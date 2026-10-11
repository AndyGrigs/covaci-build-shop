-- Захист від подвійного бронювання обладнання

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- 1. Кінець оренди має бути пізніше за початок.
--    Інакше діапазон порожній і ніколи ні з чим не перетинається.
ALTER TABLE rentals
  ADD CONSTRAINT rentals_dates_check CHECK (end_date > start_date);

-- 2. Одне обладнання не може мати двох оренд з перетинними датами
ALTER TABLE rentals
  ADD CONSTRAINT rentals_no_overlap
  EXCLUDE USING gist (
    equipment_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  )
  WHERE (status IN ('pending', 'active'));

-- 3. Публічний список занятых діапазонів дат для обладнання (без персональних даних)
CREATE OR REPLACE FUNCTION equipment_busy_ranges(p_equipment_id uuid)
RETURNS TABLE (start_date date, end_date date)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.start_date, r.end_date
  FROM rentals r
  WHERE r.equipment_id = p_equipment_id
    AND r.status IN ('pending', 'active')
    AND r.end_date > current_date
  ORDER BY r.start_date;
$$;

GRANT EXECUTE ON FUNCTION equipment_busy_ranges(uuid) TO anon, authenticated;