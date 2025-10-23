-- Retroactively generate certificates for already completed courses
-- This is a one-time migration to create certificates for courses completed before the trigger was added

do $$
declare
  enrollment_rec record;
  hours_total integer;
  vcode text;
  md5val text;
begin
  -- Loop through all completed enrollments
  for enrollment_rec in 
    select course_id, user_id 
    from public.mooc_enrollments 
    where completed = true
  loop
    -- Check if certificate already exists
    if not exists (
      select 1 from public.mooc_certificates 
      where course_id = enrollment_rec.course_id 
      and user_id = enrollment_rec.user_id
    ) then
      -- compute total hours from lessons of the course
      select coalesce(sum(duration_hours),0) into hours_total
      from public.mooc_lessons
      where course_id = enrollment_rec.course_id;

      -- generate verification code
      vcode := 'CERT-' || to_char(now(), 'YYYY') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 10));

      -- md5 hash
      md5val := md5(enrollment_rec.user_id::text || '-' || enrollment_rec.course_id::text || '-' || now()::text);

      -- insert certificate
      insert into public.mooc_certificates (course_id, user_id, hours, verification_code, issued_at, md5_hash)
      values (enrollment_rec.course_id, enrollment_rec.user_id, hours_total, vcode, now(), md5val);
      
      raise notice 'Certificate created for user % course %', enrollment_rec.user_id, enrollment_rec.course_id;
    end if;
  end loop;
end $$;
