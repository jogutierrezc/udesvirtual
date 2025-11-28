import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { MoocExamQuestionEditor } from "./MoocExamQuestionEditor";

interface MoocExamFormProps {
  open: boolean;
  courseId: string;
  exam?: any;
  lessons?: Array<{ id: string; title: string; order_index: number }>;
  sections?: Array<{ id: string; title: string; order_index: number }>;
  onClose: (refresh?: boolean) => void;
}

export const MoocExamForm = ({ open, courseId, exam, lessons, sections, onClose }: MoocExamFormProps) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "draft",
    order_index: 0,
    max_score: 5,
    passing_score: 3,
    time_limit_minutes: 0,
    attempts_allowed: 1,
    lesson_id: null as string | null,
    section_id: null as string | null,
  });
  const [saving, setSaving] = useState(false);
  const [examId, setExamId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("config");

  useEffect(() => {
    if (exam) {
      setForm({
        title: exam.title || "",
        description: exam.description || "",
        status: exam.status || "draft",
        order_index: exam.order_index || 0,
        max_score: exam.max_score || 5,
        passing_score: exam.passing_score || 3,
        time_limit_minutes: exam.time_limit_minutes || 0,
        attempts_allowed: exam.attempts_allowed || 1,
        lesson_id: exam.lesson_id || null,
        section_id: exam.section_id || null,
      });
      setExamId(exam.id);
    } else {
      setForm({
        title: "",
        description: "",
        status: "draft",
        order_index: 0,
        max_score: 5,
        passing_score: 3,
        time_limit_minutes: 0,
        attempts_allowed: 1,
        lesson_id: null,
        section_id: null,
      });
      setExamId(null);
      setActiveTab("config");
    }
  }, [exam, open]);

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
      if (examId) {
        res = await supabase.from("mooc_exams").update({ ...form }).eq("id", examId).select();
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

      if (!examId && res.data && res.data[0]) {
        setExamId(res.data[0].id);
        // Don't close, just update state to allow adding questions
        // onClose(true); 
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
    <Dialog open={open} onOpenChange={(val) => !val && onClose(false)}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{examId ? "Editar evaluación" : "Nueva evaluación"}</DialogTitle>
          <DialogDescription>
            Configura los detalles de la evaluación y gestiona las preguntas.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">Configuración</TabsTrigger>
            <TabsTrigger value="questions" disabled={!examId}>Preguntas</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <Input name="title" value={form.title} onChange={handleChange} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <select name="status" value={form.status} onChange={handleChange} className="w-full border rounded px-2 py-1 h-10 bg-background">
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>Vincular a lección específica (opcional)</Label>
                <Select
                  value={form.lesson_id || "none"}
                  onValueChange={(value) => setForm(f => ({ ...f, lesson_id: value === "none" ? null : value, section_id: null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin vincular (examen libre)</SelectItem>
                    {lessons && lessons.length > 0 && lessons.filter(l => l.id && l.id !== '').length > 0 ? (
                      lessons.filter(l => l.id && l.id !== '').map((lesson) => (
                        <SelectItem key={lesson.id} value={lesson.id}>
                          Lección {lesson.order_index}: {lesson.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-lessons" disabled>No hay lecciones creadas. Crea lecciones primero.</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {form.lesson_id ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠️ La lección no se completará hasta que el estudiante apruebe este examen
                  </p>
                ) : (
                  <div className="mt-4">
                    <Label>Vincular a sección (opcional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Si no vinculas a una lección, puedes ubicar el examen dentro de una sección específica.
                    </p>
                    <Select
                      value={form.section_id || "none"}
                      onValueChange={(value) => setForm(f => ({ ...f, section_id: value === "none" ? null : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sección" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin sección (aparecerá al final)</SelectItem>
                        {sections && sections.length > 0 ? (
                          sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              Sección {section.order_index}: {section.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-sections" disabled>No hay secciones creadas.</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
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
                <p className="text-xs text-muted-foreground mt-1">El valor de cada pregunta se ajustará automáticamente.</p>
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
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => onClose(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : examId ? "Guardar cambios" : "Crear y continuar"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4 py-4">
            {examId && (
              <MoocExamQuestionEditor
                examId={examId}
                maxScore={form.max_score}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
