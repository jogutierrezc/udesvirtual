-- Create bucket for passport badge images
INSERT INTO storage.buckets (id, name, public)
VALUES ('passport-badges', 'passport-badges', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Badge images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'passport-badges');

CREATE POLICY "Only admins can upload badge images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'passport-badges'
    AND auth.role() = 'authenticated'
    AND (auth.jwt() ->> 'role' = 'admin' OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    ))
  );

CREATE POLICY "Only admins can update badge images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'passport-badges'
    AND auth.role() = 'authenticated'
    AND (auth.jwt() ->> 'role' = 'admin' OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    ))
  );

CREATE POLICY "Only admins can delete badge images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'passport-badges'
    AND auth.role() = 'authenticated'
    AND (auth.jwt() ->> 'role' = 'admin' OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    ))
  );