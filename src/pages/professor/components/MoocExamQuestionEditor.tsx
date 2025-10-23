import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";

const QUESTION_TYPES = [
  { value: "single_choice", label: "Selección única" },
  { value: "multiple_choice", label: "Selección múltiple" },
  { value: "true_false", label: "Verdadero/Falso" },
  { value: "short_text", label: "Respuesta corta" },
];

export const MoocExamQuestionEditor = ({ examId }: { examId: string }) => {
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
    loadQuestions();
  };

  const handleFormClose = (refresh?: boolean) => {
    setShowForm(false);
    setEditing(null);
    if (refresh) loadQuestions();
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Preguntas del examen</CardTitle>
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
                <div>
                  <div className="font-medium">{q.prompt}</div>
                  <div className="text-xs text-muted-foreground">{QUESTION_TYPES.find(t => t.value === q.type)?.label}</div>
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
      {showForm && (
        <QuestionForm
          examId={examId}
          question={editing}
          onClose={handleFormClose}
        />
      )}
    </Card>
  );
};

function QuestionForm({ examId, question, onClose }: { examId: string, question?: any, onClose: (refresh?: boolean) => void }) {
  const [form, setForm] = useState({
    type: question?.type || "single_choice",
    prompt: question?.prompt || "",
    order_index: question?.order_index || 0,
    points: question?.points || 1,
    options: question?.mooc_exam_options || [],
  });
  const [saving, setSaving] = useState(false);
  const [optionText, setOptionText] = useState("");

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
    setSaving(true);
    let res;
    if (question) {
      res = await supabase.from("mooc_exam_questions").update({
        type: form.type,
        prompt: form.prompt,
        order_index: form.order_index,
        points: form.points,
      }).eq("id", question.id);
    } else {
      res = await supabase.from("mooc_exam_questions").insert({
        exam_id: examId,
        type: form.type,
        prompt: form.prompt,
        order_index: form.order_index,
        points: form.points,
      });
    }
    if (!res.error) {
      // Opciones (solo para selección)
      if (["single_choice","multiple_choice","true_false"].includes(form.type)) {
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
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{question ? "Editar pregunta" : "Nueva pregunta"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded px-2 py-1">
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Puntos</label>
            <Input name="points" type="number" min={1} value={form.points} onChange={handleChange} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Orden</label>
            <Input name="order_index" type="number" min={0} value={form.order_index} onChange={handleChange} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Enunciado</label>
          <Textarea name="prompt" value={form.prompt} onChange={handleChange} rows={2} />
        </div>
        {["single_choice","multiple_choice","true_false"].includes(form.type) && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Opciones</label>
            <div className="flex gap-2 mb-2">
              <Input value={optionText} onChange={e => setOptionText(e.target.value)} placeholder="Texto de la opción" />
              <Button variant="outline" onClick={handleAddOption}>Agregar</Button>
            </div>
            <div className="space-y-2">
              {form.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input value={opt.text} onChange={e => handleOptionChange(idx, "text", e.target.value)} className="flex-1" />
                  <label className="flex items-center gap-1 text-xs">
                    <input type={form.type === "multiple_choice" ? "checkbox" : "radio"}
                      checked={!!opt.is_correct}
                      onChange={e => handleOptionChange(idx, "is_correct", e.target.checked)} />
                    Correcta
                  </label>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteOption(idx)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => onClose(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
