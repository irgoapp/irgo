export class ConfirmarViajeDto {
  viaje_id: string;
  destino_lat: number;
  destino_lng: number;
  destino_texto: string;
  monto: number;
  distancia_km: number;
  tiempo_minutos: number;

  constructor(data: any) {
    this.viaje_id = data.viaje_id;
    this.destino_lat = data.destino_lat;
    this.destino_lng = data.destino_lng;
    this.destino_texto = data.destino_texto;
    this.monto = data.monto;
    this.distancia_km = data.distancia_km;
    this.tiempo_minutos = data.tiempo_minutos;
  }

  validar() {
    if (!this.viaje_id) throw new Error('ID de viaje requerido');
    if (!this.destino_lat || !this.destino_lng) throw new Error('Coordenadas de destino requeridas');
  }
}
