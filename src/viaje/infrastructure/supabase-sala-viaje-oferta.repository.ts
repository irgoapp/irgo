import { ISalaViajeOfertaRepository } from '../domain/sala-viaje-oferta.repository';
import { SalaViajeOferta } from '../domain/sala-viaje-oferta.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseSalaViajeOfertaRepository implements ISalaViajeOfertaRepository {
  
  async crear(sala: SalaViajeOferta): Promise<SalaViajeOferta> {
    const { data, error } = await supabaseClient
      .from('sala_viaje_ofertas')
      .insert({
        viaje_id: sala.viaje_id,
        enviado_conductores_id: sala.enviado_conductores_id, // Supabase maneja JSONB automáticamente desde el array
        numero_conductores: sala.numero_conductores,
        cliente_id: sala.cliente_id,
        estado_oferta: sala.estado_oferta
      })
      .select()
      .single();

    if (error) {
      console.error(`[SalaOfertasRepo] Error creando sala: ${error.message}`);
      throw new Error(error.message);
    }
    return new SalaViajeOferta(data);
  }

  async buscarPorViajeId(viajeId: string): Promise<SalaViajeOferta | null> {
    const { data, error } = await supabaseClient
      .from('sala_viaje_ofertas')
      .select('*')
      .eq('viaje_id', viajeId)
      .maybeSingle();

    if (error || !data) return null;
    return new SalaViajeOferta(data);
  }

  async actualizarEstado(viajeId: string, estado: SalaViajeOferta['estado_oferta'], conductorId?: string): Promise<boolean> {
    const updatePayload: any = {
      estado_oferta: estado,
      updated_at: new Date().toISOString()
    };

    if (conductorId) {
      updatePayload.conductor_id = conductorId;
    }

    const { error } = await supabaseClient
      .from('sala_viaje_ofertas')
      .update(updatePayload)
      .eq('viaje_id', viajeId);

    if (error) {
      console.error(`[SalaOfertasRepo] Error actualizando estado a ${estado}: ${error.message}`);
      return false;
    }
    return true;
  }

  async agregarConductores(viajeId: string, conductoresIds: string[]): Promise<boolean> {
    const sala = await this.buscarPorViajeId(viajeId);
    if (!sala) return false;

    // Unificamos y evitamos duplicados
    const listaNueva = Array.from(new Set([...sala.enviado_conductores_id, ...conductoresIds]));
    
    const { error } = await supabaseClient
      .from('sala_viaje_ofertas')
      .update({
        enviado_conductores_id: listaNueva,
        numero_conductores: listaNueva.length,
        updated_at: new Date().toISOString()
      })
      .eq('viaje_id', viajeId);

    if (error) {
      console.error(`[SalaOfertasRepo] Error agregando conductores: ${error.message}`);
      return false;
    }
    return true;
  }
}
