/**
 * Entidad para el túnel de chat conductor ↔ cliente.
 * Cada fila es un mensaje dentro de un viaje activo.
 */
export class ViajeMensaje {
  id?: string;
  viaje_id: string;
  emisor_tipo: 'cliente' | 'conductor' | 'sistema';
  contenido: string;
  created_at: Date;

  constructor(data: Partial<ViajeMensaje>) {
    this.id = data.id;
    this.viaje_id = data.viaje_id!;
    this.emisor_tipo = data.emisor_tipo!;
    this.contenido = data.contenido!;
    this.created_at = data.created_at || new Date();
  }
}
