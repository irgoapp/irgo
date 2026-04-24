export class Cliente {
  id?: string;
  nombre: string;
  telefono: string;
  calificacion: number;

  constructor(data: Partial<Cliente>) {
    this.id = data.id;
    this.nombre = data.nombre || 'Cliente WhatsApp';
    this.telefono = data.telefono!;
    this.calificacion = data.calificacion ?? 5.0;
  }
}
