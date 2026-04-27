import { IViajeMensajesRepository } from '../domain/viaje-mensajes.repository';
import { ViajeMensaje } from '../domain/viaje-mensajes.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseViajeMensajesRepository implements IViajeMensajesRepository {

  async guardarMensaje(mensaje: ViajeMensaje): Promise<ViajeMensaje> {
    const { data, error } = await supabaseClient
      .from('viaje_mensajes')
      .insert({
        viaje_id: mensaje.viaje_id,
        emisor_tipo: mensaje.emisor_tipo,
        contenido: mensaje.contenido,
      })
      .select()
      .single();

    if (error) {
      console.error('[ViajeMensajesRepo] Error al guardar mensaje:', error.message);
      throw new Error(error.message);
    }

    return new ViajeMensaje(data);
  }

  async obtenerMensajes(viajeId: string): Promise<ViajeMensaje[]> {
    const { data, error } = await supabaseClient
      .from('viaje_mensajes')
      .select('*')
      .eq('viaje_id', viajeId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[ViajeMensajesRepo] Error al obtener mensajes:', error.message);
      return [];
    }

    return (data || []).map((d: any) => new ViajeMensaje(d));
  }
}
