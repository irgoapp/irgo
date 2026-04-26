import { Mapa } from './mapa.entity';

export interface IMapaRepository {
  calcularRuta(origen: { lat: number; lng: number }, destino: { lat: number; lng: number }): Promise<Mapa>;
}
