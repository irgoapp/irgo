import { IConductorRepository } from '../../domain/conductor.repository';

export class ObtenerUbicacionConductorUseCase {
  constructor(private conductorRepo: IConductorRepository) {}

  async execute(id: string): Promise<{ lat: number; lng: number } | null> {
    const conductor = await this.conductorRepo.buscarPorId(id);
    if (!conductor || !conductor.ubicacion_actual) return null;
    
    return {
      lat: conductor.ubicacion_actual.lat,
      lng: conductor.ubicacion_actual.lon
    };
  }
}
