-- 09_conductor_en_viaje.sql
-- Implementa el bloqueo de conductores ocupados para evitar doble asignacion.

-- 1. Agregar columna si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conductores' AND column_name='en_viaje') THEN
        ALTER TABLE public.conductores ADD COLUMN en_viaje BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Actualizar función de búsqueda geoespacial
-- Esta función es la que llama el backend mediante RPC
CREATE OR REPLACE FUNCTION public.conductores_cercanos(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_radio DOUBLE PRECISION DEFAULT 3000
)
RETURNS TABLE (
    id UUID,
    nombre VARCHAR,
    telefono VARCHAR,
    vehiculo_placa VARCHAR,
    tipo_vehiculo VARCHAR,
    vehiculo_color VARCHAR,
    distancia_metros DOUBLE PRECISION
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.nombre,
        c.telefono,
        c.vehiculo_placa,
        c.tipo_vehiculo::VARCHAR,
        c.vehiculo_color,
        ST_Distance(
            c.ubicacion, 
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
        ) * 111320 AS distancia_metros -- Conversion aproximada a metros si usa grados
    FROM 
        public.conductores c
    WHERE 
        c.disponible = true 
        AND c.activo = true
        AND c.en_viaje = false -- FILTRO CRITICO: Solo conductores NO ocupados
        AND ST_DWithin(
            c.ubicacion, 
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326), 
            p_radio / 111320.0 -- Ajuste de radio si la columna ubicacion es geometry(Point, 4326)
        )
    ORDER BY 
        distancia_metros ASC;
END;
$$;
