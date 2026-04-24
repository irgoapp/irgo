import { IWhatsappRepository } from '../domain/whatsapp.repository';
import { MensajeWhatsapp } from '../domain/whatsapp.entity';

export class WhatsappMetaClient implements IWhatsappRepository {
  async enviarMensaje(mensaje: MensajeWhatsapp): Promise<boolean> {
    const token = process.env.META_WHATSAPP_TOKEN?.trim();
    const phoneId = process.env.META_PHONE_NUMBER_ID?.trim();

    if (!token || !phoneId) return false;

    const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

    // Limpieza estricta: Solo dígitos, sin '+' ni espacios
    const telefonoDestino = mensaje.telefono.replace(/\D/g, '');

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: telefonoDestino,
      ...(typeof mensaje.texto === 'string' 
          ? { type: 'text', text: { body: mensaje.texto } } 
          : mensaje.texto
      )
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error(`[Whatsapp Meta] Error API:`, JSON.stringify(data));
        return false;
      }

      console.log(`[Whatsapp Meta] EXITO: Entregado a Meta para ${telefonoDestino}`);
      return true;
    } catch (e: any) {
      console.error('[Whatsapp Meta] Error HTTP:', e.message);
      return false;
    }
  }

  async marcarLeido(telefono: string, messageId: string): Promise<boolean> {
    const token = process.env.META_WHATSAPP_TOKEN?.trim();
    const phoneId = process.env.META_PHONE_NUMBER_ID?.trim();
    if (!token || !phoneId || !messageId) return false;

    const url = `https://graph.facebook.com/v21.0/${phoneId}/messages`;
    const telefonoLimpio = telefono.replace(/\D/g, '');

    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    };

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}
