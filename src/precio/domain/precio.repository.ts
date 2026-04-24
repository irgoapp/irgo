import { Precio } from './precio.entity';

export interface IPrecioRepository {
  buscarTarifaPorVehiculo(tipoVehiculo: string): Promise<Precio | null>;
}
