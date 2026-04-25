import { IConductorRepository } from '../domain/conductor.repository'; // RPC Compatibility v1.2.1
import { Conductor } from '../domain/conductor.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseConductorRepository implements IConductorRepository {
  
  async buscarPorId(id: string): Promise<Conductor | null> {
    // Usamos RPC para evitar el conflicto con la columna 'ubicacion' EWKB
    const { data, error } = await supabaseClient.rpc('obtener_conductor_por_id', { 
      id_conductor: id 
    });

    if (error || !data) {
      console.warn(`[Repository] Conductor ${id} no encontrado o error en RPC:`, error);
      return null;
    }

    // La RPC ya nos devuelve lat y lon como números planos
    const d = Array.isArray(data) ? data[0] : data;
    
    return new Conductor({
      id: d.id,
      disponible: d.disponible,
      tipo_vehiculo: d.vehiculo_tipo,
      ubicacion_actual: { lat: d.lat, lon: d.lon }
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
    const { data: drivers, error } = await supabaseClient.rpc('conductores_cercanos', {
      p_lat: lat,
      p_lng: lon,
      p_radio: radioKm * 1000 // Convertir a metros para la RPC
    });

    if (error) {
      console.error("[Repository] Error en RPC conductores_cercanos:", error);
      throw new Error(error.message);
    }
    
    // Mapeo y FILTRO por tipo de vehículo (Garantiza consistencia si la RPC no lo hace)
    const filtered = (drivers || []).filter((d: any) => 
      !tipoVehiculo || d.vehiculo_tipo === tipoVehiculo
    );

    const slice = filtered.slice(offset, offset + limite);
    return slice.map((d: any) => new Conductor({
      id: d.id,
      disponible: true, 
      tipo_vehiculo: d.vehiculo_tipo,
      ubicacion_actual: { lat: d.lat || d.origen_lat, lon: d.lon || d.origen_lng } // Manejar variantes de nombre de la RPC
    }));
  }
}
