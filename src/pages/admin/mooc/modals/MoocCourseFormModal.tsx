import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  is_passport_activity?: boolean;
  passport_pathway?: string;
  passport_points?: number;
  passport_complexity?: string;
};

type Lesson = {
  id?: string;
  title: string;
  description: string;
  duration_hours: number;
  order_index: number;
  content: string;
  video_url: string;
  // archivos de lectura (PDF) que el profesor puede adjuntar antes de guardar
  newFiles?: File[];
  // lecturas existentes cargadas desde la BD
  existingReadings?: Array<{ id: string; title: string; file_name: string; storage_path: string }>;
  // tipo de contenido: video grabado o encuentro sincrónico
  content_type?: 'video' | 'live_session';
  // datos del encuentro sincrónico
  live_platform?: string; // Meet, Teams, Zoom, etc
  live_url?: string;
  live_date?: string; // ISO date
  live_time?: string; // HH:mm
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
    intro_video_url: "",
    is_passport_activity: false,
    passport_pathway: "",
    passport_points: 0,
    passport_complexity: "basico"
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
        intro_video_url: editingCourse.intro_video_url || "",
        is_passport_activity: editingCourse.is_passport_activity || false,
        passport_pathway: editingCourse.passport_pathway || "",
        passport_points: editingCourse.passport_points || 0,
        passport_complexity: editingCourse.passport_complexity || "basico"
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
      // Normalizar las URLs de video al formato embebible para evitar problemas de X-Frame-Options
      const normalized = (data || []).map((l: any) => ({
        ...l,
        video_url: getEmbedUrl(l.video_url) || l.video_url || "",
        newFiles: [],
        existingReadings: [],
        content_type: l.content_type || 'video',
        live_platform: l.live_platform || '',
        live_url: l.live_url || '',
        live_date: l.live_date || '',
        live_time: l.live_time || ''
      }));

      setLessons(normalized);

      // Cargar lecturas para cada lección
      for (let i = 0; i < normalized.length; i++) {
        const lessonId = normalized[i].id;
        if (lessonId) {
          const { data: readingsData } = await supabase
            .from("mooc_readings")
            .select("id, title, file_name, storage_path")
            .eq("lesson_id", lessonId)
            .order("sort_order");
          
          if (readingsData && readingsData.length > 0) {
            setLessons(prev => {
              const updated = [...prev];
              if (updated[i]) {
                updated[i] = { ...updated[i], existingReadings: readingsData };
              }
              return updated;
            });
          }
        }
      }
    } catch (error) {
      console.error("Error loading lessons:", error);
    }
  };

  // Convierte URLs de video a formato embebible (YouTube watch -> /embed, youtu.be -> /embed, Vimeo -> player)
  const getEmbedUrl = (rawUrl?: string | null) => {
    if (!rawUrl) return null;
    try {
      const url = new URL(rawUrl, window.location.origin);
      const host = url.hostname.replace('www.', '').toLowerCase();

      if (host.includes('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v) return `https://www.youtube.com/embed/${v}`;
        if (url.pathname.startsWith('/embed/')) return url.href;
        const parts = url.pathname.split('/').filter(Boolean);
        const maybeId = parts[parts.length - 1];
        if (maybeId) return `https://www.youtube.com/embed/${maybeId}`;
      }

      if (host === 'youtu.be') {
        const id = url.pathname.split('/').filter(Boolean)[0];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }

      if (host.includes('vimeo.com')) {
        const parts = url.pathname.split('/').filter(Boolean);
        const id = parts[parts.length - 1];
        if (id) return `https://player.vimeo.com/video/${id}`;
      }

      return rawUrl;
    } catch (e) {
      console.warn('Invalid video URL', rawUrl, e);
      return rawUrl;
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
      intro_video_url: "",
      is_passport_activity: false,
      passport_pathway: "",
      passport_points: 0,
      passport_complexity: "basico"
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
        video_url: "",
        newFiles: [],
        existingReadings: [],
        content_type: 'video',
        live_platform: '',
        live_url: '',
        live_date: '',
        live_time: ''
      }
    ]);
  };

  const handleLessonFilesChange = (index: number, files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter(f => f.type === 'application/pdf');
    setLessons(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], newFiles: arr };
      return updated;
    });
  };

  const handleRemoveExistingReading = async (lessonIndex: number, readingId: string) => {
    if (!confirm("¿Eliminar esta lectura?")) return;
    
    try {
      // Eliminar de la BD
      const { error } = await supabase
        .from("mooc_readings")
        .delete()
        .eq("id", readingId);
      
      if (error) throw error;

      // Actualizar el estado local
      setLessons(prev => {
        const updated = [...prev];
        if (updated[lessonIndex]) {
          updated[lessonIndex] = {
            ...updated[lessonIndex],
            existingReadings: (updated[lessonIndex].existingReadings || []).filter(r => r.id !== readingId)
          };
        }
        return updated;
      });

      toast({
        title: "Lectura eliminada",
        description: "La lectura ha sido eliminada correctamente"
      });
    } catch (error: any) {
      console.error("Error deleting reading:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la lectura",
        variant: "destructive"
      });
    }
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

      // Guardar lecciones y lecturas (PDF)
      if (courseId && lessons.length > 0) {
        // Si estamos editando, eliminar lecciones previas sin lecturas asociadas
        // Las lecturas existentes ya están en la BD y las mantenemos
        if (editingCourse) {
          try {
            await supabase
              .from("mooc_lessons")
              .delete()
              .eq("course_id", courseId as string);
          } catch (e) {
            console.warn("Error removing old lessons", e);
          }
        }

        // Insertar lecciones una por una para obtener el id y poder asociar archivos
        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];
          const lessonPayload: any = {
            title: lesson.title,
            description: lesson.description,
            duration_hours: lesson.duration_hours,
            order_index: i + 1,
            content: lesson.content,
            video_url: getEmbedUrl(lesson.video_url) || lesson.video_url,
            course_id: courseId,
            content_type: lesson.content_type || 'video',
            live_platform: lesson.live_platform || null,
            live_url: lesson.live_url || null,
            live_date: lesson.live_date || null,
            live_time: lesson.live_time || null
          };

          const { data: insertedLesson, error: insertLessonError } = await supabase
            .from("mooc_lessons")
            .insert([lessonPayload])
            .select()
            .single();

          if (insertLessonError) throw insertLessonError;

          const lessonId = insertedLesson.id;

          // Si había lecturas existentes, actualizarles el lesson_id
          if (lesson.existingReadings && lesson.existingReadings.length > 0) {
            const readingIds = lesson.existingReadings.map(r => r.id);
            await supabase
              .from("mooc_readings")
              .update({ lesson_id: lessonId })
              .in("id", readingIds);
          }

          // Subir archivos asociados (PDFs) al bucket 'mooc-readings' y crear registros en mooc_readings
          if (lesson.newFiles && lesson.newFiles.length > 0) {
            for (const file of lesson.newFiles) {
              try {
                const filePath = `${courseId}/${lessonId}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage
                  .from("mooc-readings")
                  .upload(filePath, file, { upsert: false });

                if (uploadError) {
                  console.warn("Error uploading reading file", uploadError);
                  continue;
                }

                // Crear registro en la tabla mooc_readings
                const { error: readingInsertError } = await supabase
                  .from("mooc_readings")
                  .insert([
                    {
                      lesson_id: lessonId,
                      title: file.name.replace(/\.pdf$/i, ""),
                      content: null,
                      storage_path: filePath,
                      file_name: file.name,
                      type: "file",
                      sort_order: null,
                      created_by: user.id,
                      created_at: new Date().toISOString()
                    }
                  ]);

                if (readingInsertError) {
                  console.warn("Error creating mooc_readings row", readingInsertError);
                }
              } catch (e) {
                console.error("Error processing reading file", e);
              }
            }
          }
        }
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

            {/* Configuración de Passport UDES */}
            <div className="border-t pt-4 mt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_passport_activity"
                    checked={formData.is_passport_activity}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_passport_activity: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_passport_activity" className="font-semibold">
                    Este curso forma parte del Programa Passport UDES
                  </Label>
                </div>

                {formData.is_passport_activity && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="space-y-2">
                      <Label>Sendero del Pasaporte</Label>
                      <Select
                        value={formData.passport_pathway}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, passport_pathway: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar sendero" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conocimiento">Conocimiento</SelectItem>
                          <SelectItem value="descubrimiento">Descubrimiento</SelectItem>
                          <SelectItem value="impacto_social">Impacto Social</SelectItem>
                          <SelectItem value="multiple">Múltiple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Puntos por Completar</Label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.passport_points}
                        onChange={(e) => setFormData(prev => ({ ...prev, passport_points: parseInt(e.target.value) || 0 }))}
                        placeholder="Ej: 30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Nivel de Complejidad</Label>
                      <Select
                        value={formData.passport_complexity}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, passport_complexity: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Básico</SelectItem>
                          <SelectItem value="intermedio">Intermedio</SelectItem>
                          <SelectItem value="avanzado">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
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
                {editingCourse ? (
                  <Button type="button" onClick={() => { setEditingExam(null); setShowExamForm(true); }} size="sm" variant="secondary">
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Examen
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="secondary" 
                    disabled 
                    title="Primero debes guardar el curso antes de crear exámenes"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Examen
                  </Button>
                )}
              </div>
            </div>

            {!editingCourse && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                💡 <strong>Nota:</strong> Primero debes guardar el curso para poder agregar exámenes.
              </div>
            )}

            {/* Lista de exámenes creados */}
            {editingCourse && (
              <ExamList
                courseId={editingCourse.id}
                onEdit={(exam: any) => {
                  setEditingExam(exam);
                  setShowExamForm(true);
                }}
              />
            )}

            {/* Modal para crear/editar examen */}
            {showExamForm && editingCourse && (
              <Dialog open={showExamForm} onOpenChange={setShowExamForm}>
                <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 overflow-hidden">
                  <div className="h-full overflow-y-auto p-6">
                    <MoocExamForm
                      courseId={editingCourse.id}
                      exam={editingExam}
                      lessons={lessons.map(l => ({ id: l.id || '', title: l.title, order_index: l.order_index }))}
                      onClose={(refresh) => { 
                        setShowExamForm(false); 
                        setEditingExam(null);
                      }}
                    />
                  </div>
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

                      <div className="space-y-3 border-t pt-3">
                        <Label>Tipo de contenido multimedia</Label>
                        <Select
                          value={lesson.content_type || 'video'}
                          onValueChange={(value) => handleLessonChange(index, "content_type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="video">Video grabado (YouTube/Vimeo)</SelectItem>
                            <SelectItem value="live_session">Encuentro sincrónico (Meet/Teams/Zoom)</SelectItem>
                          </SelectContent>
                        </Select>

                        {lesson.content_type === 'video' ? (
                          <div className="space-y-2">
                            <Label>URL del Video</Label>
                            <Input
                              value={lesson.video_url}
                              onChange={(e) => handleLessonChange(index, "video_url", e.target.value)}
                              placeholder="https://youtube.com/..."
                            />
                          </div>
                        ) : (
                          <div className="space-y-3 p-3 bg-blue-50 rounded-md">
                            <div className="space-y-2">
                              <Label>Plataforma</Label>
                              <Select
                                value={lesson.live_platform || ''}
                                onValueChange={(value) => handleLessonChange(index, "live_platform", value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar plataforma" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Google Meet">Google Meet</SelectItem>
                                  <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                                  <SelectItem value="Zoom">Zoom</SelectItem>
                                  <SelectItem value="Webex">Webex</SelectItem>
                                  <SelectItem value="Otra">Otra</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>URL del encuentro</Label>
                              <Input
                                value={lesson.live_url || ''}
                                onChange={(e) => handleLessonChange(index, "live_url", e.target.value)}
                                placeholder="https://meet.google.com/xxx-yyyy-zzz"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Fecha</Label>
                                <Input
                                  type="date"
                                  value={lesson.live_date || ''}
                                  onChange={(e) => handleLessonChange(index, "live_date", e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Hora</Label>
                                <Input
                                  type="time"
                                  value={lesson.live_time || ''}
                                  onChange={(e) => handleLessonChange(index, "live_time", e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Lecturas (PDF)</Label>
                        
                        {/* Mostrar lecturas existentes */}
                        {lesson.existingReadings && lesson.existingReadings.length > 0 && (
                          <div className="mb-3 p-3 bg-secondary/50 rounded-md">
                            <div className="text-sm font-medium mb-2">Lecturas actuales:</div>
                            <div className="space-y-2">
                              {lesson.existingReadings.map((reading) => (
                                <div key={reading.id} className="flex items-center justify-between text-sm">
                                  <span className="flex-1 truncate">{reading.file_name}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveExistingReading(index, reading.id)}
                                    className="ml-2"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <input
                          type="file"
                          accept="application/pdf"
                          multiple
                          onChange={(e) => handleLessonFilesChange(index, e.target.files)}
                        />
                        {lesson.newFiles && lesson.newFiles.length > 0 && (
                          <div className="mt-2 text-sm">
                            Archivos nuevos seleccionados:
                            <ul className="list-disc list-inside">
                              {lesson.newFiles.map((f, idx) => (
                                <li key={idx}>{f.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
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
