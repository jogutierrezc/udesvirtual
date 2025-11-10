import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { MoocExamQuestionEditor } from "./MoocExamQuestionEditor";

interface MoocExamFormProps {
  courseId: string;
  exam?: any;
  lessons?: Array<{ id: string; title: string; order_index: number }>;
  onClose: (refresh?: boolean) => void;
}

export const MoocExamForm = ({ courseId, exam, lessons, onClose }: MoocExamFormProps) => {
  const [form, setForm] = useState({
    title: exam?.title || "",
    description: exam?.description || "",
    status: exam?.status || "draft",
    order_index: exam?.order_index || 0,
    max_score: exam?.max_score || 5,
    passing_score: exam?.passing_score || 3,
    time_limit_minutes: exam?.time_limit_minutes || 0,
    attempts_allowed: exam?.attempts_allowed || 1,
    lesson_id: exam?.lesson_id || null,
  });
  const [saving, setSaving] = useState(false);
  const [showQuestions, setShowQuestions] = useState(!!exam);
  const [examId, setExamId] = useState(exam?.id || null);

  const handleChange = (e: any) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("El título es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("No autenticado");
        setSaving(false);
        return;
      }

      let res;
      if (exam) {
        res = await supabase.from("mooc_exams").update({ ...form }).eq("id", exam.id).select();
      } else {
        res = await supabase.from("mooc_exams").insert({ 
          ...form, 
          course_id: courseId,
          created_by: user.id 
        }).select();
      }
      
      if (res.error) {
        console.error("Error saving exam:", res.error);
        alert("Error al guardar el examen: " + res.error.message);
        setSaving(false);
        return;
      }

      if (!exam && res.data && res.data[0]) {
        setExamId(res.data[0].id);
        setShowQuestions(true);
      } else {
        onClose(true);
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {!showQuestions ? (
        <Card>
          <CardHeader>
            <CardTitle>{exam ? "Editar evaluación" : "Nueva evaluación"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <Input name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-2 py-1">
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Vincular a lección específica (opcional)</Label>
                <Select 
                  value={form.lesson_id || "none"} 
                  onValueChange={(value) => setForm(f => ({ ...f, lesson_id: value === "none" ? null : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin vincular (examen general del curso)</SelectItem>
                    {lessons && lessons.length > 0 ? (
                      lessons.map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          Lección {lesson.order_index}: {lesson.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-lessons" disabled>No hay lecciones disponibles</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.lesson_id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠️ La lección no se completará hasta que el estudiante apruebe este examen
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Intentos permitidos</label>
                <Input name="attempts_allowed" type="number" min={1} value={form.attempts_allowed} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Límite de tiempo (minutos)</label>
                <Input name="time_limit_minutes" type="number" min={0} value={form.time_limit_minutes} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nota máxima</label>
                <Input name="max_score" type="number" min={1} max={5} step={0.1} value={form.max_score} onChange={handleChange} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nota mínima aprobatoria</label>
                <Input name="passing_score" type="number" min={1} max={5} step={0.1} value={form.passing_score} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <Textarea name="description" value={form.description} onChange={handleChange} rows={3} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => onClose(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : exam ? "Guardar cambios" : "Guardar y continuar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">{form.title}</h3>
              <p className="text-sm text-muted-foreground">Creando preguntas para este examen</p>
            </div>
            <Button variant="outline" onClick={() => onClose(true)}>
              Finalizar
            </Button>
          </div>
          <MoocExamQuestionEditor examId={examId} />
        </div>
      )}
    </div>
  );
};
