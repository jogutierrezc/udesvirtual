import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Clock, 
  BookOpen, 
  Award, 
  PlayCircle, 
  Target,
  Users,
  CheckCircle,
  ArrowLeft,
  Video,
  Loader2
} from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  description: string;
  duration_hours: number;
  order_index: number;
  content: string;
  video_url: string;
};

type CourseDetail = {
  id: string;
  title: string;
  description: string;
  profession: string;
  tags: string[];
  objective: string;
  course_image_url: string | null;
  intro_video_url: string | null;
  created_at: string;
  creator?: {
    full_name: string;
    email: string;
  };
  lessons?: Lesson[];
  total_duration?: number;
  lesson_count?: number;
};

export default function MoocDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCourse(id);
    }
  }, [id]);

  const loadCourse = async (courseId: string) => {
    try {
      setLoading(true);
      console.log("Cargando curso:", courseId);

      // Obtener datos del curso
      const { data: courseData, error: courseError } = await supabase
        .from("mooc_courses")
        .select("*")
        .eq("id", courseId)
        .eq("status", "approved")
        .single();

      if (courseError) {
        console.error("Error loading course:", courseError);
        throw courseError;
      }

      if (!courseData) {
        toast({
          title: "Error",
          description: "Curso no encontrado",
          variant: "destructive",
        });
        return;
      }

      console.log("Curso cargado:", courseData);

      // Obtener información del creador
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", courseData.created_by)
        .single();

      // Obtener lecciones
      const { data: lessonsData } = await supabase
        .from("mooc_lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      const totalDuration = lessonsData?.reduce((sum, lesson) => sum + (lesson.duration_hours || 0), 0) || 0;
      const lessonCount = lessonsData?.length || 0;

      const courseDetail: CourseDetail = {
        ...courseData,
        creator: profileData ? { full_name: profileData.full_name, email: profileData.email } : undefined,
        lessons: lessonsData || [],
        total_duration: totalDuration,
        lesson_count: lessonCount,
      };

      console.log("Curso con detalles:", courseDetail);
      setCourse(courseDetail);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Curso no encontrado</h2>
          <Button onClick={() => navigate("/mooc")}>Volver a cursos</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section con imagen de fondo */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        {/* Imagen de fondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-gradient-to-br from-indigo-100 to-purple-100"
          style={{ backgroundImage: course.course_image_url ? `url(${course.course_image_url})` : undefined }}
        />
        
        {/* Degradado blanco desde abajo */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
        
        {/* Contenido sobre la imagen */}
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8 md:pb-12">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/mooc")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a cursos
            </Button>
            
            {/* Badges de información */}
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="secondary" className="bg-white backdrop-blur-sm text-blue-600 text-sm py-1.5 px-3">
                <Clock className="h-4 w-4 mr-1.5 text-blue-600" />
                {course.total_duration || 0} horas
              </Badge>
              <Badge variant="secondary" className="bg-white backdrop-blur-sm text-blue-600 text-sm py-1.5 px-3">
                <BookOpen className="h-4 w-4 mr-1.5 text-blue-600" />
                {course.lesson_count || 0} lecciones
              </Badge>
              <Badge variant="secondary" className="bg-yellow-500 backdrop-blur-sm text-white text-sm py-1.5 px-3">
                <Award className="h-4 w-4 mr-1.5 text-white" />
                Certificado
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal (izquierda) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Título y descripción */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              {course.intro_video_url && (
                <Button 
                  onClick={() => setShowIntroVideo(true)}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Ver Introducción
                </Button>
              )}
              <Button 
                size="lg"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Tomar Curso
              </Button>
            </div>

            {/* Perfil del instructor */}
            {course.creator && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarFallback className="text-xl bg-indigo-100 text-indigo-600">
                        {course.creator.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">{course.creator.full_name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{course.profession}</p>
                      <p className="text-sm text-muted-foreground">{course.creator.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contenido programático */}
            {course.lessons && course.lessons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Contenido del Curso</CardTitle>
                  <CardDescription>
                    {course.lesson_count} lecciones • {course.total_duration} horas totales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {course.lessons.map((lesson, index) => (
                      <div 
                        key={lesson.id}
                        className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <div className="text-indigo-600 mt-1">
                            <Video className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium mb-1">
                              {index + 1}. {lesson.title}
                            </div>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                          <Clock className="h-3 w-3 mr-1" />
                          {lesson.duration_hours}h
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna lateral (derecha) */}
          <div className="space-y-6">
            {/* Objetivo del curso */}
            {course.objective && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    Objetivo del Curso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{course.objective}</p>
                </CardContent>
              </Card>
            )}
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Colaboradores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Colaboradores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.collaborators.map((collaborator, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                        <AvatarFallback>{collaborator.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{collaborator.name}</div>
                        <div className="text-xs text-muted-foreground">{collaborator.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nivel</span>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duración</span>
                  <span className="font-medium">{course.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estudiantes</span>
                  <span className="font-medium">{course.students.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Categoría</span>
                  <span className="font-medium">{course.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-medium">⭐ {course.rating}/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de video de introducción */}
      <Dialog open={showIntroVideo} onOpenChange={setShowIntroVideo}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Video de Introducción</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
            <iframe
              className="w-full h-full"
              src={course.introVideo}
              title="Video de introducción"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
