import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Question = {
  id: string;
  prompt: string;
  order_index: number;
  mooc_exam_options: Array<{ id: string; text: string; order_index: number | null; is_correct: boolean }>;
};

type Exam = {
  id: string;
  title: string;
  description: string | null;
  passing_score: number;
  max_score: number;
  time_limit_minutes: number;
  attempts_allowed: number;
  status: string;
};

export default function StudentExamPage() {
  const { courseId, examId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [invalidated, setInvalidated] = useState(false);
  const [showInvalidationDialog, setShowInvalidationDialog] = useState(false);
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only load exam after user accepts terms
    if (examId && courseId && acceptedTerms) {
      loadExam();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId, courseId, acceptedTerms]);

  // Anti-cheating detection
  useEffect(() => {
    if (!attemptId || invalidated) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCheatingDetected('visibilitychange: pestaña no visible');
      }
    };

    const handleBlur = () => {
      handleCheatingDetected('blur: ventana perdió foco');
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleCheatingDetected('copy: intento de copiar contenido');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleCheatingDetected('contextmenu: clic derecho detectado');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [attemptId, invalidated]);

  const handleCheatingDetected = async (reason: string) => {
    if (invalidated || !attemptId) return;
    setInvalidated(true);
    setShowInvalidationDialog(true);

    try {
      // Invalidate attempt by updating submitted and passed fields
      await supabase
        .from('mooc_exam_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          passed: false,
          score_numeric: 0,
          score_percent: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId);

      // Optionally log the cheating reason (you could create a separate table or use a JSON field)
      console.warn(`Cheating detected for attempt ${attemptId}: ${reason}`);

      toast({
        title: 'Intento anulado',
        description: `El sistema detectó: ${reason}. El examen ha sido invalidado.`,
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Error invalidating attempt:', error);
    }
  };

  const loadExam = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // First, check if user is enrolled in the course
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('mooc_enrollments')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (enrollmentError) {
        console.error('Error checking enrollment:', enrollmentError);
      }

      if (!enrollmentData) {
        toast({
          title: 'No inscrito',
          description: 'Debes estar inscrito en el curso para tomar el examen.',
          variant: 'destructive',
        });
        navigate(`/mooc/${courseId}`);
        return;
      }

      // Load exam details
      const { data: examData, error: examError } = await supabase
        .from('mooc_exams')
        .select('id, title, description, passing_score, max_score, time_limit_minutes, attempts_allowed, status')
        .eq('id', examId)
        .single();

      if (examError) {
        console.error('Error loading exam details:', examError);
        throw examError;
      }

      if (examData.status !== 'published') {
        toast({
          title: 'Examen no disponible',
          description: 'Este examen aún no está publicado.',
          variant: 'destructive',
        });
        navigate(`/courses/${courseId}/learn`);
        return;
      }

      setExam(examData);

      // Load questions with options
      const { data: questionsData, error: questionsError } = await supabase
        .from('mooc_exam_questions')
        .select('id, prompt, order_index, mooc_exam_options(*)')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (questionsError) {
        console.error('Error loading questions:', questionsError);
        throw questionsError;
      }
      setQuestions(
        questionsData.map((q: any) => ({
          ...q,
          mooc_exam_options: (q.mooc_exam_options || []).sort(
            (a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0)
          ),
        }))
      );

      // Check existing attempts
      const { data: attemptsData } = await supabase
        .from('mooc_exam_attempts')
        .select('id, attempt_number, passed')
        .eq('exam_id', examId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const existingAttempts = attemptsData || [];
      const passedAttempt = existingAttempts.find((a: any) => a.passed);

      if (passedAttempt) {
        toast({
          title: 'Examen ya aprobado',
          description: 'Ya has aprobado este examen.',
        });
        navigate(`/courses/${courseId}/learn`);
        return;
      }

      if (examData.attempts_allowed && existingAttempts.length >= examData.attempts_allowed) {
        toast({
          title: 'Intentos agotados',
          description: 'Has usado todos tus intentos para este examen.',
          variant: 'destructive',
        });
        navigate(`/courses/${courseId}/learn`);
        return;
      }

      // Create new attempt
      const attemptNumber = existingAttempts.length + 1;
      const { data: newAttempt, error: attemptError } = await supabase
        .from('mooc_exam_attempts')
        .insert([
          {
            exam_id: examId,
            user_id: user.id,
            attempt_number: attemptNumber,
            started_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (attemptError) {
        console.error('Error creating attempt:', attemptError);
        throw attemptError;
      }
      setAttemptId(newAttempt.id);

      // Start timer if time limit exists
      if (examData.time_limit_minutes > 0) {
        const totalSeconds = examData.time_limit_minutes * 60;
        setTimeLeft(totalSeconds);
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev === null || prev <= 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              handleSubmit(true); // Auto-submit on timeout
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      console.error('Error loading exam:', error);
      const errorMessage = error?.message || error?.hint || 'No se pudo cargar el examen';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      // Don't navigate away, stay on page to see the error
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!attemptId || invalidated) return;

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Save answers
      const answerRows = Object.entries(answers).map(([questionId, optionId]) => ({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: optionId,
        selected_option_ids: [optionId],
      }));

      if (answerRows.length > 0) {
        const { error: answersError } = await supabase.from('mooc_exam_answers').insert(answerRows);
        if (answersError) throw answersError;
      }

      // Mark attempt as submitted
      const { error: updateError } = await supabase
        .from('mooc_exam_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', attemptId);

      if (updateError) throw updateError;

      // Compute score using RPC
      await supabase.rpc('compute_exam_score', { p_attempt_id: attemptId });

      toast({
        title: autoSubmit ? 'Tiempo agotado' : 'Examen enviado',
        description: autoSubmit
          ? 'El examen se envió automáticamente al agotar el tiempo.'
          : 'Tu examen ha sido enviado y calificado.',
      });

      navigate(`/courses/${courseId}/learn`);
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el examen',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;

  const handleAcceptTerms = () => {
    setAcceptedTerms(true);
    setShowDisclaimerDialog(false);
  };

  const handleDeclineTerms = () => {
    navigate(`/courses/${courseId}/learn`);
  };

  if (!acceptedTerms) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-3xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              Condiciones del Examen y Sistema Antiplagio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <p className="text-base font-semibold text-foreground">
                Antes de iniciar el examen, debes leer y aceptar las siguientes condiciones:
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-3 mt-4">
                <h3 className="text-lg font-semibold text-foreground m-0">Sistema de Detección Antiplagio</h3>
                
                <p className="text-sm text-muted-foreground m-0">
                  Este examen cuenta con un sistema automático de detección de comportamientos irregulares. 
                  El sistema monitoreará tu actividad durante el examen y <strong>anulará automáticamente</strong> tu 
                  intento si detecta alguna de las siguientes acciones:
                </p>

                <ul className="text-sm space-y-2 ml-4 text-foreground">
                  <li>
                    <strong>Cambio de pestaña o ventana:</strong> Si sales de la ventana del examen o cambias a otra pestaña 
                    del navegador.
                  </li>
                  <li>
                    <strong>Pérdida de foco:</strong> Si la ventana del examen pierde el foco o minimizas el navegador.
                  </li>
                  <li>
                    <strong>Intento de copiar contenido:</strong> Si intentas copiar el texto de las preguntas 
                    (Ctrl+C o clic derecho).
                  </li>
                  <li>
                    <strong>Menú contextual:</strong> Si intentas acceder al menú del clic derecho sobre las preguntas.
                  </li>
                </ul>

                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3 mt-3">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 m-0 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Importante
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 mt-2 m-0">
                    Si el sistema detecta cualquiera de estas acciones, tu intento será <strong>anulado inmediatamente</strong> 
                    y marcado como no aprobado. No podrás continuar con el examen y se contará como un intento utilizado.
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
                <h3 className="text-lg font-semibold text-foreground m-0">Recomendaciones</h3>
                <ul className="text-sm space-y-1 ml-4 text-muted-foreground">
                  <li>Asegúrate de estar en un lugar tranquilo y sin distracciones.</li>
                  <li>Cierra todas las demás pestañas y aplicaciones del navegador.</li>
                  <li>No minimices la ventana ni cambies de aplicación.</li>
                  <li>Desactiva notificaciones que puedan interrumpir tu concentración.</li>
                  <li>Lee cuidadosamente cada pregunta antes de responder.</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3 mt-4">
                <p className="text-sm text-blue-900 dark:text-blue-100 m-0">
                  <strong>Integridad Académica:</strong> Al aceptar estas condiciones, te comprometes a realizar el examen 
                  de manera individual, sin ayuda externa, y cumpliendo con las normas de integridad académica de la institución.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-4 border-t">
              <input
                type="checkbox"
                id="accept-terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="accept-terms" className="text-sm text-foreground cursor-pointer">
                He leído y acepto las condiciones del examen. Entiendo que el sistema detectará automáticamente 
                cualquier intento de plagio y anulará mi examen si es necesario. Me comprometo a mantener la 
                integridad académica durante todo el proceso.
              </label>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={handleDeclineTerms}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAcceptTerms}
                disabled={!acceptedTerms}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Aceptar e Iniciar Examen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Examen no encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{exam.title}</CardTitle>
                {exam.description && <p className="text-muted-foreground mt-2">{exam.description}</p>}
              </div>
              {timeLeft !== null && (
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Clock className="h-5 w-5" />
                  <span className={timeLeft < 60 ? 'text-red-600' : ''}>{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Puntaje máximo: {exam.max_score}</span>
                <span>Puntaje para aprobar: {exam.passing_score}</span>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Progreso</Label>
                <Progress value={progressPercent} className="h-2 mt-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Object.keys(answers).length} de {questions.length} preguntas respondidas
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Questions */}
        {questions.map((question, idx) => (
          <Card key={question.id}>
            <CardHeader>
            <CardTitle className="text-lg">
              Pregunta {idx + 1}
            </CardTitle>
              <p className="text-base">{question.prompt}</p>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => handleAnswerChange(question.id, value)}
              >
                {question.mooc_exam_options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 p-3 border rounded hover:bg-muted">
                    <RadioGroupItem value={option.id} id={option.id} />
                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        {/* Submit */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Asegúrate de haber respondido todas las preguntas antes de enviar.
                </p>
              </div>
              <Button onClick={() => handleSubmit(false)} disabled={submitting || invalidated} size="lg">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Enviar examen
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invalidation Dialog */}
      <AlertDialog open={showInvalidationDialog} onOpenChange={setShowInvalidationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Examen anulado
            </AlertDialogTitle>
            <AlertDialogDescription>
              El sistema detectó que cambiaste de pestaña o intentaste copiar contenido. Por seguridad académica, el
              examen ha sido invalidado y marcado como no aprobado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => navigate(`/courses/${courseId}/learn`)}>Volver al curso</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
