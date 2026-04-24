import { IPrecioRepository } from '../domain/precio.repository';
import { Precio } from '../domain/precio.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabasePrecioRepository implements IPrecioRepository {
  async buscarTarifaPorVehiculo(tipoVehiculo: string): Promise<Precio | null> {
    const { data } = await supabaseClient.from('tarifas').select('*').eq('tipo_vehiculo', tipoVehiculo).single();
    if (!data) return new Precio({ tipo_vehiculo: tipoVehiculo, precio_base: 5, precio_km: 1.2, precio_minuto: 0.5 });
    return new Precio(data);
  }
}
