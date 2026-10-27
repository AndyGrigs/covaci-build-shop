-- 20260616172237_add_user_trigger.sql overwrote handle_new_user() without
-- ON CONFLICT (id) DO NOTHING, so a duplicate profile causes a unique-key
-- violation that aborts the signup with a cryptic error.
-- Restore idempotency here.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, address, company_name, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'address', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', ''),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
