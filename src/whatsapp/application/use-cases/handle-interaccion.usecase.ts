import { IWhatsappRepository } from '../../domain/whatsapp.repository';
import { ISessionRepository } from '../../domain/wsp-session.entity';
import { BotResponseBuilder } from '../../domain/bot-response.builder';

export class HandleInteraccionUseCase {
  constructor(
    private whatsappRepo: IWhatsappRepository,
    private sessionRepo: ISessionRepository
  ) {}

  async execute(telefono: string, replyId: string): Promise<void> {
    console.log(`[HandleInteraccion] Acción: ${replyId} para ${telefono}`);

    if (replyId === 'pedir_moto') {
      await this.whatsappRepo.enviarMensaje({
        telefono,
        texto: BotResponseBuilder.pedirUbicacion()
      });
      await this.sessionRepo.upsertSession(telefono, 'AWAITING_LOCATION', {});
      return;
    }

    if (replyId === 'info') {
      const infoMsg = 
        `ℹ️ *IrGo (Motos)*\n` +
        `_El servicio más rápido y seguro de tu ciudad._\n\n` +
        `*¿Por qué elegirnos?*\n` +
        `✅ *Rapidez:* Olvídate del tráfico con nuestras unidades verificadas.\n` +
        `✅ *Seguridad:* Seguimiento en tiempo real y conductores 100% validados.\n` +
        `✅ *Transparencia:* Tarifas fijas calculadas por la ruta más eficiente.\n\n` +
        `_¡Tu seguridad es nuestra prioridad!_`;
      
      await this.whatsappRepo.enviarMensaje({
        telefono,
        texto: infoMsg
      });
      return;
    }

    if (replyId === 'confirmar_no' || replyId === 'cancelar') {
        await this.whatsappRepo.enviarMensaje({
            telefono,
            texto: BotResponseBuilder.cancelacionConfirmada()
        });
        await this.sessionRepo.upsertSession(telefono, 'START', {});
        return;
    }

    // Si no reconoce el botón, lo manda al inicio por seguridad
    console.warn(`[HandleInteraccion] Botón no reconocido: ${replyId}`);
    await this.sessionRepo.upsertSession(telefono, 'START', {});
  }
}
