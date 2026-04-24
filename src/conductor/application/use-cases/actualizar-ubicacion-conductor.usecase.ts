import { ActualizarUbicacionDto } from '../dto/in/actualizar-ubicacion.dto';
import { IConductorRepository } from '../../domain/conductor.repository';

export class ActualizarUbicacionConductorUseCase {
  constructor(private conductorRepository: IConductorRepository) {}

  async execute(dto: ActualizarUbicacionDto) {
    dto.validar();
    await this.conductorRepository.actualizarUbicacion(dto.conductor_id, dto.lat, dto.lon);
    return { exito: true };
  }
}
