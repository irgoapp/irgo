-- 06_hierarchy_sync.sql
-- Sincronización Global de Jerarquías de Calles para TaxiLibre
-- Basado en el mapeo oficial de OSM a Clasificación de Tráfico

-- 1. Actualización masiva de clasificaciones basada en la categoría de OSM
UPDATE streets SET
  classification_auto = CASE category
    WHEN 'motorway'     THEN 'avenida_principal'
    WHEN 'motorway_link'THEN 'avenida_principal'
    WHEN 'trunk'        THEN 'avenida_principal'
    WHEN 'trunk_link'   THEN 'avenida_principal'
    WHEN 'primary'      THEN 'avenida_principal'
    WHEN 'primary_link' THEN 'avenida_principal'
    WHEN 'secondary'    THEN 'calle_principal'
    WHEN 'secondary_link'THEN 'calle_principal'
    WHEN 'tertiary'     THEN 'normal'
    WHEN 'tertiary_link' THEN 'normal'
    WHEN 'residential'  THEN 'regular'
    WHEN 'service'      THEN 'regular'
    WHEN 'track'        THEN 'mala'
    WHEN 'path'         THEN 'intransitable'
    WHEN 'footway'      THEN 'intransitable'
    WHEN 'steps'        THEN 'intransitable'
    WHEN 'cycleway'     THEN 'intransitable'
    ELSE 'regular'
  END,
  classification_moto = CASE category
    WHEN 'motorway'     THEN 'avenida_principal'
    WHEN 'motorway_link'THEN 'avenida_principal'
    WHEN 'trunk'        THEN 'avenida_principal'
    WHEN 'trunk_link'   THEN 'avenida_principal'
    WHEN 'primary'      THEN 'avenida_principal'
    WHEN 'primary_link' THEN 'avenida_principal'
    WHEN 'secondary'    THEN 'calle_principal'
    WHEN 'secondary_link'THEN 'calle_principal'
    WHEN 'tertiary'     THEN 'normal'
    WHEN 'tertiary_link' THEN 'normal'
    WHEN 'residential'  THEN 'regular'
    WHEN 'service'      THEN 'regular'
    WHEN 'track'        THEN 'regular' -- Moto puede por track
    WHEN 'path'         THEN 'mala'    -- Moto puede por path con dificultad
    WHEN 'footway'      THEN 'intransitable'
    WHEN 'steps'        THEN 'intransitable'
    WHEN 'cycleway'     THEN 'regular' -- Moto puede por cycleway
    ELSE 'regular'
  END;

-- 2. Forzar el recálculo de custom_weight_*
-- El trigger 'auto_update_weight' se activará para todas las filas
-- al haber modificado las columnas classification_auto y classification_moto.

-- 3. Verificación de conteo por jerarquía (Diagnóstico)
SELECT 
  classification_auto, 
  COUNT(*) as cantidad,
  ROUND(AVG(custom_weight_auto / NULLIF(cost, 0))::numeric, 2) as factor_promedio
FROM streets 
GROUP BY classification_auto
ORDER BY factor_promedio ASC;
