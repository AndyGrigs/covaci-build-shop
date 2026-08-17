-- Allow admins to read all profiles (required for the Users tab in AdminDashboard)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS me
      WHERE me.id = auth.uid()
        AND me.is_admin = true
    )
  );
