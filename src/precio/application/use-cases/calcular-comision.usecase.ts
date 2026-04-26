import { IPrecioRepository } from '../../domain/precio.repository';

export class CalcularComisionUseCase {
  constructor(private precioRepository: IPrecioRepository) {}

  async execute(dto: { distancia_ruta: number; tipo_vehiculo: string }): Promise<number> {
    const tarifa = await this.precioRepository.buscarTarifaPorVehiculo(dto.tipo_vehiculo);
    
    if (!tarifa) {
      throw new Error(`Tarifa no encontrada para vehículo: ${dto.tipo_vehiculo}`);
    }

    // Comisión = fija por solicitud + por km
    const comisionKm = dto.distancia_ruta * tarifa.comision_por_km;
    const comisionTotal = tarifa.comision_por_solicitud + comisionKm;
    
    // Aplica mínimo de comisión
    const comisionFinal = Math.max(
      comisionTotal, 
      tarifa.comision_solicitud_minima
    );
    
    return Number(comisionFinal.toFixed(2));
  }
}
