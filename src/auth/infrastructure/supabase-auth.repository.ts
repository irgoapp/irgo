import { IAuthRepository } from '../domain/auth.repository';
import { AuthSession } from '../domain/auth.entity';
import { supabaseClient } from '../../shared/supabase.client';
import { createClient } from '@supabase/supabase-js';

export class SupabaseAuthRepository implements IAuthRepository {
  async loginConductor(telefono: string, passwordHash: string): Promise<AuthSession | null> {
    const cleanedTelefono = telefono.trim().replace(/\D/g, '').replace(/^591/, '');
    const emailFalso = `${cleanedTelefono}@irgodriver.com`;

    // CRÍTICO: Creamos una instancia local para el login. 
    // Esto evita que la sesión del conductor "ensucie" el cliente global admin.
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
    
    const localAuthClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await localAuthClient.auth.signInWithPassword({
      email: emailFalso,
      password: passwordHash
    });

    if (error || !data.session) return null;

    // 2. Extraer el Perfil Completo del Conductor desde la tabla 'conductores'
    let perfilData = {};
    const { data: qData, error: qError } = await supabaseClient
      .from('conductores')
      .select('nombre, apellido, foto_url, telefono, vehiculo_placa, vehiculo_marca, vehiculo_modelo, vehiculo_color, tipo_vehiculo, calificacion')
      .eq('id', data.user?.id)
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
