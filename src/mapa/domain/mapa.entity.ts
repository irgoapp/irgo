export class Mapa {
  origen: { lat: number; lon: number };
  destino: { lat: number; lon: number };
  distancia_km: number;
  tiempo_minutos: number;
  geojson?: any;

  constructor(data: Partial<Mapa>) {
    this.origen = data.origen!;
    this.destino = data.destino!;
    this.distancia_km = data.distancia_km!;
    this.tiempo_minutos = data.tiempo_minutos!;
    this.geojson = data.geojson;
  }
}
