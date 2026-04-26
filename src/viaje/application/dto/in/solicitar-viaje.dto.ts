export class SolicitarViajeDto {
  cliente_id: string;
  origen: { lat: number; lng: number };
  origen_texto?: string;
  destino: { lat: number; lng: number };
  destino_texto?: string;
  tipo_vehiculo: string;

  constructor(data: any) {
    this.cliente_id = data.cliente_id;
    this.origen = { lat: data.origen_lat, lng: data.origen_lng };
    this.origen_texto = data.origen_texto;
    this.destino = { lat: data.destino_lat, lng: data.destino_lng };
    this.destino_texto = data.destino_texto;
    this.tipo_vehiculo = data.tipo_vehiculo;
  }

  validar() {
    if (!this.cliente_id) throw new Error('cliente_id requerido');
    if (!this.origen.lat || !this.origen.lng) throw new Error('origen (lat, lng) requerido');
  }
}
