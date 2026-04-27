import { IWhatsappRepository } from '../../domain/whatsapp.repository';
import { BotResponseBuilder } from '../../domain/bot-response.builder';

/**
 * WhatsappNotificationService
 * Envía mensajes proactivos al cliente basados en eventos del viaje.
 * NO importa repositorios de otros dominios. Recibe datos ya procesados.
 */
export class WhatsappNotificationService {
  constructor(
    private whatsappRepo: IWhatsappRepository
  ) {}

  /**
   * Notifica al cliente que un conductor ha aceptado el viaje.
   */
  async notificarConductorAsignado(params: {
    telefono: string;
    conductor: { nombre: string; vehiculo_placa?: string; vehiculo_color?: string };
    etaMinutos: number;
    pin: string;
  }): Promise<void> {
    try {
      const mensaje = BotResponseBuilder.mensajeConductorAsignado({
        conductor: params.conductor,
        etaMinutos: params.etaMinutos,
        pin: params.pin
      });

      await this.whatsappRepo.enviarMensaje({
        telefono: params.telefono,
        texto: mensaje
      });

      console.log(`[WspNotif] ✅ ASIGNADO enviada a ${params.telefono}`);
    } catch (error: any) {
      console.error(`[WspNotif] ❌ Error notificando asignación:`, error.message);
    }
  }

  /**
   * Notifica al cliente que el conductor ha llegado al punto de recogida.
   */
  async notificarConductorLlegado(telefono: string): Promise<void> {
    try {
      await this.whatsappRepo.enviarMensaje({
        telefono,
        texto: BotResponseBuilder.mensajeConductorLlegado()
      });
      console.log(`[WspNotif] ✅ LLEGADA enviada a ${telefono}`);
    } catch (error: any) {
      console.error(`[WspNotif] ❌ Error notificando llegada:`, error.message);
    }
  }

  /**
   * Notifica al cliente que el viaje ha comenzado.
   */
  async notificarViajeIniciado(telefono: string): Promise<void> {
    try {
      await this.whatsappRepo.enviarMensaje({
        telefono,
        texto: BotResponseBuilder.mensajeViajeIniciado()
      });
      console.log(`[WspNotif] ✅ INICIO DE VIAJE enviada a ${telefono}`);
    } catch (error: any) {
      console.error(`[WspNotif] ❌ Error notificando inicio:`, error.message);
    }
  }

  /**
   * Túnel de chat inverso: Conductor → Cliente vía WhatsApp.
   */
  async notificarMensajeConductor(telefono: string, contenido: string): Promise<void> {
    try {
      await this.whatsappRepo.enviarMensaje({
        telefono,
        texto: { type: 'text', text: { body: `💬 *Conductor dice:*\n${contenido}` } }
      });
      console.log(`[WspNotif] ✅ Mensaje de conductor reenviado a ${telefono}`);
    } catch (error: any) {
      console.error(`[WspNotif] ❌ Error reenviando mensaje:`, error.message);
    }
  }
}
