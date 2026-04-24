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
}
