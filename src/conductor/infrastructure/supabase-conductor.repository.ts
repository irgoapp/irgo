import { IConductorRepository } from '../domain/conductor.repository'; // Fresh build trigger
import { Conductor } from '../domain/conductor.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseConductorRepository implements IConductorRepository {
  
  async buscarPorId(id: string): Promise<Conductor | null> {
    const { data, error } = await supabaseClient.from('conductores').select('*').eq('id', id).single();
    if (error || !data) return null;
    return new Conductor({
      ...data,
      tipo_vehiculo: data.vehiculo_tipo
    });
  }

  async actualizarUbicacion(id: string, lat: number, lon: number): Promise<boolean> {
    const wkt = `POINT(${lon} ${lat})`;
    const { error } = await supabaseClient
      .from('conductores')
      .update({
        ubicacion: wkt,
        ultima_posicion_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
    return true;
  }

  async cambiarDisponibilidad(id: string, disponible: boolean): Promise<boolean> {
    const { error } = await supabaseClient
      .from('conductores')
      .update({ disponible })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  async buscarCercanosDisponibles(
    lat: number, 
    lon: number, 
    radioKm: number, 
    tipoVehiculo: string,
    limite: number = 10,
    offset: number = 0
  ): Promise<Conductor[]> {
    // LLAMADA RPC: Usamos la función optimizada de Supabase/PostGIS
    const { data: drivers, error } = await supabaseClient.rpc('buscar_conductores_cercanos', {
      lat_origen: lat,
      lon_origen: lon,
      radio_metros: radioKm * 1000 // Convertir a metros para la RPC
    });

    if (error) {
      console.error("[Repository] Error en RPC buscar_conductores_cercanos:", error);
      throw new Error(error.message);
    }
    
    // Mapeo plano directo de la RPC (lat/lon ya vienen como números)
    const slice = (drivers || []).slice(offset, offset + limite);
    return slice.map((d: any) => new Conductor({
      id: d.id,
      disponible: true, // Si la RPC los devolvió es porque cumplen el filtro
      tipo_vehiculo: d.vehiculo_tipo,
      ubicacion_actual: { lat: d.lat, lon: d.lon }
    }));
  }
}
