import { IMovimientoRepository } from '../domain/movimiento.repository';
import { Movimiento } from '../domain/movimiento.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseMovimientoRepository implements IMovimientoRepository {
  
  async obtenerSaldo(conductorId: string): Promise<number> {
    const { data, error } = await supabaseClient
      .from('conductor_saldo')
      .select('saldo')
      .eq('conductor_id', conductorId)
      .maybeSingle();

    if (error) throw new Error(`Error al obtener saldo: ${error.message}`);
    
    // Si no existe, lo inicializamos en 0
    if (!data) {
      const { data: newData, error: createError } = await supabaseClient
        .from('conductor_saldo')
        .insert({ conductor_id: conductorId, saldo: 0 })
        .select('saldo')
        .single();
      
      if (createError) throw new Error(`Error al crear saldo inicial: ${createError.message}`);
      return newData.saldo;
    }

    return data.saldo;
  }

  async actualizarSaldo(conductorId: string, nuevoSaldo: number): Promise<void> {
    const { error } = await supabaseClient
      .from('conductor_saldo')
      .update({ 
        saldo: nuevoSaldo, 
        actualizado_en: new Date().toISOString() 
      })
      .eq('conductor_id', conductorId);

    if (error) throw new Error(`Error al actualizar saldo: ${error.message}`);
  }

  async registrarTransaccion(movimiento: Movimiento): Promise<void> {
    const { error } = await supabaseClient
      .from('transacciones')
      .insert({
        id: movimiento.id,
        conductor_id: movimiento.conductor_id,
        solicitud_id: movimiento.solicitud_id,
        tipo: movimiento.tipo,
        monto: movimiento.monto,
        saldo_antes: movimiento.saldo_antes,
        saldo_despues: movimiento.saldo_despues,
        descripcion: movimiento.descripcion
      });

    if (error) throw new Error(`Error al registrar transacción: ${error.message}`);
  }

  async buscarPorSolicitudYTipo(solicitudId: string, tipo: string): Promise<Movimiento | null> {
    const { data, error } = await supabaseClient
      .from('transacciones')
      .select('*')
      .eq('solicitud_id', solicitudId)
      .eq('tipo', tipo)
      .maybeSingle();

    if (error) return null;
    return data ? new Movimiento(data) : null;
  }

  async obtenerHistorial(conductorId: string, limite: number = 20): Promise<Movimiento[]> {
    const { data, error } = await supabaseClient
      .from('transacciones')
      .select('*')
      .eq('conductor_id', conductorId)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) throw new Error(`Error al obtener historial: ${error.message}`);
    return (data || []).map(d => new Movimiento(d));
  }
}
