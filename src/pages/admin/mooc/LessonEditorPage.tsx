import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { sanitizeLessonHtml } from '@/lib/html';
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Trash2, Loader2, Video, Calendar } from "lucide-react";

export default function LessonEditorPage(){
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [preview, setPreview] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [uploadingReading, setUploadingReading] = useState(false);

  useEffect(()=>{
    if(lessonId) {
      loadLesson(lessonId);
      loadReadings(lessonId);
    }
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

  const loadReadings = async (lessonId: string) => {
    try {
      const { data, error } = await supabase
        .from('mooc_readings')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      setReadings(data || []);
    } catch (e: any) {
      console.error('loadReadings', e);
      toast({ title: 'Error', description: 'No se pudieron cargar las lecturas', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !lessonId) return;

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      toast({ title: 'Error', description: 'Solo se permiten archivos PDF', variant: 'destructive' });
      return;
    }

    // Validar tamaño (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Error', description: 'El archivo no debe superar 10MB', variant: 'destructive' });
      return;
    }

    setUploadingReading(true);
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay usuario autenticado');

      // Generar nombre único
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${lessonId}/${timestamp}_${safeName}`;

      // Subir a Storage (bucket mooc-readings)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('mooc-readings')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Guardar en la base de datos
      const { error: dbError } = await supabase
        .from('mooc_readings')
        .insert({
          lesson_id: lessonId,
          title: file.name,
          type: 'file',
          file_name: safeName,
          storage_path: fileName,
          created_by: user.id
        });

      if (dbError) throw dbError;

      toast({ title: 'Lectura subida correctamente' });
      loadReadings(lessonId);
      
      // Limpiar input
      event.target.value = '';
    } catch (e: any) {
      console.error('Upload error', e);
      toast({ title: 'Error', description: e.message || 'No se pudo subir el archivo', variant: 'destructive' });
    } finally {
      setUploadingReading(false);
    }
  };

  const handleDeleteReading = async (readingId: string, storagePath: string) => {
    if (!confirm('¿Estás seguro de eliminar esta lectura?')) return;

    try {
      // Eliminar de Storage
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('mooc-readings')
          .remove([storagePath]);

        if (storageError) console.warn('Storage delete warning:', storageError);
      }

      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('mooc_readings')
        .delete()
        .eq('id', readingId);

      if (dbError) throw dbError;

      toast({ title: 'Lectura eliminada' });
      loadReadings(lessonId!);
    } catch (e: any) {
      console.error('Delete error', e);
      toast({ title: 'Error', description: e.message || 'No se pudo eliminar', variant: 'destructive' });
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
        content_type: lesson.content_type || 'video',
        video_url: lesson.video_url,
        live_platform: lesson.live_platform,
        live_url: lesson.live_url,
        live_date: lesson.live_date,
        live_time: lesson.live_time,
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
        <>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input value={lesson.title||''} onChange={e=>setLesson((p:any)=>({...p, title: e.target.value}))} />
                </div>

                <div>
                  <Label>Duración (horas)</Label>
                  <Input type="number" min={1} value={lesson.duration_hours||1} onChange={e=>setLesson((p:any)=>({...p, duration_hours: parseInt(e.target.value)||1}))} />
                </div>

                <div>
                  <Label>Tipo de Contenido</Label>
                  <Select 
                    value={lesson.content_type || 'video'} 
                    onValueChange={(val) => setLesson((p:any) => ({...p, content_type: val}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Video Grabado (YouTube, Vimeo, etc.)
                        </div>
                      </SelectItem>
                      <SelectItem value="live_session">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Sesión Sincrónica (Meet, Teams, Zoom)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos según el tipo de contenido */}
                {lesson.content_type === 'video' && (
                  <div>
                    <Label>URL del Video (YouTube, Vimeo, etc.)</Label>
                    <Input 
                      value={lesson.video_url||''} 
                      onChange={e=>setLesson((p:any)=>({...p, video_url: e.target.value}))}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Pega el enlace directo del video
                    </p>
                  </div>
                )}

                {lesson.content_type === 'live_session' && (
                  <>
                    <div>
                      <Label>Plataforma</Label>
                      <Select 
                        value={lesson.live_platform || 'meet'} 
                        onValueChange={(val) => setLesson((p:any) => ({...p, live_platform: val}))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la plataforma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meet">Google Meet</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="other">Otra</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>URL de la Sesión</Label>
                      <Input 
                        value={lesson.live_url||''} 
                        onChange={e=>setLesson((p:any)=>({...p, live_url: e.target.value}))}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Fecha</Label>
                        <Input 
                          type="date" 
                          value={lesson.live_date||''} 
                          onChange={e=>setLesson((p:any)=>({...p, live_date: e.target.value}))}
                        />
                      </div>
                      <div>
                        <Label>Hora</Label>
                        <Input 
                          type="time" 
                          value={lesson.live_time||''} 
                          onChange={e=>setLesson((p:any)=>({...p, live_time: e.target.value}))}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label>Descripción (rich text)</Label>
                  <ReactQuill theme="snow" value={lesson.description||''} onChange={(val)=>setLesson((p:any)=>({...p, description: val}))} modules={{ toolbar: [['bold','italic','underline'], [{ 'align': [] }], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link','clean']] }} />
                </div>

                <div>
                  <Label>Contenido (rich text)</Label>
                  <ReactQuill theme="snow" value={lesson.content||''} onChange={(val)=>setLesson((p:any)=>({...p, content: val}))} modules={{ toolbar: [['bold','italic','underline'], [{ 'align': [] }], [{ 'list': 'ordered' }, { 'list': 'bullet' }], ['link','clean']] }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sección de Lecturas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Lecturas (PDF)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Botón de subida */}
                <div className="flex items-center gap-4">
                  <Label 
                    htmlFor="reading-upload" 
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    {uploadingReading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Subir PDF
                      </>
                    )}
                  </Label>
                  <Input
                    id="reading-upload"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingReading}
                  />
                  <span className="text-sm text-muted-foreground">
                    Solo archivos PDF (máx. 10MB)
                  </span>
                </div>

                {/* Lista de lecturas */}
                {readings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">
                    No hay lecturas cargadas. Sube archivos PDF para que los estudiantes puedan descargarlos.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {readings.map((reading) => {
                      // Obtener URL pública si tiene storage_path
                      const fileUrl = reading.storage_path 
                        ? supabase.storage.from('mooc-readings').getPublicUrl(reading.storage_path).data.publicUrl
                        : null;
                      
                      return (
                        <div 
                          key={reading.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="font-medium">{reading.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(reading.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {fileUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(fileUrl, '_blank')}
                              >
                                Ver
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReading(reading.id, reading.storage_path)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
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
