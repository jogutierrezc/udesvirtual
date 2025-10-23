import React, { useEffect, useState, useMemo } from "react";
import { MoocExamManager } from "./components/MoocExamManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Edit, Trash2, BookOpen, Clock, User } from "lucide-react";
import { MoocCourseFormModal } from "@/pages/admin/mooc/modals/MoocCourseFormModal";

interface MoocCourse {
  id: string;
  title: string;
  profession: string;
  tags: string[];
  objective: string;
  description: string;
  course_image_url: string | null;
  intro_video_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string | null;
  created_by: string;
  creator?: {
    full_name: string;
  } | null;
  total_duration?: number;
  lesson_count?: number;
  enrolled_count?: number;
  completed_count?: number;
}

export const ProfessorMoocPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [courses, setCourses] = useState<MoocCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<MoocCourse | null>(null);

  useEffect(() => {
    checkAuthAndLoadCourses();
  }, []);

  const checkAuthAndLoadCourses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUserId(session.user.id);
      await loadCourses(session.user.id);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async (professorId: string) => {
    try {
      console.log("Cargando cursos del profesor:", professorId);
      
      // Cargar cursos creados por el profesor
      const { data: coursesData, error: coursesError } = await supabase
        .from("mooc_courses")
        .select("*")
        .eq("created_by", professorId)
        .order("created_at", { ascending: false });

      if (coursesError) {
        console.error("Error loading courses:", coursesError);
        throw coursesError;
      }

      console.log("Cursos del profesor cargados:", coursesData);

      // Calcular duración total y número de lecciones
      const coursesWithStats = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Obtener información del creador
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", course.created_by)
            .single();

          // Obtener lecciones
          const { data: lessons } = await supabase
            .from("mooc_lessons")
            .select("duration_hours")
            .eq("course_id", course.id);

          const total_duration = lessons?.reduce((sum, lesson) => sum + (lesson.duration_hours || 0), 0) || 0;
          const lesson_count = lessons?.length || 0;

          // Obtener conteo de estudiantes inscritos y completados
          const { count: enrolled_count } = await supabase
            .from("mooc_enrollments")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id);

          const { count: completed_count } = await supabase
            .from("mooc_enrollments")
            .select("id", { count: "exact", head: true })
            .eq("course_id", course.id)
            .eq("completed", true);

          return {
            ...course,
            creator: profileData ? { full_name: profileData.full_name } : null,
            total_duration,
            lesson_count,
            enrolled_count: enrolled_count || 0,
            completed_count: completed_count || 0,
          } as MoocCourse;
        })
      );

      console.log("Cursos con stats:", coursesWithStats);
      setCourses(coursesWithStats);
    } catch (error: any) {
      console.error("Error loading courses:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      // Primero eliminar lecciones
      const { error: lessonsError } = await supabase
        .from("mooc_lessons")
        .delete()
        .eq("course_id", courseId);

      if (lessonsError) throw lessonsError;

      // Luego eliminar el curso
      const { error: courseError } = await supabase
        .from("mooc_courses")
        .delete()
        .eq("id", courseId);

      if (courseError) throw courseError;

      toast({
        title: "Éxito",
        description: "Curso eliminado correctamente",
      });

      await loadCourses(userId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (course: MoocCourse) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCourse(null);
  };
  
  const handleSave = () => {
    loadCourses(userId);
    handleModalClose();
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.profession.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "all" || course.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [courses, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const },
      approved: { label: "Aprobado", variant: "default" as const },
      rejected: { label: "Rechazado", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mis Cursos MOOC</h2>
          <p className="text-muted-foreground">
            Gestiona tus cursos MOOC. Los cursos quedan pendientes de aprobación por el administrador.
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Crear Nuevo Curso
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por título o profesión..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            onClick={() => setStatusFilter("pending")}
            size="sm"
          >
            Pendientes
          </Button>
          <Button
            variant={statusFilter === "approved" ? "default" : "outline"}
            onClick={() => setStatusFilter("approved")}
            size="sm"
          >
            Aprobados
          </Button>
          <Button
            variant={statusFilter === "rejected" ? "default" : "outline"}
            onClick={() => setStatusFilter("rejected")}
            size="sm"
          >
            Rechazados
          </Button>
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay cursos</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "No se encontraron cursos con los filtros aplicados"
                : "Comienza creando tu primer curso MOOC"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button onClick={handleCreateNew}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Crear Curso
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              {course.course_image_url && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={course.course_image_url}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg">{course.title}</CardTitle>
                  {getStatusBadge(course.status)}
                </div>
                <p className="text-sm text-muted-foreground">{course.profession}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm line-clamp-2">{course.description}</p>

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {course.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {course.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{course.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}


                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{course.total_duration || 0}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.lesson_count || 0} lecciones</span>
                  </div>
                </div>

                {/* Estudiantes: completado / matriculados */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                  <User className="h-4 w-4" />
                  <span>{course.completed_count || 0} / {course.enrolled_count || 0}</span>
                </div>

                {/* Status info */}
                {course.status === "rejected" && (
                  <p className="text-sm text-destructive">
                    Este curso fue rechazado. Puedes editarlo y volverlo a enviar.
                  </p>
                )}
                {course.status === "pending" && (
                  <p className="text-sm text-yellow-600">
                    Este curso está pendiente de aprobación por el administrador.
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(course)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(course.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <MoocCourseFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editingCourse={editingCourse as any}
        onSave={handleSave}
      />
    </div>
  );
};
