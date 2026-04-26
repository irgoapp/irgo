export class Ruta {
  puntos_coordenadas: Array<{ lat: number; lng: number }>;
  distancia_metros: number;
  tiempo_segundos: number;
  polilinea_geojson: any;

  constructor(data: any) {
    this.puntos_coordenadas = data.puntos_coordenadas || [];
    this.distancia_metros = data.distancia_metros || 0;
    this.tiempo_segundos = data.tiempo_segundos || 0;
    this.polilinea_geojson = data.polilinea_geojson;
  }
}
