import { Conductor } from '../../../domain/conductor.entity';

export class ConductorResponseDto {
  id?: string;
  disponible: boolean;
  calificacion: number;
  tipo_vehiculo: string;
  ubicacion?: { lat: number; lng: number };
  ultima_ubicacion_at?: string;

  constructor(conductor: Conductor) {
    this.id = conductor.id;
    this.disponible = conductor.disponible;
    this.calificacion = conductor.calificacion;
    this.tipo_vehiculo = conductor.tipo_vehiculo;
    this.ultima_ubicacion_at = conductor.ultima_ubicacion_at;
    if (conductor.ubicacion_actual) {
      this.ubicacion = conductor.ubicacion_actual;
    }
  }
}
