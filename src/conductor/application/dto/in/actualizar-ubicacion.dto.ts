export class ActualizarUbicacionDto {
  conductor_id: string;
  lat: number;
  lon: number;

  constructor(data: any) {
    this.conductor_id = data.conductor_id;
    this.lat = data.lat;
    this.lon = data.lon;
  }

  validar() {
    if (!this.conductor_id) throw new Error('conductor_id requerido');
    if (!this.lat || !this.lon) throw new Error('lat y lon requeridos');
  }
}
