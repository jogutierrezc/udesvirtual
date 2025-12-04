
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, User, Trophy, CheckCircle2, XCircle, CalendarClock, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  city?: string | null;
  department?: string | null;
  document_type?: string | null;
  document_number?: string | null;
}

interface Enrollment {
  progress?: number | null;
  completed?: boolean | null;
  enrolled_at?: string | null;
  course_title?: string | null;
}

interface AttemptRow {
  id: string;
  attempt_number: number;
  passed: boolean | null;
  score_percent: number | null;
  score_numeric: number | null;
  started_at: string | null;
  submitted_at: string | null;
  is_annulled?: boolean | null;
  annulment_reason?: string | null;
  mooc_exams?: { id: string; title: string; course_id?: string } | null;
}

export default function StudentDetail() {
  const { courseId, studentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, studentId]);

  const load = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/auth'); return; }

      // verify professor role
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
      const isProfessor = (roles || []).some((r: any) => r.role === 'professor' || r.role === 'admin');
      if (!isProfessor) { navigate('/unauthorized'); return; }

      // profile
      const { data: prof, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, email, city, department, document_type, document_number')
        .eq('id', studentId)
        .single();
      if (pErr) throw pErr;
      setProfile(prof);

      // enrollment with course title
      const { data: enr, error: eErr } = await supabase
        .from('mooc_enrollments')
        .select('progress, completed, enrolled_at, mooc_courses(title)')
        .eq('course_id', courseId)
        .eq('user_id', studentId)
        .maybeSingle();
      if (eErr) console.warn('enrollment read warning:', eErr);
      setEnrollment(enr || null);

      // attempts joined with exams limited to this course
      const { data: attemptsData, error: aErr } = await supabase
        .from('mooc_exam_attempts')
        .select('id, attempt_number, passed, score_percent, score_numeric, started_at, submitted_at, is_annulled, annulment_reason, mooc_exams(id,title,course_id)')
        .eq('user_id', studentId)
        .eq('mooc_exams.course_id', courseId)
        .order('started_at', { ascending: false });
      if (aErr) throw aErr;
      setAttempts(attemptsData || []);

    } catch (err: any) {
      console.error('Error loading student detail:', err);
      toast({ title: 'Error', description: err?.message || 'No se pudo cargar el estudiante', variant: 'destructive' });
      navigate('/professor/mis-estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const groupedByExam = useMemo(() => {
    const map = new Map<string, { examId: string; examTitle: string; attempts: AttemptRow[]; bestPercent: number | null; passed: boolean }>();
    for (const a of attempts) {
      if (!a.mooc_exams) continue;
      const key = a.mooc_exams.id;
      const title = a.mooc_exams.title;
      if (!map.has(key)) map.set(key, { examId: key, examTitle: title, attempts: [], bestPercent: null, passed: false });
      const item = map.get(key)!;
      item.attempts.push(a);
      const pct = a.score_percent ?? 0;
      item.bestPercent = item.bestPercent === null ? pct : Math.max(item.bestPercent, pct);
      item.passed = item.passed || !!a.passed;
    }
    return Array.from(map.values()).sort((a, b) => a.examTitle.localeCompare(b.examTitle));
  }, [attempts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">No se encontró el perfil del estudiante.</CardContent>
        </Card>
      </div>
    );
  }

  const handlePrintReport = async () => {
    try {
      const response = await fetch('/reporte_estudiante_template.html');
      let html = await response.text();

      // Fetch exam details to get max_score for conversion
      const examIds = [...new Set(attempts.map(a => a.mooc_exams?.id).filter(Boolean))];
      const { data: examDetails } = await supabase
        .from('mooc_exams')
        .select('id, max_score')
        .in('id', examIds);

      const examScoreMap = new Map(examDetails?.map(e => [e.id, e.max_score || 100]) || []);

      // Prepare data for the report
      const reportData = {
        encabezado: {
          tituloReporte: "Reporte de Detalles del Estudiante",
          fechaGeneracion: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
        },
        datosEstudiante: {
          nombreCompleto: profile?.full_name || "N/A",
          tipoDocumento: profile?.document_type || "N/A",
          numeroDocumento: profile?.document_number || "N/A",
          correoElectronico: profile?.email || "N/A",
          ciudad: profile?.city || "N/A",
          departamento: profile?.department || "N/A"
        },
        datosCurso: {
          tituloCurso: (enrollment as any)?.mooc_courses?.title || "Curso MOOC",
          progresoCurso: `${enrollment?.progress || 0}%`,
          fechaInscripcion: enrollment?.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleString('es-CO') : "N/A",
          leccionesVistas: "N/A",
          examenesCompletados: attempts.filter(a => a.passed).length
        },
        resumenExamenes: groupedByExam.map(g => {
          const examId = g.examId;
          const maxScore = examScoreMap.get(examId) || 100;
          const notaScale5 = ((g.bestPercent || 0) / 100) * 5;
          return {
            tituloExamen: g.examTitle,
            notaMejorIntento: notaScale5.toFixed(1),
            numeroIntentos: g.attempts.length,
            estadoExamen: g.passed ? "Aprobado" : "Reprobado"
          };
        }),
        intentosDetallados: attempts.map(a => {
          const examId = a.mooc_exams?.id;
          const maxScore = examId ? examScoreMap.get(examId) || 100 : 100;
          const notaScale5 = ((a.score_percent || 0) / 100) * 5;

          return {
            tituloExamen: a.mooc_exams?.title || "Examen",
            numeroIntento: a.attempt_number,
            notaObtenida: notaScale5.toFixed(1),
            estadoIntento: a.passed ? "Aprobado" : "Reprobado",
            horaInicio: a.started_at || null,
            horaInicioDisplay: a.started_at ? new Date(a.started_at).toLocaleString('es-CO') : "N/A",
            horaEnvio: a.submitted_at || null,
            horaEnvioDisplay: a.submitted_at ? new Date(a.submitted_at).toLocaleString('es-CO') : "N/A",
            hizoPlagio: !!a.is_annulled,
            motivoPlagio: a.annulment_reason
          };
        })
      };

      // Inject data into the template
      const dataScript = `
        const mockReporte = ${JSON.stringify(reportData)};
      `;

      html = html.replace(/const mockReporte = \{[\s\S]*?\};/, dataScript);

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" />Volver</Button>
          <Button onClick={handlePrintReport} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="h-4 w-4 mr-2" /> Imprimir Reporte
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Estudiante</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Nombre</div>
              <div className="font-medium">{profile.full_name || profile.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Correo</div>
              <div className="font-medium">{profile.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Ciudad</div>
              <div className="font-medium">{profile.city || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Departamento</div>
              <div className="font-medium">{profile.department || '-'}</div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" /> Progreso en el curso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Inscrito</div>
              <div className="font-medium mb-3">{enrollment?.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleString() : '—'}</div>
              <div className="text-sm text-muted-foreground">Progreso</div>
              <div className="font-medium">{enrollment?.progress ?? 0}% {enrollment?.completed ? '• Completado' : ''}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" /> Resumen de exámenes</CardTitle>
            </CardHeader>
            <CardContent>
              {groupedByExam.length === 0 ? (
                <div className="text-sm text-muted-foreground">Sin intentos de exámenes aún.</div>
              ) : (
                <div className="space-y-2">
                  {groupedByExam.map((g) => (
                    <div key={g.examId} className="flex items-center justify-between rounded border p-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{g.examTitle}</div>
                        <div className="text-xs text-muted-foreground">Mejor intento: {g.bestPercent ?? 0}%</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {g.passed ? (
                          <span className="inline-flex items-center text-green-600 text-sm"><CheckCircle2 className="h-4 w-4 mr-1" />Aprobado</span>
                        ) : (
                          <span className="inline-flex items-center text-red-600 text-sm"><XCircle className="h-4 w-4 mr-1" />No aprobado</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Intentos de exámenes</CardTitle>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay intentos registrados.</div>
            ) : (
              <div className="space-y-2">
                {attempts.map((a) => (
                  <div key={a.id} className={`grid gap - 2 md: grid - cols - 5 items - center border rounded p - 2 ${a.is_annulled ? 'bg-red-50 border-red-200' : ''} `}>
                    <div className="font-medium md:col-span-2">
                      {a.mooc_exams?.title || 'Examen'}
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">Intento #{a.attempt_number}</div>
                        {a.is_annulled && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            ANULADO
                          </span>
                        )}
                      </div>
                      {a.is_annulled && a.annulment_reason && (
                        <div className="text-xs text-red-600 mt-1 font-medium">
                          Motivo: {a.annulment_reason}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{a.score_percent ?? 0}%</div>
                      <div className="text-xs text-muted-foreground">
                        {a.is_annulled ? 'Anulado' : (a.passed ? 'Aprobado' : 'No aprobado')}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Inicio</div>
                      <div className="text-sm">{a.started_at ? new Date(a.started_at).toLocaleString() : '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Envío</div>
                      <div className="text-sm">{a.submitted_at ? new Date(a.submitted_at).toLocaleString() : '—'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
