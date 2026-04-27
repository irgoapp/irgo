import { IViajeRepository } from '../../domain/viaje.repository';
import { Viaje } from '../../domain/viaje.entity';
import { WhatsappNotificationService } from '../../../whatsapp/application/services/whatsapp-notification.service';

export class MarcarLlegadaUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private whatsappNotification: WhatsappNotificationService
  ) {}

  async execute(viajeId: string): Promise<Viaje> {
    const viaje = await this.viajeRepository.buscarPorId(viajeId);
    if (!viaje) throw new Error('Viaje no encontrado');

    if (viaje.estado !== 'asignado') {
      throw new Error('Solo se puede marcar llegada si el viaje está asignado');
    }

    viaje.estado = 'llegado';
    viaje.llegado_at = new Date();

    await this.viajeRepository.actualizarEstado(viajeId, 'llegado');

    // WhatsApp notification handled by bot RAMA 2 (estado = 'llegado')

    return viaje;
  }
}
