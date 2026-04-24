import { IViajeRepository } from '../../domain/viaje.repository';
import { ViajeResponseDto } from '../dto/out/viaje-response.dto';

export class ConfirmarViajePasajeroUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(dto: {
    viaje_id: string;
    destino: { lat: number; lon: number };
    destino_texto: string;
    monto: number;
    distancia_km: number;
    duracion_min: number;
  }): Promise<ViajeResponseDto> {
    
    // 1. Buscamos el viaje borrador
    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');
    if (viaje.estado !== 'borrador') throw new Error('El viaje ya no es un borrador');

    // 2. Actualizamos con los datos finales del cliente
    viaje.destino = dto.destino;
    viaje.destino_texto = dto.destino_texto;
    viaje.precio = dto.monto;
    viaje.distancia_km = dto.distancia_km;
    viaje.estado = 'buscando';
    viaje.buscando_at = new Date();

    const actualizado = await this.viajeRepository.actualizar(viaje);
    
    // TODO: Aquí dispararíamos el evento de Socket.io para avisar a los conductores
    console.log(`[Viaje] Solicitud ${dto.viaje_id} activada. Buscando conductores...`);

    return new ViajeResponseDto(actualizado);
  }
}
