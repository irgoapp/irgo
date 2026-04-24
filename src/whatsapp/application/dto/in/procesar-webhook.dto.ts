export class ProcesarWebhookDto {
  telefono: string;
  type: string;
  body?: string;
  replyId?: string;
  lat?: number;
  lng?: number;
  messageId?: string;

  constructor(payload: any) {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      this.telefono = ''; // Marcar como vacío para ignorar
      this.type = 'status_update';
      return;
    }

    this.telefono = message.from;
    this.type = message.type;
    this.messageId = message.id;

    if (this.type === 'text') {
      this.body = message.text?.body;
    }

    if (this.type === 'interactive') {
      this.replyId = message.interactive?.button_reply?.id || message.interactive?.list_reply?.id;
    }

    if (this.type === 'location') {
      this.lat = message.location?.latitude;
      this.lng = message.location?.longitude;
    }
  }

  validar() {
    if (this.type === 'status_update') return; // Es válido pero ignorado
    if (!this.telefono) throw new Error('Teléfono remitente obligatorio');
    if (!this.type) throw new Error('Tipo de mensaje desconocido');
  }
}
