import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';

const ReadingView: React.FC = () => {
  const { courseId, lessonId, readingId } = useParams<{ courseId: string; lessonId: string; readingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reading, setReading] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!readingId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('mooc_readings')
          .select('*')
          .eq('id', readingId)
          .single();
        if (error) throw error;
        // If this reading is a file stored in Supabase storage, resolve a public URL
        let readingRow: any = data as any;
        if (readingRow?.type === 'file' && readingRow?.storage_path) {
          try {
            const pub = supabase.storage.from('mooc-readings').getPublicUrl(readingRow.storage_path);
            const publicUrl = pub?.data?.publicUrl || null;
            readingRow = { ...readingRow, public_url: publicUrl };
          } catch (e) {
            console.warn('Could not get public URL for reading', e);
          }
        }
        setReading(readingRow as any);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        // Mark reading completed for the user
        await supabase.from('student_reading_progress').upsert({
          user_id: user.id,
          reading_id: readingId,
          completed: true,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,reading_id' });

        // Check if all readings for the lesson are completed by this user
        const { data: lessonReadings } = await supabase
          .from('mooc_readings')
          .select('id')
          .eq('lesson_id', lessonId);

        const readingIds = (lessonReadings || []).map((r: any) => r.id);

        if (readingIds.length > 0) {
          const { data: completed } = await supabase
            .from('student_reading_progress')
            .select('reading_id')
            .in('reading_id', readingIds)
            .eq('user_id', user.id)
            .eq('completed', true);

          const completedIds = (completed || []).map((c: any) => c.reading_id);

          if (completedIds.length === readingIds.length) {
            // Mark lesson complete
            await supabase.from('mooc_lesson_progress' as any).upsert({
              user_id: user.id,
              lesson_id: lessonId,
              completed: true,
              completed_at: new Date().toISOString()
            }, { onConflict: 'user_id,lesson_id' });

            // Recalculate course progress and update enrollment
            const { data: lessonsData } = await supabase
              .from('mooc_lessons')
              .select('id')
              .eq('course_id', courseId);

            const lessonIds = (lessonsData || []).map((l: any) => l.id);
            const { data: completedLessons } = await supabase
              .from('mooc_lesson_progress' as any)
              .select('lesson_id')
              .in('lesson_id', lessonIds)
              .eq('user_id', user.id)
              .eq('completed', true);

            const completedCount = (completedLessons || []).length;
            const newProgress = Math.round((completedCount / Math.max(lessonIds.length, 1)) * 100);

            await supabase
              .from('mooc_enrollments')
              .update({ progress: newProgress, updated_at: new Date().toISOString() })
              .eq('course_id', courseId)
              .eq('user_id', user.id);
          }
        }
      } catch (e: any) {
        console.error('Error loading reading', e);
        toast({ title: 'Error', description: 'No se pudo cargar la lectura.' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [readingId, lessonId, courseId, navigate, toast]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  if (!reading) return <div className="min-h-screen flex items-center justify-center">Lectura no encontrada</div>;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">{reading.title}</h1>
          {reading.type === 'file' && reading.storage_path ? (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">Archivo: {reading.file_name}</p>
              {reading.public_url ? (
                <div className="flex gap-2">
                  <Button onClick={() => setPdfModalOpen(true)}>Ver</Button>
                  <Button variant="outline" asChild>
                    <a href={reading.public_url} download>Descargar</a>
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No se pudo obtener la URL pública del archivo.</div>
              )}
            </div>
          ) : (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: reading.content || '' }} />
          )}
        </Card>
      </div>

      {/* Modal para visualizar el PDF */}
      <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="flex items-center justify-between">
              <span>{reading?.file_name || 'Lectura'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 h-[calc(95vh-5rem)] px-6 pb-6">
            {reading?.public_url && (
              <iframe
                src={reading.public_url}
                className="w-full h-full border rounded"
                title="Visualizador de PDF"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReadingView;
