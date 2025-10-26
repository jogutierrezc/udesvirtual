-- Función para verificar si un usuario tiene correo institucional UDES
create or replace function is_udes_email(user_id uuid)
returns boolean as $$
declare
  user_email text;
begin
  select email into user_email
  from auth.users
  where id = user_id;
  
  return user_email like '%@mail.udes.edu.co';
end;
$$ language plpgsql security definer;

-- Actualizar políticas RLS para restringir pasaporte solo a usuarios UDES
drop policy if exists passport_points_user_read_own on public.passport_points_ledger;
drop policy if exists passport_user_badges_read_own on public.passport_user_badges;
drop policy if exists passport_user_recognitions_read_own on public.passport_user_recognitions;
drop policy if exists passport_academic_profile_read_own on public.passport_academic_profile;

-- Políticas actualizadas con restricción de email
create policy passport_points_user_read_own
  on public.passport_points_ledger
  for select to authenticated
  using (user_id = auth.uid() and is_udes_email(auth.uid()));

create policy passport_user_badges_read_own
  on public.passport_user_badges
  for select to authenticated
  using (user_id = auth.uid() and is_udes_email(auth.uid()));

create policy passport_user_recognitions_read_own
  on public.passport_user_recognitions
  for select to authenticated
  using (user_id = auth.uid() and is_udes_email(auth.uid()));

create policy passport_academic_profile_read_own
  on public.passport_academic_profile
  for select to authenticated
  using (user_id = auth.uid() and is_udes_email(auth.uid()));

-- Actualizar política de rutas para permitir solo a usuarios UDES verlas
drop policy if exists passport_routes_read_all on public.passport_routes;

create policy passport_routes_read_all
  on public.passport_routes
  for select to authenticated
  using (is_udes_email(auth.uid()) or has_role(auth.uid(), 'admin'::app_role));

-- Actualizar política de actividades
drop policy if exists passport_activities_read_all on public.passport_activities;

create policy passport_activities_read_all
  on public.passport_activities
  for select to authenticated
  using (active = true and (is_udes_email(auth.uid()) or has_role(auth.uid(), 'admin'::app_role)));

-- Actualizar política de insignias
drop policy if exists passport_badges_read_all on public.passport_badges;

create policy passport_badges_read_all
  on public.passport_badges
  for select to authenticated
  using (active = true and (is_udes_email(auth.uid()) or has_role(auth.uid(), 'admin'::app_role)));

comment on function is_udes_email is 'Verifica si un usuario tiene correo institucional @mail.udes.edu.co';
