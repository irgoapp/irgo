import { ISessionRepository, SesionWhatsApp } from '../domain/wsp-session.entity';
import { supabaseClient } from '../../shared/supabase.client';

export class SupabaseWspSessionRepository implements ISessionRepository {
  
  private limpiarTelefono(telefono: string): string {
    // Elimina cualquier carácter que no sea un dígito (incluyendo el +)
    return telefono.replace(/\D/g, '');
  }

  async getSession(telefono: string): Promise<SesionWhatsApp | null> {
    const telfLimpio = this.limpiarTelefono(telefono);
    try {
      console.log(`[SessionRepo] Consultando DB para ${telfLimpio}...`);
      const { data, error } = await supabaseClient
        .from('sesiones_whatsapp')
        .select('*')
        .eq('telefono', telfLimpio)
        .maybeSingle();

      if (error) {
        console.error(`[SessionRepo] Error de Supabase: ${error.message}`);
        return null;
      }
      return data as SesionWhatsApp;
    } catch (e: any) {
      console.error(`[SessionRepo] Excepción Catastrófica: ${e.message}`);
      return null;
    }
  }

  async upsertSession(telefono: string, estado: string, contexto: any, finalizado_at?: string): Promise<boolean> {
    const telfLimpio = this.limpiarTelefono(telefono);
    const payload: any = {
      telefono: telfLimpio,
      estado,
      contexto,
      ultima_actividad: new Date().toISOString()
    };

    if (finalizado_at) {
      payload.finalizado_at = finalizado_at;
    }

    const { error } = await supabaseClient
      .from('sesiones_whatsapp')
      .upsert(payload, { onConflict: 'telefono' });

    if (error) {
      console.error(`[SessionRepo] Error al guardar sesión: ${error.message}`);
      throw new Error(error.message);
    }
    return true;
  }

  async deleteSession(telefono: string): Promise<boolean> {
    const telfLimpio = this.limpiarTelefono(telefono);
    const { error } = await supabaseClient
      .from('sesiones_whatsapp')
      .delete()
      .eq('telefono', telfLimpio);

    if (error) throw new Error(error.message);
    return true;
  }
}
