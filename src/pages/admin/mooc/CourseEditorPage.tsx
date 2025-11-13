import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MoocExamForm } from "@/pages/professor/components/MoocExamForm";
import { MoocExamManager } from '@/pages/professor/components/MoocExamManager';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useToast } from "@/hooks/use-toast";

type Lesson = {
  id?: string;
  title: string;
  description: string;
  duration_hours: number;
  order_index: number;
  content: string;
  video_url?: string;
  content_type?: 'video' | 'live_session';
  section_id?: string | null;
};

type Section = { id?: string; title: string; description?: string; order_index: number };

export default function CourseEditorPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(null);
  const [showExamForm, setShowExamForm] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    loadCourse(courseId);
    loadLessons(courseId);
    loadSections(courseId);
  }, [courseId]);

  const loadCourse = async (id: string) => {
    try {
      const { data, error } = await supabase.from('mooc_courses').select('*').eq('id', id).single();
      if (error) throw error;
      setCourse(data);
    } catch (e:any) {
      console.error('loadCourse', e);
      toast({ title: 'Error', description: e.message || 'No se pudo cargar el curso', variant: 'destructive' });
    }
  };

  const loadLessons = async (id: string) => {
    try {
      const { data, error } = await supabase.from('mooc_lessons').select('*').eq('course_id', id).order('order_index');
      if (error) throw error;
      setLessons((data||[]).map((l:any)=>({
        ...l,
        content_type: l.content_type || 'video',
        duration_hours: l.duration_hours || 1,
        section_id: l.section_id || null
      })));
    } catch (e:any) {
      console.error('loadLessons', e);
      toast({ title: 'Error', description: 'No se pudieron cargar las lecciones', variant: 'destructive' });
    }
  };

  const loadSections = async (id: string) => {
    try {
      const { data, error } = await supabase.from('mooc_course_sections').select('*').eq('course_id', id).order('order_index');
      if (error) throw error;
      setSections((data||[]).map((s:any)=>({ id: s.id, title: s.title, description: s.description, order_index: s.order_index })));
    } catch (e:any) {
      console.error('loadSections', e);
    }
  };

  const handleCourseChange = (field: string, value: any) => {
    setCourse((prev:any)=> ({ ...prev, [field]: value }));
  };

  const handleSaveCourse = async () => {
    if (!courseId || !course) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('mooc_courses').update({
        title: course.title,
        profession: course.profession,
        objective: course.objective,
        description: course.description,
        course_image_url: course.course_image_url,
        intro_video_url: course.intro_video_url
      }).eq('id', courseId);
      if (error) throw error;
      toast({ title: 'Curso guardado' });
    } catch (e:any) {
      console.error('save course', e);
      toast({ title: 'Error', description: e.message || 'No se pudo guardar el curso', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleSelectLesson = (index: number) => {
    setSelectedLessonIndex(index);
  };

  const handleLessonField = (index:number, field: keyof Lesson, value:any) => {
    setLessons(prev=>{
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const saveLessonToDB = async (index:number) => {
    const lesson = lessons[index];
    if (!lesson) return;
    setLoading(true);
    try {
      if (lesson.id) {
        const { error } = await supabase.from('mooc_lessons').update({
          title: lesson.title,
          description: lesson.description,
          content: lesson.content,
          duration_hours: lesson.duration_hours,
          content_type: lesson.content_type,
          video_url: lesson.video_url,
          section_id: lesson.section_id,
          order_index: lesson.order_index
        }).eq('id', lesson.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('mooc_lessons').insert([{ ...lesson, course_id: courseId }]).select().single();
        if (error) throw error;
        // replace id locally
        setLessons(prev=>{
          const copy = [...prev];
          copy[index] = { ...copy[index], id: data.id };
          return copy;
        });
      }
      toast({ title: 'Lección guardada' });
    } catch (e:any) {
      console.error('saveLesson', e);
      toast({ title: 'Error', description: e.message || 'No se pudo guardar la lección', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const addLesson = () => {
    setLessons(prev => [...prev, { title: '', description: '', duration_hours: 1, order_index: prev.length + 1, content: '', content_type: 'video', video_url: '' }]);
  };

  const addSection = async (title:string) => {
    if (!courseId) return;
    try {
      const { data, error } = await supabase.from('mooc_course_sections').insert([{ course_id: courseId, title, order_index: sections.length + 1 }]).select().single();
      if (error) throw error;
      setSections(prev => [...prev, { id: data.id, title: data.title, order_index: data.order_index }]);
      toast({ title: 'Sección creada' });
    } catch (e:any) {
      console.error('addSection', e);
      toast({ title: 'Error', description: e.message || 'No se pudo crear la sección', variant: 'destructive' });
    }
  };

  // Open lesson editor: if the lesson has an id navigate to the lesson editor page,
  // otherwise create a minimal lesson record and then navigate.
  const openLessonEditor = async (lessonObj: any) => {
    if (!courseId) return;
    try {
      if (lessonObj.id) {
        navigate(`/admin/mooc/course/${courseId}/lesson/${lessonObj.id}/edit`);
        return;
      }
      // create minimal lesson first
      const payload = {
        title: lessonObj.title || '',
        description: lessonObj.description || '',
        content: lessonObj.content || '',
        duration_hours: lessonObj.duration_hours || 1,
        order_index: lessonObj.order_index || lessons.length + 1,
        course_id: courseId,
        content_type: lessonObj.content_type || 'video'
      };
      const { data, error } = await supabase.from('mooc_lessons').insert([payload]).select().single();
      if (error) throw error;
      // update local state
      setLessons(prev => prev.map(l => l === lessonObj ? { ...l, id: data.id } : l));
      navigate(`/admin/mooc/course/${courseId}/lesson/${data.id}/edit`);
    } catch (e:any) {
      console.error('openLessonEditor', e);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Course image large */}
      {course?.course_image_url && (
        <div className="w-full h-56 md:h-96 rounded-lg overflow-hidden shadow">
          <img src={course.course_image_url} alt={course.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Course details full width */}
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">{course?.title || 'Editar Curso'}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Volver</Button>
            <Button onClick={handleSaveCourse} disabled={loading}>Guardar Curso</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <Label>Título</Label>
            <Input value={course?.title||''} onChange={e=>handleCourseChange('title', e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <Label>Programa</Label>
                <Input value={course?.profession||''} onChange={e=>handleCourseChange('profession', e.target.value)} />
              </div>
              <div>
                <Label>Objetivo</Label>
                <Input value={course?.objective||''} onChange={e=>handleCourseChange('objective', e.target.value)} />
              </div>
            </div>
            <div className="mt-3">
              <Label>Descripción</Label>
              <Textarea rows={4} value={course?.description||''} onChange={e=>handleCourseChange('description', e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Sections accordion */}
      {/* Exams manager: muestra y administra evaluaciones del curso */}
      {courseId && (
        <div>
          <MoocExamManager courseId={courseId} />
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Secciones</h3>
          <div className="flex gap-2">
            <Button onClick={addLesson}>Agregar Lección</Button>
            <Button onClick={() => { const t = prompt('Título de la nueva sección'); if (t) addSection(t); }} variant="outline">Agregar Sección</Button>
            <Button onClick={() => setShowExamForm(true)} variant="secondary">Crear examen</Button>
          </div>
        </div>

        {sections.length === 0 && <div className="text-sm text-muted-foreground">No hay secciones aún</div>}

        <div className="space-y-3">
          {sections.sort((a,b)=>(a.order_index||0)-(b.order_index||0)).map(s => (
            <details key={s.id} className="group border rounded-md" open>
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3 font-semibold bg-muted/30">
                <div>{s.order_index}. {s.title}</div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">{lessons.filter(l=>l.section_id===s.id).length} lecciones • {lessons.filter(l=>l.section_id===s.id).reduce((sum, l)=> sum + (l.duration_hours||0), 0)}h</div>
                </div>
              </summary>
              <div className="p-4 space-y-3">
                {lessons.filter(l=>l.section_id===s.id).map(l => (
                  <Card key={l.id || l.order_index}>
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{l.title || '(Sin título)'}</div>
                        <div className="text-sm text-muted-foreground">{l.duration_hours || 0} horas</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={async ()=>{ await openLessonEditor(l); }}>Editar</Button>
                        <Button size="sm" variant="outline" onClick={()=> setShowExamForm(true)}>Crear examen</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </details>
          ))}
        </div>

        {/* Unsectioned */}
        <details className="group border rounded-md">
          <summary className="flex items-center justify-between cursor-pointer px-4 py-3 font-semibold bg-muted/30">
            <div>Sin sección</div>
            <div className="text-sm text-muted-foreground">{lessons.filter(l=>!l.section_id).length} lecciones • {lessons.filter(l=>!l.section_id).reduce((sum, l)=> sum + (l.duration_hours||0), 0)}h</div>
          </summary>
          <div className="p-4 space-y-3">
            {lessons.filter(l=>!l.section_id).map(l => (
              <Card key={l.id || l.order_index}>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{l.title || '(Sin título)'}</div>
                    <div className="text-sm text-muted-foreground">{l.duration_hours || 0} horas</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={async ()=>{ await openLessonEditor(l); }}>Editar</Button>
                    <Button size="sm" variant="outline" onClick={()=> setShowExamForm(true)}>Crear examen</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </details>

      </div>

      {showExamForm && courseId && (
        <Dialog open={showExamForm} onOpenChange={setShowExamForm}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <MoocExamForm
                courseId={courseId}
                exam={null}
                lessons={lessons.map(l=>({ id: l.id || '', title: l.title, order_index: l.order_index }))}
                onClose={() => setShowExamForm(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
