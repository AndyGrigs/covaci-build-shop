/*
  Update RLS policies to allow public access to products and equipment
  This enables non-authenticated users to view products and equipment
*/

-- Update categories policy to allow public read
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" 
  ON categories FOR SELECT
  TO PUBLIC
  USING (true);

-- Update products policy to allow public read for active products
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products" 
  ON products FOR SELECT
  TO PUBLIC
  USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

-- Update equipment policy to allow public read for available equipment
DROP POLICY IF EXISTS "Anyone can view available equipment" ON equipment;
CREATE POLICY "Anyone can view available equipment" 
  ON equipment FOR SELECT
  TO PUBLIC
  USING (is_available = true OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));