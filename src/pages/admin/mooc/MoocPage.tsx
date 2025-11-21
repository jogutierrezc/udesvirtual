import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusCircle, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Loader2,
  BookOpen,
  Clock,
  Eye,
  Award
} from "lucide-react";
import { LinkPassportModal } from "./modals/LinkPassportModal";
import CertificateTemplateAdmin from "./CertificateTemplateAdmin";

type MoocCourse = {
  id: string;
  title: string;
  profession: string;
  tags: string[];
  objective: string;
  description: string;
  course_image_url: string | null;
  intro_video_url: string | null;
  created_by: string;
  status: string;
  created_at: string;
  updated_at: string;
  passport_activity_id?: string | null;
  passport_points?: number | null;
  creator?: {
    full_name: string;
    email: string;
  };
  total_duration?: number;
  lessons_count?: number;
};

export const MoocPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<MoocCourse[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<MoocCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // const [showCourseModal, setShowCourseModal] = useState(false);
  // const [editingCourse, setEditingCourse] = useState<MoocCourse | null>(null);
  const [linkingCourse, setLinkingCourse] = useState<MoocCourse | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, statusFilter]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      console.log("Cargando cursos MOOC...");
      
      // Obtener cursos
      const { data: coursesData, error: coursesError } = await supabase
        .from("mooc_courses")
        .select("*, passport_activity_id, passport_points")
        .order("created_at", { ascending: false});

      if (coursesError) {
        console.error("Error loading courses:", coursesError);
        throw coursesError;
      }

      console.log("Cursos cargados:", coursesData);

      // Obtener información de los creadores y stats de lecciones
      const coursesWithStats = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Obtener información del creador
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", course.created_by)
            .single();

          // Obtener duración y número de lecciones
          const { data: lessonsData } = await supabase
            .from("mooc_lessons")
            .select("duration_hours")
            .eq("course_id", course.id);

          const totalDuration = lessonsData?.reduce((sum, lesson) => sum + lesson.duration_hours, 0) || 0;
          const lessonsCount = lessonsData?.length || 0;

          return {
            ...course,
            creator: profileData || { full_name: "Desconocido", email: "" },
            total_duration: totalDuration,
            lessons_count: lessonsCount
          };
        })
      );

      console.log("Cursos con stats:", coursesWithStats);
      setCourses(coursesWithStats);
    } catch (error: any) {
      console.error("Error loading courses:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.profession.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(course => course.status === statusFilter);
    }

    setFilteredCourses(filtered);
  };

  const handleApproveCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("mooc_courses")
        .update({ status: "approved" })
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Curso aprobado",
        description: "El curso ha sido aprobado exitosamente"
      });

      loadCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRejectCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("mooc_courses")
        .update({ status: "rejected" })
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Curso rechazado",
        description: "El curso ha sido rechazado"
      });

      loadCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("¿Eliminar este curso? Esta acción es irreversible.")) return;

    try {
      const { error } = await supabase
        .from("mooc_courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Curso eliminado",
        description: "El curso ha sido eliminado exitosamente"
      });

      loadCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEditCourse = (course: MoocCourse) => {
    // Redirigir directamente al editor de curso
    window.location.href = `/admin/mooc/course/${course.id}/edit`;
  };

  const handleCloseModal = () => {
    setShowCourseModal(false);
    setEditingCourse(null);
  };

  const handleSaveCourse = () => {
    loadCourses();
    handleCloseModal();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Gestión de Cursos MOOC</h1>
            <p className="text-sm text-muted-foreground">
              Administra los cursos virtuales de la plataforma
            </p>
          </div>
          <Button onClick={() => setShowCourseModal(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Crear Curso
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <Input
                  placeholder="Buscar por título o programa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="approved">Aprobados</SelectItem>
                    <SelectItem value="rejected">Rechazados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de cursos */}
        <div className="grid grid-cols-1 gap-4">
          {filteredCourses.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron cursos</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
                  {/* Imagen del curso */}
                  <div className="h-48 md:h-auto bg-muted relative">
                    {course.course_image_url ? (
                      <img
                        src={course.course_image_url}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={
                          course.status === "approved"
                            ? "default"
                            : course.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {course.status === "approved"
                          ? "Aprobado"
                          : course.status === "pending"
                          ? "Pendiente"
                          : "Rechazado"}
                      </Badge>
                    </div>
                  </div>

                  {/* Contenido del curso */}
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg md:text-xl font-semibold">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{course.profession}</Badge>
                          {course.tags?.map((tag, index) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.total_duration} horas</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>{course.lessons_count} lecciones</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Creado por: {course.creator?.full_name || "Desconocido"}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="flex md:flex-col gap-2">
                        {course.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveCourse(course.id)}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectCourse(course.id)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant={course.passport_activity_id ? "default" : "outline"}
                          onClick={() => setLinkingCourse(course)}
                          title="Vincular con Pasaporte"
                        >
                          <Award className="h-4 w-4 mr-1" />
                          {course.passport_activity_id ? `${course.passport_points} pts` : "Pasaporte"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCourse(course)}
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal de formulario eliminado. Ahora se redirige directamente al editor de curso. */}

      {/* Modal de vinculación con Pasaporte */}
      {linkingCourse && (
        <LinkPassportModal
          open={!!linkingCourse}
          onClose={() => setLinkingCourse(null)}
          courseId={linkingCourse.id}
          courseTitle={linkingCourse.title}
          currentActivityId={linkingCourse.passport_activity_id || undefined}
          currentPoints={linkingCourse.passport_points || undefined}
          onSuccess={loadCourses}
        />
      )}
      {/* Administración de plantillas de certificado */}
      <div className="mt-12">
        <CertificateTemplateAdmin />
      </div>
    </div>
  );
};
