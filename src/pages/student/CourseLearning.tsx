import { useEffect, useState, useRef } from "react";
import ActivitySubmissionForm, { ActivityEvidenceType } from '@/components/ActivitySubmissionForm';
import { getLessonActivity, submitActivityEvidence } from '@/components/activitySubmissionApi';
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
  XCircle,
  ChevronLeft,
  FileText,
  Video,
  Calendar,
  Clock,
  MoreVertical,
  ChevronUp,
  ExternalLink,
  MessageSquare
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
  completion_criteria?: string;
  virtual_session_date?: string | null;
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
  const [sections, setSections] = useState<Array<{ id: string; title: string; order_index: number; available_from?: string | null; available_until?: string | null }>>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [videoWatched, setVideoWatched] = useState(false);

  // Actividad y entrega
  const [activity, setActivity] = useState<any | null>(null);
  const [activitySubmission, setActivitySubmission] = useState<any | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activitySubmitting, setActivitySubmitting] = useState(false);


  // Cargar actividad y entrega cuando cambia la lección
  useEffect(() => {
    const fetchActivity = async () => {
      if (!currentLesson) {
        setActivity(null);
        setActivitySubmission(null);
        return;
      }
      setActivityLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { activity, submission } = await getLessonActivity(currentLesson.id, user.id);
        setActivity(activity);
        setActivitySubmission(submission);
      } catch (e) {
        setActivity(null);
        setActivitySubmission(null);
      } finally {
        setActivityLoading(false);
      }
    };
    fetchActivity();
  }, [currentLesson]);

  // Cargar curso cuando cambia el id
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

  useEffect(() => {
    const checkCompletion = async () => {
      if (progress === 100 && course?.virtual_session_date && courseId) {
        const sessionDate = new Date(course.virtual_session_date);
        if (new Date() >= sessionDate) {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Check if enrollment is already completed
          const { data: enrollment } = await supabase.from('mooc_enrollments').select('completed').eq('course_id', courseId).eq('user_id', user.id).single();
          if (enrollment && !enrollment.completed) {
            // Mark as completed
            const { error } = await supabase.from('mooc_enrollments').update({ completed: true }).eq('course_id', courseId).eq('user_id', user.id);
            if (!error) {
              toast({ title: "¡Curso Finalizado!", description: "La fecha de la sesión virtual ha pasado. Tu curso ha sido marcado como completado." });
            }
          }
        }
      }
    };
    checkCompletion();
  }, [progress, course, courseId]);

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
        .select("id, title, description, profession, course_image_url, completion_criteria, virtual_session_date")
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

        // Cargar exámenes vinculados a lecciones Y globales
        const { data: examsData } = await supabase
          .from('mooc_exams')
          .select('id, title, lesson_id, section_id, passing_score, description, order_index')
          .eq('course_id', courseId)
          .eq('status', 'published');

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

        // Cargar actividades
        const { data: activitiesData } = await supabase
          .from('mooc_activities')
          .select('id, lesson_id, title')
          .in('lesson_id', lessonsData.map(l => l.id));

        const activitiesMap = new Map((activitiesData || []).map((a: any) => [a.lesson_id, a]));

        // Agregar exámenes globales como "lecciones" virtuales
        const globalExams = (examsData || []).filter(e => !e.lesson_id);
        globalExams.forEach(exam => {
          const attemptInfo = examAttemptsMap.get(exam.id) || { passed: false, attempts: 0 };
          lessonsWithProgress.push({
            id: `exam_${exam.id}`,
            title: exam.title,
            description: exam.description || 'Evaluación del curso',
            duration_hours: 0,
            order_index: exam.order_index || 9999,
            content: '',
            video_url: null,
            completed: attemptInfo.passed,
            content_type: 'exam',
            section_id: exam.section_id || null,
            exam: {
              id: exam.id,
              title: exam.title,
              passed: attemptInfo.passed,
              attempts: attemptInfo.attempts
            }
          } as any);
        });

        // Marcar lecciones que tienen actividad como tipo 'exam' para el sidebar si no tienen sección
        // O mejor, ajustamos la lógica del sidebar para incluir lessons con actividad en la sección de exámenes
        lessonsWithProgress.forEach(l => {
          if (activitiesMap.has(l.id)) {
            (l as any).has_activity = true;
          }
        });

        // Ordenar todas las lecciones por order_index
        lessonsWithProgress.sort((a, b) => a.order_index - b.order_index);

        setLessons(lessonsWithProgress);

        // Cargar secciones reales para encabezados
        const { data: sectionsData } = await supabase
          .from('mooc_course_sections')
          .select('id, title, order_index, available_from, available_until')
          .eq('course_id', courseId)
          .order('order_index', { ascending: true });
        const mappedSections = (sectionsData || []).map((s: any) => ({
          id: s.id,
          title: s.title,
          order_index: s.order_index || 0,
          available_from: s.available_from,
          available_until: s.available_until
        }));
        setSections(mappedSections);
        // Inicialmente todas las secciones abiertas
        const initialOpen: Record<string, boolean> = {};
        mappedSections.forEach(s => { initialOpen[s.id] = true; });
        if (lessonsWithProgress.some(l => !l.section_id && l.content_type !== 'exam' && !(l as any).has_activity)) {
          initialOpen['__unsectioned'] = true;
        }
        if (lessonsWithProgress.some(l => !l.section_id && (l.content_type === 'exam' || (l as any).has_activity))) {
          initialOpen['__unsectioned_exams'] = true;
        }
        setOpenSections(initialOpen);

        // Seleccionar la primera lección no completada o la primera que esté disponible
        const firstIncomplete = lessonsWithProgress.find(l => {
          if (l.completed) return false;
          // Check availability
          if (l.section_id) {
            const section = mappedSections.find(s => s.id === l.section_id);
            if (section) {
              const now = new Date();
              if (section.available_from && new Date(section.available_from) > now) return false;
              if (section.available_until && new Date(section.available_until) < now) return false;
            }
          }
          return true;
        });

        // Fallback to first available lesson if all are completed or none found
        const firstAvailable = lessonsWithProgress.find(l => {
          if (l.section_id) {
            const section = mappedSections.find(s => s.id === l.section_id);
            if (section) {
              const now = new Date();
              if (section.available_from && new Date(section.available_from) > now) return false;
              if (section.available_until && new Date(section.available_until) < now) return false;
            }
          }
          return true;
        });

        setCurrentLesson(firstIncomplete || firstAvailable || lessonsWithProgress[0] || null);
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
          // Check virtual session date
          if (course?.virtual_session_date) {
            const sessionDate = new Date(course.virtual_session_date);
            if (new Date() < sessionDate) {
              toast({
                title: "Curso completado parcialmente",
                description: `Has completado todas las lecciones, pero el curso finalizará oficialmente el ${sessionDate.toLocaleString()}`,
              });
              // We update progress to 100 but NOT completed: true
              try {
                const { error: enrollErr } = await supabase
                  .from('mooc_enrollments')
                  .update({ progress: 100, updated_at: new Date().toISOString() }) // completed is NOT set to true
                  .eq('course_id', courseId)
                  .eq('user_id', user.id);

                if (enrollErr) throw enrollErr;
              } catch (e) {
                console.error('Error updating enrollment progress', e);
              }
              return; // Exit here
            }
          }

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

  const isSectionAvailable = (section: { available_from?: string | null; available_until?: string | null }) => {
    const now = new Date();
    if (section.available_from && new Date(section.available_from) > now) return false;
    if (section.available_until && new Date(section.available_until) < now) return false;
    return true;
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
    } else if (lesson.content_type === 'exam' || (lesson as any).has_activity) {
      setOpenSections(prev => ({ ...prev, ['__unsectioned_exams']: true }));
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

  // Solo puede completar si no hay actividad pendiente
  const canCompleteLesson = currentLesson && (
    currentLesson.completed ||
    !currentLesson.video_url ||
    videoWatched
  ) && (!currentLesson.exam || currentLesson.exam.passed)
    && (
      !activity || !!activitySubmission
    );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800">

      {/* --- TOP HEADER (Contexto del Curso) --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-tight line-clamp-1">{course?.title}</h1>
              <p className="text-xs text-slate-500 font-medium">{course?.profession}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-700">Tu Progreso</p>
              <p className="text-xs text-slate-500">{progress}% completado</p>
            </div>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

        {/* --- COLUMNA IZQUIERDA: CONTENIDO PRINCIPAL (2/3 del ancho) --- */}
        <section className="lg:col-span-2 space-y-6">

          {currentLesson ? (
            (() => {
              // Check if the current lesson belongs to a locked section
              let isLocked = false;
              let lockMessage = "";
              if (currentLesson.section_id) {
                const section = sections.find(s => s.id === currentLesson.section_id);
                if (section) {
                  const now = new Date();
                  if (section.available_from && new Date(section.available_from) > now) {
                    isLocked = true;
                    lockMessage = `Este módulo estará disponible desde el ${new Date(section.available_from).toLocaleString()}`;
                  } else if (section.available_until && new Date(section.available_until) < now) {
                    isLocked = true;
                    lockMessage = `Este módulo cerró el ${new Date(section.available_until).toLocaleString()}`;
                  }
                }
              }

              if (isLocked) {
                return (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                    <Lock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-900">Contenido Bloqueado</h3>
                    <p className="text-slate-500 mt-2">{lockMessage}</p>
                    <Button variant="outline" className="mt-6" onClick={() => navigate("/dashboard")}>
                      Volver al Panel
                    </Button>
                  </div>
                );
              }

              return (
                <>
                  {/* 1. Título y Descripción del Tema Actual */}
                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
                    <div className="mb-6">
                      <span className="inline-block px-3 py-1 bg-blue-50 text-[#003366] text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                        Tema Actual
                      </span>
                      <h2 className="text-3xl font-bold text-slate-900 mb-4">{currentLesson.title}</h2>

                      {currentLesson.description && (
                        <div className="prose prose-slate text-slate-600 max-w-none leading-relaxed">
                          <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(currentLesson.description) }} />
                        </div>
                      )}
                    </div>

                    {/* Video Player if available */}
                    {currentLesson.video_url && (
                      <div className="mt-6 mb-6">
                        {(() => {
                          const embed = getEmbedUrl(currentLesson.video_url);
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
                            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
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
                        })()}
                      </div>
                    )}

                    {/* Lesson Content (HTML) */}
                    {currentLesson.content && (
                      <div className="mt-6 prose prose-slate text-slate-600 max-w-none leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(currentLesson.content) }} />
                      </div>
                    )}

                    {/* 2. TARJETA DE ENCUENTRO SINCRÓNICO (Rediseñada) */}
                    {currentLesson.content_type === 'live_session' && (
                      <div className="mt-8 relative overflow-hidden rounded-xl bg-gradient-to-br from-[#464775] to-[#6264A7] text-white shadow-lg">
                        {/* Decorative circles */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>

                        <div className="relative p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-semibold border border-white/10 backdrop-blur-sm">
                                EN VIVO
                              </span>
                              <span className="text-xs text-white/80 flex items-center gap-1">
                                <Video size={12} /> {currentLesson.live_platform || 'Plataforma Virtual'}
                              </span>
                            </div>
                            <h3 className="text-xl font-bold mb-1">Encuentro Sincrónico</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-white/90 mt-3">
                              {currentLesson.live_date && (
                                <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                                  <Calendar size={14} />
                                  <span>
                                    {(() => {
                                      // Parse YYYY-MM-DD as local date, not UTC
                                      const [year, month, day] = currentLesson.live_date!.split('-').map(Number);
                                      const localDate = new Date(year, month - 1, day);
                                      return localDate.toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      });
                                    })()}
                                  </span>
                                </div>
                              )}
                              {currentLesson.live_time && (
                                <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-lg">
                                  <Clock size={14} />
                                  <span>{currentLesson.live_time}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {currentLesson.live_url && (
                            <div className="flex-shrink-0 w-full md:w-auto">
                              <a
                                href={currentLesson.live_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-[#464775] hover:bg-gray-100 px-5 py-3 rounded-lg font-bold transition-all shadow-md active:scale-95"
                              >
                                Unirse a la sesión <ExternalLink size={16} />
                              </a>
                              <p className="text-center text-[10px] text-white/60 mt-2">Se abrirá en una nueva pestaña</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Exam Card */}
                    {currentLesson.exam && (
                      <div className={`mt-8 p-6 rounded-xl border ${currentLesson.exam.passed ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                              <CheckCircle2 size={20} className={currentLesson.exam.passed ? "text-green-600" : "text-orange-600"} />
                              Examen: {currentLesson.exam.title}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1">
                              {currentLesson.exam.passed ? (
                                <span className="text-green-700 font-medium">✓ Aprobado</span>
                              ) : currentLesson.exam.attempts > 0 ? (
                                <span className="text-orange-700">Intentos realizados: {currentLesson.exam.attempts}</span>
                              ) : (
                                <span>No iniciado</span>
                              )}
                            </p>
                          </div>
                          <Button
                            variant={currentLesson.exam.passed ? "outline" : "default"}
                            className={!currentLesson.exam.passed ? "bg-[#003366] hover:bg-[#002a55]" : ""}
                            onClick={async (e) => {
                              if (currentLesson.exam?.passed) {
                                // View result logic
                                try {
                                  setExamResultLoading(true);
                                  const { data: { user } } = await supabase.auth.getUser();
                                  if (!user) return;
                                  const { data: attempts } = await supabase
                                    .from('mooc_exam_attempts')
                                    .select('score_numeric, score_percent, passed')
                                    .eq('exam_id', currentLesson.exam.id)
                                    .eq('user_id', user.id)
                                    .order('created_at', { ascending: false })
                                    .limit(1);
                                  const att = (attempts && attempts[0]) || null;
                                  if (att) {
                                    setExamResult({ score_numeric: att.score_numeric || 0, score_percent: att.score_percent || 0, passed: !!att.passed });
                                    setShowExamResultDialog(true);
                                  }
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setExamResultLoading(false);
                                }
                              } else {
                                navigate(`/mooc/${courseId}/exam/${currentLesson.exam?.id}`);
                              }
                            }}
                          >
                            {currentLesson.exam.passed ? "Ver resultado" : "Realizar examen"}
                          </Button>
                        </div>
                        {!currentLesson.exam.passed && (
                          <div className="mt-3 text-xs text-orange-800 bg-orange-100/50 p-2 rounded">
                            ⚠️ Importante: Debes aprobar este examen para completar la lección
                          </div>
                        )}
                      </div>
                    )}

                    {/* Evidencia de actividad */}
                    {activityLoading ? (
                      <div className="mt-8 flex items-center gap-2 text-blue-600"><Loader2 className="animate-spin" /> Cargando actividad...</div>
                    ) : activity && !activitySubmission ? (
                      <div className="mt-8">
                        <div className="mb-4">
                          <h4 className="font-bold text-slate-900 text-lg mb-1">Actividad</h4>
                          <div className="text-slate-700 mb-2">{activity.title}</div>
                          {activity.description && <div className="text-slate-500 mb-2">{activity.description}</div>}
                          <div className="text-xs text-slate-500 mb-2">Debes entregar evidencia para poder completar la lección.</div>
                        </div>
                        <ActivitySubmissionForm
                          activityId={activity.id}
                          allowedTypes={activity.allowed_types as ActivityEvidenceType[]}
                          loading={activitySubmitting}
                          onSubmit={async (data) => {
                            setActivitySubmitting(true);
                            try {
                              const { data: { user } } = await supabase.auth.getUser();
                              if (!user) throw new Error('No autenticado');
                              await submitActivityEvidence({
                                activityId: activity.id,
                                userId: user.id,
                                ...data,
                              });
                              toast({ title: 'Evidencia enviada', description: 'Tu entrega fue registrada correctamente.' });
                              // Refrescar estado
                              const { activity: act, submission } = await getLessonActivity(currentLesson.id, user.id);
                              setActivity(act);
                              setActivitySubmission(submission);
                            } catch (e: any) {
                              toast({ title: 'Error', description: e.message || 'No se pudo enviar la evidencia', variant: 'destructive' });
                            } finally {
                              setActivitySubmitting(false);
                            }
                          }}
                        />
                      </div>
                    ) : null}

                    {/* Completion Button */}
                    {!currentLesson.completed && (
                      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">¿Terminaste esta lección?</p>
                          <p className="text-sm text-slate-500">
                            {activity && !activitySubmission
                              ? "Debes entregar la evidencia de la actividad para completar la lección."
                              : currentLesson.video_url && !videoWatched
                                ? "Mira el video completo para continuar"
                                : currentLesson.exam && !currentLesson.exam.passed
                                  ? "Debes aprobar el examen para completar"
                                  : "Marca como completada para avanzar"}
                          </p>
                        </div>
                        <Button
                          onClick={markLessonComplete}
                          disabled={!canCompleteLesson || completing}
                          size="lg"
                          className="bg-[#003366] hover:bg-[#002a55] text-white"
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
                  </div>

                  {/* Recursos Adicionales (Bonus) */}
                  {currentLesson.readings && currentLesson.readings.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-[#003366]" />
                        Material de Apoyo
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentLesson.readings.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => navigate(`/courses/${courseId}/lessons/${currentLesson.id}/reading/${r.id}`)}
                            className="p-4 border border-slate-100 rounded-xl flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer group"
                          >
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800 text-sm truncate">{r.title}</p>
                              <p className="text-xs text-slate-500">
                                {r.completed ? <span className="text-green-600">Completado</span> : "Lectura pendiente"}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
              <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900">Selecciona una lección</h3>
              <p className="text-slate-500 mt-2">Elige un tema del menú derecho para comenzar a aprender.</p>
            </div>
          )}

        </section>


        {/* --- COLUMNA DERECHA: TEMARIO (SIDEBAR) --- */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 sticky top-24 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Contenido del curso</h3>
              <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                {lessons.length} lecciones
              </span>
            </div>

            <div className="divide-y divide-slate-50">
              {/* Secciones */}
              {sections.length > 0 ? (
                sections.map((section) => {
                  const sectionLessons = lessons.filter(l => (l as any).section_id === section.id).sort((a, b) => a.order_index - b.order_index);
                  const isOpen = openSections[section.id];
                  const available = isSectionAvailable(section);

                  return (
                    <div key={section.id} className={`bg-white ${!available ? 'opacity-75' : ''}`}>
                      {/* Module Header */}
                      <button
                        onClick={() => available && toggleSection(section.id)}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors ${!available ? 'cursor-not-allowed' : ''}`}
                      >
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Módulo {section.order_index}</p>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-800 text-sm">{section.title}</p>
                            {!available && <Lock size={14} className="text-slate-400" />}
                          </div>

                          {/* Availability Messages */}
                          {!available && section.available_from && new Date(section.available_from) > new Date() && (
                            <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                              <Clock size={10} /> Disponible desde: {new Date(section.available_from).toLocaleString()}
                            </p>
                          )}
                          {!available && section.available_until && new Date(section.available_until) < new Date() && (
                            <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                              <Lock size={10} /> Cerrado el: {new Date(section.available_until).toLocaleString()}
                            </p>
                          )}
                          {available && section.available_until && (
                            <p className="text-[10px] text-orange-600 mt-1 flex items-center gap-1">
                              <Clock size={10} /> Disponible hasta: {new Date(section.available_until).toLocaleString()}
                            </p>
                          )}
                        </div>
                        {available && (isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />)}
                      </button>

                      {/* Module Items List */}
                      {isOpen && available && (
                        <div className="bg-slate-50/50 pb-2">
                          {sectionLessons.length > 0 ? (
                            sectionLessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                onClick={() => selectLessonAndExpand(lesson)}
                                className={`
                                  relative pl-4 pr-4 py-3 flex gap-3 items-start transition-all cursor-pointer
                                  ${currentLesson?.id === lesson.id ? 'bg-blue-50 border-l-4 border-[#003366]' : 'hover:bg-slate-100 border-l-4 border-transparent'}
                                `}
                              >
                                {/* Status Icon */}
                                <div className="mt-0.5 flex-shrink-0">
                                  {lesson.completed ? (
                                    <CheckCircle2 size={18} className="text-green-500" />
                                  ) : currentLesson?.id === lesson.id ? (
                                    <PlayCircle size={18} className="text-[#003366] fill-blue-100" />
                                  ) : (
                                    <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300"></div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium leading-snug ${currentLesson?.id === lesson.id ? 'text-[#003366]' : 'text-slate-600'}`}>
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                    <span className="flex items-center gap-1">
                                      {lesson.video_url ? <Video size={10} /> : <FileText size={10} />}
                                      {lesson.video_url ? 'Video' : 'Lectura'}
                                    </span>
                                    <span>•</span>
                                    <span>{lesson.duration_hours}h</span>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-slate-400 italic flex items-center gap-2">
                              <Lock size={14} /> Sin contenido
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                // Fallback si no hay secciones (lista plana)
                <div className="bg-slate-50/50 pb-2">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      onClick={() => selectLesson(lesson)}
                      className={`
                        relative pl-4 pr-4 py-3 flex gap-3 items-start transition-all cursor-pointer
                        ${currentLesson?.id === lesson.id ? 'bg-blue-50 border-l-4 border-[#003366]' : 'hover:bg-slate-100 border-l-4 border-transparent'}
                      `}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {lesson.completed ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : currentLesson?.id === lesson.id ? (
                          <PlayCircle size={18} className="text-[#003366] fill-blue-100" />
                        ) : (
                          <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium leading-snug ${currentLesson?.id === lesson.id ? 'text-[#003366]' : 'text-slate-600'}`}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <span>{lesson.duration_hours}h</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lecciones sin sección (si hay secciones pero algunas lecciones no tienen) */}
              {sections.length > 0 && (
                <>
                  {/* 1. Lecciones Adicionales (No exámenes ni actividades) */}
                  {lessons.filter(l => !(l as any).section_id && l.content_type !== 'exam' && !(l as any).has_activity).length > 0 && (
                    <div className="bg-white">
                      <button
                        onClick={() => toggleSection('__unsectioned')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Otros</p>
                          <p className="font-bold text-slate-800 text-sm">Lecciones Adicionales</p>
                        </div>
                        {openSections['__unsectioned'] ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </button>

                      {openSections['__unsectioned'] && (
                        <div className="bg-slate-50/50 pb-2">
                          {lessons.filter(l => !(l as any).section_id && l.content_type !== 'exam' && !(l as any).has_activity).map((lesson) => (
                            <div
                              key={lesson.id}
                              onClick={() => selectLessonAndExpand(lesson)}
                              className={`
                                relative pl-4 pr-4 py-3 flex gap-3 items-start transition-all cursor-pointer
                                ${currentLesson?.id === lesson.id ? 'bg-blue-50 border-l-4 border-[#003366]' : 'hover:bg-slate-100 border-l-4 border-transparent'}
                              `}
                            >
                              <div className="mt-0.5 flex-shrink-0">
                                {lesson.completed ? (
                                  <CheckCircle2 size={18} className="text-green-500" />
                                ) : currentLesson?.id === lesson.id ? (
                                  <PlayCircle size={18} className="text-[#003366] fill-blue-100" />
                                ) : (
                                  <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium leading-snug ${currentLesson?.id === lesson.id ? 'text-[#003366]' : 'text-slate-600'}`}>
                                  {lesson.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                  <span>{lesson.duration_hours}h</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Exámenes / Actividades sin sección */}
                  {lessons.filter(l => !(l as any).section_id && (l.content_type === 'exam' || (l as any).has_activity)).length > 0 && (
                    <div className="bg-white">
                      <button
                        onClick={() => toggleSection('__unsectioned_exams')}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-0.5">Evaluación</p>
                          <p className="font-bold text-slate-800 text-sm">Exámenes y Actividades</p>
                        </div>
                        {openSections['__unsectioned_exams'] ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </button>

                      {openSections['__unsectioned_exams'] && (
                        <div className="bg-slate-50/50 pb-2">
                          {lessons.filter(l => !(l as any).section_id && (l.content_type === 'exam' || (l as any).has_activity)).map((lesson) => (
                            <div
                              key={lesson.id}
                              onClick={() => selectLessonAndExpand(lesson)}
                              className={`
                                relative pl-4 pr-4 py-3 flex gap-3 items-start transition-all cursor-pointer
                                ${currentLesson?.id === lesson.id ? 'bg-blue-50 border-l-4 border-[#003366]' : 'hover:bg-slate-100 border-l-4 border-transparent'}
                              `}
                            >
                              <div className="mt-0.5 flex-shrink-0">
                                {lesson.completed ? (
                                  <CheckCircle2 size={18} className="text-green-500" />
                                ) : currentLesson?.id === lesson.id ? (
                                  <PlayCircle size={18} className="text-[#003366] fill-blue-100" />
                                ) : (
                                  <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium leading-snug ${currentLesson?.id === lesson.id ? 'text-[#003366]' : 'text-slate-600'}`}>
                                  {lesson.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <FileText size={10} />
                                    {lesson.content_type === 'exam' ? 'Examen' : 'Actividad'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>

      </main>

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
