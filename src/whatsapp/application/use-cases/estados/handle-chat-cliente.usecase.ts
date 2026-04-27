import { IViajeMensajesRepository } from '../../../domain/viaje-mensajes.repository';
import { ViajeMensaje } from '../../../domain/viaje-mensajes.entity';
import { IWhatsappRepository } from '../../../domain/whatsapp.repository';

// Importamos la función de emisión de Socket (shared, no de otro dominio)
import { emitirMensajeChat } from '../../../../shared/socket.handler';

/**
 * HandleChatClienteUseCase — Túnel de Chat
 * Guarda el mensaje del cliente en viaje_mensajes y lo reenvía
 * al conductor vía WebSocket (chat:nuevo_mensaje).
 */
export class HandleChatClienteUseCase {
  constructor(
    private mensajesRepo: IViajeMensajesRepository,
    private whatsappRepo: IWhatsappRepository
  ) {}

  async execute(
    viajeId: string,
    conductorId: string,
    telefono: string,
    contenido: string
  ): Promise<void> {
    // 1. Guardar en viaje_mensajes
    const mensaje = new ViajeMensaje({
      viaje_id: viajeId,
      emisor_tipo: 'cliente',
      contenido
    });

    await this.mensajesRepo.guardarMensaje(mensaje);

    // 2. Emitir a la APK del conductor vía WebSocket
    emitirMensajeChat(conductorId, {
      viaje_id: viajeId,
      emisor_tipo: 'cliente',
      contenido,
      timestamp: new Date().toISOString()
    });

    // 3. Confirmar al cliente que su mensaje fue enviado
    await this.whatsappRepo.enviarMensaje({
      telefono,
      texto: { type: 'text', text: { body: '✅ Mensaje enviado al conductor.' } }
    });

    console.log(`[ChatCliente] Mensaje guardado y emitido para viaje ${viajeId}`);
  }
}
