import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';

export class ObtenerViajeActivoUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(conductorId: string): Promise<Viaje | null> {
    if (!conductorId) throw new Error('ID del conductor es requerido');
    return await this.viajeRepository.buscarActivoPorConductor(conductorId);
  }
}
