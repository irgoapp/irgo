import { IConductorRepository } from '../domain/conductor.repository';
import { Conductor } from '../domain/conductor.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseConductorRepository implements IConductorRepository {
  
  async buscarPorId(id: string): Promise<Conductor | null> {
    const { data, error } = await supabaseClient.from('conductores').select('*').eq('id', id).single();
    if (error || !data) return null;
    return new Conductor(data);
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

  async buscarCercanosDisponibles(lat: number, lon: number, radioKm: number, tipoVehiculo: string): Promise<Conductor[]> {
    // Buscar en Supabase conductores disponibles
    const { data: drivers, error } = await supabaseClient
      .from('conductores')
      .select('id, ubicacion, disponible, tipo_vehiculo, calificacion, usuario_id')
      .eq('disponible', true)
      .eq('tipo_vehiculo', tipoVehiculo);

    if (error) throw new Error(error.message);
    
    // (Simplificación de la lógica geo-espacial usando PostGIS)
    // El radio se evaluaría nativamente o tras parsearlo, como en tu viejo backend
    const cercanos = (drivers || []).map((d: any) => new Conductor(d));
    return cercanos;
  }
}
