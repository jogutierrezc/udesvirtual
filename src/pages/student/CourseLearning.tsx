import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Check, 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  Loader2,
  PlayCircle,
  Lock,
  BookOpen,
  ChevronDown,
  ChevronRight,
  XCircle
} from "lucide-react";
import { sanitizeLessonHtml } from '@/lib/html';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  duration_hours: number;
  order_index: number;
  content: string | null;
  video_url: string | null;
  completed: boolean;
  readings?: Array<{ id: string; title: string; type?: string; file_name?: string; completed?: boolean }>;
  content_type?: string | null;
  live_platform?: string | null;
  live_url?: string | null;
  live_date?: string | null;
  live_time?: string | null;
  exam?: { id: string; title: string; passed: boolean; attempts: number } | null;
  section_id?: string | null;
};

type Course = {
  id: string;
  title: string;
  description: string;
  profession: string;
  course_image_url: string | null;
};

export default function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showExamResultDialog, setShowExamResultDialog] = useState(false);
  const [examResultLoading, setExamResultLoading] = useState(false);
  const [examResult, setExamResult] = useState<null | { score_numeric: number; score_percent: number; passed: boolean }>(null);
  const videoRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sections, setSections] = useState<Array<{ id: string; title: string; order_index: number }>>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  useEffect(() => {
    // Simular tracking de video (en producción usar API de YouTube/Vimeo)
    const timer = setTimeout(() => {
      if (currentLesson?.video_url && !videoWatched && !currentLesson.completed) {
        setVideoWatched(true);
      }
    }, 5000); // Después de 5 segundos considera el video como visto

    return () => clearTimeout(timer);
  }, [currentLesson, videoWatched]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Verificar inscripción
      const { data: enrollment } = await supabase
        .from("mooc_enrollments")
        .select("progress")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .single();

      if (!enrollment) {
        toast({
          title: "No inscrito",
          description: "No estás inscrito en este curso",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setProgress(enrollment.progress || 0);

      // Cargar curso
      const { data: courseData } = await supabase
        .from("mooc_courses")
        .select("id, title, description, profession, course_image_url")
        .eq("id", courseId)
        .single();

      if (courseData) {
        setCourse(courseData);
      }

      // Cargar lecciones
      const { data: lessonsData } = await supabase
        .from("mooc_lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (lessonsData) {
        // Cargar progreso de cada lección
        const { data: progressData } = await supabase
          .from("mooc_lesson_progress" as any)
          .select("lesson_id, completed")
          .eq("user_id", user.id)
          .in("lesson_id", lessonsData.map(l => l.id));

        const progressMap = new Map(
          (progressData as any)?.map((p: any) => [p.lesson_id, p.completed]) || []
        );

        // Also load readings for these lessons and the student's reading progress
        const lessonIds = lessonsData.map((l: any) => l.id);
        const { data: readingsData } = await supabase
          .from('mooc_readings')
          .select('*')
          .in('lesson_id', lessonIds)
          .order('sort_order', { ascending: true });

        const readingIds = (readingsData || []).map((r: any) => r.id);
        const { data: readingProgressData } = await supabase
          .from('student_reading_progress')
          .select('reading_id,completed')
          .eq('user_id', user.id)
          .in('reading_id', readingIds || []);

        const readingProgressMap = new Map((readingProgressData || []).map((r: any) => [r.reading_id, r.completed]));

        const readingsByLesson = new Map<string, any[]>();
        (readingsData || []).forEach((r: any) => {
          const arr = readingsByLesson.get(r.lesson_id) || [];
          arr.push({ ...r, completed: Boolean(readingProgressMap.get(r.id)) });
          readingsByLesson.set(r.lesson_id, arr);
        });

        // Cargar exámenes vinculados a lecciones
        const { data: examsData } = await supabase
          .from('mooc_exams')
          .select('id, title, lesson_id, passing_score')
          .eq('course_id', courseId)
          .eq('status', 'published')
          .not('lesson_id', 'is', null);

        // Cargar intentos del estudiante para esos exámenes
        const examIds = (examsData || []).map((e: any) => e.id);
        let examAttemptsMap = new Map<string, { passed: boolean; attempts: number }>();
        if (examIds.length > 0) {
          const { data: attemptsData } = await supabase
            .from('mooc_exam_attempts')
            .select('exam_id, passed')
            .eq('user_id', user.id)
            .in('exam_id', examIds)
            .order('created_at', { ascending: false });

          // Agrupar por exam_id y determinar si pasó algún intento
          (attemptsData || []).forEach((att: any) => {
            const existing = examAttemptsMap.get(att.exam_id);
            if (!existing) {
              examAttemptsMap.set(att.exam_id, { 
                passed: att.passed || false, 
                attempts: 1 
              });
            } else {
              examAttemptsMap.set(att.exam_id, {
                passed: existing.passed || att.passed || false,
                attempts: existing.attempts + 1
              });
            }
          });
        }

        // Mapear exámenes a lecciones
        const examsByLesson = new Map<string, any>();
        (examsData || []).forEach((exam: any) => {
          if (exam.lesson_id) {
            const attemptInfo = examAttemptsMap.get(exam.id) || { passed: false, attempts: 0 };
            examsByLesson.set(exam.lesson_id, {
              id: exam.id,
              title: exam.title,
              passed: attemptInfo.passed,
              attempts: attemptInfo.attempts
            });
          }
        });

        const lessonsWithProgress: Lesson[] = lessonsData.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          duration_hours: lesson.duration_hours,
          order_index: lesson.order_index,
          content: lesson.content,
          video_url: lesson.video_url,
          completed: Boolean(progressMap.get(lesson.id)),
          content_type: lesson.content_type,
          live_platform: lesson.live_platform,
          live_url: lesson.live_url,
          live_date: lesson.live_date,
          live_time: lesson.live_time,
          section_id: (lesson as any).section_id || null,
          // @ts-ignore extend with readings
          readings: readingsByLesson.get(lesson.id) || [],
          exam: examsByLesson.get(lesson.id) || null,
        } as any));

  setLessons(lessonsWithProgress);

        // Cargar secciones reales para encabezados
        const { data: sectionsData } = await supabase
          .from('mooc_course_sections')
          .select('id, title, order_index')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
        const mappedSections = (sectionsData || []).map((s: any) => ({ id: s.id, title: s.title, order_index: s.order_index || 0 }));
        setSections(mappedSections);
        // Inicialmente todas las secciones abiertas
        const initialOpen: Record<string, boolean> = {};
        mappedSections.forEach(s => { initialOpen[s.id] = true; });
        if (lessonsWithProgress.some(l => !l.section_id)) {
          initialOpen['__unsectioned'] = true;
        }
        setOpenSections(initialOpen);

        // Seleccionar la primera lección no completada o la primera
        const firstIncomplete = lessonsWithProgress.find(l => !l.completed);
        setCurrentLesson(firstIncomplete || lessonsWithProgress[0] || null);
      }
    } catch (error: any) {
      console.error("Error loading course:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el curso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Convierte URLs de video (YouTube watch, youtu.be, embed) a una URL segura para iframe
  const getEmbedUrl = (rawUrl?: string | null) => {
    if (!rawUrl) return null;
    try {
      const url = new URL(rawUrl, window.location.origin);
      const host = url.hostname.replace('www.', '').toLowerCase();

      // YouTube watch?v=ID -> /embed/ID
      if (host.includes('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;

        // If already an embed path, return as-is
        if (url.pathname.startsWith('/embed/')) return url.href;

        // Any other youtube path — try to extract last segment
        const parts = url.pathname.split('/').filter(Boolean);
        const maybeId = parts[parts.length - 1];
        if (maybeId) return `https://www.youtube.com/embed/${maybeId}`;
      }

      // youtu.be short links
      if (host === 'youtu.be') {
        const id = url.pathname.split('/').filter(Boolean)[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }

      // Vimeo and others often provide embed-friendly URLs already
      if (host.includes('vimeo.com')) {
        // For vimeo, transform /{id} to player.vimeo.com/video/{id}
        const parts = url.pathname.split('/').filter(Boolean);
        const id = parts[parts.length - 1];
        if (id) return `https://player.vimeo.com/video/${id}`;
      }

      // Default: return original (may still be blocked by provider)
      return rawUrl;
    } catch (e) {
      console.warn('Invalid video URL', rawUrl, e);
      return rawUrl;
    }
  };

  const markLessonComplete = async () => {
    if (!currentLesson || !courseId) return;

    try {
      setCompleting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Validaciones previas: asegurar que la lección existe en la base de datos
      if (!currentLesson.id) {
        toast({ title: 'Error', description: 'La lección actual no tiene identificador.', variant: 'destructive' });
        return;
      }

      const { data: lessonRow, error: lessonErr } = await supabase
        .from('mooc_lessons')
        .select('id')
        .eq('id', currentLesson.id)
        .maybeSingle();

      if (lessonErr) {
        console.error('Error comprobando la lección existente', lessonErr);
      }

      if (!lessonRow) {
        toast({ title: 'Error', description: 'La lección no existe en la base de datos. Contacta con un administrador.', variant: 'destructive' });
        return;
      }

      // Crear o actualizar progreso de lección
      const { error } = await supabase
        .from("mooc_lesson_progress" as any)
        .upsert({
          user_id: user.id,
          lesson_id: currentLesson.id,
          completed: true,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: "user_id,lesson_id"
        });

      if (error) {
        // Manejo específico de violaciones de FK (Postgres 23503)
        console.error('Error upserting lesson progress', error);
        if ((error as any)?.code === '23503' || (error as any)?.message?.includes?.('foreign key')) {
          toast({ title: 'Error de integridad', description: 'No se pudo guardar el progreso porque falta una referencia (lección o usuario).', variant: 'destructive' });
          return;
        }
        throw error;
      }

      // Actualizar estado local teniendo en cuenta la lección marcada ahora
      const updatedLessons = lessons.map(l => l.id === currentLesson.id ? { ...l, completed: true } : l);
      setLessons(updatedLessons);

      // Calcular nuevo progreso basándonos en el estado actualizado
      const completedCount = updatedLessons.filter(l => l.completed).length;
      const newProgress = Math.round((completedCount / Math.max(updatedLessons.length, 1)) * 100);
      setProgress(newProgress);

      toast({
        title: "¡Lección completada!",
        description: `Progreso: ${newProgress}%`,
      });

      // Si todas las lecciones están completadas, verificar que se hayan visto los videos
      const incompleteVideoLessons = updatedLessons.filter(l => l.video_url && !l.completed);

      if (newProgress === 100) {
        if (incompleteVideoLessons.length > 0) {
          // No marcar la inscripción como completada si faltan videos por ver
          toast({
            title: "Revisión requerida",
            description: "Debes completar la visualización de todos los videos antes de finalizar el curso.",
            variant: "destructive"
          });
        } else {
          // Marcar la inscripción como completada en la tabla mooc_enrollments
          try {
            const { error: enrollErr } = await supabase
              .from('mooc_enrollments')
              .update({ progress: 100, completed: true, updated_at: new Date().toISOString() })
              .eq('course_id', courseId)
              .eq('user_id', user.id);

            if (enrollErr) throw enrollErr;

            toast({
              title: "¡Felicitaciones!",
              description: "Has completado todo el curso",
            });
          } catch (e) {
            console.error('Error marking enrollment complete', e);
          }
        }
      }

      // Avanzar a la siguiente lección no completada
      const currentIndex = updatedLessons.findIndex(l => l.id === currentLesson.id);
      const nextLesson = updatedLessons.slice(currentIndex + 1).find(l => !l.completed && l.id !== currentLesson.id);

      if (nextLesson) {
        setCurrentLesson(nextLesson);
        setVideoWatched(false);
      }
    } catch (error: any) {
      console.error("Error marking lesson complete:", error);
      toast({
        title: "Error",
        description: "No se pudo marcar la lección como completada",
        variant: "destructive",
      });
    } finally {
      setCompleting(false);
    }
  };

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setVideoWatched(false);
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectLessonAndExpand = (lesson: Lesson) => {
    if (lesson.section_id) {
      setOpenSections(prev => ({ ...prev, [lesson.section_id!]: true }));
    } else {
      setOpenSections(prev => ({ ...prev, ['__unsectioned']: true }));
    }
    setCurrentLesson(lesson);
    setVideoWatched(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  const canCompleteLesson = currentLesson && (
    currentLesson.completed || 
    !currentLesson.video_url || 
    videoWatched
  ) && (!currentLesson.exam || currentLesson.exam.passed);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{course?.title}</h1>
                <p className="text-sm text-muted-foreground">{course?.profession}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Progreso del curso</p>
                <p className="text-2xl font-bold">{progress}%</p>
              </div>
              <Progress value={progress} className="w-32 h-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            {currentLesson ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl mb-2">
                          {currentLesson.title}
                        </CardTitle>
                        {currentLesson.description && (
                          <div className="text-muted-foreground text-justify">
                            <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(currentLesson.description) }} />
                          </div>
                        )}
                      </div>
                      {currentLesson.completed && (
                        <Badge className="bg-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Completada
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Video o Encuentro Sincrónico */}
                    {currentLesson.content_type === 'live_session' ? (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <PlayCircle className="h-5 w-5" />
                            Encuentro Sincrónico
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {currentLesson.live_platform && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">Plataforma:</span>
                              <p className="text-lg font-semibold">{currentLesson.live_platform}</p>
                            </div>
                          )}
                          {currentLesson.live_date && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">Fecha:</span>
                              <p className="text-lg font-semibold">
                                {new Date(currentLesson.live_date).toLocaleDateString('es-ES', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          )}
                          {currentLesson.live_time && (
                            <div>
                              <span className="text-sm font-medium text-muted-foreground">Hora:</span>
                              <p className="text-lg font-semibold">{currentLesson.live_time}</p>
                            </div>
                          )}
                          {currentLesson.live_url && (
                            <Button asChild className="w-full mt-4" size="lg">
                              <a href={currentLesson.live_url} target="_blank" rel="noopener noreferrer">
                                Unirse al encuentro
                              </a>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ) : currentLesson.video_url ? (
                      (() => {
                        const embed = getEmbedUrl(currentLesson.video_url);
                        // Si no hay embed válido, mostramos botón para abrir en nueva pestaña
                        if (!embed) {
                          return (
                            <div className="p-4 rounded-lg bg-muted">
                              <p className="text-sm mb-2">Este video no tiene una vista embebida disponible.</p>
                              <Button asChild>
                                <a href={currentLesson.video_url} target="_blank" rel="noreferrer">Abrir video en YouTube</a>
                              </Button>
                            </div>
                          );
                        }

                        return (
                          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                            <iframe
                              ref={videoRef}
                              src={embed}
                              className="w-full h-full"
                              frameBorder={0}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              title={currentLesson.title || 'Video'}
                            />
                          </div>
                        );
                      })()
                    ) : null}

                    {/* Contenido de texto */}
                    {currentLesson.content && (
                      <Card className="bg-muted/50">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Contenido de la lección
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none text-justify">
                            <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(currentLesson.content) }} />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Lecturas asociadas */}
                    {currentLesson.readings && currentLesson.readings.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Lecturas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {currentLesson.readings.map((r) => (
                            <div key={r.id} className="flex items-center justify-between p-3 border rounded-md">
                              <div className="flex items-center gap-3">
                                <div className="font-medium">{r.title}</div>
                                {r.type === 'file' && r.file_name && (
                                  <div className="text-xs text-muted-foreground">{r.file_name}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {r.completed ? (
                                  <div className="text-sm text-green-600 font-semibold">Completada</div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">Pendiente</div>
                                )}
                                <Button asChild size="sm">
                                  <a href={`/courses/${courseId}/lessons/${currentLesson.id}/reading/${r.id}`}>Abrir</a>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Examen vinculado a la lección */}
                    {currentLesson.exam && (
                      <Card className={currentLesson.exam.passed ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50"}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Check className="h-5 w-5" />
                            Examen de la lección
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between p-3 border rounded-md bg-background">
                            <div>
                              <div className="font-semibold">{currentLesson.exam.title}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {currentLesson.exam.passed ? (
                                  <span className="text-green-600 font-medium">✓ Aprobado</span>
                                ) : currentLesson.exam.attempts > 0 ? (
                                  <span className="text-orange-600">Intentos realizados: {currentLesson.exam.attempts}</span>
                                ) : (
                                  <span>No iniciado</span>
                                )}
                              </div>
                            </div>
                            <Button asChild variant={currentLesson.exam.passed ? "outline" : "default"}>
                                {currentLesson.exam.passed ? (
                                  <button type="button" onClick={async (e) => {
                                    e.preventDefault();
                                    // fetch latest attempt and open dialog
                                    try {
                                      setExamResultLoading(true);
                                      const { data: { user } } = await supabase.auth.getUser();
                                      if (!user) {
                                        navigate('/auth');
                                        return;
                                      }
                                      const { data: attempts } = await supabase
                                        .from('mooc_exam_attempts')
                                        .select('score_numeric, score_percent, passed')
                                        .eq('exam_id', currentLesson.exam.id)
                                        .eq('user_id', user.id)
                                        .order('created_at', { ascending: false })
                                        .limit(1);
                                      const att = (attempts && attempts[0]) || null;
                                      if (!att) {
                                        toast({ title: 'Resultado no encontrado', description: 'No se encontró un intento para este examen.' });
                                        return;
                                      }
                                      setExamResult({ score_numeric: att.score_numeric || 0, score_percent: att.score_percent || 0, passed: !!att.passed });
                                      setShowExamResultDialog(true);
                                      // confetti if passed
                                      if (att.passed) {
                                        try { (window as any).confetti?.({ particleCount: 120, spread: 160 }); } catch (e) {}
                                      }
                                    } catch (err) {
                                      console.error('Error fetching exam attempt', err);
                                      toast({ title: 'Error', description: 'No se pudo obtener el resultado del examen', variant: 'destructive' });
                                    } finally {
                                      setExamResultLoading(false);
                                    }
                                  }}>Ver resultado</button>
                                ) : (
                                  <a href={`/mooc/${courseId}/exam/${currentLesson.exam.id}`}>Realizar examen</a>
                                )}
                            </Button>
                          </div>
                          {!currentLesson.exam.passed && (
                            <div className="text-sm text-orange-800 bg-orange-100 p-3 rounded-md">
                              ⚠️ <strong>Importante:</strong> Debes aprobar este examen para completar la lección
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Botón de completar */}
                    {!currentLesson.completed && (
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <p className="font-medium">¿Terminaste esta lección?</p>
                          <p className="text-sm text-muted-foreground">
                            {currentLesson.video_url && !videoWatched
                              ? "Mira el video completo para continuar"
                              : currentLesson.exam && !currentLesson.exam.passed
                              ? "Debes aprobar el examen para completar esta lección"
                              : "Marca como completada para avanzar"}
                          </p>
                        </div>
                        <Button
                          onClick={markLessonComplete}
                          disabled={!canCompleteLesson || completing}
                          size="lg"
                        >
                          {completing ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Marcar completa
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Selecciona una lección para comenzar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar con secciones y lecciones */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Contenido del curso</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="p-4 space-y-4">
                    {sections.length === 0 ? (
                      <div className="space-y-2">
                        {lessons.map((lesson, index) => (
                          <button
                            key={lesson.id}
                            onClick={() => selectLesson(lesson)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              currentLesson?.id === lesson.id
                                ? "border-primary bg-primary/5"
                                : "border-transparent hover:bg-muted"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                {lesson.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : currentLesson?.id === lesson.id ? (
                                  <PlayCircle className="h-5 w-5 text-primary" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-tight mb-1">
                                  {index + 1}. {lesson.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {lesson.duration_hours}h
                                  {lesson.video_url && " • Video"}
                                  {lesson.readings && lesson.readings.length > 0 && ` • ${lesson.readings.length} lecturas`}
                                  {lesson.exam && (
                                    <span className={`ml-2 inline-flex items-center gap-1 ${
                                      lesson.exam.passed 
                                        ? "text-green-600" 
                                        : lesson.exam.attempts > 0 
                                        ? "text-orange-600" 
                                        : "text-muted-foreground"
                                    }`}>
                                      • Examen
                                      {lesson.exam.passed && " ✓"}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sections.map((section, sIdx) => {
                          const arr = lessons.filter(l => (l as any).section_id === section.id).sort((a,b)=>a.order_index-b.order_index);
                          const totalHours = arr.reduce((sum, l) => sum + (l.duration_hours || 0), 0);
                          return (
                            <div key={section.id} className="space-y-2">
                              <div
                                className="flex items-center justify-between cursor-pointer select-none"
                                onClick={() => toggleSection(section.id)}
                              >
                                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                  {openSections[section.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                  {section.order_index}. {section.title}
                                </h4>
                                <div className="text-[10px] text-muted-foreground font-medium">
                                  {arr.length} lecciones • {totalHours}h
                                </div>
                              </div>
                              {openSections[section.id] && (
                                arr.length === 0 ? (
                                  <div className="text-xs text-muted-foreground italic">(Sin lecciones aún)</div>
                                ) : (
                                  arr.map((lesson, index) => (
                                    <button
                                      key={lesson.id}
                                      onClick={() => selectLessonAndExpand(lesson)}
                                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                                        currentLesson?.id === lesson.id
                                          ? "border-primary bg-primary/5"
                                          : "border-transparent hover:bg-muted"
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                          {lesson.completed ? (
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                          ) : currentLesson?.id === lesson.id ? (
                                            <PlayCircle className="h-5 w-5 text-primary" />
                                          ) : (
                                            <Circle className="h-5 w-5 text-muted-foreground" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium leading-tight mb-1">
                                            {lesson.order_index}. {lesson.title}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {lesson.duration_hours}h
                                            {lesson.video_url && " • Video"}
                                            {lesson.readings && lesson.readings.length > 0 && ` • ${lesson.readings.length} lecturas`}
                                            {lesson.exam && (
                                              <span className={`ml-2 inline-flex items-center gap-1 ${
                                                lesson.exam.passed 
                                                  ? "text-green-600" 
                                                  : lesson.exam.attempts > 0 
                                                  ? "text-orange-600" 
                                                  : "text-muted-foreground"
                                              }`}>
                                                • Examen
                                                {lesson.exam.passed && " ✓"}
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    </button>
                                  ))
                                )
                              )}
                            </div>
                          );
                        })}
                        {lessons.filter(l => !(l as any).section_id).length > 0 && (
                          <div className="space-y-2">
                            <div
                              className="flex items-center justify-between cursor-pointer select-none"
                              onClick={() => toggleSection('__unsectioned')}
                            >
                              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                {openSections['__unsectioned'] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                Sin sección
                              </h4>
                              <div className="text-[10px] text-muted-foreground font-medium">
                                {lessons.filter(l => !(l as any).section_id).length} lecciones • {lessons.filter(l => !(l as any).section_id).reduce((sum,l)=>sum+(l.duration_hours||0),0)}h
                              </div>
                            </div>
                            {openSections['__unsectioned'] && lessons.filter(l => !(l as any).section_id).map((lesson, index) => (
                              <button
                                key={lesson.id}
                                onClick={() => selectLessonAndExpand(lesson)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${
                                  currentLesson?.id === lesson.id
                                    ? "border-primary bg-primary/5"
                                    : "border-transparent hover:bg-muted"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-1">
                                    {lesson.completed ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : currentLesson?.id === lesson.id ? (
                                      <PlayCircle className="h-5 w-5 text-primary" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium leading-tight mb-1">
                                      {lesson.order_index}. {lesson.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {lesson.duration_hours}h
                                      {lesson.video_url && " • Video"}
                                      {lesson.readings && lesson.readings.length > 0 && ` • ${lesson.readings.length} lecturas`}
                                      {lesson.exam && (
                                        <span className={`ml-2 inline-flex items-center gap-1 ${
                                          lesson.exam.passed 
                                            ? "text-green-600" 
                                            : lesson.exam.attempts > 0 
                                            ? "text-orange-600" 
                                            : "text-muted-foreground"
                                        }`}>
                                          • Examen
                                          {lesson.exam.passed && " ✓"}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Exam result dialog */}
      <Dialog open={showExamResultDialog} onOpenChange={setShowExamResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{examResult?.passed ? '¡Felicidades!' : 'Resultado del examen'}</DialogTitle>
            <DialogDescription>
              {examResult?.passed ? 'Has aprobado el examen.' : 'No alcanzaste la puntuación mínima. Sigue practicando y vuelve a intentarlo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            {examResult?.passed ? (
              <CheckCircle2 className="mx-auto h-20 w-20 text-green-600" />
            ) : (
              <XCircle className="mx-auto h-20 w-20 text-red-600" />
            )}
            <div className="text-5xl font-bold mt-4">{examResult?.score_numeric}</div>
            <div className="text-lg text-muted-foreground mt-2">{examResult?.score_percent}%</div>
          </div>
          <DialogFooter>
            <div className="w-full flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowExamResultDialog(false)}>Cerrar</Button>
              <Button type="button" onClick={() => { setShowExamResultDialog(false); navigate(`/courses/${courseId}`); }}>Volver al curso</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
