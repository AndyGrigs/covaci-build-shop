-- Trigger that prevents non-admins from elevating their own is_admin flag.
-- RLS alone cannot restrict individual columns, so we enforce it here.

CREATE OR REPLACE FUNCTION profiles_protect_is_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No change to is_admin — nothing to check
  IF NEW.is_admin IS NOT DISTINCT FROM OLD.is_admin THEN
    RETURN NEW;
  END IF;

  -- auth.uid() IS NULL means service role or internal migration context — allow
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only an existing admin may change is_admin on any row
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND is_admin = true
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'permission denied: is_admin can only be changed by an existing admin';
END;
$$;

CREATE TRIGGER profiles_protect_is_admin
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_protect_is_admin();
