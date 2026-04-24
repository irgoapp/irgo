import { AceptarViajeDto } from '../dto/in/aceptar-viaje.dto';
import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';

export class AceptarViajeUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(dto: AceptarViajeDto): Promise<Viaje> {
    dto.validar();

    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');
    
    // Un viaje solo puede ser aceptado si está en estado 'buscando'
    if (viaje.estado !== 'buscando') {
      throw new Error('EL_VIAJE_YA_NO_ESTA_DISPONIBLE');
    }

    viaje.estado = 'asignado';
    viaje.conductor_id = dto.conductor_id;
    viaje.asignado_at = new Date();

    await this.viajeRepository.actualizarConductor(viaje.id!, dto.conductor_id);

    return viaje;
  }
}
