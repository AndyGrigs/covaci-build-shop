-- ─────────────────────────────────────────────────────────────
-- 1. Функція транслітерації  (IMMUTABLE = може кешуватись)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION slugify(str text) RETURNS text
  LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  result text;
BEGIN
  result := lower(str);
  -- Спочатку багатосимвольні замінники
  result := replace(result, 'щ', 'sch');
  result := replace(result, 'ш', 'sh');
  result := replace(result, 'ч', 'ch');
  result := replace(result, 'ж', 'zh');
  result := replace(result, 'ю', 'yu');
  result := replace(result, 'я', 'ya');
  result := replace(result, 'ё', 'yo');
  result := replace(result, 'ц', 'ts');
  -- Односимвольні
  result := replace(result, 'а', 'a');
  result := replace(result, 'б', 'b');
  result := replace(result, 'в', 'v');
  result := replace(result, 'г', 'g');
  result := replace(result, 'д', 'd');
  result := replace(result, 'е', 'e');
  result := replace(result, 'з', 'z');
  result := replace(result, 'и', 'i');
  result := replace(result, 'й', 'j');
  result := replace(result, 'к', 'k');
  result := replace(result, 'л', 'l');
  result := replace(result, 'м', 'm');
  result := replace(result, 'н', 'n');
  result := replace(result, 'о', 'o');
  result := replace(result, 'п', 'p');
  result := replace(result, 'р', 'r');
  result := replace(result, 'с', 's');
  result := replace(result, 'т', 't');
  result := replace(result, 'у', 'u');
  result := replace(result, 'ф', 'f');
  result := replace(result, 'х', 'h');
  result := replace(result, 'ы', 'y');
  result := replace(result, 'э', 'e');
  result := replace(result, 'ъ', '');
  result := replace(result, 'ь', '');
  -- Тільки a-z0-9, решта → дефіс
  result := regexp_replace(result, '[^a-z0-9]+', '-', 'g');
  result := trim(both '-' from result);
  RETURN result;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Додаємо колонки (спочатку nullable для backfill)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE products   ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE equipment  ADD COLUMN IF NOT EXISTS slug text;

-- ─────────────────────────────────────────────────────────────
-- 3. Backfill — генеруємо унікальні slug для існуючих рядків
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  r         RECORD;
  base_slug text;
  candidate text;
  counter   int;
BEGIN
  -- categories
  FOR r IN SELECT id, name FROM categories ORDER BY created_at NULLS LAST LOOP
    base_slug := slugify(r.name);
    candidate := base_slug;
    counter   := 1;
    WHILE EXISTS (SELECT 1 FROM categories WHERE slug = candidate AND id <> r.id) LOOP
      candidate := base_slug || '-' || counter;
      counter   := counter + 1;
    END LOOP;
    UPDATE categories SET slug = candidate WHERE id = r.id;
  END LOOP;

  -- products
  FOR r IN SELECT id, name FROM products ORDER BY created_at NULLS LAST LOOP
    base_slug := slugify(r.name);
    candidate := base_slug;
    counter   := 1;
    WHILE EXISTS (SELECT 1 FROM products WHERE slug = candidate AND id <> r.id) LOOP
      candidate := base_slug || '-' || counter;
      counter   := counter + 1;
    END LOOP;
    UPDATE products SET slug = candidate WHERE id = r.id;
  END LOOP;

  -- equipment
  FOR r IN SELECT id, name FROM equipment ORDER BY created_at NULLS LAST LOOP
    base_slug := slugify(r.name);
    candidate := base_slug;
    counter   := 1;
    WHILE EXISTS (SELECT 1 FROM equipment WHERE slug = candidate AND id <> r.id) LOOP
      candidate := base_slug || '-' || counter;
      counter   := counter + 1;
    END LOOP;
    UPDATE equipment SET slug = candidate WHERE id = r.id;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. NOT NULL + унікальні індекси
-- ─────────────────────────────────────────────────────────────
ALTER TABLE categories ALTER COLUMN slug SET NOT NULL;
ALTER TABLE products   ALTER COLUMN slug SET NOT NULL;
ALTER TABLE equipment  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx   ON products   (slug);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_slug_idx  ON equipment  (slug);

-- ─────────────────────────────────────────────────────────────
-- 5. Тригер: auto-slug при INSERT (UPDATE не чіпаємо — зберігаємо URL)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auto_slugify() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE
  base_slug text;
  candidate text;
  counter   int;
  is_taken  boolean;
BEGIN
  -- Якщо slug вже задано вручну — нічого не робимо
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  base_slug := slugify(NEW.name);
  candidate := base_slug;
  counter   := 1;

  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE slug = $1)', TG_TABLE_NAME)
      INTO is_taken USING candidate;
    EXIT WHEN NOT is_taken;
    candidate := base_slug || '-' || counter;
    counter   := counter + 1;
  END LOOP;

  NEW.slug := candidate;
  RETURN NEW;
END;
$$;

CREATE TRIGGER products_auto_slug
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION auto_slugify();

CREATE TRIGGER equipment_auto_slug
  BEFORE INSERT ON equipment
  FOR EACH ROW EXECUTE FUNCTION auto_slugify();

CREATE TRIGGER categories_auto_slug
  BEFORE INSERT ON categories
  FOR EACH ROW EXECUTE FUNCTION auto_slugify();
