-- 10_conductor_rpcs.sql
-- Funciones para manejo de ubicación geoespacial de conductores

-- 1. Obtener conductor con coordenadas legibles (lat/lon)
CREATE OR REPLACE FUNCTION public.obtener_conductor_por_id(id_conductor UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'nombre', nombre,
        'disponible', disponible,
        'en_viaje', en_viaje,
        'tipo_vehiculo', tipo_vehiculo,
        'lat', ST_Y(ubicacion::geometry),
        'lon', ST_X(ubicacion::geometry),
        'ultima_ubicacion_at', ultima_ubicacion_at
    ) INTO result
    FROM public.conductores
    WHERE id = id_conductor;
    
    RETURN result;
END;
$$;

-- 2. Actualizar ubicación en formato hexadecimal (PostGIS)
CREATE OR REPLACE FUNCTION public.actualizar_ubicacion_conductor(
    p_id UUID,
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.conductores
    SET 
        ubicacion = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326),
        ultima_ubicacion_at = NOW()
    WHERE id = p_id;
END;
$$;
