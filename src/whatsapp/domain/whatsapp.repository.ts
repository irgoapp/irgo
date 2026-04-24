import { MensajeWhatsapp } from './whatsapp.entity';

export interface IWhatsappRepository {
  enviarMensaje(mensaje: MensajeWhatsapp): Promise<boolean>;
}
