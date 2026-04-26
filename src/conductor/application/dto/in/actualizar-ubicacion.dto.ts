export class ActualizarUbicacionDto {
  conductor_id: string;
  lat: number;
  lng: number;

  constructor(data: any) {
    this.conductor_id = data.conductor_id;
    this.lat = data.lat;
    this.lng = data.lng;
  }

  validar() {
    if (!this.conductor_id) throw new Error('conductor_id requerido');
    if (!this.lat || !this.lng) throw new Error('lat y lng requeridos');
  }
}
