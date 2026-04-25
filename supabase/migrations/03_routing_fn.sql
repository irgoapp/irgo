-- 03_routing_fn.sql
-- Función de ruteo base consolidada
-- Utiliza Dijkstra puro confiando en la jerarquía intrínseca de OSM (Avenidas, Calles Principales)

-- 1. Borramos la función actual (con su firma exacta de tipos)
DROP FUNCTION IF EXISTS calculate_route(FLOAT8, FLOAT8, FLOAT8, FLOAT8, TEXT);

-- 2. Creamos la versión optimizada y limpia
-- [NOTA] He mantenido la columna 'source' para asegurar que el frontend 
-- pueda invertir la geometría cuando sea necesario y la ruta siga las calles.
CREATE OR REPLACE FUNCTION calculate_route(
    start_lat FLOAT8, start_lng FLOAT8, 
    end_lat FLOAT8, end_lng FLOAT8,
    vehicle_type TEXT DEFAULT 'moto'
) 
RETURNS TABLE (
    seq INTEGER, 
    node BIGINT,
    edge BIGINT, 
    source BIGINT, -- Necesario para detectar inversión de geometría
    cost FLOAT8,       
    distance_m FLOAT8, 
    geom GEOMETRY
) AS $$
DECLARE
    start_node BIGINT; end_node BIGINT; 
    w_col TEXT;
    start_pt GEOMETRY; end_pt GEOMETRY;
BEGIN
    -- 1. Selección de columna de peso (Moto vs Auto)
    w_col := CASE WHEN vehicle_type = 'auto' THEN 'custom_weight_auto' ELSE 'custom_weight_moto' END;
    
    start_pt := ST_SetSRID(ST_Point(start_lng, start_lat), 4326);
    end_pt := ST_SetSRID(ST_Point(end_lng, end_lat), 4326);

    -- 2. SNAPPING (Encontrar nodos más cercanos)
    -- Usamos el operador <-> que aprovecha el índice GIST que creamos
    SELECT s.source INTO start_node FROM streets s 
    WHERE ST_DWithin(s.geom, start_pt, 0.005) 
    ORDER BY s.geom <-> start_pt LIMIT 1;

    SELECT s.source INTO end_node FROM streets s 
    WHERE ST_DWithin(s.geom, end_pt, 0.005) 
    ORDER BY s.geom <-> end_pt LIMIT 1;

    -- 3. CÁLCULO DIJKSTRA
    RETURN QUERY EXECUTE format(
        'SELECT d.seq, d.node, d.edge, s.source, d.cost, s.cost as distance_m, s.geom ' ||
        'FROM pgr_dijkstra(' ||
        '  ''SELECT id, source, target, %I AS cost, ' ||
        '    CASE WHEN reverse_cost < 0 THEN -1 ELSE %I END AS reverse_cost ' ||
        '    FROM streets'', ' ||
        '  $1, $2, true' ||
        ') AS d JOIN streets s ON d.edge = s.id ORDER BY d.seq',
        w_col, w_col
    ) USING start_node, end_node;

END;
$$ LANGUAGE plpgsql;
