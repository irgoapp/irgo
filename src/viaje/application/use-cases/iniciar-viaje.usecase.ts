import { IViajeRepository } from '../../domain/viaje.repository';
import { Viaje } from '../../domain/viaje.entity';
import { WhatsappNotificationService } from '../../../whatsapp/application/services/whatsapp-notification.service';

export class IniciarViajeUseCase {
  constructor(
    private viajeRepository: IViajeRepository,
    private whatsappNotificationService: WhatsappNotificationService
  ) {}

  async execute(dto: { viaje_id: string, pin: string }): Promise<Viaje> {
    const viaje = await this.viajeRepository.buscarPorId(dto.viaje_id);
    if (!viaje) throw new Error('Viaje no encontrado');

    // VALIDACIÓN DE SEGURIDAD (Regla IrGo)
    if (viaje.pin_verificacion !== dto.pin) {
        throw new Error('PIN de verificación incorrecto. Por favor, solicite el código al pasajero.');
    }

    viaje.estado = 'en_curso';
    viaje.iniciado_at = new Date();
    
    await this.viajeRepository.actualizar(viaje);

    // Notificación automática al cliente
    await this.whatsappNotificationService.notificarViajeIniciado(viaje);

    return viaje;
  }
}
