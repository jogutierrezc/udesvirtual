import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, Edit, Trash2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const QUESTION_TYPES = [
  { value: "single_choice", label: "Selección única" },
  { value: "multiple_choice", label: "Selección múltiple" },
  { value: "true_false", label: "Verdadero/Falso" },
  { value: "short_text", label: "Respuesta corta" },
];

export const MoocExamQuestionEditor = ({ examId, maxScore }: { examId: string, maxScore: number }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [examId]);

  const loadQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mooc_exam_questions")
      .select("*, mooc_exam_options(*)")
      .eq("exam_id", examId)
      .order("order_index", { ascending: true });
    if (!error && data) setQuestions(data);
    setLoading(false);
  };

  const handleCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (q: any) => {
    setEditing(q);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta pregunta?")) return;
    await supabase.from("mooc_exam_questions").delete().eq("id", id);
    // Remove from local state immediately to trigger recalculation
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleFormClose = (refresh?: boolean) => {
    setShowForm(false);
    setEditing(null);
    if (refresh) loadQuestions();
  };

  // Calculate total points
  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const pointsExceedMax = totalPoints > maxScore;

  return (
    <div className="space-y-4">
      {questions.length > 0 && (
        <Alert variant={pointsExceedMax ? "destructive" : "default"} className="bg-card">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">Puntos totales: {totalPoints.toFixed(2)}</span> de {maxScore} puntos máximos
            {pointsExceedMax && (
              <span className="block mt-1 text-destructive font-medium">
                ⚠️ La suma de puntos excede el máximo configurado para el examen
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Preguntas del examen ({questions.length})</CardTitle>
          <Button variant="outline" onClick={handleCreate}>
            <PlusCircle className="h-4 w-4 mr-2" /> Nueva pregunta
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando...</div>
          ) : questions.length === 0 ? (
            <div className="text-muted-foreground">No hay preguntas creadas para este examen.</div>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div key={q.id} className="flex items-center justify-between border rounded p-3">
                  <div className="flex-1">
                    <div className="font-medium">{q.prompt}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {QUESTION_TYPES.find(t => t.value === q.type)?.label} • <span className="font-semibold text-primary">{q.points}</span> punto(s)
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(q)}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(q.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <QuestionForm
        open={showForm}
        examId={examId}
        maxScore={maxScore}
        question={editing}
        onClose={handleFormClose}
      />
    </div>
  );
};

function QuestionForm({ open, examId, maxScore, question, onClose }: { open: boolean, examId: string, maxScore: number, question?: any, onClose: (refresh?: boolean) => void }) {
  const [form, setForm] = useState({
    type: "single_choice",
    prompt: "",
    order_index: 0,
    points: 1.0, // Default value, can be customized
    options: [] as any[],
  });
  const [saving, setSaving] = useState(false);
  const [optionText, setOptionText] = useState("");

  useEffect(() => {
    if (question) {
      setForm({
        type: question.type || "single_choice",
        prompt: question.prompt || "",
        order_index: question.order_index || 0,
        points: question.points || 0,
        options: question.mooc_exam_options || [],
      });
    } else {
      setForm({
        type: "single_choice",
        prompt: "",
        order_index: 0,
        points: 1.0,
        options: [],
      });
    }
  }, [question, open]);

  const handleChange = (e: any) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };

  const handleAddOption = () => {
    if (!optionText.trim()) return;
    setForm((f) => ({ ...f, options: [...f.options, { text: optionText, is_correct: false }] }));
    setOptionText("");
  };

  const handleOptionChange = (idx: number, field: string, value: any) => {
    setForm((f) => ({
      ...f,
      options: f.options.map((opt, i) => i === idx ? { ...opt, [field]: value } : opt),
    }));
  };

  const handleDeleteOption = (idx: number) => {
    setForm((f) => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.prompt.trim()) {
      alert("La pregunta es obligatoria");
      return;
    }

    setSaving(true);
    let res;
    if (question) {
      res = await supabase.from("mooc_exam_questions").update({
        type: form.type,
        prompt: form.prompt,
        order_index: form.order_index,
        points: form.points,
      }).eq("id", question.id).select();
    } else {
      res = await supabase.from("mooc_exam_questions").insert({
        exam_id: examId,
        type: form.type,
        prompt: form.prompt,
        order_index: form.order_index,
        points: form.points,
      }).select();
    }
    if (!res.error && res.data) {
      // Opciones (solo para selección)
      if (["single_choice", "multiple_choice", "true_false"].includes(form.type)) {
        const qid = question ? question.id : res.data[0].id;
        // Elimina opciones previas si editando
        if (question) await supabase.from("mooc_exam_options").delete().eq("question_id", qid);
        // Inserta nuevas
        if (form.options.length > 0) {
          await supabase.from("mooc_exam_options").insert(
            form.options.map((opt, i) => ({
              question_id: qid,
              text: opt.text,
              is_correct: !!opt.is_correct,
              order_index: i,
            }))
          );
        }
      }
      setSaving(false);
      onClose(true);
    } else {
      setSaving(false);
      alert("Error al guardar la pregunta");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose(false)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{question ? "Editar pregunta" : "Nueva pregunta"}</DialogTitle>
          <DialogDescription>Define el tipo de pregunta y sus opciones.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de pregunta</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded px-3 py-2 h-10 bg-background">
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Puntos *</label>
              <Input 
                name="points" 
                type="number" 
                min={0.1} 
                step={0.1}
                max={maxScore}
                value={form.points} 
                onChange={handleChange}
                placeholder="1.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Orden</label>
              <Input name="order_index" type="number" min={0} value={form.order_index} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Enunciado de la pregunta *</label>
            <Textarea name="prompt" value={form.prompt} onChange={handleChange} rows={3} placeholder="Escribe la pregunta aquí..." />
          </div>
          {["single_choice", "multiple_choice", "true_false"].includes(form.type) && (
            <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
              <label className="block text-sm font-medium mb-3">Opciones de respuesta</label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={optionText}
                  onChange={e => setOptionText(e.target.value)}
                  placeholder="Escribe una opción de respuesta"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddOption())}
                />
                <Button variant="outline" onClick={handleAddOption}>
                  <PlusCircle className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
              {form.options.length === 0 ? (
                <div className="text-sm text-muted-foreground italic">No hay opciones agregadas</div>
              ) : (
                <div className="space-y-2">
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-background p-2 rounded border">
                      <input
                        type="checkbox"
                        checked={opt.is_correct}
                        onChange={(e) => handleOptionChange(idx, "is_correct", e.target.checked)}
                        className="h-4 w-4"
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) => handleOptionChange(idx, "text", e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteOption(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                ✓ Marca las opciones correctas
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onClose(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Guardando...</> : "Guardar pregunta"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
