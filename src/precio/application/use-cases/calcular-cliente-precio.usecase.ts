import { IPrecioRepository } from '../../domain/precio.repository';

export class CalcularClientePrecioUseCase {
  constructor(private precioRepository: IPrecioRepository) {}

  async execute(dto: { distancia_ruta: number; tipo_vehiculo: string }): Promise<number> {
    const tarifa = await this.precioRepository.buscarTarifaPorVehiculo(dto.tipo_vehiculo);
    
    if (!tarifa) {
      throw new Error(`Tarifa no encontrada para vehículo: ${dto.tipo_vehiculo}`);
    }

    const monto = dto.distancia_ruta * tarifa.precio_por_km;
    const montoFinal = Math.max(monto, tarifa.tarifa_minima_bs);
    
    return Number(montoFinal.toFixed(2));
  }
}
