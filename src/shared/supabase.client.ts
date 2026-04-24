import { createClient } from '@supabase/supabase-js';

// Cliente formal usando las variables del entorno en shared
// Soporte multi-variable para distintos entornos (Railway, Local, Vercel)
const supabaseUrl = 
  process.env.SUPABASE_URL || 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';

const supabaseKey = 
  process.env.SUPABASE_SERVICE_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SERVICE_ROLE_KEY || 
  '';

// Log de diagnóstico en el arranque para depurar Railway
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ [SUPABASE] ERROR CRÍTICO: Faltan variables de entorno (URL o KEY).');
  console.log(`[DUMP ENV] URL:${supabaseUrl ? 'SI' : 'NO'} | KEY:${supabaseKey ? 'SI' : 'NO'}`);
} else {
  console.log(`🚀 [SUPABASE] Inicializando cliente centralizado... URL detectada: ${supabaseUrl.substring(0, 20)}...`);
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
