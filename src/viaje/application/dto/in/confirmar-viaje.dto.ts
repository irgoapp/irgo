export class ConfirmarViajeDto {
  viaje_id: string;
  destino_lat: number;
  destino_lng: number;
  destino_texto: string;
  monto_ruta: number;
  distancia_ruta: number;
  tiempo_ruta: number;

  constructor(data: any) {
    this.viaje_id = data.viaje_id;
    this.destino_lat = data.destino_lat;
    this.destino_lng = data.destino_lng;
    this.destino_texto = data.destino_texto;
    this.monto_ruta = data.monto_ruta;
    this.distancia_ruta = data.distancia_ruta;
    this.tiempo_ruta = data.tiempo_ruta;
  }

  validar() {
    if (!this.viaje_id) throw new Error('ID de viaje requerido');
    if (!this.destino_lat || !this.destino_lng) throw new Error('Coordenadas de destino requeridas');
  }
}
