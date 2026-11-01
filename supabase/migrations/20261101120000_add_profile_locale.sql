-- Мова інтерфейсу користувача: нею надсилаються листи про замовлення й оренду
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'ru';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_locale_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_locale_check CHECK (locale IN ('ru', 'ro'));

-- Тригер створення профілю: підхоплюємо мову з метаданих реєстрації
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address, company_name, is_admin, locale)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'address', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', ''),
    false,
    CASE WHEN new.raw_user_meta_data->>'locale' = 'ro' THEN 'ro' ELSE 'ru' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
