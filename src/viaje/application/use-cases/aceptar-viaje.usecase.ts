import { AceptarViajeDto } from '../dto/in/aceptar-viaje.dto';
import { Viaje } from '../../domain/viaje.entity';
import { IViajeRepository } from '../../domain/viaje.repository';

export class AceptarViajeUseCase {
  constructor(private viajeRepository: IViajeRepository) {}

  async execute(dto: AceptarViajeDto): Promise<Viaje> {
    dto.validar();

    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');
    if (viaje.estado !== 'solicitado') throw new Error('No está disponible');

    viaje.estado = 'aceptado';
    viaje.conductor_id = dto.conductor_id;

    await this.viajeRepository.actualizarConductor(viaje.id!, dto.conductor_id);
    await this.viajeRepository.actualizarEstado(viaje.id!, 'aceptado');

    return viaje;
  }
}
