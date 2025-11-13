import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Eye, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ProfessorStudentDetailDialog from './components/ProfessorStudentDetailDialog';

interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrolled_at?: string | null;
  completed?: boolean | null;
  progress?: number | null;
}

export default function MisEstudiantes() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<{ courseId: string; studentId: string } | null>(null);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const openStudentDetail = (courseId: string, studentId: string) => {
    console.log('openStudentDetail clicked', { courseId, studentId });
    toast({ title: 'Cargando detalles', description: `Cargando ${studentId}...` });
    setSelectedStudent({ courseId, studentId });
    setShowStudentDialog(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setUserId(session.user.id);

      // Verificar rol de profesor
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
      const isProfessor = (roles || []).some((r: any) => r.role === 'professor');
      if (!isProfessor) {
        navigate('/unauthorized');
        return;
      }

      // Cargar cursos MOOC creados por el profesor
      const { data: myCourses } = await supabase
        .from('mooc_courses')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false });

      const coursesWithEnrollments = await Promise.all((myCourses || []).map(async (c: any) => {
        const { data: enrollments } = await supabase
          .from('mooc_enrollments')
          .select('*')
          .eq('course_id', c.id)
          .order('enrolled_at', { ascending: true });

        const userIds = (enrollments || []).map((e: any) => e.user_id);
        let profilesMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, city, department')
            .in('id', userIds);
          profilesMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
        }

        const enriched = (enrollments || []).map((en: any) => {
          const p = profilesMap[en.user_id];
          return {
            ...en,
            profile: p ? p : { id: en.user_id, full_name: en.user_id, email: '', city: '', department: '' }
          };
        });

        return { ...c, enrollments: enriched };
      }));

      setCourses(coursesWithEnrollments || []);
    } catch (error: any) {
      console.error('Error cargando estudiantes:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los estudiantes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis Estudiantes</h1>
            <p className="text-muted-foreground mt-1">Gestiona y revisa el progreso de tus estudiantes</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{courses.length}</div>
            <div className="text-xs text-muted-foreground">Cursos activos</div>
          </div>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No hay cursos MOOC</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Crea un curso MOOC para empezar a ver estudiantes matriculados.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {course.enrollments?.length || 0} estudiante{(course.enrollments?.length || 0) !== 1 ? 's' : ''}
                        </span>
                        <span>•</span>
                        <span>{course.completed_count || 0} completado{(course.completed_count || 0) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {course.enrollments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay estudiantes inscritos en este curso.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {course.enrollments.map((en: Enrollment & { profile: any }) => (
                        <div 
                          key={en.id} 
                          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback className="text-sm">
                                {(en.profile?.full_name || en.user_id || "U")
                                  .split(" ")
                                  .map((s: string) => s[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {en.profile?.full_name || en.user_id}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {en.profile?.email || 'Sin correo'}
                                </div>
                              </div>
                              
                              <div className="min-w-0 text-xs text-muted-foreground">
                                {en.profile?.city && (
                                  <div className="truncate">{en.profile.city}</div>
                                )}
                                {en.profile?.department && (
                                  <div className="truncate">{en.profile.department}</div>
                                )}
                                {!en.profile?.city && !en.profile?.department && (
                                  <div className="text-muted-foreground/50">Sin ubicación</div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                                      <div 
                                        className="bg-primary h-full transition-all"
                                        style={{ width: `${en.progress || 0}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                      {en.progress || 0}%
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {en.completed ? '✓ Completado' : 'En curso'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4 shrink-0">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="outline"
                              onClick={() => openStudentDetail(course.id, en.user_id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver detalle
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedStudent && (
          <ProfessorStudentDetailDialog
            courseId={selectedStudent.courseId}
            studentId={selectedStudent.studentId}
            open={showStudentDialog}
            onOpenChange={(open) => { 
              if (!open) setSelectedStudent(null); 
              setShowStudentDialog(open); 
            }}
          />
        )}
      </div>
    </div>
  );
}
