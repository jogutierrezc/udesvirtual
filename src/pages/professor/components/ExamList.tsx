import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";

export interface ExamListProps {
  courseId?: string;
  onEdit?: (exam: any) => void;
}

export const ExamList = ({ courseId, onEdit }: ExamListProps) => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (courseId) loadExams();
  }, [courseId]);

  const loadExams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mooc_exams")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index", { ascending: true });
    if (!error && data) setExams(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este examen?")) return;
    await supabase.from("mooc_exams").delete().eq("id", id);
    loadExams();
  };

  if (!courseId) return null;

  return (
    <div className="space-y-2 mt-4">
      <div className="font-semibold mb-2">Evaluaciones del Curso</div>
      {loading ? (
        <div className="text-muted-foreground">Cargando...</div>
      ) : exams.length === 0 ? (
        <Card><CardContent className="py-4 text-center text-muted-foreground">No hay exámenes creados</CardContent></Card>
      ) : (
        exams.map((exam) => (
          <Card key={exam.id} className="flex items-center justify-between p-3">
            <div>
              <div className="font-medium">{exam.title}</div>
              <div className="text-xs text-muted-foreground">{exam.status === "published" ? "Publicado" : "Borrador"}</div>
            </div>
            <div className="flex gap-2">
              {onEdit && (
                <Button size="sm" variant="outline" onClick={() => onEdit(exam)}><Edit className="h-4 w-4" /></Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => handleDelete(exam.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};
