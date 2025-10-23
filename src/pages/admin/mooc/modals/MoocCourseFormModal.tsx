import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";
import { ExamList } from "@/pages/professor/components/ExamList";
import { MoocExamForm } from "@/pages/professor/components/MoocExamForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

type MoocCourse = {
  id: string;
  title: string;
  profession: string;
  tags: string[];
  objective: string;
  description: string;
  course_image_url: string | null;
  intro_video_url: string | null;
};

type Lesson = {
  id?: string;
  title: string;
  description: string;
  duration_hours: number;
  order_index: number;
  content: string;
  video_url: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCourse: MoocCourse | null;
  onSave: () => void;
};

export const MoocCourseFormModal = ({ open, onOpenChange, editingCourse, onSave }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("course");

  // Modal state for exam form
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);

  // Datos del curso
  const [formData, setFormData] = useState({
    title: "",
    profession: "",
    tags: [] as string[],
    objective: "",
    description: "",
    course_image_url: "",
    intro_video_url: ""
  });

  const [tagInput, setTagInput] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (editingCourse) {
      setFormData({
        title: editingCourse.title,
        profession: editingCourse.profession,
        tags: editingCourse.tags || [],
        objective: editingCourse.objective,
        description: editingCourse.description,
        course_image_url: editingCourse.course_image_url || "",
        intro_video_url: editingCourse.intro_video_url || ""
      });
      loadLessons(editingCourse.id);
    } else {
      resetForm();
    }
  }, [editingCourse, open]);

  const loadLessons = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from("mooc_lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error("Error loading lessons:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      profession: "",
      tags: [],
      objective: "",
      description: "",
      course_image_url: "",
      intro_video_url: ""
    });
    setLessons([]);
    setCurrentTab("course");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleAddLesson = () => {
    setLessons(prev => [
      ...prev,
      {
        title: "",
        description: "",
        duration_hours: 1,
        order_index: prev.length + 1,
        content: "",
        video_url: ""
      }
    ]);
  };

  const handleRemoveLesson = (index: number) => {
    setLessons(prev => prev.filter((_, i) => i !== index));
  };

  const handleLessonChange = (index: number, field: keyof Lesson, value: any) => {
    setLessons(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validateCourse = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.profession.trim()) {
      toast({
        title: "Error",
        description: "El programa es obligatorio",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.objective.trim()) {
      toast({
        title: "Error",
        description: "El objetivo es obligatorio",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "La descripción es obligatoria",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateCourse()) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      let courseId = editingCourse?.id;

      if (editingCourse) {
        // Actualizar curso existente
        const { error: updateError } = await supabase
          .from("mooc_courses")
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingCourse.id);

        if (updateError) throw updateError;
      } else {
        // Crear nuevo curso
        const { data: newCourse, error: insertError } = await supabase
          .from("mooc_courses")
          .insert([
            {
              ...formData,
              created_by: user.id
            }
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        courseId = newCourse.id;
      }

      // Guardar lecciones
      if (courseId && lessons.length > 0) {
        // Eliminar lecciones existentes
        await supabase
          .from("mooc_lessons")
          .delete()
          .eq("course_id", courseId);

        // Insertar nuevas lecciones
        const lessonsToInsert = lessons.map((lesson, index) => ({
          ...lesson,
          course_id: courseId,
          order_index: index + 1
        }));

        const { error: lessonsError } = await supabase
          .from("mooc_lessons")
          .insert(lessonsToInsert);

        if (lessonsError) throw lessonsError;
      }

      toast({
        title: editingCourse ? "Curso actualizado" : "Curso creado",
        description: editingCourse
          ? "El curso ha sido actualizado exitosamente"
          : "El curso ha sido creado y está pendiente de aprobación"
      });

      onSave();
    } catch (error: any) {
      console.error("Error saving course:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el curso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCourse ? "Editar Curso MOOC" : "Crear Curso MOOC"}
          </DialogTitle>
          {editingCourse && (
            <div className="flex gap-4 mt-2">
              <span className="text-sm font-medium">No. de estudiantes inscritos: {/* TODO: fetch count */} </span>
              <span className="text-sm font-medium">No. de estudiantes que han terminado el curso: {/* TODO: fetch count */} </span>
            </div>
          )}
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="course">Información del Curso</TabsTrigger>
            <TabsTrigger value="lessons">Lecciones</TabsTrigger>
          </TabsList>

          {/* Tab de información del curso */}
          <TabsContent value="course" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Curso *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ej: Introducción a la Inteligencia Artificial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession">Programa *</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                placeholder="Ej: Ingeniería de Sistemas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo del Curso *</Label>
              <Textarea
                id="objective"
                value={formData.objective}
                onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
                placeholder="Describe el objetivo principal del curso"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción detallada del curso"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder="Agregar etiqueta"
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course_image_url">URL de Imagen del Curso</Label>
                <Input
                  id="course_image_url"
                  value={formData.course_image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, course_image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intro_video_url">URL de Video de Introducción</Label>
                <Input
                  id="intro_video_url"
                  value={formData.intro_video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, intro_video_url: e.target.value }))}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </TabsContent>


          {/* Tab de lecciones y exámenes */}
          <TabsContent value="lessons" className="space-y-4">
            <div className="flex justify-between items-center gap-2">
              <Label>Lecciones del Curso ({lessons.length})</Label>
              <div className="flex gap-2">
                <Button type="button" onClick={handleAddLesson} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Lección
                </Button>
                <Button type="button" onClick={() => { setEditingExam(null); setShowExamForm(true); }} size="sm" variant="secondary">
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Examen
                </Button>
              </div>
            </div>

            {/* Lista de exámenes creados */}
            <ExamList
              courseId={editingCourse?.id}
              onEdit={(exam: any) => {
                setEditingExam(exam);
                setShowExamForm(true);
              }}
            />

            {/* Modal para crear/editar examen */}
            {showExamForm && (
              <Dialog open={showExamForm} onOpenChange={setShowExamForm}>
                <DialogContent className="max-w-2xl">
                  <MoocExamForm
                    courseId={editingCourse?.id}
                    exam={editingExam}
                    onClose={() => { setShowExamForm(false); setEditingExam(null); }}
                  />
                </DialogContent>
              </Dialog>
            )}

            {lessons.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No hay lecciones agregadas
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Lección {index + 1}</Label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Título</Label>
                          <Input
                            value={lesson.title}
                            onChange={(e) => handleLessonChange(index, "title", e.target.value)}
                            placeholder="Título de la lección"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Duración (horas)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={lesson.duration_hours}
                            onChange={(e) => handleLessonChange(index, "duration_hours", parseInt(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={lesson.description}
                          onChange={(e) => handleLessonChange(index, "description", e.target.value)}
                          placeholder="Descripción de la lección"
                          rows={2}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Contenido</Label>
                        <Textarea
                          value={lesson.content}
                          onChange={(e) => handleLessonChange(index, "content", e.target.value)}
                          placeholder="Contenido detallado de la lección"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>URL del Video</Label>
                        <Input
                          value={lesson.video_url}
                          onChange={(e) => handleLessonChange(index, "video_url", e.target.value)}
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Curso"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
