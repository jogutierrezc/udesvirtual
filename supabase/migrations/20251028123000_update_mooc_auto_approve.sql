-- Migration: Toggleable auto-approve for MOOC Passport points
-- - Adds/ensures passport_settings.config.auto_approve_mooc (default true)
-- - Replaces award_passport_points_for_mooc_completion() to:
--     * If auto_approve_mooc = true -> insert directly into passport_points_ledger
--     * If false -> create pending request in passport_activity_requests for admin review

-- Ensure a settings row exists and set auto_approve_mooc default to true (defensive to schema variants)
do $$
begin
  if exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'passport_settings'
  ) then
    -- Insert a row if none exists, only referencing config to avoid unknown columns
    if not exists (select 1 from public.passport_settings) then
      begin
        insert into public.passport_settings (config)
        values ('{"auto_approve_mooc": true}'::jsonb);
      exception when undefined_column then
        -- If config column does not exist, skip gracefully
        raise notice 'passport_settings.config does not exist; skipping initial insert';
      end;
    end if;

    -- Ensure the config key exists on existing rows
    begin
      update public.passport_settings
      set config = jsonb_set(coalesce(config, '{}'::jsonb), '{auto_approve_mooc}',
                             coalesce(config->'auto_approve_mooc','true'::jsonb), true);
    exception when undefined_column then
      raise notice 'passport_settings.config does not exist; skipping config update';
    end;
  end if;
end$$;

-- Replace MOOC completion award function to support approval toggle
create or replace function public.award_passport_points_for_mooc_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity_id uuid;
  v_points integer;
  v_user_id uuid;
  v_auto boolean := true;
  v_pathway_type text;
  v_activity_exists boolean := false;
  v_route_id uuid;
  v_course_title text;
  v_already_awarded boolean := false;
begin
  -- Only react when completion flips to true (both UPDATE and INSERT paths)
  if (tg_op = 'UPDATE') then
    if not (new.completed is distinct from old.completed and new.completed = true) then
      return new;
    end if;
  elsif (tg_op = 'INSERT') then
    if not (new.completed = true) then
      return new;
    end if;
  end if;

  -- Fetch course passport integration
  select passport_activity_id, passport_points into v_activity_id, v_points
  from public.mooc_courses
  where id = new.course_id;

  -- Resolve user_id from enrollment (avoid depending on non-existent columns)
  select user_id into v_user_id
  from public.mooc_enrollments
  where id = new.id
  limit 1;

  if v_user_id is null then
    raise notice 'award_passport_points_for_mooc_completion: no user_id found for enrollment %', new.id;
    return new;
  end if;

  -- Validate activity exists and points > 0
  if v_activity_id is not null then
    select exists(select 1 from public.passport_activities where id = v_activity_id) into v_activity_exists;
    select pathway_type into v_pathway_type from public.passport_activities where id = v_activity_id;
  end if;

  if not v_activity_exists or v_points is null or v_points <= 0 then
    return new;
  end if;

  -- Read toggle from settings (defaults to true)
  select coalesce((select (config->>'auto_approve_mooc')::boolean from public.passport_settings limit 1), true) into v_auto;

  -- Resolve optional route for requests by pathway
  if v_pathway_type is not null then
    select id into v_route_id from public.passport_routes where pathway_type = v_pathway_type and active = true limit 1;
  end if;

  -- Course title for messages
  select title into v_course_title from public.mooc_courses where id = new.course_id;

  if v_auto then
    -- Prevent duplicate awards for same enrollment/activity/source
    select exists(
      select 1 from public.passport_points_ledger
      where activity_id = v_activity_id
        and related_type = 'mooc_enrollment'
        and related_id = new.id
        and source = 'mooc_auto'
    ) into v_already_awarded;

    if not v_already_awarded then
      insert into public.passport_points_ledger (
        user_id,
        points,
        pathway_type,
        activity_id,
        reason,
        source,
        related_type,
        related_id,
        metadata
      ) values (
        v_user_id,
        v_points,
        v_pathway_type,
        v_activity_id,
        'Completación de curso MOOC: ' || coalesce(v_course_title, new.course_id::text),
        'mooc_auto',
        'mooc_enrollment',
        new.id,
        jsonb_build_object('course_id', new.course_id, 'completion_date', now())
      );
    end if;
  else
    -- Create or keep a pending admin request (de-dup via unique constraint)
    insert into public.passport_activity_requests (
      user_id, activity_id, route_id, status, evidence_description
    ) values (
      v_user_id, v_activity_id, v_route_id, 'pending',
      'MOOC completado: ' || coalesce(v_course_title, new.course_id::text)
    )
    on conflict on constraint unique_pending_request do nothing;
  end if;

  return new;
end;
$$;

-- Ensure trigger exists and uses the updated function
drop trigger if exists trigger_award_mooc_passport_points on public.mooc_enrollments;
create trigger trigger_award_mooc_passport_points
  after insert or update on public.mooc_enrollments
  for each row
  execute function public.award_passport_points_for_mooc_completion();
