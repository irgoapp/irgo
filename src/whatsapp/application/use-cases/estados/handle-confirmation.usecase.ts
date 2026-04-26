import { SesionWhatsApp } from '../../../domain/wsp-session.entity';
import { BotResponseBuilder } from '../../../domain/bot-response.builder';
import { IWhatsappRepository } from '../../../domain/whatsapp.repository';
import { ISessionRepository } from '../../../domain/wsp-session.entity';

export class HandleConfirmationUseCase {
  constructor(
    private whatsappRepo: IWhatsappRepository,
    private sessionRepo: ISessionRepository
  ) {}

  async execute(session: SesionWhatsApp, replyId: string): Promise<void> {
    if (replyId === 'confirmar_no' || replyId === 'cancelar') {
      await this.whatsappRepo.enviarMensaje({
        telefono: session.telefono,
        texto: BotResponseBuilder.mensajeCancelacionConfirmada()
      });
      await this.sessionRepo.upsertSession(session.telefono, 'START', {});
    }

    if (replyId === 'confirmar_si') {
      // Como ya generamos el viaje en AWAITING_LOCATION, solo queda notificar
      await this.whatsappRepo.enviarMensaje({
        telefono: session.telefono,
        texto: BotResponseBuilder.mensajeBuscandoConductor()
      });
    }
  }
}
