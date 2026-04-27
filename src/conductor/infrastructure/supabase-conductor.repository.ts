import { IConductorRepository } from '../domain/conductor.repository'; // RPC Compatibility v1.2.1
import { Conductor } from '../domain/conductor.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseConductorRepository implements IConductorRepository {
  
  async buscarPorId(id: string): Promise<Conductor | null> {
    const { data, error } = await supabaseClient
      .from('conductores')
      .select('id, nombre, disponible, tipo_vehiculo, vehiculo_placa, vehiculo_color, vehiculo_marca, vehiculo_modelo, calificacion, ultima_ubicacion_at')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      console.warn(`[Repository] Conductor ${id} no encontrado:`, error?.message);
      return null;
    }

    return new Conductor({
      id: data.id,
      disponible: data.disponible,
      tipo_vehiculo: data.tipo_vehiculo,
      calificacion: data.calificacion,
      ultima_ubicacion_at: data.ultima_ubicacion_at
    });
  }


  async actualizarUbicacion(id: string, lat: number, lng: number): Promise<boolean> {
    const { error } = await supabaseClient.rpc('actualizar_ubicacion_conductor', {
      p_id: id,
      p_lat: lat,
      p_lng: lng
    });
    
    if (error) {
      console.error(`[Repository] Error al actualizar ubicación con RPC:`, error);
      throw new Error(error.message);
    }
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
    lng: number, 
    radioKm: number, 
    tipoVehiculo?: string,
    limite: number = 10,
    offset: number = 0
  ): Promise<Conductor[]> {
    // 1. LLAMADA RPC OPTIMIZADA: Ahora pasamos el tipo de vehículo directamente a la DB
    const { data: drivers, error } = await supabaseClient.rpc('conductores_cercanos', {
      p_lat: lat,
      p_lng: lng,
      p_radio: radioKm * 1000,
      p_tipo_vehiculo: tipoVehiculo // Se agrega este parámetro para filtrado nativo
    });

    if (error) {
      console.error("[Repository] Error en RPC conductores_cercanos:", error);
      throw new Error(error.message);
    }
    
    // 2. MAPEO DIRECTO: Eliminamos el .filter() manual. 
    // La DB ya nos entrega solo lo que necesitamos.
    const slice = (drivers || []).slice(offset, offset + limite);
    return slice.map((d: any) => new Conductor({
      id: d.id,
      disponible: true, 
      tipo_vehiculo: d.tipo_vehiculo,
      ubicacion_actual: { lat: d.lat || d.origen_lat, lng: d.lng || d.lon || d.origen_lng }, // Soporte multi-campo
      ultima_ubicacion_at: d.ultima_ubicacion_at
    }));
  }
}
