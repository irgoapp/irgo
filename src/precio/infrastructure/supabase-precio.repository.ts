import { IPrecioRepository } from '../domain/precio.repository';
import { Precio } from '../domain/precio.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabasePrecioRepository implements IPrecioRepository {
  async buscarTarifaPorVehiculo(tipoVehiculo: string): Promise<Precio | null> {
    // Intentamos buscar por el nombre que nos diste antes (vehiculo_tipo)
    let { data, error } = await supabaseClient
      .from('tarifas')
      .select('*')
      .eq('vehiculo_tipo', tipoVehiculo)
      .maybeSingle();

    // Si no lo encuentra, intentamos con el nombre que mencionaste ahora (tipo_vehiculo)
    if (!data) {
      const { data: altData } = await supabaseClient
        .from('tarifas')
        .select('*')
        .eq('tipo_vehiculo', tipoVehiculo)
        .maybeSingle();
      data = altData;
    }

    if (!data) {
      console.warn(`[Repository] Tarifa '${tipoVehiculo}' no encontrada en vehiculo_tipo ni tipo_vehiculo. Usando respaldo...`);
      
      const { data: anyRate } = await supabaseClient.from('tarifas').select('*').limit(1);
      
      if (anyRate && anyRate.length > 0) {
        return new Precio({
          ...anyRate[0],
          tipo_vehiculo: anyRate[0].vehiculo_tipo || anyRate[0].tipo_vehiculo
        });
      }

      console.error(`[Repository] 🚨 TOTAL FAIL: Sin tarifas en DB.`);
      return new Precio({
        tipo_vehiculo: 'emergencia',
        precio_por_km: 3, 
        tarifa_minima_bs: 10,
        comision_por_solicitud: 0.5,
        comision_por_km: 0.3,
        comision_solicitud_minima: 1
      });
    }

    return new Precio({
      ...data,
      tipo_vehiculo: data.vehiculo_tipo || data.tipo_vehiculo
    });
  }
}
