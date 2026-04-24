import { IViajeRepository } from '../../domain/viaje.repository';
import { Viaje } from '../../domain/viaje.entity';

export class IniciarViajeUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(dto: { viaje_id: string }): Promise<Viaje> {
    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');

    viaje.estado = 'en_curso';
    await this.viajeRepository.actualizarEstado(viaje.id!, 'en_curso');

    return viaje;
  }
}
