export class Conductor {
  id?: string;
  usuario_id?: string;
  disponible: boolean;
  ubicacion_actual?: { lat: number; lng: number };
  tipo_vehiculo: string;
  calificacion: number;
  ultima_ubicacion_at?: string;

  constructor(data: Partial<Conductor>) {
    this.id = data.id;
    this.usuario_id = data.usuario_id;
    this.disponible = data.disponible ?? false;
    this.ubicacion_actual = data.ubicacion_actual;
    this.tipo_vehiculo = data.tipo_vehiculo || 'basico';
    this.calificacion = data.calificacion ?? 5.0;
    this.ultima_ubicacion_at = data.ultima_ubicacion_at;
  }

  estaDisponible(): boolean {
    return this.disponible;
  }
}
