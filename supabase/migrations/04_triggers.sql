-- 04_triggers.sql
-- Trigger Final Calibrado para TaxiLibre
-- Implementa Pesos Simétricos y Jerarquía de Diferenciación por Vehículo

CREATE OR REPLACE FUNCTION trigger_update_weight()
RETURNS TRIGGER AS $$
DECLARE
    factor_auto FLOAT8; factor_moto FLOAT8;
BEGIN
  -- Definir Factores Auto (Jerarquía estricta)
  factor_auto := CASE NEW.classification_auto
    WHEN 'avenida_principal' THEN 0.4
    WHEN 'calle_principal'   THEN 0.6
    WHEN 'normal'            THEN 1.0
    WHEN 'regular'           THEN 2.0
    WHEN 'mala'              THEN 6.0
    WHEN 'intransitable'     THEN 99.0
    ELSE 1.5 END;

  -- Definir Factores Moto (Mayor flexibilidad en vías subóptimas)
  factor_moto := CASE NEW.classification_moto
    WHEN 'avenida_principal' THEN 0.4
    WHEN 'calle_principal'   THEN 0.6
    WHEN 'normal'            THEN 1.0
    WHEN 'regular'           THEN 1.8
    WHEN 'mala'              THEN 2.5
    WHEN 'intransitable'     THEN 5.0
    ELSE 1.3 END;

  -- Pesos Simétricos (Afecta a ambos sentidos de la calle)
  NEW.custom_weight_auto := NEW.cost * factor_auto;
  NEW.custom_weight_moto := NEW.cost * factor_moto;
  
  -- Para el sentido contrario, verificamos si es una sola vía
  IF NEW.reverse_cost < 0 THEN
      NEW.custom_reverse_weight_auto := -1;
      NEW.custom_reverse_weight_moto := -1;
  ELSE
      NEW.custom_reverse_weight_auto := NEW.reverse_cost * factor_auto;
      NEW.custom_reverse_weight_moto := NEW.reverse_cost * factor_moto;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_update_weight ON streets;
CREATE TRIGGER auto_update_weight
BEFORE INSERT OR UPDATE OF classification_auto, classification_moto ON streets
FOR EACH ROW EXECUTE FUNCTION trigger_update_weight();
