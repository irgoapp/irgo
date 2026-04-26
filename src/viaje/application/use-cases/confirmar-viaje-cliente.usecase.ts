import { IViajeRepository } from '../../domain/viaje.repository';
import { IConductorRepository } from '../../../conductor/domain/conductor.repository';
import { emitirOfertaViaje } from '../../../shared/socket.handler';
import { OfertaViajeConductorDto } from '../dto/out/oferta-viaje-conductor.dto';
import { ConfirmarViajeDto } from '../dto/in/confirmar-viaje.dto';
import { ViajeResponseDto } from '../dto/out/viaje-response.dto';
import { ConsultarRutaMapaUseCase } from '../../../mapa/application/use-cases/consultar-ruta-mapa.usecase';
import { CalcularComisionUseCase } from '../../../precio/application/use-cases/calcular-comision.usecase';

export class ConfirmarViajeClienteUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private conductorRepository: IConductorRepository,
    private consultarRutaMapa: ConsultarRutaMapaUseCase,
    private calcularComisionUseCase: CalcularComisionUseCase
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
    viaje.monto_ruta = dto.monto_ruta;
    viaje.distancia_ruta = dto.distancia_ruta;
    viaje.tiempo_ruta = dto.tiempo_ruta;
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
    try {
      const v = await this.viajeRepository.buscarPorId(viajeId);
      if (v) {
        // RUTA PRINCIPAL: Origen -> Destino del cliente
        const mapa = await this.consultarRutaMapa.execute({ 
          origen: v.origen, 
          destino: v.destino,
          tipo_vehiculo: v.tipo_vehiculo
        });
        tiempoEstimado = mapa.tiempo_ruta || 10;

        // Aplanar el GeoJSON antes de guardar (Requerimiento IrGo_Backend)
        if (mapa.geojson?.features) {
          rutaCoords = mapa.geojson.features.flatMap((f: any) => f.geometry.coordinates);

          // PERSISTENCIA: Guardamos la ruta del viaje (origen -> destino)
          v.ruta = rutaCoords;
          v.tiempo_ruta = tiempoEstimado;
          await this.viajeRepository.actualizar(v);
        }
      }
    } catch (e) {
      console.error("[MatchingEngine] Error obteniendo ruta origen->destino:", e);
    }

    // RONDA 1: Los 5 más cercanos
    await this.ejecutarRonda(viajeId, 5, 0, rutaCoords, tiempoEstimado);

    // ESPERA 10 SEGUNDOS
    setTimeout(async () => {
      // RONDA 2: Los siguientes 10
      await this.ejecutarRonda(viajeId, 10, 5, rutaCoords, tiempoEstimado);
    }, 10000);
  }

  private async ejecutarRonda(viajeId: string, limite: number, offset: number, ruta: any[], tiempoEstimado: number) {
    console.log(`[MatchingEngine] Ejecutando Ronda (L:${limite}, O:${offset}) para viaje ${viajeId}`);
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
      offset
    );

    console.log(`[MatchingEngine] Conductores encontrados para tipo ${viaje.tipo_vehiculo}: ${conductores.length}`);

    for (const cond of conductores) {
      if (!cond.id || !cond.ubicacion_actual) continue;

      const precioCliente = viaje.monto_ruta!;
      const comision = await this.calcularComisionUseCase.execute({
        distancia_ruta: viaje.distancia_ruta || 0,
        tipo_vehiculo: viaje.tipo_vehiculo
      });
      const gananciaDriver = precioCliente - comision;

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
