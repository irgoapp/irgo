import { supabaseClient } from '../shared/supabase.client';

export interface AppVersionResponse {
  version_actual: string;
  url_descarga: string;
  notas_version: string;
  es_mantenimiento: boolean;
  mensaje_mantenimiento: string;
}

export class AppVersionService {
  async obtenerVersion(appNombre: string = 'irgo-driver'): Promise<AppVersionResponse | null> {
    const { data, error } = await supabaseClient
      .from('app_versiones')
      .select('*')
      .eq('app_nombre', appNombre)
      .eq('plataforma', 'android')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`[AppVersionService] Error al obtener versión: ${error.message}`);
      return null;
    }

    if (!data) return null;

    return {
      version_actual: data.version_actual,
      url_descarga: data.url_descarga,
      notas_version: data.notas_version || '',
      es_mantenimiento: data.es_mantenimiento || false,
      mensaje_mantenimiento: data.mensaje_mantenimiento || ''
    };
  }
}
