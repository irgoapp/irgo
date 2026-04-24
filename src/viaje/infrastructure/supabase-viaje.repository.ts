import { IViajeRepository } from '../domain/viaje.repository';
import { Viaje } from '../domain/viaje.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseViajeRepository implements IViajeRepository {
  
  async crear(viaje: Viaje): Promise<Viaje> {
    const { data, error } = await supabaseClient
      .from('solicitudes')
      .insert({
        cliente_id: viaje.cliente_id,
        origen: `POINT(${viaje.origen.lon} ${viaje.origen.lat})`,
        origen_lat: viaje.origen.lat,
        origen_lng: viaje.origen.lon,
        destino_lat: viaje.destino.lat, 
        destino_lng: viaje.destino.lon,
        monto_ruta: viaje.precio ?? 0,
        estado: 'borrador' 
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return new Viaje({ ...viaje, id: data.id, estado: data.estado });
  }

  async buscarPorId(id: string): Promise<Viaje | null> {
    const { data, error } = await supabaseClient
      .from('solicitudes')
      .select('*, clientes(nombre, telefono)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    
    return new Viaje({
      id: data.id,
      cliente_id: data.cliente_id,
      conductor_id: data.conductor_id,
      estado: data.estado,
      precio: data.monto_ruta,
      origen: { lat: data.origen_lat, lon: data.origen_lng },
      destino: { lat: data.destino_lat || 0, lon: data.destino_lng || 0 },
      tipo_vehiculo: 'basico'
    });
  }

  async actualizarEstado(id: string, estado: string): Promise<boolean> {
    const updatePayload: any = { estado };
    const now = new Date().toISOString();
    
    if (estado === 'asignado') updatePayload.asignado_at = now;
    if (estado === 'en_curso') updatePayload.iniciado_at = now;
    if (estado === 'completado') updatePayload.completado_at = now;
    if (estado === 'cancelado') updatePayload.cancelado_at = now;

    const { error } = await supabaseClient
      .from('solicitudes')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  async actualizar(viaje: Viaje): Promise<Viaje> {
    const { data, error } = await supabaseClient
      .from('solicitudes')
      .update({
        destino_lat: viaje.destino.lat,
        destino_lng: viaje.destino.lon,
        destino_texto: viaje.destino_texto,
        monto_ruta: viaje.precio,
        estado: viaje.estado,
        distancia_ruta: viaje.distancia_km
      })
      .eq('id', viaje.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return new Viaje({
      ...viaje,
      id: data.id,
      estado: data.estado,
      precio: data.monto_ruta
    });
  }

  async actualizarConductor(id: string, conductorId: string): Promise<boolean> {
    const { error } = await supabaseClient
      .from('solicitudes')
      .update({
        conductor_id: conductorId,
        asignado_at: new Date().toISOString(),
        estado: 'asignado'
      })
      .eq('id', id)
      .eq('estado', 'buscando'); 

    if (error) throw new Error(error.message);
    return true;
  }

  async obtenerHistorial(conductorId: string): Promise<any[]> {
    const { data, error } = await supabaseClient
      .from('solicitudes')
      .select('id, origen_texto, destino_texto, estado, created_at, distancia_ruta, monto_ruta, completado_at')
      .eq('conductor_id', conductorId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    return data || [];
  }
}
