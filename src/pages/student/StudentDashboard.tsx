import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Award, 
  Trophy, 
  User2, 
  Loader2,
  GraduationCap,
  Clock,
  PlayCircle,
  Printer,
  FileDown
} from "lucide-react";

type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  university_name: string | null;
  avatar_url?: string;
};

type EnrolledCourse = {
  id: string;
  course_id: string;
  progress: number | null;
  completed: boolean | null;
  enrolled_at: string | null;
  course: {
    id: string;
    title: string;
    description: string;
    profession: string;
    course_image_url: string | null;
    tags: string[] | null;
  };
  lesson_count?: number;
  total_duration?: number;
};

type Certificate = {
  id: string;
  course_id: string;
  hours: number;
  verification_code: string;
  issued_at: string;
  course?: {
    title: string;
  };
};

export default function StudentDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalHours: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Cargar perfil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, university_name")
        .eq("id", user.id)
        .single();

      if (profileData) {
        const avatarUrl = user.user_metadata?.avatar_url;
        setProfile({ ...profileData, avatar_url: avatarUrl });
      }

      // Cargar cursos inscritos
      const { data: enrollments } = await supabase
        .from("mooc_enrollments")
        .select(`
          id,
          course_id,
          progress,
          completed,
          enrolled_at,
          course:mooc_courses!inner(
            id,
            title,
            description,
            profession,
            course_image_url,
            tags
          )
        `)
        .eq("user_id", user.id)
        .order("enrolled_at", { ascending: false });

      if (enrollments) {
        // Para cada curso, obtener el conteo de lecciones y duración
        const coursesWithDetails = await Promise.all(
          enrollments.map(async (enrollment: any) => {
            const { data: lessons } = await supabase
              .from("mooc_lessons")
              .select("duration_hours")
              .eq("course_id", enrollment.course_id);

            const totalDuration = lessons?.reduce((sum, lesson) => sum + (lesson.duration_hours || 0), 0) || 0;
            const lessonCount = lessons?.length || 0;

            return {
              ...enrollment,
              lesson_count: lessonCount,
              total_duration: totalDuration,
            };
          })
        );

        setEnrolledCourses(coursesWithDetails);

        // Calcular estadísticas
        const total = coursesWithDetails.length;
        const completed = coursesWithDetails.filter(c => c.completed).length;
        const inProgress = total - completed;
        const totalHours = coursesWithDetails.reduce((sum, c) => sum + (c.total_duration || 0), 0);

        setStats({
          totalCourses: total,
          completedCourses: completed,
          inProgressCourses: inProgress,
          totalHours,
        });
      }

      // Cargar certificados
      const { data: certsData, error: certsError } = await supabase
        .from("mooc_certificates" as any)
        .select("id, course_id, hours, verification_code, issued_at, course:mooc_courses(title)")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });

      console.log("Certificates query result:", { certsData, certsError });

      if (certsData) {
        setCertificates(certsData as any);
      }
    } catch (error: any) {
      console.error("Error loading student dashboard:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar tu información",
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

  const initials = profile?.full_name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header con perfil */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                ) : (
                  <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-700">
                    {initials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profile?.full_name}</h1>
                <p className="text-muted-foreground mb-2">{profile?.email}</p>
                {profile?.university_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    {profile.university_name}
                  </p>
                )}
              </div>
              <Button onClick={() => navigate("/profile")} variant="outline">
                <User2 className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="text-3xl font-bold">{stats.totalCourses}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                <span className="text-3xl font-bold">{stats.completedCourses}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">En Progreso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <PlayCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-3xl font-bold">{stats.inProgressCourses}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Horas Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="text-3xl font-bold">{stats.totalHours}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs con contenido */}
        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Mis Cursos
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <Award className="h-4 w-4 mr-2" />
              Certificaciones
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Trophy className="h-4 w-4 mr-2" />
              Badges
            </TabsTrigger>
          </TabsList>

          {/* Mis Cursos */}
          <TabsContent value="courses" className="space-y-4">
            {enrolledCourses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No tienes cursos inscritos</h3>
                  <p className="text-muted-foreground mb-4 text-center">
                    Explora nuestro catálogo de cursos MOOC y comienza tu aprendizaje
                  </p>
                  <Button onClick={() => navigate("/mooc")}>
                    Explorar Cursos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {enrolledCourses.map((enrollment) => (
                  <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      {enrollment.course.course_image_url ? (
                        <img
                          src={enrollment.course.course_image_url}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600" />
                      )}
                      {enrollment.completed && (
                        <Badge className="absolute top-3 right-3 bg-green-600">
                          <Award className="h-3 w-3 mr-1" />
                          Completado
                        </Badge>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{enrollment.course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {enrollment.course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {enrollment.lesson_count} lecciones
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {enrollment.total_duration}h
                        </span>
                      </div>

                      {!enrollment.completed && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span className="font-medium">{enrollment.progress || 0}%</span>
                          </div>
                          <Progress value={enrollment.progress || 0} className="h-2" />
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => navigate(enrollment.completed 
                            ? `/mooc/${enrollment.course_id}` 
                            : `/courses/${enrollment.course_id}/learn`
                          )}
                          className="flex-1"
                        >
                          {enrollment.completed ? "Ver Detalles" : "Continuar Curso"}
                        </Button>
                        {!enrollment.completed && (
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/mooc/${enrollment.course_id}`)}
                          >
                            Info
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Certificaciones */}
          <TabsContent value="certificates" className="space-y-4">
            {certificates.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Mis Certificaciones</CardTitle>
                  <CardDescription>
                    Aquí verás tus certificados una vez completes los cursos
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Award className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Completa cursos para obtener certificaciones
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stats.completedCourses} certificación{stats.completedCourses !== 1 ? 'es' : ''} disponible{stats.completedCourses !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                  <Card key={cert.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-2 text-base">
                          {cert.course?.title || "Curso MOOC"}
                        </CardTitle>
                        <Award className="h-5 w-5 text-amber-600 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Horas certificadas:</span>
                          <span className="font-semibold">{cert.hours}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Emitido:</span>
                          <span className="font-medium">{new Date(cert.issued_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => {
                            window.open(`/certificado/${cert.id}`, '_blank');
                            setTimeout(() => window.print(), 500);
                          }}
                          variant="outline"
                          className="flex-1"
                          size="sm"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Imprimir
                        </Button>
                        <Button 
                          onClick={() => window.open(`/certificado/${cert.id}`, '_blank')}
                          className="flex-1"
                          size="sm"
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Ver PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Badges */}
          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Mis Badges</CardTitle>
                <CardDescription>
                  Insignias y logros obtenidos durante tu aprendizaje
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Gana badges completando actividades y alcanzando metas
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Funcionalidad próximamente disponible
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
