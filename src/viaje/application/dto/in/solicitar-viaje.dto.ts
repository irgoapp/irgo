export class SolicitarViajeDto {
  cliente_id: string;
  origen: { lat: number; lon: number };
  destino: { lat: number; lon: number };
  tipo_vehiculo: string;

  constructor(data: any) {
    this.cliente_id = data.cliente_id;
    this.origen = { lat: data.origen_lat, lon: data.origen_lon };
    this.destino = { lat: data.destino_lat, lon: data.destino_lon };
    this.tipo_vehiculo = data.tipo_vehiculo;
  }

  validar() {
    if (!this.cliente_id) throw new Error('cliente_id requerido');
    if (!this.origen.lat || !this.origen.lon) throw new Error('origen (lat, lon) requerido');
  }
}
