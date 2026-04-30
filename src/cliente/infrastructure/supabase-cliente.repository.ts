import { IClienteRepository } from '../domain/cliente.repository';
import { Cliente } from '../domain/cliente.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseClienteRepository implements IClienteRepository {
  
  async buscarPorTelefono(telefono: string): Promise<Cliente | null> {
    const { data, error } = await supabaseClient
      .from('clientes')
      .select('*')
      .eq('telefono', telefono)
      .maybeSingle();

    if (error || !data) return null;
    return new Cliente(data);
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    const { data, error } = await supabaseClient
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return new Cliente(data);
  }

  async crear(cliente: Cliente): Promise<Cliente> {
    const { data, error } = await supabaseClient
      .from('clientes')
      .insert({
        nombre: cliente.nombre,
        telefono: cliente.telefono,
        // Asume un DB default para la calificación en Supabase, si está bien modelada.
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return new Cliente(data);
  }

  async incrementarCancelaciones(id: string): Promise<void> {
    // Usamos una consulta atómica de incremento si es posible, 
    // o en su defecto un RPC si el usuario lo tiene configurado.
    // Como no tenemos certeza del RPC, usamos la lógica de lectura/escritura 
    // o un query directo si el cliente lo permite.
    const { data: current } = await supabaseClient
      .from('clientes')
      .select('cancelaciones_consecutivas')
      .eq('id', id)
      .single();

    const { error } = await supabaseClient
      .from('clientes')
      .update({ cancelaciones_consecutivas: (current?.cancelaciones_consecutivas || 0) + 1 })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async resetearCancelaciones(id: string): Promise<void> {
    const { error } = await supabaseClient
      .from('clientes')
      .update({ cancelaciones_consecutivas: 0 })
      .eq('id', id);

    if (error) throw new Error(error.message);
  }
}
