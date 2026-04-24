import { IPrecioRepository } from '../../domain/precio.repository';

export class CalcularClientePrecioUseCase {
  constructor(private precioRepository: IPrecioRepository) {}

  async execute(dto: { distancia_km: number; tiempo_min: number; tipo_vehiculo: string }): Promise<number> {
    // Definimos el precio directamente: 3 BS por KM solicitado por el usuario
    const precioPorKm = 3;
    const montoFinal = dto.distancia_km * precioPorKm;

    // Retornamos el monto, asegurando un mínimo (ej. 10 Bs) si la distancia es muy corta, 
    // pero respetando la regla de los 3 Bs/km.
    return Number(montoFinal.toFixed(2));
  }
}
