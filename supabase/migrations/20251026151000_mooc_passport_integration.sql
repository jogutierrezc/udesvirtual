-- Integration between MOOC and Passport systems

-- Add passport_activity_id to mooc_courses to link courses with passport activities
alter table public.mooc_courses
  add column if not exists passport_activity_id uuid references public.passport_activities(id) on delete set null,
  add column if not exists passport_points integer default 50;

-- Function to award passport points when a student completes a MOOC course
create or replace function award_passport_points_for_mooc_completion()
returns trigger as $$
declare
  v_activity_id uuid;
  v_points integer;
  v_course record;
begin
  -- Only proceed if status changed to 'completed'
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    -- Get course details
    select passport_activity_id, passport_points into v_activity_id, v_points
    from mooc_courses
    where id = new.course_id;
    
    -- If course has passport integration
    if v_activity_id is not null and v_points is not null and v_points > 0 then
      -- Award points in passport
      insert into passport_points_ledger (
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
        new.student_id,
        v_points,
        'conocimiento', -- MOOC courses default to knowledge pathway
        v_activity_id,
        'Curso MOOC completado',
        'mooc_auto',
        'mooc_enrollment',
        new.id,
        jsonb_build_object(
          'course_id', new.course_id,
          'completion_date', new.updated_at,
          'final_score', new.final_score
        )
      );
      
      raise notice 'Awarded % points to user % for completing MOOC course', v_points, new.student_id;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for automatic point awarding
drop trigger if exists trigger_award_mooc_passport_points on mooc_enrollments;
create trigger trigger_award_mooc_passport_points
  after update on mooc_enrollments
  for each row
  execute function award_passport_points_for_mooc_completion();

-- Update existing MOOC activity to be linkable
update passport_activities
set description = 'Curso MOOC completado con certificación - Integrado con plataforma MOOC UDES'
where activity_type = 'mooc' and name = 'MOOC Certificado';

-- Create a function for admins to manually link a MOOC course to passport
create or replace function link_mooc_course_to_passport(
  p_course_id uuid,
  p_activity_id uuid,
  p_points integer
)
returns void as $$
begin
  update mooc_courses
  set 
    passport_activity_id = p_activity_id,
    passport_points = p_points
  where id = p_course_id;
end;
$$ language plpgsql security definer;

comment on function link_mooc_course_to_passport is 'Links a MOOC course to a passport activity for automatic point awarding';
