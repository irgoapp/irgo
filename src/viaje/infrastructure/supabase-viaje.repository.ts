import { IViajeRepository } from '../domain/viaje.repository';
import { Viaje } from '../domain/viaje.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseViajeRepository implements IViajeRepository {

  async crear(viaje: Viaje): Promise<Viaje> {
    const payload = this.mapToDatabase(viaje);
    const { data, error } = await supabaseClient
      .from('solicitudes')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapToEntity(data);
  }

  async buscarPorId(id: string): Promise<Viaje | null> {
    const { data, error } = await supabaseClient
      .from('solicitudes')
      .select('*, clientes(nombre, telefono, calificacion)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    return this.mapToEntity(data);
  }

  async actualizarEstado(id: string, estado: string, metadata?: { cancelado_por?: string, cancelado_motivo?: string }): Promise<boolean> {
    const updatePayload: any = { estado };
    const now = new Date().toISOString();

    if (estado === 'buscando') updatePayload.buscando_at = now;
    if (estado === 'asignado') updatePayload.asignado_at = now;
    if (estado === 'llegado') updatePayload.llegado_at = now;
    if (estado === 'en_curso') updatePayload.iniciado_at = now;
    if (estado === 'completado') updatePayload.completado_at = now;
    if (estado === 'cancelado') {
      updatePayload.cancelado_at = now;
      if (metadata?.cancelado_por) updatePayload.cancelado_por = metadata.cancelado_por;
      if (metadata?.cancelado_motivo) updatePayload.cancelado_motivo = metadata.cancelado_motivo;
    }

    const { error } = await supabaseClient
      .from('solicitudes')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  async actualizar(viaje: Viaje): Promise<Viaje> {
    const payload = this.mapToDatabase(viaje);
    const { data, error } = await supabaseClient
      .from('solicitudes')
      .update(payload)
      .eq('id', viaje.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return this.mapToEntity(data);
  }

  // --- Mapeadores ---

  private mapToDatabase(v: Viaje): any {
    return {
      cliente_id: v.cliente_id,
      conductor_id: v.conductor_id,
      origen: `POINT(${v.origen.lng} ${v.origen.lat})`,
      origen_lat: v.origen.lat,
      origen_lng: v.origen.lng,
      origen_texto: v.origen_texto,
      destino_lat: v.destino?.lat,
      destino_lng: v.destino?.lng,
      destino_texto: v.destino_texto,
      monto_ruta: v.monto_ruta,
      monto_conductor: v.monto_conductor,
      monto_comision: v.monto_comision,
      distancia_ruta: v.distancia_ruta,
      tiempo_ruta: v.tiempo_ruta,
      tipo_vehiculo: v.tipo_vehiculo,
      estado: v.estado,
      buscando_at: v.buscando_at?.toISOString(),
      asignado_at: v.asignado_at?.toISOString(),
      llegado_at: v.llegado_at?.toISOString(),
      iniciado_at: v.iniciado_at?.toISOString(),
      completado_at: v.completado_at?.toISOString(),
      cancelado_at: v.cancelado_at?.toISOString(),
      cancelado_por: v.cancelado_por,
      cancelado_motivo: v.cancelado_motivo,
      ruta: v.ruta,
      ruta_recogida: v.ruta_recogida,
      pin_verificacion: v.pin_verificacion
    };
  }

  private mapToEntity(data: any): Viaje {
    return new Viaje({
      id: data.id,
      cliente_id: data.cliente_id,
      conductor_id: data.conductor_id,
      estado: data.estado,
      monto_ruta: data.monto_ruta,
      monto_conductor: data.monto_conductor,
      monto_comision: data.monto_comision,
      origen: { lat: data.origen_lat, lng: data.origen_lng },
      origen_texto: data.origen_texto,
      destino: { lat: data.destino_lat || 0, lng: data.destino_lng || 0 },
      destino_texto: data.destino_texto,
      distancia_ruta: data.distancia_ruta,
      tiempo_ruta: data.tiempo_ruta,
      tipo_vehiculo: data.tipo_vehiculo || 'moto',
      creado_en: new Date(data.created_at),
      buscando_at: data.buscando_at,
      asignado_at: data.asignado_at,
      llegado_at: data.llegado_at,
      iniciado_at: data.iniciado_at,
      completado_at: data.completado_at,
      cancelado_at: data.cancelado_at,
      cancelado_por: data.cancelado_por,
      cancelado_motivo: data.cancelado_motivo,
      ruta: data.ruta,
      ruta_recogida: data.ruta_recogida,
      pin_verificacion: data.pin_verificacion,
      cliente: data.clientes // Mapeamos la relación cargada en buscarPorId
    });
  }

  async asignarConductor(id: string, conductorId: string, rutaRecogida?: any[]): Promise<boolean> {
    const { data, error } = await supabaseClient
      .from('solicitudes')
      .update({
        conductor_id: conductorId,
        asignado_at: new Date().toISOString(),
        estado: 'asignado',
        ruta_recogida: rutaRecogida
      })
      .eq('id', id)
      .eq('estado', 'buscando') // Bloqueo Atómico
      .select();

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      throw new Error('EL_VIAJE_YA_NO_ESTA_DISPONIBLE');
    }
    return true;
  }

  async obtenerHistorial(conductorId: string, filtro?: { inicio?: string, fin?: string }): Promise<{ metricas: any, historial: any[] }> {
    // 1. Obtener Métricas vía RPC
    const { data: metricas, error: errorMetricas } = await supabaseClient.rpc('obtener_metricas_historial', {
      p_conductor_id: conductorId,
      p_fecha_inicio: filtro?.inicio || null,
      p_fecha_fin: filtro?.fin || null
    });

    if (errorMetricas) {
        console.error('[SupabaseViajeRepository] Error en RPC metricas:', errorMetricas.message);
    }

    // 2. Obtener Historial Filtrado
    let query = supabaseClient
      .from('solicitudes')
      .select('id, origen_texto, destino_texto, estado, created_at, completado_at, distancia_ruta, monto_conductor')
      .eq('conductor_id', conductorId);

    if (filtro?.inicio) {
        query = query.gte('completado_at', filtro.inicio);
    }
    if (filtro?.fin) {
        query = query.lte('completado_at', filtro.fin);
    }

    const { data: historial, error: errorHistorial } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (errorHistorial) throw new Error(errorHistorial.message);

    return {
        metricas: metricas || { viajes: 0, distancia: 0, total: 0 },
        historial: historial || []
    };
  }

  async buscarActivoPorConductor(conductorId: string): Promise<Viaje | null> {
    const { data, error } = await supabaseClient
      .from('solicitudes')
      .select('*, clientes(nombre, telefono, calificacion)')
      .eq('conductor_id', conductorId)
      .in('estado', ['asignado', 'llegado', 'en_curso'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }
}
