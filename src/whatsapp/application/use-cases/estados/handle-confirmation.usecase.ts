import { SesionWhatsApp, ISessionRepository, ESTADOS_SESION } from '../../../domain/wsp-session.entity';
import { BotResponseBuilder } from '../../../domain/bot-response.builder';
import { IWhatsappRepository } from '../../../domain/whatsapp.repository';

/**
 * HandleConfirmationUseCase
 * Procesa la respuesta del cliente al botón de "Confirmar viaje".
 * Al confirmar, limpia la sesión (la verdad pasa a solicitudes.estado).
 */
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
      await this.sessionRepo.upsertSession(session.telefono, ESTADOS_SESION.INICIO, {});
      console.log(`[HandleConfirmation] Viaje cancelado por el cliente.`);
      return;
    }

    if (replyId === 'confirmar_si') {
      await this.whatsappRepo.enviarMensaje({
        telefono: session.telefono,
        texto: BotResponseBuilder.mensajeBuscandoConductor()
      });

      // Limpiamos la sesión. A partir de aquí, la fuente de verdad
      // es la columna `estado` de la tabla `solicitudes` (RAMA 2).
      await this.sessionRepo.deleteSession(session.telefono);
      console.log(`[HandleConfirmation] Viaje confirmado. Sesión limpiada → RAMA 2.`);
    }
  }
}
