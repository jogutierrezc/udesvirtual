import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

import { MoocExamQuestionEditor } from "./MoocExamQuestionEditor";

interface MoocExamFormProps {
  courseId: string;
  exam?: any;
  onClose: (refresh?: boolean) => void;
}

export const MoocExamForm = ({ courseId, exam, onClose }: MoocExamFormProps) => {
  const [form, setForm] = useState({
    title: exam?.title || "",
    description: exam?.description || "",
    status: exam?.status || "draft",
    order_index: exam?.order_index || 0,
    max_score: exam?.max_score || 5,
    passing_score: exam?.passing_score || 3,
    time_limit_minutes: exam?.time_limit_minutes || 0,
    attempts_allowed: exam?.attempts_allowed || 1,
  });
  const [saving, setSaving] = useState(false);
  const [showQuestions, setShowQuestions] = useState(!!exam);

  const handleChange = (e: any) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };

  const handleSave = async () => {
    setSaving(true);
    let res;
    if (exam) {
      res = await supabase.from("mooc_exams").update({ ...form }).eq("id", exam.id);
    } else {
      res = await supabase.from("mooc_exams").insert({ ...form, course_id: courseId });
    }
    setSaving(false);
    if (!res.error) {
      setShowQuestions(true);
      if (!exam) setForm((f) => ({ ...f, id: res.data[0].id }));
      onClose(true);
    }
  };

  return (
    <Card className="mb-6">
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
          <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar"}</Button>
        </div>
        {showQuestions && (
          <div className="mt-8">
            <MoocExamQuestionEditor examId={exam?.id || form.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
