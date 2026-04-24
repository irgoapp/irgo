export class MensajeWhatsapp {
  telefono: string;
  texto: any;
  plantilla?: string;

  constructor(data: Partial<MensajeWhatsapp>) {
    this.telefono = data.telefono!;
    this.texto = data.texto!;
    this.plantilla = data.plantilla;
  }
}
