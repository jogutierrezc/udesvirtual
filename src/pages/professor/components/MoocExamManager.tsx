import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import { MoocExamForm } from "./MoocExamForm";

export interface MoocExam {
  id: string;
  title: string;
  description: string;
  status: string;
  order_index: number;
  max_score: number;
  passing_score: number;
  time_limit_minutes?: number;
  attempts_allowed: number;
  lesson_id?: string | null;
}

interface MoocExamManagerProps {
  courseId: string;
}

export const MoocExamManager = ({ courseId }: MoocExamManagerProps) => {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<MoocExam[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExam, setEditingExam] = useState<MoocExam | null>(null);

  useEffect(() => {
    loadExams();
  }, [courseId]);

  const loadExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mooc_exams")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });
    if (!error && data) setExams(data);

    // Fetch lessons for the form
    const { data: lessonsData } = await supabase
      .from("mooc_lessons")
      .select("id, title, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });
    if (lessonsData) setLessons(lessonsData);

    // Fetch sections for the form
    const { data: sectionsData } = await supabase
      .from("mooc_course_sections")
      .select("id, title, order_index")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });
    if (sectionsData) setSections(sectionsData);

    setLoading(false);
  };

  const handleCreate = () => {
    setEditingExam(null);
    setShowForm(true);
  };

  const handleEdit = (exam: MoocExam) => {
    setEditingExam(exam);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta evaluación?")) return;
    await supabase.from("mooc_exams").delete().eq("id", id);
    loadExams();
  };

  const handleFormClose = (refresh?: boolean) => {
    setShowForm(false);
    setEditingExam(null);
    if (refresh) loadExams();
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Evaluaciones</CardTitle>
        <Button variant="outline" onClick={handleCreate}>
          <PlusCircle className="h-4 w-4 mr-2" /> Nueva evaluación
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Cargando...</div>
        ) : exams.length === 0 ? (
          <div className="text-muted-foreground">No hay evaluaciones creadas para este curso.</div>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{exam.title}</div>
                  <div className="text-xs text-muted-foreground">{exam.status === "published" ? "Publicado" : "Borrador"}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(exam)}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(exam.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {showForm && (
        <MoocExamForm
          courseId={courseId}
          exam={editingExam}
          lessons={lessons}
          sections={sections}
          onClose={handleFormClose}
        />
      )}
    </Card>
  );
};
