import { IViajeRepository } from '../../../viaje/domain/viaje.repository';

export class ConsultarHistorialConductorUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(conductorId: string): Promise<any[]> {
    if (!conductorId) throw new Error('Conductor ID requerido');
    return await this.viajeRepository.obtenerHistorial(conductorId);
  }
}
