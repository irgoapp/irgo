import { ISessionRepository } from '../../domain/wsp-session.entity';
import { HandleStartUseCase } from './estados/handle-start.usecase';
import { HandleLocationUseCase } from './estados/handle-location.usecase';
import { HandleConfirmationUseCase } from './estados/handle-confirmation.usecase';
import { HandleInteraccionUseCase } from './handle-interaccion.usecase';

/**
 * Este es el Router Central que determina hacia que UseCase saltar,
 * reemplazando la antigua 'ConversationStateMachine' gigante.
 */
export class BotMachineUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private handleStartUseCase: HandleStartUseCase,
    private handleLocationUseCase: HandleLocationUseCase,
    private handleConfirmationUseCase: HandleConfirmationUseCase,
    private handleInteraccionUseCase: HandleInteraccionUseCase
  ) {}

  async execute(telefono: string, message: { type: string, replyId?: string, lat?: number, lng?: number, body?: string }) {
    console.log(`[BotMachine] INI -> Tel: ${telefono}`);
    let session = await this.sessionRepo.getSession(telefono);
    console.log(`[BotMachine] Sesión previa: ${session ? session.estado : 'Nueva'}`);

    // Verificación de Expiración (10 minutos)
    if (session) {
      const now = new Date();
      const lastActive = new Date(session.ultima_actividad || now);
      const diffMinutes = (now.getTime() - lastActive.getTime()) / 60000;
      
      if (diffMinutes > 10) {
        console.log(`[BotMachine] Sesión expirada para ${telefono} (${diffMinutes.toFixed(1)} min). Reiniciando.`);
        session = null; // Forzamos reinicio
      }
    }

    // Si no hay sesión o envía HOLA, reiniciamos el flujo y le enviamos Bienvenida.
    if (!session || message.body?.toLowerCase() === 'hola') {
      console.log(`[BotMachine] Reiniciando flujo para ${telefono}`);
      await this.sessionRepo.upsertSession(telefono, 'START', {});
      await this.handleStartUseCase.execute(telefono);
      return;
    }

    // Router por Botones/Respuestas Interactivas (replyId)
    if (message.replyId) {
      // Si son botones de confirmación, van a su caso de uso
      if (message.replyId.startsWith('confirmar_') || message.replyId === 'cancelar') {
        await this.handleConfirmationUseCase.execute(session, message.replyId);
      } else {
        // Otros botones (info, pedir_moto, etc)
        await this.handleInteraccionUseCase.execute(telefono, message.replyId);
      }
      return;
    }

    // Router por Estados
    switch (session.estado) {
      case 'START':
      case 'AWAITING_LOCATION':
        if (message.type === 'location' && message.lat && message.lng) {
          console.log(`[BotMachine] Procesando ubicación para ${telefono}`);
          await this.handleLocationUseCase.execute(session, message.lat, message.lng);
        } else {
          // Si manda texto estando en START/AWAITING_LOCATION y no fue "hola", le recordamos qué hacer.
          console.log(`[BotMachine] Texto no reconocido en estado ${session.estado}, reenviando bienvenida.`);
          await this.handleStartUseCase.execute(telefono);
        }
        break;
      
      default:
        console.log(`[BotMachine] Estado ${session.estado} no tiene handler, reiniciando.`);
        await this.handleStartUseCase.execute(telefono);
        break;
    }
  }
}
