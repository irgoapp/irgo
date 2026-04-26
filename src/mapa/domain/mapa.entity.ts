export class Mapa {
  origen: { lat: number; lng: number };
  destino: { lat: number; lng: number };
  distancia_ruta: number;
  tiempo_ruta: number;
  geojson?: any;

  constructor(data: Partial<Mapa>) {
    this.origen = data.origen!;
    this.destino = data.destino!;
    this.distancia_ruta = data.distancia_ruta!;
    this.tiempo_ruta = data.tiempo_ruta!;
    this.geojson = data.geojson;
  }
}
