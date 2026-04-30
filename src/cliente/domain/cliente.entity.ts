export class Cliente {
  id?: string;
  nombre: string;
  telefono: string;
  calificacion: number;
  suspendido_hasta?: Date;
  cancelaciones_consecutivas: number;

  constructor(data: Partial<Cliente>) {
    this.id = data.id;
    this.nombre = data.nombre || 'Cliente WhatsApp';
    this.telefono = data.telefono!;
    this.calificacion = data.calificacion ?? 5.0;
    this.suspendido_hasta = data.suspendido_hasta ? new Date(data.suspendido_hasta) : undefined;
    this.cancelaciones_consecutivas = data.cancelaciones_consecutivas || 0;
  }
}
