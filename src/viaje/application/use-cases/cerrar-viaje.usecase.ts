import { CerrarViajeDto } from '../dto/in/cerrar-viaje.dto';
import { IViajeRepository } from '../../domain/viaje.repository';

export class CerrarViajeUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(dto: CerrarViajeDto) {
    dto.validar();

    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');
    if (viaje.conductor_id !== dto.conductor_id) throw new Error('No autorizado');

    viaje.estado = 'completado';
    await this.viajeRepository.actualizarEstado(viaje.id!, 'completado');

    return viaje;
  }
}
