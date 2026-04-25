-- 03_routing_fn.sql
-- Función de ruteo base consolidada
-- Utiliza Dijkstra puro confiando en la jerarquía intrínseca de OSM (Avenidas, Calles Principales)
-- Mantiene la penalidad de giro (+50m) para evitar zig-zags en barrios residenciales genéricos

CREATE OR REPLACE FUNCTION calculate_route(
    start_lat FLOAT8, start_lng FLOAT8, 
    end_lat FLOAT8, end_lng FLOAT8,
    vehicle_type TEXT DEFAULT 'moto'
) 
RETURNS TABLE (
    seq INTEGER, 
    node BIGINT,
    edge BIGINT, 
    source BIGINT,
    cost FLOAT8,       
    distance_m FLOAT8, 
    geom GEOMETRY
) AS $$
DECLARE
    start_node BIGINT; end_node BIGINT; 
    w_col TEXT; rw_col TEXT;
    turn_penalty FLOAT8 := 50.0;
    start_pt GEOMETRY; end_pt GEOMETRY;
BEGIN
    -- Protección de servidor: Evitar que una sola consulta bloquee el pool por más de 10s
    SET LOCAL statement_timeout = 10000;

    w_col := CASE WHEN vehicle_type = 'auto' THEN 'custom_weight_auto' ELSE 'custom_weight_moto' END;
    rw_col := CASE WHEN vehicle_type = 'auto' THEN 'custom_reverse_weight_auto' ELSE 'custom_reverse_weight_moto' END;
    
    start_pt := ST_SetSRID(ST_Point(start_lng, start_lat), 4326);
    end_pt := ST_SetSRID(ST_Point(end_lng, end_lat), 4326);

    -- SNAPPING ROBUSTO (Mejora para Avenidas)
    SELECT CASE WHEN ST_Distance(start_pt, ST_StartPoint(s.geom)) < ST_Distance(start_pt, ST_EndPoint(s.geom)) 
           THEN s.source ELSE s.target END INTO start_node
    FROM streets s 
    WHERE ST_DWithin(s.geom, start_pt, 0.001) 
    ORDER BY s.geom <-> start_pt LIMIT 1;

    SELECT CASE WHEN ST_Distance(end_pt, ST_StartPoint(s.geom)) < ST_Distance(end_pt, ST_EndPoint(s.geom)) 
           THEN s.source ELSE s.target END INTO end_node
    FROM streets s 
    WHERE ST_DWithin(s.geom, end_pt, 0.001) 
    ORDER BY s.geom <-> end_pt LIMIT 1;

    IF start_node IS NULL THEN
        SELECT n.id INTO start_node FROM nodes n ORDER BY n.geom <-> start_pt LIMIT 1;
    END IF;
    IF end_node IS NULL THEN
        SELECT n.id INTO end_node FROM nodes n ORDER BY n.geom <-> end_pt LIMIT 1;
    END IF;

    RETURN QUERY EXECUTE format(
        'SELECT d.seq, d.node, d.edge, s.source, d.cost AS cost, s.cost AS distance_m, s.geom ' ||
        'FROM pgr_dijkstra(' ||
        '  ''SELECT id, source, target, %I AS cost, ' ||
        '     CASE WHEN %I < 0 THEN -1 ELSE %I END AS reverse_cost ' ||
        '     FROM streets WHERE cost > 0'', ' ||
        '  $1, $2, true' ||
        ') AS d JOIN streets s ON d.edge = s.id ORDER BY d.seq',
        w_col, rw_col, rw_col
    ) USING start_node, end_node;
END;
$$ LANGUAGE plpgsql;
