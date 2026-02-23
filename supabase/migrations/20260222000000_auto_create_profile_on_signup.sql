/*
  # Auto-create profile on user signup

  Creates a trigger that automatically inserts a row in `profiles`
  whenever a new user is created in auth.users.

  This is needed because the client-side INSERT after signUp can fail
  when email confirmation is enabled (session is null at that point).

  The trigger runs with SECURITY DEFINER so it bypasses RLS.
*/

-- Function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger: fires after every new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
