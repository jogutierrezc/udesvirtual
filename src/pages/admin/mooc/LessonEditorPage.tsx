import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { sanitizeLessonHtml } from '@/lib/html';
import { useToast } from "@/hooks/use-toast";

export default function LessonEditorPage(){
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [preview, setPreview] = useState(false);

  useEffect(()=>{
    if(lessonId) loadLesson(lessonId);
  }, [lessonId]);

  const loadLesson = async (id:string) => {
    try{
      const { data, error } = await supabase.from('mooc_lessons').select('*').eq('id', id).single();
      if(error) throw error;
      setLesson(data);
    }catch(e:any){
      console.error('loadLesson', e);
      toast({ title: 'Error', description: e.message || 'No se pudo cargar la lección', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if(!lesson) return;
    setLoading(true);
    try{
      const { error } = await supabase.from('mooc_lessons').update({
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        duration_hours: lesson.duration_hours,
        content_type: lesson.content_type,
        video_url: lesson.video_url,
      }).eq('id', lesson.id);
      if(error) throw error;
      toast({ title: 'Lección guardada' });
    }catch(e:any){
      console.error('save', e);
      toast({ title: 'Error', description: e.message || 'No se pudo guardar', variant: 'destructive' });
    }finally{ setLoading(false); }
  };

  if(!lesson) return <div className="p-6">Cargando lección...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Editar Lección</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={()=> navigate(-1)}>Volver</Button>
          <Button onClick={handleSave} disabled={loading}>Guardar</Button>
          <Button variant="ghost" onClick={() => setPreview(p => !p)}>{preview? 'Ocultar vista previa' : 'Vista previa estudiante'}</Button>
        </div>
      </div>

      {!preview ? (
        <Card>
          <CardContent>
            <div className="space-y-4">
              <Label>Título</Label>
              <Input value={lesson.title||''} onChange={e=>setLesson((p:any)=>({...p, title: e.target.value}))} />

              <Label>Duración (horas)</Label>
              <Input type="number" min={1} value={lesson.duration_hours||1} onChange={e=>setLesson((p:any)=>({...p, duration_hours: parseInt(e.target.value)||1}))} />

              <Label>Descripción (rich text)</Label>
              <ReactQuill theme="snow" value={lesson.description||''} onChange={(val)=>setLesson((p:any)=>({...p, description: val}))} modules={{ toolbar: [['bold','italic','underline'], [{ 'align': [] }], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link','clean']] }} />

              <Label>Contenido (rich text)</Label>
              <ReactQuill theme="snow" value={lesson.content||''} onChange={(val)=>setLesson((p:any)=>({...p, content: val}))} modules={{ toolbar: [['bold','italic','underline'], [{ 'align': [] }], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link','clean']] }} />

              <Label>URL Video / Encuentro</Label>
              <Input value={lesson.video_url||''} onChange={e=>setLesson((p:any)=>({...p, video_url: e.target.value}))} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-3">Vista previa (estudiante)</h3>
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(lesson.description) }} />
            <div className="mt-4" dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(lesson.content) }} />
          </div>
        </div>
      )}
    </div>
  );
}
