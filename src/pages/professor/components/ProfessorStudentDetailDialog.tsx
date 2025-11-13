import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User, CheckCircle2, XCircle, Award, BookOpen, Target } from 'lucide-react';

interface Props {
  courseId: string;
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfessorStudentDetailDialog: React.FC<Props> = ({ courseId, studentId, open, onOpenChange }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any | null>(null);
  const [enrollment, setEnrollment] = useState<any | null>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [examSummaries, setExamSummaries] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    if (open) {
      console.log('ProfessorStudentDetailDialog opening', { courseId, studentId });
      load();
    }
  }, [open]);

  const load = async () => {
    if (!courseId || !studentId) return;
    setLoading(true);
    try {
      const { data: prof } = await supabase.from('profiles').select('id, full_name, email, city, department').eq('id', studentId).single();
      setProfile(prof || null);

      const { data: enr } = await supabase.from('mooc_enrollments').select('progress, completed, enrolled_at').eq('course_id', courseId).eq('user_id', studentId).maybeSingle();
      setEnrollment(enr || null);

      // load lessons and student's lesson progress
      const { data: lessonsData } = await supabase.from('mooc_lessons').select('id, title, order_index').eq('course_id', courseId).order('order_index');
      const lessonIds = (lessonsData || []).map((l:any)=>l.id);
      
      // Verificar progreso de lecciones (mooc_lesson_progress)
      const { data: progressData } = await supabase
        .from('mooc_lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', studentId)
        .in('lesson_id', lessonIds || []);
      
      const progressMap = new Map((progressData||[]).map((p:any)=>[p.lesson_id, p.completed]));
      
      // También verificar si hay lecturas completadas (student_reading_progress)
      const { data: readingsData } = await supabase
        .from('mooc_readings')
        .select('id, lesson_id')
        .in('lesson_id', lessonIds || []);
      
      const readingsByLesson = new Map<string, string[]>();
      (readingsData || []).forEach((r: any) => {
        const arr = readingsByLesson.get(r.lesson_id) || [];
        arr.push(r.id);
        readingsByLesson.set(r.lesson_id, arr);
      });
      
      const readingIds = (readingsData || []).map((r: any) => r.id);
      const { data: readingProgressData } = readingIds.length > 0 
        ? await supabase
            .from('student_reading_progress')
            .select('reading_id, completed')
            .eq('user_id', studentId)
            .in('reading_id', readingIds)
        : { data: [] };
      
      const completedReadingsSet = new Set(
        (readingProgressData || [])
          .filter((rp: any) => rp.completed)
          .map((rp: any) => rp.reading_id)
      );
      
      // Combinar información: una lección está completa si tiene progreso marcado O todas sus lecturas están completas
      let lessonsWithProgress = (lessonsData||[]).map((l:any)=> {
        const hasProgressCompleted = progressMap.get(l.id) === true;
        const lessonReadings = readingsByLesson.get(l.id) || [];
        const allReadingsCompleted = lessonReadings.length > 0 && lessonReadings.every(rId => completedReadingsSet.has(rId));
        return {
          ...l, 
          completed: hasProgressCompleted || allReadingsCompleted
        };
      });

      // Si el progreso general es mayor a 0 pero no hay lecciones completadas, marcar N lecciones como completadas según el porcentaje
      const completedCount = lessonsWithProgress.filter(l => l.completed).length;
      if ((enr?.progress ?? 0) > 0 && completedCount === 0 && lessonsWithProgress.length > 0) {
        const percent = Math.max(0, Math.min(100, enr.progress));
        const nToComplete = Math.floor((percent / 100) * lessonsWithProgress.length);
        lessonsWithProgress = lessonsWithProgress.map((l, idx) => ({
          ...l,
          completed: idx < nToComplete
        }));
      }
      setLessons(lessonsWithProgress || []);

      // load exams for course and latest attempt per exam for this student
      const { data: exams } = await supabase.from('mooc_exams').select('id,title,lesson_id').eq('course_id', courseId).eq('status','published');
      const examIds = (exams||[]).map((e:any)=>e.id);
      let summaries = new Map<string, any>();
      if (examIds.length>0) {
        const { data: attempts } = await supabase.from('mooc_exam_attempts').select('exam_id, score_numeric, score_percent, passed, created_at').eq('user_id', studentId).in('exam_id', examIds).order('created_at', { ascending: false });
        // group best per exam (most recent or best percent)
        const map = new Map<string, any[]>();
        (attempts||[]).forEach((a:any)=>{
          const arr = map.get(a.exam_id) || [];
          arr.push(a);
          map.set(a.exam_id, arr);
        });
        (exams||[]).forEach((ex:any)=>{
          const arr = map.get(ex.id) || [];
          const best = arr.sort((a:any,b:any)=> (b.score_percent||0)-(a.score_percent||0))[0] || null;
          summaries.set(ex.id, { exam: ex, best });
        });
      }
      setExamSummaries(summaries);
    } catch (err) {
      console.error('Error loading professor student detail', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalle del Estudiante</DialogTitle>
          <DialogDescription>Información de progreso y calificaciones</DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Perfil del estudiante */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary"/> 
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Nombre Completo</div>
                    <div className="text-sm font-semibold">{profile?.full_name || profile?.id}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Correo Electrónico</div>
                    <div className="text-sm">{profile?.email || 'No disponible'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Ciudad</div>
                    <div className="text-sm">{profile?.city || 'No especificada'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-medium">Departamento</div>
                    <div className="text-sm">{profile?.department || 'No especificado'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progreso General */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-primary"/> 
                  Progreso General del Curso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progreso Total</span>
                      <span className="text-lg font-bold text-primary">{enrollment?.progress ?? 0}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all rounded-full"
                        style={{ width: `${enrollment?.progress ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Estado</div>
                      <Badge variant={enrollment?.completed ? "default" : "secondary"} className="text-xs">
                        {enrollment?.completed ? '✓ Completado' : 'En Curso'}
                      </Badge>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Fecha de Inscripción</div>
                      <div className="text-xs font-medium">
                        {enrollment?.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 'No disponible'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Módulos/Lecciones */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="h-5 w-5 text-primary"/> 
                    Módulos y Lecciones
                  </CardTitle>
                  <Badge variant="outline">
                    {lessons.filter(l => l.completed).length} / {lessons.length} completadas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {lessons.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay lecciones disponibles
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {lessons.map((l, idx) => (
                      <div 
                        key={l.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                          l.completed 
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                            : 'bg-muted/30 border-muted'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                            l.completed ? 'bg-green-500' : 'bg-muted'
                          }`}>
                            {l.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            ) : (
                              <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {l.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Lección {l.order_index}
                            </div>
                          </div>
                        </div>
                        <div className="ml-2 shrink-0">
                          {l.completed ? (
                            <Badge variant="default" className="bg-green-600">
                              Completada
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Pendiente
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Exámenes y Calificaciones */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5 text-primary"/> 
                    Exámenes y Calificaciones
                  </CardTitle>
                  <Badge variant="outline">
                    {Array.from(examSummaries.values()).filter(s => s.best?.passed).length} / {examSummaries.size} aprobados
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {Array.from(examSummaries.values()).length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    No hay exámenes en este curso
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {Array.from(examSummaries.values()).map((s: any) => {
                      const hasAttempt = s.best !== null;
                      const passed = s.best?.passed;
                      const scorePercent = s.best?.score_percent ?? 0;
                      const scoreNumeric = s.best?.score_numeric ?? 0;
                      
                      return (
                        <div 
                          key={s.exam.id} 
                          className={`p-4 rounded-lg border-2 ${
                            !hasAttempt 
                              ? 'bg-muted/30 border-muted' 
                              : passed 
                                ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                                : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm mb-1 truncate">
                                  {s.exam.title}
                                </div>
                                {!hasAttempt ? (
                                  <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      No ha presentado este examen
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">Nota:</span>
                                        <span className="font-bold text-lg">
                                          {scoreNumeric.toFixed(1)}
                                        </span>
                                      </div>
                                      <div className="text-xs text-muted-foreground">•</div>
                                      <div className="flex items-center gap-1">
                                        <span className="font-semibold">
                                          {scorePercent.toFixed(0)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="shrink-0">
                                {!hasAttempt ? (
                                  <Badge variant="outline" className="bg-background">
                                    Sin intentos
                                  </Badge>
                                ) : passed ? (
                                  <Badge className="bg-green-600">
                                    ✓ Aprobado
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    No aprobado
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            {hasAttempt && (
                              <div>
                                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${
                                      passed ? 'bg-green-600' : 'bg-red-600'
                                    }`}
                                    style={{ width: `${scorePercent}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfessorStudentDetailDialog;
