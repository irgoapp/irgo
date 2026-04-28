import { IViajeRepository } from '../../domain/viaje.repository';
import { IConductorRepository } from '../../../conductor/domain/conductor.repository';
import { emitirOfertaViaje } from '../../../shared/socket.handler';
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

    // 2. SOBERANÍA DEL BACKEND: Recalculamos Ruta y Precio real (Origen -> Destino)
    const mapa = await this.consultarRutaMapa.execute({
      origen: viaje.origen,
      destino: { lat: dto.destino_lat, lng: dto.destino_lng },
      tipo_vehiculo: viaje.tipo_vehiculo
    });

    const precios = await this.calcularClientePrecio.execute({
      distancia_ruta: mapa.distancia_ruta,
      tipo_vehiculo: viaje.tipo_vehiculo
    });

    const montoComision = await this.calcularComisionUseCase.execute({
      distancia_ruta: mapa.distancia_ruta,
      tipo_vehiculo: viaje.tipo_vehiculo
    });

    // 3. Actualizamos el objeto viaje con los datos finales
    viaje.destino = { lat: dto.destino_lat, lng: dto.destino_lng };
    viaje.destino_texto = dto.destino_texto;
    viaje.monto_ruta = precios.monto_ruta;
    viaje.monto_conductor = precios.monto_conductor;
    viaje.monto_comision = precios.monto_comision;
    viaje.distancia_ruta = mapa.distancia_ruta;
    viaje.tiempo_ruta = mapa.tiempo_ruta;
    viaje.estado = 'buscando';
    viaje.buscando_at = new Date();

    // Aplanamos coordenadas para el historial
    if (mapa.geojson?.features) {
      viaje.ruta = mapa.geojson.features.flatMap((f: any) => f.geometry.coordinates);
    }

    const actualizado = await this.viajeRepository.actualizar(viaje);

    // 4. DISPARAR MOTOR DE EMPAREJAMIENTO (Matching Engine) - Única ráfaga de 20
    this.lanzarOfertaMasiva(actualizado, montoComision, mapa.tiempo_ruta);

    return new ViajeResponseDto(actualizado);
  }

  private async lanzarOfertaMasiva(viaje: any, montoComision: number, tiempoEstimado: number) {
    console.log(`[MatchingEngine] Lanzando oferta masiva a los 20 más cercanos para viaje: ${viaje.id}`);

    // A. Buscamos los 20 conductores más cercanos (Filtrados por saldo en Supabase)
    const conductores = await this.conductorRepository.buscarCercanosDisponibles(
      viaje.origen.lat,
      viaje.origen.lng,
      5, // Radio 5km
      viaje.tipo_vehiculo,
      20, // Límite de 20 conductores
      0,
      montoComision
    );

    console.log(`[MatchingEngine] Conductores calificados encontrados: ${conductores.length}`);

    if (conductores.length === 0) return;

    // B. Registramos en la Sala de Ofertas (Control de cancelaciones)
    const ids = conductores.map(c => c.id!).filter(id => !!id);
    await this.salaOfertasRepo.crear(new SalaViajeOferta({
      viaje_id: viaje.id,
      cliente_id: viaje.cliente_id,
      enviado_conductores_id: ids,
      numero_conductores: ids.length,
      estado_oferta: 'enviada'
    }));

    // C. Emitimos sockets a cada conductor
    for (const cond of conductores) {
      if (!cond.id) continue;

      const gananciaDriver = viaje.monto_ruta - montoComision;
      const oferta = new OfertaViajeConductorDto(
        viaje,
        Number(gananciaDriver.toFixed(2)),
        viaje.distancia_ruta || 0,
        tiempoEstimado
      );
      oferta.puntos_ruta = viaje.ruta || [];

      emitirOfertaViaje(cond.id, oferta);
    }
  }
}
