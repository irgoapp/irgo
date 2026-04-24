import { Mapa } from './mapa.entity';

export interface IMapaRepository {
  calcularRuta(origen: { lat: number; lon: number }, destino: { lat: number; lon: number }): Promise<Mapa>;
}
