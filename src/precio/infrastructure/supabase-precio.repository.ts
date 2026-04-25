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
      throw new Error(`No se encontró configuración de tarifas para el tipo: ${tipoVehiculo}`);
    }

    return new Precio(data);
  }
}
