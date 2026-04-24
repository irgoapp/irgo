import { IConductorRepository } from '../../domain/conductor.repository';

export class CambiarDisponibilidadConductorUseCase {
  constructor(private conductorRepository: IConductorRepository) {}

  async execute(dto: { conductor_id: string; disponible: boolean }) {
    if (!dto.conductor_id) throw new Error('id requerido');
    await this.conductorRepository.cambiarDisponibilidad(dto.conductor_id, dto.disponible);
    return { exito: true };
  }
}
