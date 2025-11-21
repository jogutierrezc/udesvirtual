import { supabase } from '@/integrations/supabase/client';

export async function getLessonActivity(lessonId: string, userId: string) {
  // Obtiene la actividad de la lección y la entrega del usuario (si existe)
  const { data: activity, error: activityError } = await supabase
    .from('mooc_activities')
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (!activity || activityError) return { activity: null, submission: null };

  const { data: submission, error: submissionError } = await supabase
    .from('mooc_activity_submissions')
    .select('*')
    .eq('activity_id', activity.id)
    .eq('user_id', userId)
    .maybeSingle();

  return { activity, submission };
}

export async function submitActivityEvidence({
  activityId,
  userId,
  file,
  videoUrl,
  linkUrl,
  observation,
}: {
  activityId: string;
  userId: string;
  file?: File;
  videoUrl?: string;
  linkUrl?: string;
  observation?: string;
}) {
  let fileUrl = undefined;
  if (file) {
    const { data, error } = await supabase.storage
      .from('activity_evidence')
      .upload(`${activityId}/${userId}/${file.name}`, file, { upsert: true });
    if (error) throw error;
    fileUrl = data?.path;
  }
  const { error: upsertError } = await supabase
    .from('mooc_activity_submissions')
    .upsert({
      activity_id: activityId,
      user_id: userId,
      file_url: fileUrl,
      video_url: videoUrl,
      link_url: linkUrl,
      observation,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'activity_id,user_id' });
  if (upsertError) throw upsertError;
}
