import { SolicitarViajeDto } from '../dto/in/solicitar-viaje.dto';
import { OfertaViajeConductorDto } from '../dto/out/oferta-viaje-conductor.dto';
import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';
import { emitirOfertaViaje } from '../../../shared/socket.handler';

// NOTA: Para respetar la frontera, usamos Interface pura, o inyectamos.
import { IConductorRepository } from '../../../conductor/domain/conductor.repository';
import { ConsultarRutaMapaUseCase } from '../../../mapa/application/use-cases/consultar-ruta-mapa.usecase';
import { CalcularClientePrecioUseCase } from '../../../precio/application/use-cases/calcular-cliente-precio.usecase';

export class SolicitarViajeUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private conductorRepository: IConductorRepository,
    private consultarRutaMapa: ConsultarRutaMapaUseCase,
    private calcPrecio: CalcularClientePrecioUseCase
  ) {}

  async execute(dto: SolicitarViajeDto): Promise<Viaje> {
    dto.validar();
    
    // 1. INTEGRACIÓN CARTOGRÁFICA Y FINANCIERA (Real-time)
    const mapa = await this.consultarRutaMapa.execute({
      origen: { lat: dto.origen.lat, lng: dto.origen.lng },
      destino: { lat: dto.destino.lat, lng: dto.destino.lng }
    });

    const montoTotal = await this.calcPrecio.execute({
      distancia_ruta: mapa.distancia_ruta,
      tipo_vehiculo: dto.tipo_vehiculo || 'basico'
    });

    // 2. Crear la entidad base del Viaje con datos reales
    const viaje = new Viaje({
      cliente_id: dto.cliente_id,
      origen: { lat: dto.origen.lat, lng: dto.origen.lng },
      origen_texto: dto.origen_texto,
      destino: { lat: dto.destino.lat, lng: dto.destino.lng },
      destino_texto: dto.destino_texto,
      tipo_vehiculo: dto.tipo_vehiculo,
      monto_ruta: montoTotal,
      distancia_ruta: mapa.distancia_ruta,
      tiempo_ruta: mapa.tiempo_ruta,
      ruta: mapa.geojson,
      estado: 'buscando'
    });

    // 3. Insertarlo oficialmente en BD
    const viajeGuardado = await this.viajeRepository.crear(viaje);

    // 3. Buscar los conductores más cercanos
    const tipo = dto.tipo_vehiculo;
    const cercanos = await this.conductorRepository.buscarCercanosDisponibles(dto.origen.lat, dto.origen.lng, 5, tipo);

    // 5. Emitir el JSON de Oferta REAL a todos vía WebSockets
    const montoConductor = Number((viajeGuardado.monto_ruta! * 0.85).toFixed(2)); // 15% Comisión IrGo

    for (const conductor of cercanos) {
      if (!conductor.id) continue;
      
      const ofertaDto = new OfertaViajeConductorDto(
        viajeGuardado,
        montoConductor, 
        viajeGuardado.distancia_ruta || 0,
        viajeGuardado.tiempo_ruta || 0
      );

      // Inyectamos la polyline para el mapa del conductor
      ofertaDto.ruta = viajeGuardado.ruta;

      emitirOfertaViaje(conductor.id, ofertaDto);
    }

    return viajeGuardado;
  }
}

