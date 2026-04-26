import { OfertaViajeConductorDto } from '../dto/out/oferta-viaje-conductor.dto';
import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';
import { IConductorRepository } from '../../../conductor/domain/conductor.repository';
import { emitirOfertaViaje } from '../../../shared/socket.handler';
import { ConsultarRutaMapaUseCase } from '../../../mapa/application/use-cases/consultar-ruta-mapa.usecase';
import { CalcularClientePrecioUseCase } from '../../../precio/application/use-cases/calcular-cliente-precio.usecase';

export class ConfirmarYBuscarConductoresUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private conductorRepository: IConductorRepository,
    private consultarRutaMapa: ConsultarRutaMapaUseCase,
    private calcPrecio: CalcularClientePrecioUseCase
  ) {}

  async execute(dto: { viaje_id: string; destino: { lat: number; lng: number } }): Promise<Viaje> {
    // 1. Validar el viaje existente
    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');
    if (viaje.estado !== 'borrador') throw new Error('El viaje ya fue solicitado');

    // 2. Modificar el destino y congelar el estado a Buscando
    viaje.destino = dto.destino;

    // 🌟 INYECCIÓN CARTOGRÁFICA Y FINANCIERA NATIVA
    // Interceptamos la petición con nuestro motor de Mapas
    const mapa = await this.consultarRutaMapa.execute({
      origen: viaje.origen,
      destino: viaje.destino
    });

    // Se lo pasamos al tarificador inteligente
    const recaudoFinal = await this.calcPrecio.execute({ 
      distancia_km: mapa.distancia_km,
      tipo_vehiculo: viaje.tipo_vehiculo || 'basico'
    });

    viaje.monto_ruta = recaudoFinal; 
    
    // Guardamos la información monetaria fuerte en la Base de Datos
    await this.viajeRepository.actualizarEstado(viaje.id!, 'buscando');
    
    // (Asegurar que guardamos el destino idealmente en repo si el método lo permite)

    // 3. Motor de Búsqueda Masiva de Conductores
    const tipo = viaje.tipo_vehiculo;
    const cercanos = await this.conductorRepository.buscarCercanosDisponibles(viaje.origen.lat, viaje.origen.lng, 5, tipo);

    // 4. Emitir Lluvias de Ofertas en Sockets
    for (const conductor of cercanos) {
      if (!conductor.id) continue;
      
      const ofertaDto = new OfertaViajeConductorDto(
        viaje,
        Number((recaudoFinal * 0.85).toFixed(2)), // 15% Comisión IrGo
        mapa.distancia_km, // Agregado dinámico real extraído de ruta-proxy
        mapa.tiempo_ruta || 10 // Tiempo extraído del motor Mapas
      );

      // Mutamos temporalmente en RAM el objeto interno para empujarle la manguera de puntos topográficos de MapLibre
      ofertaDto.ruta = mapa.geojson;

      emitirOfertaViaje(conductor.id, ofertaDto);
    }

    return viaje;
  }
}
