-- 05_oneway_sync.sql
-- Sincronización de sentidos de calles (OneWay) para TaxiLibre
-- Ejecutar en Supabase SQL Editor

-- ============================================================
-- PASO 1: Sincronizar campo oneway con los costos actuales
-- Esto corrige los datos que ya están en la BD
-- ============================================================
UPDATE streets 
SET oneway = (reverse_cost < 0 OR cost < 0);

-- Verificación rápida del resultado:
-- SELECT COUNT(*) as total,
--   COUNT(CASE WHEN oneway = true THEN 1 END) as solo_ida,
--   COUNT(CASE WHEN oneway = false THEN 1 END) as doble_sentido
-- FROM streets;


-- ============================================================
-- PASO 2: Trigger automático para futuras importaciones
-- Cada vez que se inserte o actualice una calle, 
-- el campo oneway se sincroniza solo.
-- ============================================================
CREATE OR REPLACE FUNCTION sync_oneway_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Si alguno de los dos costos es negativo, es una sola vía
  NEW.oneway := (NEW.reverse_cost < 0 OR NEW.cost < 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_sync_oneway ON streets;
CREATE TRIGGER auto_sync_oneway
BEFORE INSERT OR UPDATE OF cost, reverse_cost ON streets
FOR EACH ROW EXECUTE FUNCTION sync_oneway_flag();


-- ============================================================
-- PASO 3: Columna e índice para consultas de auditoría
-- ============================================================

-- Asegurar columna oneway existe (por si acaso)
ALTER TABLE streets ALTER COLUMN oneway SET DEFAULT false;

-- Índice para queries de diagnóstico rápido  
CREATE INDEX IF NOT EXISTS streets_oneway_idx ON streets(oneway);

-- ============================================================
-- PASO 4: Agregar columna direction para mostrar en apps
-- de administración (maps-admin) el sentido visual
-- ============================================================
ALTER TABLE streets ADD COLUMN IF NOT EXISTS 
  direction TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN cost < 0    THEN 'v_to_u'   -- Solo de destino a origen
      WHEN reverse_cost < 0 THEN 'u_to_v'   -- Solo de origen a destino  
      ELSE             'both'           -- Ambos sentidos
    END
  ) STORED;

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
-- Ejecuta esto para ver el estado de tus calles:
SELECT 
  direction,
  COUNT(*) as cantidad,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as porcentaje
FROM streets
GROUP BY direction
ORDER BY cantidad DESC;
