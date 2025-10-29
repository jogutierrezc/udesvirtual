-- Ensure REST roles can access table, RLS will still enforce row-level
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON TABLE public.udes_relationships TO anon, authenticated;
GRANT INSERT ON TABLE public.udes_relationships TO authenticated;

-- Clean up an earlier policy if it references non-existent columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'udes_relationships' 
      AND policyname = 'public_select_when_profile_public_or_owner'
  ) THEN
    EXECUTE 'DROP POLICY "public_select_when_profile_public_or_owner" ON public.udes_relationships';
  END IF;
END$$;

-- Allow the owner to read their own relation
CREATE POLICY "select_by_owner"
  ON public.udes_relationships FOR SELECT
  USING (auth.uid() = profile_id);

-- Allow public read of professor relations for profile pages
CREATE POLICY "public_read_professor_relations"
  ON public.udes_relationships FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = profile_id AND ur.role = 'professor'
  ));
