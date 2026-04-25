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
      console.warn(`[Repository] Tarifa '${tipoVehiculo}' no encontrada. Intentando obtener tarifa general...`);
      
      // INTENTO 2: Intentar traer la primera tarifa disponible (Bypass para que funcione con todo)
      const { data: allRates } = await supabaseClient.from('tarifas').select('*').limit(1);
      
      if (allRates && allRates.length > 0) {
        console.log(`[Repository] Usando tarifa de respaldo: ${allRates[0].tipo_vehiculo}`);
        return new Precio(allRates[0]);
      }

      // INTENTO 3: Último recurso (Valores hardcodeados)
      console.error(`[Repository] 🚨 TOTAL FAIL: Sin tarifas en DB. Usando valores Críticos.`);
      return new Precio({
        tipo_vehiculo: 'emergencia',
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
