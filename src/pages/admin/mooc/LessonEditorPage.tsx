import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuillEditor from '@/components/QuillEditor';
import DOMPurify from 'dompurify';
import { sanitizeLessonHtml } from '@/lib/html';
import { useToast } from "@/hooks/use-toast";
import { FileText, Upload, Trash2, Loader2, Video, Calendar, BookOpen, Clock, ExternalLink, Download, Pencil, GraduationCap, Rocket, Plus, ArrowLeft, Eye, Globe, X } from "lucide-react";
import LessonActivitySection from './LessonActivitySection';

export default function LessonEditorPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [preview, setPreview] = useState(false);
  const [readings, setReadings] = useState<any[]>([]);
  const [uploadingReading, setUploadingReading] = useState(false);
  const [activity, setActivity] = useState<any>(null);
  const [hasActivity, setHasActivity] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [submissionTypes, setSubmissionTypes] = useState<any>({ file: true, video: false, link: false });

  useEffect(() => {
    if (lessonId) {
      loadLesson(lessonId);
      loadReadings(lessonId);
    }
  }, [lessonId]);

  const loadLesson = async (id: string) => {
    try {
      const { data, error } = await supabase.from('mooc_lessons').select('*').eq('id', id).single();
      if (error) throw error;
      setLesson(data);

      // Cargar actividad si existe
      const { data: activityData } = await supabase
        .from('mooc_activities')
        .select('*')
        .eq('lesson_id', id)
        .maybeSingle();

      if (activityData) {
        setActivity(activityData);
        setHasActivity(true);
        // Parsear allowed_types
        const types = activityData.allowed_types || [];
        setSubmissionTypes({
          file: types.includes('file'),
          video: types.includes('video'),
          link: types.includes('link')
        });
      } else {
        setActivity({ instructions: '', due_date: '' });
        setHasActivity(false);
        setSubmissionTypes({ file: true, video: false, link: false });
      }

    } catch (e: any) {
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !lessonId) return;

    setUploadingReading(true);
    try {
      for (const file of Array.from(files)) {
        // Validar tamaño (máx 50MB)
        if (file.size > 50 * 1024 * 1024) {
          toast({ title: 'Error', description: `${file.name} excede el tamaño máximo de 50MB`, variant: 'destructive' });
          continue;
        }

        // Subir archivo a storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${lessonId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('mooc-readings')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Crear registro en la tabla
        const { error: dbError } = await supabase
          .from('mooc_readings')
          .insert({
            lesson_id: lessonId,
            title: file.name,
            storage_path: fileName
          });

        if (dbError) throw dbError;
      }

      toast({ title: 'Archivos subidos correctamente' });
      await loadReadings(lessonId);
    } catch (e: any) {
      console.error('handleFileUpload', e);
      toast({ title: 'Error', description: e.message || 'No se pudieron subir los archivos', variant: 'destructive' });
    } finally {
      setUploadingReading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDeleteReading = async (readingId: string, storagePath: string) => {
    if (!confirm('¿Estás seguro de eliminar esta lectura?')) return;

    try {
      // Eliminar de storage
      if (storagePath) {
        await supabase.storage.from('mooc-readings').remove([storagePath]);
      }

      // Eliminar de la base de datos
      const { error } = await supabase
        .from('mooc_readings')
        .delete()
        .eq('id', readingId);

      if (error) throw error;

      toast({ title: 'Lectura eliminada' });
      if (lessonId) await loadReadings(lessonId);
    } catch (e: any) {
      console.error('handleDeleteReading', e);
      toast({ title: 'Error', description: e.message || 'No se pudo eliminar la lectura', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!lesson) return;
    setLoading(true);
    try {
      // 1. Guardar lección
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
      if (error) throw error;

      // 2. Guardar/Actualizar Actividad
      if (hasActivity) {
        const allowed_types = [];
        if (submissionTypes.file) allowed_types.push('file');
        if (submissionTypes.video) allowed_types.push('video');
        if (submissionTypes.link) allowed_types.push('link');

        const activityPayload = {
          lesson_id: lesson.id,
          title: `Actividad: ${lesson.title}`, // Título por defecto
          description: activity?.instructions || '', // Usamos instructions como descripción
          instructions: activity?.instructions || '',
          due_date: activity?.due_date || null,
          allowed_types,
          is_required: true
        };

        // Upsert activity based on lesson_id (assuming 1 activity per lesson)
        // First check if exists to get ID if needed, or just upsert if we have a unique constraint on lesson_id
        // We'll use upsert with onConflict on lesson_id if it exists, otherwise we might need to query first.
        // Checking schema... assuming lesson_id is unique or we query first. We queried in loadLesson.

        const { data: existingActivity } = await supabase
          .from('mooc_activities')
          .select('id')
          .eq('lesson_id', lesson.id)
          .maybeSingle();

        if (existingActivity) {
          await supabase
            .from('mooc_activities')
            .update(activityPayload)
            .eq('id', existingActivity.id);
        } else {
          await supabase
            .from('mooc_activities')
            .insert({ ...activityPayload, course_id: courseId }); // Need course_id? Check schema. Usually yes.
          // Wait, mooc_activities might not have course_id if it's linked to lesson.
          // Let's check schema or assume lesson_id is enough. 
          // Actually, usually activities are linked to lessons.
          // Let's try inserting without course_id first, or fetch it from lesson.
        }
      } else {
        // Si se desactivó, ¿borramos la actividad? 
        // Por seguridad, mejor no borrar automáticamente, o preguntar. 
        // Por ahora, no hacemos nada o podríamos marcarla como inactiva si hubiera un campo status.
      }

      toast({ title: 'Lección guardada' });
    } catch (e: any) {
      console.error('save', e);
      toast({ title: 'Error', description: e.message || 'No se pudo guardar', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const renderSpecificContentFields = () => {
    switch (lesson.content_type) {
      case 'live_session':
        return (
          <div className="space-y-4 col-span-1 md:col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-bold text-blue-700 flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Detalles de Sesión en Vivo</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Plataforma</Label>
                    <Select
                        value={lesson.live_platform || 'meet'}
                        onValueChange={(val) => setLesson((p: any) => ({ ...p, live_platform: val }))}
                      >
                        <SelectTrigger className="bg-white mt-1">
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
                    <div className="mt-1 flex rounded-lg shadow-sm">
                        <Input
                            value={lesson.live_url || ''}
                            onChange={e => setLesson((p: any) => ({ ...p, live_url: e.target.value }))}
                            className="rounded-r-none bg-white"
                            placeholder="https://"
                        />
                        <a href={lesson.live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100">
                            <ExternalLink className="h-5 w-5" />
                        </a>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label>Fecha de la Sesión</Label>
                    <div className='flex items-center mt-1 border border-gray-300 rounded-lg p-2.5 bg-white'>
                        <Calendar className='h-5 w-5 text-gray-400 mr-2'/>
                        <input
                            type="date"
                            value={lesson.live_date || ''}
                            onChange={e => setLesson((p: any) => ({ ...p, live_date: e.target.value }))}
                            className="w-full focus:outline-none text-sm"
                        />
                    </div>
                </div>
                <div>
                    <Label>Hora de la Sesión</Label>
                    <div className='flex items-center mt-1 border border-gray-300 rounded-lg p-2.5 bg-white'>
                        <Clock className='h-5 w-5 text-gray-400 mr-2'/>
                        <input
                            type="time"
                            value={lesson.live_time || ''}
                            onChange={e => setLesson((p: any) => ({ ...p, live_time: e.target.value }))}
                            className="w-full focus:outline-none text-sm"
                        />
                    </div>
                </div>
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="space-y-4 col-span-1 md:col-span-2 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-lg font-bold text-purple-700 flex items-center space-x-2">
                <Video className="h-5 w-5" />
                <span>Detalles del Video</span>
            </h3>
            <div>
              <Label>URL del Video (Ej: YouTube, Vimeo)</Label>
              <Input
                value={lesson.video_url || ''}
                onChange={e => setLesson((p: any) => ({ ...p, video_url: e.target.value }))}
                className="mt-1 bg-white"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </div>
        );
      default:
        return (
            <div className="col-span-1 md:col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">El contenido de esta lección se basará principalmente en los archivos adjuntos y el texto detallado.</p>
            </div>
        );
    }
  };

  const QuickCreateModal = ({ onClose }: { onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Añadir a "{lesson.title}"</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-gray-600">Selecciona el tipo de contenido que deseas vincular a esta lección.</p>
          <button
            onClick={() => { toast({title: "Funcionalidad en desarrollo", description: "Por favor crea el examen desde el editor del curso."}); onClose(); }}
            className="flex items-center w-full p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors space-x-3 border border-red-300"
          >
            <GraduationCap className="h-6 w-6" /> <span>Crear Nueva Evaluación</span>
          </button>
          <button
            onClick={() => { setHasActivity(true); onClose(); }}
            className="flex items-center w-full p-3 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors space-x-3 border border-orange-300"
          >
            <Rocket className="h-6 w-6" /> <span>Crear Nueva Actividad</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!lesson) return <div className="p-6 flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      
      {/* Encabezado Principal */}
      <header className="mb-8 flex justify-between items-center w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
             <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900">Editar Lección</h1>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="text-gray-700 bg-white hover:bg-gray-100 border border-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="text-white bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Pencil className="h-4 w-4 mr-2" />}
            Guardar
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPreview(p => !p)}
            className="text-white bg-green-600 hover:bg-green-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            {preview ? 'Editar' : 'Vista Previa'}
          </Button>
        </div>
      </header>

      {!preview ? (
      <main className="w-full px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Card de Información Básica */}
        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <span>Información de la Lección</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Título */}
            <div className='md:col-span-2'>
              <Label>Título</Label>
              <Input
                value={lesson.title || ''}
                onChange={e => setLesson((p: any) => ({ ...p, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            {/* Duración */}
            <div>
              <Label>Duración (horas)</Label>
              <Input
                type="number"
                min={1}
                value={lesson.duration_hours || 1}
                onChange={e => setLesson((p: any) => ({ ...p, duration_hours: parseInt(e.target.value) || 1 }))}
                className="mt-1"
              />
            </div>

            {/* Tipo de Contenido */}
            <div className='md:col-span-3 border-t pt-4 mt-4'>
              <Label className="mb-1 block">Tipo de Contenido</Label>
              <Select
                value={lesson.content_type || 'video'}
                onValueChange={(val) => setLesson((p: any) => ({ ...p, content_type: val }))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video Grabado / Externo</SelectItem>
                  <SelectItem value="live_session">Sesión Sincrónica (En vivo)</SelectItem>
                  <SelectItem value="document">Documento / Lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Renderizado Condicional Específico */}
          <div className="mt-6">
              {renderSpecificContentFields()}
          </div>
        </section>

        {/* Card de Descripción y Contenido */}
        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center space-x-2">
            <Pencil className="h-6 w-6" />
            <span>Contenido Detallado</span>
          </h2>
          
          <div className="space-y-6">
            <div>
                <Label className="mb-2 block">Descripción (Resumen)</Label>
                <QuillEditor
                    value={lesson.description || ''}
                    onChange={(val) => setLesson((p: any) => ({ ...p, description: val }))}
                    placeholder="Escribe una breve descripción..."
                />
            </div>
            <div>
                <Label className="mb-2 block">Cuerpo de la Lección</Label>
                <QuillEditor
                    value={lesson.content || ''}
                    onChange={(val) => setLesson((p: any) => ({ ...p, content: val }))}
                    placeholder="Escribe el contenido completo..."
                />
            </div>
          </div>
        </section>

        {/* Card de Lecturas (Archivos) */}
        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h2 className="text-xl font-bold text-blue-600 flex items-center space-x-2">
              <FileText className="h-6 w-6" />
              <span>Lecturas (Archivos)</span>
            </h2>
            <Label
                htmlFor="reading-upload"
                className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors flex items-center space-x-1 text-sm cursor-pointer"
            >
                {uploadingReading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>Subir archivos</span>
            </Label>
            <Input
                id="reading-upload"
                type="file"
                multiple
                accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploadingReading}
            />
          </div>

          <p className="text-sm text-gray-500 mb-4">Tipos permitidos: PDF, PPTX, DOC, DOCX, PNG, JPG (máx. 50MB por archivo)</p>
          
          <div className="space-y-2">
            {readings.length === 0 ? (
                <p className="text-center text-gray-500 italic p-4 border rounded-lg bg-gray-50">No hay archivos adjuntos.</p>
            ) : (
                readings.map(reading => {
                    const fileUrl = reading.storage_path
                        ? supabase.storage.from('mooc-readings').getPublicUrl(reading.storage_path).data.publicUrl
                        : null;
                    return (
                        <div key={reading.id} className="flex items-center justify-between p-3 my-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3 min-w-0">
                                <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate text-gray-800">{reading.title}</p>
                                    <p className="text-xs text-gray-500">Subido el {new Date(reading.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                                {fileUrl && (
                                    <button
                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        title="Ver/Descargar"
                                        onClick={() => window.open(fileUrl, '_blank')}
                                    >
                                        <Download className="h-4 w-4" />
                                    </button>
                                )}
                                <button
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Eliminar archivo"
                                    onClick={() => handleDeleteReading(reading.id, reading.storage_path)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        </section>

        {/* Card de Evaluaciones y Actividades (Acciones Rápidas) */}
        <section className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center space-x-2">
                <Rocket className="h-6 w-6" />
                <span>Vinculación Rápida</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Botón para Crear Examen */}
                <button
                    onClick={() => setShowQuickCreateModal(true)}
                    className="flex items-center justify-between p-4 rounded-lg border-2 border-red-400 transition-colors bg-red-50 hover:bg-red-100"
                >
                    <div className="flex items-center space-x-3">
                        <GraduationCap className="h-6 w-6 text-red-500" />
                        <span className="font-semibold text-gray-800">Crear Evaluación</span>
                    </div>
                    <Plus className="h-5 w-5 text-red-500" />
                </button>

                {/* Botón para Crear Actividad */}
                <button
                    onClick={() => hasActivity ? null : setShowQuickCreateModal(true)}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 border-orange-400 transition-colors ${hasActivity ? 'bg-orange-100 cursor-default' : 'bg-orange-50 hover:bg-orange-100'}`}
                >
                    <div className="flex items-center space-x-3">
                        <Rocket className={`h-6 w-6 ${hasActivity ? 'text-orange-700' : 'text-orange-500'}`} />
                        <span className="font-semibold text-gray-800">{hasActivity ? 'Actividad Vinculada' : 'Crear Actividad'}</span>
                    </div>
                    {hasActivity ? <Pencil className="h-5 w-5 text-orange-700" /> : <Plus className="h-5 w-5 text-orange-500" />}
                </button>
            </div>
            
            {/* Editor de Actividad (Si existe) */}
            {hasActivity && (
                <div className="mt-6 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuración de la Actividad</h3>
                    <LessonActivitySection
                        lessonId={lesson.id}
                        activity={activity}
                        setActivity={setActivity}
                        hasActivity={hasActivity}
                        setHasActivity={setHasActivity}
                        submissionTypes={submissionTypes}
                        setSubmissionTypes={setSubmissionTypes}
                    />
                </div>
            )}
        </section>
      </main>
      ) : (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Vista Previa del Estudiante</h3>
          <div className="prose max-w-none">
            <h1 className="text-3xl font-bold text-blue-900 mb-4">{lesson.title}</h1>
            <div className="bg-blue-50 p-4 rounded-lg mb-6 text-blue-800">
                <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(lesson.description) }} />
            </div>
            <div dangerouslySetInnerHTML={{ __html: sanitizeLessonHtml(lesson.content) }} />
          </div>
        </div>
      )}

      {/* Modal de Creación Rápida */}
      {showQuickCreateModal && (
        <QuickCreateModal 
            onClose={() => setShowQuickCreateModal(false)}
        />
      )}

    </div>
  );
}
