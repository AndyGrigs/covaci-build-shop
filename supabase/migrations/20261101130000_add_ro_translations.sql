-- Румунські переклади. Російська лишається базовою мовою:
-- якщо переклад порожній, фронтенд показує російський текст.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name_ro text,
  ADD COLUMN IF NOT EXISTS description_ro text;

ALTER TABLE public.equipment
  ADD COLUMN IF NOT EXISTS name_ro text,
  ADD COLUMN IF NOT EXISTS description_ro text;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS name_ro text,
  ADD COLUMN IF NOT EXISTS description_ro text;
