import { IConductorRepository } from '../../domain/conductor.repository';
import { Conductor } from '../../domain/conductor.entity';

export class BuscarCercanosConductorUseCase {
  constructor(private conductorRepository: IConductorRepository) {}

  async execute(dto: { lat: number; lon: number; tipoVehiculo: string }): Promise<Conductor[]> {
    if (!dto.lat || !dto.lon) throw new Error('Ubicación requerida');
    return await this.conductorRepository.buscarCercanosDisponibles(dto.lat, dto.lon, 5, dto.tipoVehiculo);
  }
}
