import { IWhatsappRepository } from '../../../domain/whatsapp.repository';
import { BotResponseBuilder } from '../../../domain/bot-response.builder';
import { HandleChatClienteUseCase } from './handle-chat-cliente.usecase';

/**
 * HandleViajeActivoUseCase — RAMA 2
 * Responde según la columna `estado` de la tabla `solicitudes`.
 * No lee wsp_sessions. La fuente de verdad es la base de datos de viajes.
 */
export class HandleViajeActivoUseCase {
  constructor(
    private whatsappRepo: IWhatsappRepository,
    private handleChat: HandleChatClienteUseCase
  ) {}

  async execute(
    telefono: string,
    viaje: { id: string; estado: string; conductor_id?: string },
    message: { type?: string; replyId?: string; body?: string }
  ): Promise<void> {

    // Si el cliente pulsa un botón interactivo
    if (message.replyId) {
      await this.routearBotonViaje(telefono, viaje, message.replyId);
      return;
    }

    // Si el cliente escribe texto libre estando en un viaje asignado/llegado → túnel de chat
    if (message.body && (viaje.estado === 'asignado' || viaje.estado === 'llegado')) {
      await this.handleChat.execute(viaje.id, viaje.conductor_id!, telefono, message.body);
      return;
    }

    // Si no es botón ni texto de chat, mostrar estado actual
    await this.enviarEstadoActual(telefono, viaje);
  }

  /**
   * Envía al cliente un mensaje con el estado actual de su viaje.
   */
  private async enviarEstadoActual(
    telefono: string,
    viaje: { estado: string }
  ): Promise<void> {
    let mensaje;

    switch (viaje.estado) {
      case 'buscando':
      case 'borrador':
        mensaje = BotResponseBuilder.mensajeEstadoBuscando();
        break;
      case 'asignado':
        mensaje = BotResponseBuilder.mensajeEstadoAsignado();
        break;
      case 'llegado':
        mensaje = BotResponseBuilder.mensajeEstadoLlegado();
        break;
      case 'en_curso':
        mensaje = BotResponseBuilder.mensajeEstadoEnCurso();
        break;
      default:
        mensaje = BotResponseBuilder.mensajeBuscandoConductor();
        break;
    }

    await this.whatsappRepo.enviarMensaje({ telefono, texto: mensaje });
    console.log(`[ViajeActivo] Estado '${viaje.estado}' notificado a ${telefono}`);
  }

  /**
   * Procesa botones específicos del flujo de viaje activo.
   */
  private async routearBotonViaje(
    telefono: string,
    viaje: { id: string; estado: string; conductor_id?: string },
    replyId: string
  ): Promise<void> {
    if (replyId === 'hablar_conductor') {
      await this.whatsappRepo.enviarMensaje({
        telefono,
        texto: { type: 'text', text: { body: '💬 Escribe tu mensaje y lo enviaremos al conductor.' } }
      });
      return;
    }

    if (replyId === 'cancelar_viaje') {
      // Delegamos la cancelación al dominio de viajes (vía controller/endpoint)
      await this.whatsappRepo.enviarMensaje({
        telefono,
        texto: { type: 'text', text: { body: '⚠️ Para cancelar, usa el botón de cancelar en la app o contacta soporte.' } }
      });
      return;
    }

    // Botón no reconocido → mostrar estado actual
    await this.enviarEstadoActual(telefono, viaje);
  }
}
