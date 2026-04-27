import { IViajeLookupRepository } from '../domain/viaje-lookup.repository';
import { supabaseClient } from '../../shared/supabase.client';

/**
 * Consulta la tabla solicitudes para determinar si un cliente
 * tiene un viaje activo (estado != completado, cancelado).
 */
export class SupabaseViajeLookupRepository implements IViajeLookupRepository {

  async buscarViajeActivoPorCliente(clienteId: string): Promise<any | null> {
    const { data, error } = await supabaseClient
      .from('solicitudes')
      .select('id, estado, conductor_id, buscando_at, asignado_at, llegado_at, iniciado_at')
      .eq('cliente_id', clienteId)
      .not('estado', 'in', '("completado","cancelado")')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[ViajeLookupRepo] Error buscando viaje activo:', error.message);
      return null;
    }

    return data;
  }
}
