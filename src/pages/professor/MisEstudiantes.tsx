import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, User, Eye, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const { toast } = useToast();
  const navigate = useNavigate();

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
            .select('id, full_name, email')
            .in('id', userIds);
          profilesMap = (profiles || []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});
        }

        const enriched = (enrollments || []).map((en: any) => ({
          ...en,
          profile: profilesMap[en.user_id] || { id: en.user_id, full_name: en.user_id, email: '' }
        }));

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
      <div className="container mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Mis Estudiantes</h2>
            <div className="text-sm text-muted-foreground">Estudiantes matriculados en tus cursos MOOC</div>
          </div>
        </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <h3 className="text-lg font-medium">No hay cursos MOOC</h3>
            <p className="text-sm text-muted-foreground">Crea un curso MOOC para empezar a ver estudiantes matriculados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id} className="p-0 overflow-hidden">
              <div className="border-b px-4 py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm line-clamp-1">{course.title}</div>
                  <div className="text-xs text-muted-foreground">Inscritos: {course.enrollments?.length || 0}</div>
                </div>
                <div className="text-xs text-muted-foreground">{course.completed_count || 0} completados</div>
              </div>
              <CardContent className="p-2">
                {course.enrollments.length === 0 ? (
                  <div className="text-sm text-muted-foreground px-2 py-3">No hay estudiantes inscritos aún.</div>
                ) : (
                  <div className="space-y-2">
                    {course.enrollments.map((en: Enrollment & { profile: any }) => (
                      <div key={en.id} className="flex items-center justify-between rounded p-2 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{(en.profile?.full_name || en.user_id || "U").split(" ").map((s: string)=> s[0]).slice(0,2).join("")}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{en.profile?.full_name || en.user_id}</div>
                            <div className="text-xs text-muted-foreground truncate">{en.profile?.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground text-right mr-2">{en.progress || 0}% • {en.completed ? 'OK' : 'En curso'}</div>
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/professor/course/${course.id}/student/${en.user_id}`)} aria-label="Ver">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/professor/course/${course.id}`)} aria-label="Evaluar">
                            <CheckSquare className="h-4 w-4" />
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
      </div>
    </div>
  );
}
