-- Create certificates table and trigger to auto-issue on course completion
create table if not exists public.mooc_certificates (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.mooc_courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hours integer not null default 0,
  verification_code text not null,
  issued_at timestamptz not null default now(),
  md5_hash text,
  unique(course_id, user_id)
);

alter table public.mooc_certificates enable row level security;

-- Policy: owner (student) can view their certificates; admins can view all; course creators can view certificates for their courses
create policy if not exists "cert_owner_select"
  on public.mooc_certificates for select
  using (
    auth.uid() = user_id
    or has_role(auth.uid(), 'admin'::app_role)
    or exists (
      select 1 from public.mooc_courses c
      where c.id = mooc_certificates.course_id and c.created_by = auth.uid()
    )
    or exists (
      select 1 from public.mooc_course_teachers t
      where t.course_id = mooc_certificates.course_id and t.teacher_id = auth.uid()
    )
  );

-- Only the system trigger inserts certificates; block direct inserts/updates/deletes except admin
create policy if not exists "cert_admin_modify"
  on public.mooc_certificates for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- Function to issue a certificate when enrollment completed is true
create or replace function public.issue_certificate_on_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  hours_total integer;
  vcode text;
  md5val text;
begin
  -- Only proceed when completion flips to true
  if (tg_op = 'UPDATE' and new.completed = true and (old.completed is distinct from true)) then
    -- compute total hours from lessons of the course
    select coalesce(sum(duration_hours),0) into hours_total
    from public.mooc_lessons
    where course_id = new.course_id;

    -- generate verification code
    vcode := 'CERT-' || to_char(now(), 'YYYY') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 10));

    -- md5 hash of user, course, issued_at
    md5val := md5(new.user_id::text || '-' || new.course_id::text || '-' || now()::text);

    -- insert if not exists
    insert into public.mooc_certificates (course_id, user_id, hours, verification_code, issued_at, md5_hash)
    values (new.course_id, new.user_id, hours_total, vcode, now(), md5val)
    on conflict (course_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

-- Trigger on mooc_enrollments after update
drop trigger if exists trg_issue_certificate_on_completion on public.mooc_enrollments;
create trigger trg_issue_certificate_on_completion
  after update on public.mooc_enrollments
  for each row
  when (new.completed = true and (old.completed is distinct from true))
  execute function public.issue_certificate_on_completion();
