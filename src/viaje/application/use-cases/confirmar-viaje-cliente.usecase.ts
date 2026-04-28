import { IViajeRepository } from '../../domain/viaje.repository';
import { IConductorRepository } from '../../../conductor/domain/conductor.repository';
import { emitirOfertaViaje, emitirViajeExpirado } from '../../../shared/socket.handler';
import { OfertaViajeConductorDto } from '../dto/out/oferta-viaje-conductor.dto';
import { ConfirmarViajeDto } from '../dto/in/confirmar-viaje.dto';
import { ViajeResponseDto } from '../dto/out/viaje-response.dto';
import { ConsultarRutaMapaUseCase } from '../../../mapa/application/use-cases/consultar-ruta-mapa.usecase';
import { CalcularClientePrecioUseCase } from '../../../precio/application/use-cases/calcular-cliente-precio.usecase';
import { CalcularComisionUseCase } from '../../../precio/application/use-cases/calcular-comision.usecase';
import { ISalaViajeOfertaRepository } from '../../domain/sala-viaje-oferta.repository';
import { SalaViajeOferta } from '../../domain/sala-viaje-oferta.entity';

export class ConfirmarViajeClienteUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private conductorRepository: IConductorRepository,
    private consultarRutaMapa: ConsultarRutaMapaUseCase,
    private calcularClientePrecio: CalcularClientePrecioUseCase,
    private calcularComisionUseCase: CalcularComisionUseCase,
    private salaOfertasRepo: ISalaViajeOfertaRepository
  ) { }

  async execute(dto: ConfirmarViajeDto): Promise<ViajeResponseDto> {
    dto.validar();

    // 1. Buscamos el viaje borrador
    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');
    if (viaje.estado !== 'borrador') throw new Error('El viaje ya no es un borrador');

    // 2. Actualizamos con los datos finales del cliente
    viaje.destino = { lat: dto.destino_lat, lng: dto.destino_lng };
    viaje.destino_texto = dto.destino_texto;

    // 🌟 SOBERANÍA DEL BACKEND: Recalculamos Ruta y Precio real
    const mapa = await this.consultarRutaMapa.execute({
      origen: viaje.origen,
      destino: viaje.destino,
      tipo_vehiculo: viaje.tipo_vehiculo
    });

    const precios = await this.calcularClientePrecio.execute({
      distancia_ruta: mapa.distancia_ruta,
      tipo_vehiculo: viaje.tipo_vehiculo
    });

    viaje.monto_ruta = precios.monto_ruta;
    viaje.monto_conductor = precios.monto_conductor;
    viaje.monto_comision = precios.monto_comision;
    viaje.distancia_ruta = mapa.distancia_ruta;
    viaje.tiempo_ruta = mapa.tiempo_ruta;
    
    viaje.estado = 'buscando';
    viaje.buscando_at = new Date();

    const actualizado = await this.viajeRepository.actualizar(viaje);

    // 3. DISPARAR MOTOR DE EMPAREJAMIENTO (Matching Engine) EN SEGUNDO PLANO
    this.iniciarBusquedaPorRondas(actualizado.id!);

    return new ViajeResponseDto(actualizado);
  }

  private async iniciarBusquedaPorRondas(viajeId: string) {
    console.log(`[MatchingEngine] Iniciando rondas para viaje: ${viajeId}`);

    let rutaCoords: any[] = [];
    let tiempoEstimado = 10;
    let viajeActual: any = null;

    try {
      viajeActual = await this.viajeRepository.buscarPorId(viajeId);
      if (viajeActual) {
        // RUTA PRINCIPAL: Origen -> Destino del cliente
        const mapa = await this.consultarRutaMapa.execute({ 
          origen: viajeActual.origen, 
          destino: viajeActual.destino,
          tipo_vehiculo: viajeActual.tipo_vehiculo
        });
        tiempoEstimado = mapa.tiempo_ruta || 10;

        // Aplanar el GeoJSON antes de guardar (Requerimiento IrGo_Backend)
        if (mapa.geojson?.features) {
          rutaCoords = mapa.geojson.features.flatMap((f: any) => f.geometry.coordinates);

          // PERSISTENCIA: Guardamos la ruta del viaje (origen -> destino)
          viajeActual.ruta = rutaCoords;
          viajeActual.tiempo_ruta = tiempoEstimado;
          await this.viajeRepository.actualizar(viajeActual);
        }
      }
    } catch (e) {
      console.error("[MatchingEngine] Error obteniendo ruta origen->destino:", e);
    }

    // --- SALA DE OFERTAS: Inicialización ---
    if (viajeActual) {
        await this.salaOfertasRepo.crear(new SalaViajeOferta({
            viaje_id: viajeId,
            cliente_id: viajeActual.cliente_id,
            enviado_conductores_id: [],
            numero_conductores: 0,
            estado_oferta: 'enviada'
        }));
    }

    // RONDA 1: Los 5 más cercanos
    const montoComision = await this.calcularComisionUseCase.execute({
      distancia_ruta: viajeActual.distancia_ruta || 0,
      tipo_vehiculo: viajeActual.tipo_vehiculo
    });

    await this.ejecutarRonda(viajeId, 5, 0, rutaCoords, tiempoEstimado, montoComision);

    // ESPERA 10 SEGUNDOS
    setTimeout(async () => {
      // RONDA 2: Los siguientes 10
      await this.ejecutarRonda(viajeId, 10, 5, rutaCoords, tiempoEstimado, montoComision);

      // ESPERA FINAL PARA EXPIRACIÓN (Opcional, pero recomendado para cerrar modales)
      setTimeout(async () => {
         const vFinal = await this.viajeRepository.buscarPorId(viajeId);
         if (vFinal && vFinal.estado === 'buscando') {
            console.log(`[MatchingEngine] Viaje ${viajeId} expirado sin conductores.`);
            emitirViajeExpirado(viajeId);
         }
      }, 15000);
    }, 10000);
  }

  private async ejecutarRonda(viajeId: string, limite: number, offset: number, ruta: any[], tiempoEstimado: number, montoComision: number) {
    console.log(`[MatchingEngine] Ejecutando Ronda (L:${limite}, O:${offset}) para viaje ${viajeId}. Comision: ${montoComision}`);
    const viaje = await this.viajeRepository.buscarPorId(viajeId);

    if (!viaje || viaje.estado !== 'buscando') {
      console.log(`[MatchingEngine] Viaje ${viajeId} ya no está buscando. Ronda cancelada.`);
      return;
    }

    const conductores = await this.conductorRepository.buscarCercanosDisponibles(
      viaje.origen.lat,
      viaje.origen.lng,
      5, // Radio 5km para mayor alcance
      viaje.tipo_vehiculo,
      limite,
      offset,
      montoComision // Filtro nativo en Supabase
    );

    console.log(`[MatchingEngine] Conductores encontrados para tipo ${viaje.tipo_vehiculo}: ${conductores.length}`);

    if (conductores.length > 0) {
        const ids = conductores.map(c => c.id!).filter(id => !!id);
        await this.salaOfertasRepo.agregarConductores(viajeId, ids);
    }

    for (const cond of conductores) {
      if (!cond.id || !cond.ubicacion_actual) continue;

      const precioCliente = viaje.monto_ruta!;
      const gananciaDriver = precioCliente - montoComision;

      const oferta = new OfertaViajeConductorDto(
        viaje,
        Number(gananciaDriver.toFixed(2)),
        viaje.distancia_ruta || 0,
        tiempoEstimado // Tiempo real calculado por MapsAPI (Origen->Destino)
      );

      oferta.puntos_ruta = ruta; // Origen -> Destino

      emitirOfertaViaje(cond.id, oferta);
    }
  }
}
