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
  Users,
  Search,
  Filter,
  Mail,
  Calendar,
  BookOpen,
  Award,
  Clock,
  Loader2,
  UserCheck,
  Eye
} from "lucide-react";

type Student = {
  id: string;
  name: string;
  email: string;
  enrolled_courses: number;
  completed_courses: number;
  certificates_earned: number;
  total_hours: number;
  last_activity: string;
  enrollment_date: string;
  courses: {
    course_id: string;
    course_title: string;
    enrollment_date: string;
    completion_date?: string;
    progress_percentage: number;
    status: string;
  }[];
};

export const StudentsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);

      // Intentar usar selects con relaciones (funciona si existen FK declaradas)
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("mooc_enrollments")
        .select(`
          user_id,
          course_id,
          enrolled_at,
          completed,
          progress,
          updated_at,
          mooc_course:course_id (
            title
          ),
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order("enrolled_at", { ascending: false });

      // Obtener certificaciones (se usa en ambos caminos)
      const { data: certificates, error: certError } = await supabase
        .from("mooc_certificates")
        .select("user_id, course_id");

      if (certError) throw certError;

      // Si la consulta con relaciones falla (p. ej. no hay FK hacia profiles), hacemos un fallback manual
      if (enrollmentsError) {
        console.warn("Relationship select for mooc_enrollments failed, falling back to manual join:", enrollmentsError);

        const { data: basicEnrollments, error: basicErr } = await supabase
          .from("mooc_enrollments")
          .select("user_id, course_id, enrolled_at, completed, progress, updated_at")
          .order("enrolled_at", { ascending: false });

        if (basicErr) throw basicErr;

        const enrolls = basicEnrollments || [];

        // Obtener perfiles y cursos en batch
        const userIds = Array.from(new Set(enrolls.map((e: any) => e.user_id).filter(Boolean)));
        const courseIds = Array.from(new Set(enrolls.map((e: any) => e.course_id).filter(Boolean)));

        const [{ data: profiles }, { data: coursesData }] = await Promise.all([
          userIds.length > 0 ? supabase.from('profiles').select('id,full_name,email').in('id', userIds) : Promise.resolve({ data: [] }),
          courseIds.length > 0 ? supabase.from('mooc_courses').select('id,title').in('id', courseIds) : Promise.resolve({ data: [] })
        ] as any);

        const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
  const courseMap = new Map<string, any>(((coursesData || []) as any[]).map((c: any) => [c.id, c]));

  // Debugging: mostrar conteo de datos obtenidos
  console.debug('basicEnrollments:', enrolls.length, 'profiles:', (profiles || []).length, 'courses:', (coursesData || []).length);

        // Procesar datos de estudiantes
        const studentMap = new Map<string, Student>();

        (enrolls || []).forEach((enrollment: any) => {
          const userId = enrollment.user_id;
          const userProfile = profileMap.get(userId) || {};
          const userName = userProfile.full_name || "Usuario desconocido";
          const userEmail = userProfile.email || "";

          if (!studentMap.has(userId)) {
            studentMap.set(userId, {
              id: userId,
              name: userName,
              email: userEmail,
              enrolled_courses: 0,
              completed_courses: 0,
              certificates_earned: 0,
              total_hours: 0,
              last_activity: enrollment.updated_at || enrollment.enrolled_at || new Date().toISOString(),
              enrollment_date: enrollment.enrolled_at || new Date().toISOString(),
              courses: []
            });
          }

          const student = studentMap.get(userId)!;
          student.enrolled_courses += 1;

          if (enrollment.completed) {
            student.completed_courses += 1;
          }

          // Verificar si tiene certificado para este curso
          const hasCertificate = certificates?.some((cert: any) =>
            cert.user_id === userId && cert.course_id === enrollment.course_id
          );

          if (hasCertificate) {
            student.certificates_earned += 1;
          }

          student.courses.push({
            course_id: enrollment.course_id,
            course_title: courseMap.get(enrollment.course_id)?.title || "Curso desconocido",
            enrollment_date: enrollment.enrolled_at,
            completion_date: enrollment.completed ? enrollment.updated_at : undefined,
            progress_percentage: enrollment.progress || 0,
            status: enrollment.completed ? "completed" : "active"
          });

          // Actualizar última actividad
          if (new Date(enrollment.updated_at || enrollment.enrolled_at) > new Date(student.last_activity)) {
            student.last_activity = enrollment.updated_at || enrollment.enrolled_at;
          }
        });

        const studentsArray = Array.from(studentMap.values());
        setStudents(studentsArray);
        return;
      }

      // Si llegamos aquí, la consulta con relaciones funcionó
      const studentMap = new Map<string, Student>();
  console.debug('Enrollments (with relations):', (enrollments || []).length, enrollments);
      (enrollments || []).forEach((enrollment: any) => {
        const userId = enrollment.user_id;
        const userName = enrollment.profiles?.full_name || "Usuario desconocido";
        const userEmail = enrollment.profiles?.email || "";

        if (!studentMap.has(userId)) {
          studentMap.set(userId, {
            id: userId,
            name: userName,
            email: userEmail,
            enrolled_courses: 0,
            completed_courses: 0,
            certificates_earned: 0,
            total_hours: 0,
            last_activity: enrollment.updated_at || enrollment.enrolled_at || new Date().toISOString(),
            enrollment_date: enrollment.enrolled_at || new Date().toISOString(),
            courses: []
          });
        }

        const student = studentMap.get(userId)!;
        student.enrolled_courses += 1;

        if (enrollment.completed) {
          student.completed_courses += 1;
        }

        // Verificar si tiene certificado para este curso
        const hasCertificate = certificates?.some((cert: any) =>
          cert.user_id === userId && cert.course_id === enrollment.course_id
        );

        if (hasCertificate) {
          student.certificates_earned += 1;
        }

        student.courses.push({
          course_id: enrollment.course_id,
          course_title: enrollment.mooc_course?.title || "Curso desconocido",
          enrollment_date: enrollment.enrolled_at,
          completion_date: enrollment.completed ? enrollment.updated_at : undefined,
          progress_percentage: enrollment.progress || 0,
          status: enrollment.completed ? "completed" : "active"
        });

        // Actualizar última actividad
        if (new Date(enrollment.updated_at || enrollment.enrolled_at) > new Date(student.last_activity)) {
          student.last_activity = enrollment.updated_at || enrollment.enrolled_at;
        }
      });

      const studentsArray = Array.from(studentMap.values());
      setStudents(studentsArray);
    } catch (error: any) {
      console.error("Error loading students:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(student => {
        if (statusFilter === "active") return student.enrolled_courses > student.completed_courses;
        if (statusFilter === "completed") return student.completed_courses > 0;
        if (statusFilter === "certified") return student.certificates_earned > 0;
        return true;
      });
    }

    setFilteredStudents(filtered);
  };

  const getStudentStatus = (student: Student) => {
    if (student.certificates_earned > 0) return "certified";
    if (student.completed_courses > 0) return "completed";
    return "active";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "certified":
        return <Badge className="bg-green-100 text-green-800">Certificado</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completado</Badge>;
      case "active":
        return <Badge className="bg-yellow-100 text-yellow-800">Activo</Badge>;
      default:
        return <Badge variant="secondary">Sin actividad</Badge>;
    }
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
            <h1 className="text-2xl md:text-3xl font-bold">Gestión de Estudiantes</h1>
            <p className="text-sm text-muted-foreground">
              Administra los estudiantes inscritos en cursos MOOC
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{students.length}</p>
                  <p className="text-sm text-muted-foreground">Total de estudiantes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{students.reduce((sum, s) => sum + s.enrolled_courses, 0)}</p>
                  <p className="text-sm text-muted-foreground">Inscripciones totales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Award className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{students.reduce((sum, s) => sum + s.certificates_earned, 0)}</p>
                  <p className="text-sm text-muted-foreground">Certificaciones emitidas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <UserCheck className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{students.filter(s => s.completed_courses > 0).length}</p>
                  <p className="text-sm text-muted-foreground">Estudiantes activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Filtrar por estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estudiantes</SelectItem>
                    <SelectItem value="active">Estudiantes activos</SelectItem>
                    <SelectItem value="completed">Con cursos completados</SelectItem>
                    <SelectItem value="certified">Con certificaciones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de estudiantes */}
        <div className="grid grid-cols-1 gap-4">
          {filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No se encontraron estudiantes</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredStudents.map((student) => (
              <Card key={student.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{student.name}</h3>
                            {getStatusBadge(getStudentStatus(student))}
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {student.email}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{student.enrolled_courses}</p>
                          <p className="text-xs text-muted-foreground">Cursos inscritos</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">{student.completed_courses}</p>
                          <p className="text-xs text-muted-foreground">Completados</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{student.certificates_earned}</p>
                          <p className="text-xs text-muted-foreground">Certificaciones</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {Math.round((student.completed_courses / Math.max(student.enrolled_courses, 1)) * 100)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Progreso general</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Última actividad: {new Date(student.last_activity).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex md:flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};