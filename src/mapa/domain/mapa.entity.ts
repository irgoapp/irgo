export class Mapa {
  origen: { lat: number; lon: number };
  destino: { lat: number; lon: number };
  distancia_km: number;
  tiempo_ruta: number;
  geojson?: any;

  constructor(data: Partial<Mapa>) {
    this.origen = data.origen!;
    this.destino = data.destino!;
    this.distancia_km = data.distancia_km!;
    this.tiempo_ruta = data.tiempo_ruta!;
    this.geojson = data.geojson;
  }
}
