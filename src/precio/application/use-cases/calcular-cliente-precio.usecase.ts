import { IPrecioRepository } from '../../domain/precio.repository';

export interface PrecioBreakdown {
  monto_ruta: number;
  monto_comision: number;
  monto_conductor: number;
}

export class CalcularClientePrecioUseCase {
  constructor(private precioRepository: IPrecioRepository) {}

  async execute(dto: { distancia_ruta: number; tipo_vehiculo: string }): Promise<PrecioBreakdown> {
    const tarifa = await this.precioRepository.buscarTarifaPorVehiculo(dto.tipo_vehiculo);
    
    if (!tarifa) {
      throw new Error(`Tarifa no encontrada para vehículo: ${dto.tipo_vehiculo}`);
    }

    const distancia = dto.distancia_ruta;

    // 1. Cálculo del Monto Base
    const base_kilometraje = tarifa.precio_por_km * distancia;
    const base_comisiones = tarifa.comision_por_solicitud + (tarifa.comision_por_km * distancia);
    const subtotal = base_kilometraje + base_comisiones;
    
    const comision_porcentaje_valor = tarifa.comision_porcentaje || 0;
    const monto_con_porcentaje = subtotal + (subtotal * (comision_porcentaje_valor / 100));

    // 2. Definición del Monto para el Cliente (monto_ruta)
    const monto_ruta = Math.max(monto_con_porcentaje, tarifa.tarifa_minima_bs);
    const aplicoMinima = monto_ruta === tarifa.tarifa_minima_bs && monto_con_porcentaje < tarifa.tarifa_minima_bs;

    // 3. Cálculo de la Comisión de la Plataforma (monto_comision)
    let monto_comision = 0;
    if (aplicoMinima) {
      // CASO A: Se aplicó Tarifa Mínima
      monto_comision = tarifa.comision_solicitud_minima;
    } else {
      // CASO B: Superó la Mínima
      monto_comision = tarifa.comision_por_solicitud + 
                       (tarifa.comision_por_km * distancia) + 
                       (subtotal * (comision_porcentaje_valor / 100));
    }

    // 4. Pago al Conductor (monto_conductor)
    const monto_conductor = monto_ruta - monto_comision;
    
    return {
      monto_ruta: Number(monto_ruta.toFixed(2)),
      monto_comision: Number(monto_comision.toFixed(2)),
      monto_conductor: Number(monto_conductor.toFixed(2))
    };
  }
}
