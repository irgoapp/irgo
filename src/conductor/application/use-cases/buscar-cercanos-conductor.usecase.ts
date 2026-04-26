import { IConductorRepository } from '../../domain/conductor.repository';
import { Conductor } from '../../domain/conductor.entity';

export class BuscarCercanosConductorUseCase {
  constructor(private conductorRepository: IConductorRepository) {}

  async execute(dto: { lat: number; lng: number; tipoVehiculo: string }): Promise<Conductor[]> {
    if (!dto.lat || !dto.lng) throw new Error('Ubicación requerida');
    return await this.conductorRepository.buscarCercanosDisponibles(dto.lat, dto.lng, 5, dto.tipoVehiculo);
  }
}
