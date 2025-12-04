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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { XCircle } from 'lucide-react';

type Question = {
  id: string;
  prompt: string;
  order_index: number;
  type: string;
  points: number;
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
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<null | { score_numeric: number; score_percent: number; passed: boolean }>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [invalidated, setInvalidated] = useState(false);
  const [showInvalidationDialog, setShowInvalidationDialog] = useState(false);
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // New state for modernized UI
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [attemptedFinishWithIncomplete, setAttemptedFinishWithIncomplete] = useState(false);

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
      const { error: updateError } = await supabase
        .from('mooc_exam_attempts')
        .update({
          submitted_at: new Date().toISOString(),
          passed: false,
          score_numeric: 0,
          score_percent: 0,
          updated_at: new Date().toISOString(),
          is_annulled: true,
          annulment_reason: reason
        } as any) // Cast to any to avoid TS error until types are regenerated
        .eq('id', attemptId);

      if (updateError) {
        console.error('Error updating attempt with annulment:', updateError);
        throw updateError;
      }

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
        .select('id, prompt, order_index, type, points, mooc_exam_options(*)')
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
      // answers is now Record<string, string[]> (questionId -> array of optionIds)
      const answerRows = Object.entries(answers).map(([questionId, optionIds]) => {
        // For backward compatibility or single choice, we might want to set selected_option_id
        // But the new schema/logic should rely on selected_option_ids array
        const selectedIds = Array.isArray(optionIds) ? optionIds : [optionIds];
        return {
          attempt_id: attemptId,
          question_id: questionId,
          selected_option_id: selectedIds.length === 1 ? selectedIds[0] : null, // Optional: for legacy support
          selected_option_ids: selectedIds,
        };
      });

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

      // Fetch computed score for the attempt and show only the score to the student
      try {
        const { data: attemptData, error: attemptFetchError } = await supabase
          .from('mooc_exam_attempts')
          .select('score_numeric, score_percent, passed')
          .eq('id', attemptId)
          .single();

        if (!attemptFetchError && attemptData) {
          setAttemptResult({
            score_numeric: attemptData.score_numeric ?? 0,
            score_percent: attemptData.score_percent ?? 0,
            passed: !!attemptData.passed,
          });
        } else {
          console.warn('No se pudo obtener el resultado del intento', attemptFetchError);
        }
      } catch (err) {
        console.error('Error fetching attempt result:', err);
      }
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

  const handleAnswerChange = (questionId: string, optionId: string, isMultiple: boolean) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] ? (Array.isArray(prev[questionId]) ? prev[questionId] : [prev[questionId]]) : [];

      if (isMultiple) {
        // Toggle selection
        if (currentAnswers.includes(optionId)) {
          return { ...prev, [questionId]: currentAnswers.filter(id => id !== optionId) };
        } else {
          return { ...prev, [questionId]: [...currentAnswers, optionId] };
        }
      } else {
        // Single selection
        return { ...prev, [questionId]: [optionId] };
      }
    });

    // Auto-advance with delay ONLY for single choice
    if (!isMultiple) {
      setTimeout(() => {
        if (!showSummary && !attemptResult && currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        }
      }, 500);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0;

  const handleAcceptTerms = () => {
    if (!termsChecked) return;
    setAcceptedTerms(true);
    setShowDisclaimerDialog(false);
  };

  const handleDeclineTerms = () => {
    navigate(`/courses/${courseId}/learn`);
  };

  // Navigation functions
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setShowSummary(false);
    setAttemptedFinishWithIncomplete(false);
  };

  const handleNextOrFinish = () => {
    if (currentQuestionIndex === questions.length - 1) {
      setAttemptedFinishWithIncomplete(false);
      setShowSummary(true);
    } else {
      nextQuestion();
    }
  };

  const isQuestionAnswered = (questionId: string) => {
    const ans = answers[questionId];
    return ans && ans.length > 0;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(k => answers[k] && answers[k].length > 0).length;
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
                checked={termsChecked}
                onChange={(e) => setTermsChecked(e.target.checked)}
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
                disabled={!termsChecked}
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-700 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="w-full max-w-5xl mx-auto p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 z-10 relative">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{exam.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                Aprobar: {exam.passing_score} pts
              </span>
              <span className="text-xs text-slate-400">|</span>
              <p className="text-xs text-slate-500 font-medium">Examen</p>
            </div>
          </div>
        </div>

        {/* Timer Animado */}
        {timeLeft !== null && (
          <div
            className={`flex items-center gap-3 px-5 py-2 rounded-full border shadow-sm transition-all duration-300 ${timeLeft < 60 ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white border-slate-200'
              }`}
          >
            <div className="relative flex items-center justify-center">
              <svg className={`w-5 h-5 ${timeLeft < 60 ? 'text-red-500' : 'text-emerald-500'} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <span
              className={`text-lg font-mono font-bold tabular-nums ${timeLeft < 60 ? 'text-red-600' : 'text-slate-700'}`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
      </header>

      {/* Main Stage */}
      <main className="flex-1 flex flex-col items-center w-full max-w-3xl mx-auto px-4 sm:px-6 relative py-4">

        {/* Result View (if finished) */}
        {attemptResult ? (
          <div className="text-center animate-in fade-in zoom-in duration-500 flex flex-col items-center justify-center py-10 w-full">

            {/* Ícono de Resultado */}
            <div className="relative w-28 h-28 mb-6">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${attemptResult.passed ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <div className={`relative w-full h-full rounded-full flex items-center justify-center border-4 bg-white ${attemptResult.passed ? 'border-emerald-100 text-emerald-600' : 'border-red-100 text-red-500'
                }`}>
                {/* Nota Grande */}
                <div className="flex flex-col items-center leading-none">
                  <span className="text-4xl font-black">{attemptResult.score_numeric}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Nota Final</span>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              {attemptResult.passed ? '¡Felicidades, Aprobaste!' : 'Examen Finalizado'}
            </h2>

            <p className="text-slate-500 max-w-md mx-auto mb-8 px-4">
              {attemptResult.passed
                ? 'Has demostrado un excelente dominio del tema. Tu calificación ha sido registrada.'
                : 'Has completado el examen, pero no alcanzaste el puntaje mínimo. Te recomendamos repasar los temas.'}
            </p>

            {/* Tarjeta de Desglose */}
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm mb-8 w-full max-w-xs mx-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                  <span className="text-slate-500 text-sm">Estado</span>
                  <span className={`font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide ${attemptResult.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {attemptResult.passed ? 'Aprobado' : 'No Aprobado'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Mínimo requerido</span>
                  <span className="font-bold text-slate-700">{exam.passing_score} / {exam.max_score}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => setShowResultDialog(true)} variant="outline">Ver Detalles</Button>
              <Button onClick={() => navigate(`/courses/${courseId}/learn`)} className="bg-emerald-600 hover:bg-emerald-700">Volver al Curso</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Navegación de Preguntas (Paginación Interactiva) */}
            {!showSummary && (
              <div className="w-full mb-8 overflow-x-auto pb-2">
                <div className="flex justify-center flex-wrap gap-2">
                  {questions.map((q, i) => (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(i)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 border-2 relative ${i === currentQuestionIndex
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200 scale-110'
                        : isQuestionAnswered(q.id)
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:border-emerald-300'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                    >
                      {i + 1}
                      {/* Indicador de respondido (check pequeño) */}
                      {isQuestionAnswered(q.id) && i !== currentQuestionIndex && (
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contenedor Dinámico */}
            <div className="w-full relative min-h-[400px] bg-white md:bg-transparent rounded-3xl md:rounded-none shadow-xl md:shadow-none p-6 md:p-0">

              {/* 1. VISTA DE PREGUNTA */}
              {!showSummary && questions.length > 0 && (
                <div key={questions[currentQuestionIndex].id} className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                  {/* Question Header with Type */}
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                      {questions[currentQuestionIndex].type === 'multiple_choice' ? 'Selección Múltiple' : 'Selección Única'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {questions[currentQuestionIndex].points} puntos
                    </span>
                  </div>

                  {/* Question Text */}
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-snug mb-8">
                    <span className="text-emerald-500 mr-2">#{currentQuestionIndex + 1}</span>
                    {questions[currentQuestionIndex].prompt}
                  </h2>

                  {/* Options Grid */}
                  <div className="grid gap-3 md:gap-4">
                    {questions[currentQuestionIndex].mooc_exam_options.map((option) => {
                      const currentAnswers = answers[questions[currentQuestionIndex].id] || [];
                      const isSelected = Array.isArray(currentAnswers)
                        ? currentAnswers.includes(option.id)
                        : currentAnswers === option.id; // Fallback

                      const isMultiple = questions[currentQuestionIndex].type === 'multiple_choice';

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleAnswerChange(questions[currentQuestionIndex].id, option.id, isMultiple)}
                          className={`group relative w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all duration-200 ease-out outline-none focus:ring-4 focus:ring-emerald-100 ${isSelected
                            ? 'border-emerald-500 bg-emerald-50/50'
                            : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50'
                            }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Checkbox or Radio Indicator */}
                            <div
                              className={`flex-shrink-0 w-6 h-6 ${isMultiple ? 'rounded-md' : 'rounded-full'} border-2 flex items-center justify-center transition-all duration-200 ${isSelected
                                ? 'border-emerald-500 bg-emerald-500'
                                : 'border-slate-300 group-hover:border-emerald-400 bg-white'
                                }`}
                            >
                              {/* Checkmark or Dot Icon */}
                              {isSelected && (
                                isMultiple ? (
                                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                )
                              )}
                            </div>

                            {/* Text */}
                            <span
                              className={`text-sm md:text-lg font-medium transition-colors ${isSelected ? 'text-emerald-900 font-semibold' : 'text-slate-600 group-hover:text-slate-800'
                                }`}
                            >
                              {option.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. VISTA DE RESUMEN */}
              {showSummary && (
                <div className="animate-fadeIn w-full max-w-2xl mx-auto">

                  {/* Alerta de Preguntas Incompletas (Animada) */}
                  {questions.length - getAnsweredCount() > 0 && attemptedFinishWithIncomplete && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-shake">
                      <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-amber-900">¡Faltan preguntas por responder!</h3>
                        <p className="text-sm text-amber-800 mt-1">
                          Tienes <strong>{questions.length - getAnsweredCount()}</strong> preguntas sin contestar. ¿Estás seguro que deseas enviar tu examen así?
                        </p>
                      </div>
                    </div>
                  )}

                  {!(questions.length - getAnsweredCount() > 0 && attemptedFinishWithIncomplete) && (
                    <>
                      <h2 className="text-2xl font-bold text-slate-800 mb-2">Resumen de Respuestas</h2>
                      <p className="text-slate-500 mb-6 text-sm">Verifica que has respondido todo antes de enviar.</p>
                    </>
                  )}

                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 max-h-[50vh] overflow-y-auto">
                    {questions.map((q, i) => (
                      <div
                        key={q.id}
                        className={`flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${attemptedFinishWithIncomplete && !isQuestionAnswered(q.id) ? 'bg-amber-50/50 animate-pulse-soft' : ''
                          }`}
                        onClick={() => goToQuestion(i)}
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-slate-700 truncate font-medium">{q.prompt}</span>
                        </div>

                        <div className="flex-shrink-0">
                          {isQuestionAnswered(q.id) ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              Respondida
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 animate-bounce-subtle">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              Sin responder
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowSummary(false);
                        setAttemptedFinishWithIncomplete(false);
                      }}
                      className="flex-1 py-3 px-6 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                    >
                      Revisar Examen
                    </button>
                    <button
                      onClick={() => {
                        if (questions.length - getAnsweredCount() > 0 && !attemptedFinishWithIncomplete) {
                          setAttemptedFinishWithIncomplete(true);
                        } else {
                          handleSubmit(false);
                        }
                      }}
                      disabled={submitting || invalidated}
                      className={`flex-1 py-3 px-6 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${attemptedFinishWithIncomplete ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                        }`}
                    >
                      {submitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </div>
                      ) : (
                        attemptedFinishWithIncomplete ? 'Sí, Enviar Incompleto' : 'Confirmar y Enviar'
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </>
        )}
      </main>

      {/* Footer Controls (Solo en modo pregunta) */}
      {!attemptResult && !showSummary && (
        <footer className="w-full max-w-5xl mx-auto p-4 md:p-6 flex justify-between items-center">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="text-slate-400 hover:text-slate-600 font-bold text-sm flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Anterior
          </button>

          <button
            onClick={handleNextOrFinish}
            className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finalizar Examen' : 'Siguiente'}
            {currentQuestionIndex !== questions.length - 1 && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            )}
          </button>
        </footer>
      )}


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

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={(open) => {
        setShowResultDialog(open);
        // trigger confetti when opening and passed
        if (open && attemptResult?.passed) {
          try {
            // global confetti script loaded in index.html (canvas-confetti)
            (window as any).confetti?.({ particleCount: 120, spread: 160 });
          } catch (e) {
            // ignore
          }
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{attemptResult?.passed ? '¡Felicidades!' : 'Resultado del examen'}</DialogTitle>
            <DialogDescription>
              {attemptResult?.passed ? 'Has aprobado el examen.' : 'No alcanzaste la puntuación mínima. Sigue practicando y vuelve a intentarlo.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            {attemptResult?.passed ? (
              <CheckCircle2 className="mx-auto h-20 w-20 text-green-600" />
            ) : (
              <XCircle className="mx-auto h-20 w-20 text-red-600" />
            )}
            <div className="text-6xl font-bold mt-4">{attemptResult?.score_numeric}</div>
            <div className="text-lg text-muted-foreground mt-2">{attemptResult?.score_percent}%</div>
          </div>
          <DialogFooter>
            <div className="w-full flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowResultDialog(false)}>Cerrar</Button>
              <Button type="button" onClick={() => navigate(`/courses/${courseId}/learn`)}>Volver al curso</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
