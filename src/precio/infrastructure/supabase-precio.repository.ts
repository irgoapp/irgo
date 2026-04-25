import { IPrecioRepository } from '../domain/precio.repository';
import { Precio } from '../domain/precio.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabasePrecioRepository implements IPrecioRepository {
  async buscarTarifaPorVehiculo(tipoVehiculo: string): Promise<Precio | null> {
    const { data, error } = await supabaseClient
      .from('tarifas')
      .select('*')
      .eq('tipo_vehiculo', tipoVehiculo)
      .single();

    if (error || !data) {
      console.warn(`[Repository] Tarifa '${tipoVehiculo}' no encontrada. Usando valores por defecto.`);
      // Valores por defecto seguros para evitar caída del sistema
      return new Precio({
        tipo_vehiculo: tipoVehiculo,
        precio_por_km: 3, 
        tarifa_minima_bs: 10,
        comision_por_solicitud: 0.5,
        comision_por_km: 0.3,
        comision_solicitud_minima: 1
      });
    }

    return new Precio(data);
  }
}
