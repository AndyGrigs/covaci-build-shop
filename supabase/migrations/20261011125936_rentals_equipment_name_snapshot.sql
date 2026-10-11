-- 1. Заповнюємо вже наявні оренди (поточною назвою обладнання)
UPDATE rentals r
SET equipment_name = e.name
FROM equipment e
WHERE e.id = r.equipment_id
  AND r.equipment_name IS NULL;

-- 2. Функція-тригер: знімок назви на момент створення оренди
CREATE OR REPLACE FUNCTION set_rental_equipment_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT name INTO NEW.equipment_name
  FROM equipment
  WHERE id = NEW.equipment_id;
  RETURN NEW;
END;
$$;

-- 3. Тригер на вставку
DROP TRIGGER IF EXISTS rentals_set_equipment_name ON rentals;
CREATE TRIGGER rentals_set_equipment_name
  BEFORE INSERT ON rentals
  FOR EACH ROW EXECUTE FUNCTION set_rental_equipment_name();