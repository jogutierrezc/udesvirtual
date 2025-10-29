-- Note: PostgreSQL CREATE POLICY does not support IF NOT EXISTS across all versions
CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Ensure admins can read all UDES relationship rows (campus/program) for listings
CREATE POLICY "Admins can read all udes_relationships"
  ON public.udes_relationships FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
