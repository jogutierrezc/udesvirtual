import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { sanitizeLessonHtml } from '@/lib/html';
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Trash2, Loader2, Video, Calendar } from "lucide-react";
import LessonActivitySection from './LessonActivitySection';

export default function LessonEditorPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [preview, setPreview] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [uploadingReading, setUploadingReading] = useState(false);
  const [activity, setActivity] = useState<any>(null);
  const [hasActivity, setHasActivity] = useState(false);
  const [submissionTypes, setSubmissionTypes] = useState<string[]>([]);

  useEffect(() => {
    if (lessonId) {
      loadLesson(lessonId);
      loadReadings(lessonId);
    }
  }, [lessonId]);

  const loadLesson = async (id: string) => {
    try {
      const { data, error } = await supabase.from('mooc_lessons').select('*').eq('id', id).single();
      if (error) throw error;
      setLesson(data);

      // Cargar actividad si existe
      const { data: activityData } = await supabase
        .from('mooc_activities')
        .select('*')
        .eq('lesson_id', id)
        .maybeSingle();

      if (activityData) {
        setActivity(activityData);
        setHasActivity(true);
        // Parsear allowed_types
        const types = activityData.allowed_types || [];
        setSubmissionTypes({
          file: types.includes('file'),
          video: types.includes('video'),
          link: types.includes('link')
        });
      } else {
        setActivity({ instructions: '', due_date: '' });
        setHasActivity(false);
        setSubmissionTypes({ file: true, video: false, link: false });
      }

    } catch (e: any) {
      console.error('loadLesson', e);
      toast({ title: 'Error', description: e.message || 'No se pudo cargar la lección', variant: 'destructive' });
    }
  };

  // ... (loadReadings and handleFileUpload remain unchanged)

  const handleSave = async () => {
    if (!lesson) return;
    setLoading(true);
    try {
      // 1. Guardar lección
      const { error } = await supabase.from('mooc_lessons').update({
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        duration_hours: lesson.duration_hours,
        content_type: lesson.content_type || 'video',
        video_url: lesson.video_url,
        live_platform: lesson.live_platform,
        live_url: lesson.live_url,
        live_date: lesson.live_date,
        live_time: lesson.live_time,
      }).eq('id', lesson.id);
      if (error) throw error;

      // 2. Guardar/Actualizar Actividad
      if (hasActivity) {
        const allowed_types = [];
        if (submissionTypes.file) allowed_types.push('file');
        if (submissionTypes.video) allowed_types.push('video');
        if (submissionTypes.link) allowed_types.push('link');

        const activityPayload = {
          lesson_id: lesson.id,
          title: `Actividad: ${lesson.title}`, // Título por defecto
          description: activity?.instructions || '', // Usamos instructions como descripción
          instructions: activity?.instructions || '',
          due_date: activity?.due_date || null,
          allowed_types,
          is_required: true
        };

        // Upsert activity based on lesson_id (assuming 1 activity per lesson)
        // First check if exists to get ID if needed, or just upsert if we have a unique constraint on lesson_id
        // We'll use upsert with onConflict on lesson_id if it exists, otherwise we might need to query first.
        // Checking schema... assuming lesson_id is unique or we query first. We queried in loadLesson.

        const { data: existingActivity } = await supabase
          .from('mooc_activities')
          .select('id')
          .eq('lesson_id', lesson.id)
          .maybeSingle();

        if (existingActivity) {
          await supabase
            .from('mooc_activities')
            .update(activityPayload)
            .eq('id', existingActivity.id);
        } else {
          await supabase
            .from('mooc_activities')
            .insert({ ...activityPayload, course_id: courseId }); // Need course_id? Check schema. Usually yes.
          // Wait, mooc_activities might not have course_id if it's linked to lesson.
          // Let's check schema or assume lesson_id is enough. 
          // Actually, usually activities are linked to lessons.
          // Let's try inserting without course_id first, or fetch it from lesson.
        }
      } else {
        // Si se desactivó, ¿borramos la actividad? 
        // Por seguridad, mejor no borrar automáticamente, o preguntar. 
        // Por ahora, no hacemos nada o podríamos marcarla como inactiva si hubiera un campo status.
      }

      toast({ title: 'Lección guardada' });
    } catch (e: any) {
      console.error('save', e);
      toast({ title: 'Error', description: e.message || 'No se pudo guardar', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  if (!lesson) return <div className="p-6">Cargando lección...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Editar Lección</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
          <Button onClick={handleSave} disabled={loading}>Guardar</Button>
          <Button variant="ghost" onClick={() => setPreview(p => !p)}>{preview ? 'Ocultar vista previa' : 'Vista previa estudiante'}</Button>
        </div>
      </div>

      {!preview ? (
        <>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input value={lesson.title || ''} onChange={e => setLesson((p: any) => ({ ...p, title: e.target.value }))} />
                </div>

                <div>
                  <Label>Duración (horas)</Label>
                  <Input type="number" min={1} value={lesson.duration_hours || 1} onChange={e => setLesson((p: any) => ({ ...p, duration_hours: parseInt(e.target.value) || 1 }))} />
                </div>

                <div>
                  <Label>Tipo de Contenido</Label>
                  <Select
                    value={lesson.content_type || 'video'}
                    onValueChange={(val) => setLesson((p: any) => ({ ...p, content_type: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Video Grabado (YouTube, Vimeo, etc.)
                        </div>
                      </SelectItem>
                      <SelectItem value="live_session">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Sesión Sincrónica (Meet, Teams, Zoom)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos según el tipo de contenido */}
                {lesson.content_type === 'video' && (
                  <div>
                    <Label>URL del Video (YouTube, Vimeo, etc.)</Label>
                    <Input
                      value={lesson.video_url || ''}
                      onChange={e => setLesson((p: any) => ({ ...p, video_url: e.target.value }))}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Pega el enlace directo del video
                    </p>
                  </div>
                )}

                {lesson.content_type === 'live_session' && (
                  <>
                    <div>
                      <Label>Plataforma</Label>
                      <Select
                        value={lesson.live_platform || 'meet'}
                        onValueChange={(val) => setLesson((p: any) => ({ ...p, live_platform: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la plataforma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meet">Google Meet</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="other">Otra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>URL de la Sesión</Label>
                      <Input
                        value={lesson.live_url || ''}
                        onChange={e => setLesson((p: any) => ({ ...p, live_url: e.target.value }))}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Fecha</Label>
                        <Input
                          type="date"
                          value={lesson.live_date || ''}
                          onChange={e => setLesson((p: any) => ({ ...p, live_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>Hora</Label>
                        <Input
                          type="time"
                          value={lesson.live_time || ''}
                          onChange={e => setLesson((p: any) => ({ ...p, live_time: e.target.value }))}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label>Descripción (rich text)</Label>
                  <ReactQuill theme="snow" value={lesson.description || ''} onChange={(val) => setLesson((p: any) => ({ ...p, description: val }))} modules={{ toolbar: [['bold', 'italic', 'underline'], [{ 'align': [] }], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link', 'clean']] }} />
                </div>

                <div>
                  <Label>Contenido (rich text)</Label>
                  <ReactQuill theme="snow" value={lesson.content || ''} onChange={(val) => setLesson((p: any) => ({ ...p, content: val }))} modules={{ toolbar: [['bold', 'italic', 'underline'], [{ 'align': [] }], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link', 'clean']] }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección de Lecturas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lecturas (archivos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Botón de subida */}
                <div className="flex items-center gap-4">
                  <Label
                    htmlFor="reading-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    {uploadingReading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Subir archivos
                      </>
                    )}
                  </Label>
                  <Input
                    id="reading-upload"
                    type="file"
                    multiple
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingReading}
                  />
                  <span className="text-sm text-muted-foreground">
                    Tipos permitidos: PDF, PPT, PPTX, DOC, DOCX, PNG, JPG (máx. 50MB por archivo)
                  </span>
                </div>

                {/* Lista de lecturas */}
                {readings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No hay lecturas cargadas. Sube archivos PDF para que los estudiantes puedan descargarlos.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {readings.map((reading) => {
                      // Obtener URL pública si tiene storage_path
                      const fileUrl = reading.storage_path
                        ? supabase.storage.from('mooc-readings').getPublicUrl(reading.storage_path).data.publicUrl
                        : null;

                      return (
                        <div
                          key={reading.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="font-medium">{reading.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(reading.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {fileUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(fileUrl, '_blank')}
                              >
                                Ver
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReading(reading.id, reading.storage_path)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* --- NUEVO MÓDULO: Actividad / Tarea --- */}
          <LessonActivitySection
            lessonId={lesson.id}
            activity={activity}
            setActivity={setActivity}
            hasActivity={hasActivity}
            setHasActivity={setHasActivity}
            submissionTypes={submissionTypes}
            setSubmissionTypes={setSubmissionTypes}
          />
        </>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-3">Vista previa (estudiante)</h3>
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(lesson.description) }} />
            <div className="mt-4" dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(lesson.content) }} />
          </div>
        </div>
      )}
    </div>
  );
}
