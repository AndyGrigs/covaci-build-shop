-- Add locale to profiles so edge functions can send emails in the user's language.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'ru';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_locale_check CHECK (locale IN ('ru', 'ro'));

-- Update handle_new_user so new registrations capture the locale from user_metadata.
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
    COALESCE(new.raw_user_meta_data->>'locale', 'ru')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
