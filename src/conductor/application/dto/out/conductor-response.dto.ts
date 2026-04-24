import { Conductor } from '../../../domain/conductor.entity';

export class ConductorResponseDto {
  id?: string;
  disponible: boolean;
  calificacion: number;
  tipo_vehiculo: string;
  ubicacion?: { lat: number; lon: number };

  constructor(conductor: Conductor) {
    this.id = conductor.id;
    this.disponible = conductor.disponible;
    this.calificacion = conductor.calificacion;
    this.tipo_vehiculo = conductor.tipo_vehiculo;
    if (conductor.ubicacion_actual) {
      this.ubicacion = conductor.ubicacion_actual;
    }
  }
}
