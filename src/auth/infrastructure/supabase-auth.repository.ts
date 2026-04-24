import { IAuthRepository } from '../domain/auth.repository';
import { AuthSession } from '../domain/auth.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseAuthRepository implements IAuthRepository {
  async loginConductor(telefono: string, passwordHash: string): Promise<AuthSession | null> {
    const emailFalso = `${telefono.trim()}@taxilibre.bo`;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: emailFalso,
      password: passwordHash
    });

    if (error || !data.session) return null;

    // 2. Extraer el Perfil Completo del Conductor desde la tabla 'conductores'
    let perfilData = {};
    const { data: qData, error: qError } = await supabaseClient
      .from('conductores')
      .select('nombre, telefono, vehiculo_placa, vehiculo_marca, vehiculo_modelo, vehiculo_color, vehiculo_tipo, calificacion, viajes_completados')
      .eq('telefono', telefono)
      .single();

    if (!qError && qData) {
      perfilData = qData;
    }

    return new AuthSession({
      token: data.session.access_token,
      conductor_id: data.user?.id,
      perfil: perfilData
    });
  }
}
