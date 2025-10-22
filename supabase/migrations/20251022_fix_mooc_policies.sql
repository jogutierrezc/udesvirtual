-- Eliminar la política de UPDATE restrictiva
DROP POLICY IF EXISTS "Admins can update courses" ON public.mooc_courses;

-- Crear nueva política que permita a admins y creadores actualizar
CREATE POLICY "Admins and creators can update courses"
  ON public.mooc_courses FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR created_by = auth.uid());
