import { SolicitarViajeDto } from '../dto/in/solicitar-viaje.dto';
import { OfertaViajeConductorDto } from '../dto/out/oferta-viaje-conductor.dto';
import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';
import { emitirOfertaViaje } from '../../../shared/socket.handler';

// NOTA: Para respetar la frontera, usamos Interface pura, o inyectamos.
import { IConductorRepository } from '../../../conductor/domain/conductor.repository';

export class SolicitarViajeUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private conductorRepository: IConductorRepository
  ) {}

  async execute(dto: SolicitarViajeDto): Promise<Viaje> {
    dto.validar();
    
    // 1. Calcular pre-precio y crear la entidad base del Viaje
    const viaje = new Viaje({
      cliente_id: dto.cliente_id,
      origen: dto.origen,
      origen_texto: dto.origen_texto,
      destino: dto.destino,
      destino_texto: dto.destino_texto,
      tipo_vehiculo: dto.tipo_vehiculo,
      precio: 10.50 // TODO: Se inyectaría lógica del módulo 'precio'
    });

    // 2. Insertarlo oficialmente como estado 'buscando' / 'borrador' en BD
    const viajeGuardado = await this.viajeRepository.crear(viaje);

    // 3. Buscar los conductores más cercanos
    const tipo = dto.tipo_vehiculo;
    const cercanos = await this.conductorRepository.buscarCercanosDisponibles(dto.origen.lat, dto.origen.lon, 5, tipo);

    // 4. Emitir el JSON de Oferta a todos vía WebSockets
    for (const conductor of cercanos) {
      if (!conductor.id) continue;
      
      const ofertaDto = new OfertaViajeConductorDto(
        viajeGuardado,
        7.50, // Dummy temporal: Su ganancia limpia calculada
        0,    // Dummy temporal: Distancia de la ruta
        0     // Dummy temporal: Tiempo de la ruta
      );

      // Disparo real TCP por el túnel de Sockets a su celular
      emitirOfertaViaje(conductor.id, ofertaDto);
    }

    return viajeGuardado;
  }
}

