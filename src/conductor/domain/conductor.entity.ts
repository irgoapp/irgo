export class Conductor {
  id?: string;
  usuario_id: string;
  disponible: boolean;
  ubicacion_actual?: { lat: number; lon: number };
  tipo_vehiculo: string;
  calificacion: number;

  constructor(data: Partial<Conductor>) {
    this.id = data.id;
    this.usuario_id = data.usuario_id!;
    this.disponible = data.disponible ?? false;
    this.ubicacion_actual = data.ubicacion_actual;
    this.tipo_vehiculo = data.tipo_vehiculo!;
    this.calificacion = data.calificacion ?? 5.0;
  }

  estaDisponible(): boolean {
    return this.disponible;
  }
}
