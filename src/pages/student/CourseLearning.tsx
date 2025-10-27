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
  BookOpen
} from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  duration_hours: number;
  order_index: number;
  content: string | null;
  video_url: string | null;
  completed: boolean;
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
  const videoRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
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

        const lessonsWithProgress: Lesson[] = lessonsData.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          duration_hours: lesson.duration_hours,
          order_index: lesson.order_index,
          content: lesson.content,
          video_url: lesson.video_url,
          completed: Boolean(progressMap.get(lesson.id)),
        }));

        setLessons(lessonsWithProgress);

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

      if (error) throw error;

      // Actualizar estado local
      setLessons(prev => prev.map(l => 
        l.id === currentLesson.id ? { ...l, completed: true } : l
      ));

      // Calcular nuevo progreso
      const completedCount = lessons.filter(l => 
        l.id === currentLesson.id || l.completed
      ).length;
      const newProgress = Math.round((completedCount / lessons.length) * 100);
      setProgress(newProgress);

      toast({
        title: "¡Lección completada!",
        description: `Progreso: ${newProgress}%`,
      });

      // Avanzar a la siguiente lección no completada
      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
      const nextLesson = lessons
        .slice(currentIndex + 1)
        .find(l => !l.completed && l.id !== currentLesson.id);

      if (nextLesson) {
        setCurrentLesson(nextLesson);
        setVideoWatched(false);
      } else if (newProgress === 100) {
        toast({
          title: "¡Felicitaciones!",
          description: "Has completado todo el curso",
        });
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
  );

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
                          <p className="text-muted-foreground">
                            {currentLesson.description}
                          </p>
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
                    {/* Video */}
                    {currentLesson.video_url && (
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
                    )}

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
                          <div className="prose prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                          </div>
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

          {/* Sidebar con lecciones */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Contenido del curso</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="p-4 space-y-2">
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
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
