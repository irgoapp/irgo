-- 1. Añadir columna de control para completados
ALTER TABLE public.sesiones_whatsapp 
ADD COLUMN IF NOT EXISTS finalizado_at timestamp with time zone;

-- 2. Función del Trigger centralizada
CREATE OR REPLACE FUNCTION public.handle_trip_end_session_cleanup()
RETURNS TRIGGER AS $$
DECLARE
    v_cliente_telefono TEXT;
BEGIN
    -- Solo actuar si el estado cambia a completada o cancelada
    IF (NEW.estado = 'completada' OR NEW.estado = 'cancelada') AND (OLD.estado IS DISTINCT FROM NEW.estado) THEN
        
        -- Obtener el teléfono del cliente
        SELECT telefono INTO v_cliente_telefono 
        FROM public.clientes 
        WHERE id = NEW.cliente_id;
        
        IF v_cliente_telefono IS NOT NULL THEN
            IF NEW.estado = 'cancelada' THEN
                -- REGLA 1: Borrado inmediato para cancelaciones (según lo programado)
                DELETE FROM public.sesiones_whatsapp 
                WHERE telefono = regexp_replace(v_cliente_telefono, '\D', '', 'g');
            ELSIF NEW.estado = 'completada' THEN
                -- REGLA 2: Marcar para borrado diferido (15 min)
                -- Usamos el timestamp oficial de la solicitud para máxima precisión
                UPDATE public.sesiones_whatsapp 
                SET finalizado_at = COALESCE(NEW.completado_at, NOW())
                WHERE telefono = regexp_replace(v_cliente_telefono, '\D', '', 'g');
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear Trigger
DROP TRIGGER IF EXISTS trigger_session_cleanup ON public.solicitudes;
CREATE TRIGGER trigger_session_cleanup
AFTER UPDATE OF estado ON public.solicitudes
FOR EACH ROW
EXECUTE FUNCTION public.handle_trip_end_session_cleanup();

-- 4. Job de Limpieza (cada 5 min)
-- Importante: Asegúrate de tener activada la extensión pg_cron en Supabase
SELECT cron.schedule(
  'limpieza_sesiones_completadas',
  '*/5 * * * *',
  $$
    DELETE FROM public.sesiones_whatsapp 
    WHERE finalizado_at < NOW() - INTERVAL '15 minutes';
  $$
);
