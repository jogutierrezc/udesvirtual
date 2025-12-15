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
import { Trash2, Menu, BookOpen, ClipboardList, GraduationCap, GripVertical, ChevronDown, ChevronUp, Pencil, Eye, EyeOff, Plus, Rocket, X, FileText, ArrowLeft, Save, Calendar, Clock } from "lucide-react";

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

type Section = { 
  id?: string; 
  title: string; 
  description?: string; 
  order_index: number; 
  is_published?: boolean;
  available_from?: string | null;
  available_until?: string | null;
};

export default function CourseEditorPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [categories, setCategories] = useState<Array<{id:string; title:string}>>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number | null>(null);
  const [showExamForm, setShowExamForm] = useState(false);
  const [showCreateLessonDialog, setShowCreateLessonDialog] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonSectionId, setNewLessonSectionId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [examsExpanded, setExamsExpanded] = useState(true);
  
  // Section editing state
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showSectionSettings, setShowSectionSettings] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    loadCourse(courseId);
    loadLessons(courseId);
    loadSections(courseId);
    loadCategories();
  }, [courseId]);

  const loadCategories = async () => {
    try {
      const { data } = await supabase.from('mooc_categories').select('id, title').order('title');
      setCategories((data as any) || []);
    } catch (e) {
      console.error('Error loading categories', e);
    }
  };

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
      setSections((data||[]).map((s:any)=>({ 
        id: s.id, 
        title: s.title, 
        description: s.description, 
        order_index: s.order_index,
        is_published: s.is_published !== false,
        available_from: s.available_from,
        available_until: s.available_until
      })));
    } catch (e:any) {
      console.error('loadSections', e);
    }
  };

  const handleUpdateSection = async () => {
    if (!editingSection || !editingSection.id) return;
    
    try {
      const { error } = await supabase
        .from('mooc_course_sections')
        .update({
          title: editingSection.title,
          available_from: editingSection.available_from || null,
          available_until: editingSection.available_until || null
        })
        .eq('id', editingSection.id);

      if (error) throw error;

      setSections(prev => prev.map(s => s.id === editingSection.id ? editingSection : s));
      toast({ title: "Sección actualizada" });
      setShowSectionSettings(false);
      setEditingSection(null);
    } catch (e) {
      console.error('Error updating section', e);
      toast({ title: "Error", description: "No se pudo actualizar la sección", variant: "destructive" });
    }
  };

  const toggleSectionVisibility = async (sectionId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('mooc_course_sections')
        .update({ is_published: !currentStatus })
        .eq('id', sectionId);
      
      if (error) throw error;
      
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, is_published: !currentStatus } : s));
      toast({ title: !currentStatus ? "Sección publicada" : "Sección ocultada" });
    } catch (e) {
      console.error('Error toggling visibility', e);
      toast({ title: "Error", description: "No se pudo cambiar la visibilidad", variant: "destructive" });
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
        intro_video_url: course.intro_video_url,
        category_id: course.category_id || null
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

  const addLesson = async () => {
    setNewLessonTitle("");
    setNewLessonSectionId(null);
    setShowCreateLessonDialog(true);
  };

  const handleCreateLesson = async () => {
    if (!courseId || !newLessonTitle.trim()) return;
    
    try {
      const payload = {
        title: newLessonTitle,
        description: '',
        duration_hours: 1,
        order_index: lessons.length + 1,
        course_id: courseId,
        content_type: 'video',
        content: '',
        section_id: newLessonSectionId === 'none' ? null : newLessonSectionId
      };
      
      const { data, error } = await supabase.from('mooc_lessons').insert([payload]).select().single();
      if (error) throw error;

      setLessons(prev => [...prev, { ...payload, id: data.id }]);
      toast({ title: 'Lección creada', description: 'La lección ha sido creada exitosamente.' });
      setShowCreateLessonDialog(false);
    } catch (e:any) {
      console.error('addLesson', e);
      toast({ title: 'Error', description: e.message || 'No se pudo crear la lección', variant: 'destructive' });
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta lección? Esta acción no se puede deshacer.")) return;
    
    try {
      const { error } = await supabase.from('mooc_lessons').delete().eq('id', lessonId);
      if (error) throw error;
      
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      toast({ title: 'Lección eliminada' });
    } catch (e:any) {
      console.error('deleteLesson', e);
      toast({ title: 'Error', description: 'No se pudo eliminar la lección', variant: 'destructive' });
    }
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

  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const getContentIcon = (type: 'lesson' | 'activity' | 'exam') => {
    switch (type) {
      case 'lesson': return { Icon: BookOpen, color: 'text-blue-500' };
      case 'activity': return { Icon: Rocket, color: 'text-orange-500' };
      case 'exam': return { Icon: GraduationCap, color: 'text-red-500' };
      default: return { Icon: ClipboardList, color: 'text-gray-500' };
    }
  };

  const CreationModal = ({ onClose }: { onClose: () => void }) => {
    const [selectedType, setSelectedType] = useState<'section' | 'lesson' | 'activity' | 'exam' | null>(null);
    const [targetSectionId, setTargetSectionId] = useState(sections[0]?.id || '');

    const handleConfirm = () => {
      if (selectedType === 'section') {
        const title = prompt('Título de la nueva sección');
        if (title) addSection(title);
        onClose();
      } else if (selectedType === 'lesson') {
        setNewLessonTitle("");
        setNewLessonSectionId(targetSectionId === 'none' ? null : targetSectionId);
        setShowCreateLessonDialog(true);
        onClose();
      } else if (selectedType === 'exam') {
        setShowExamForm(true);
        onClose();
      } else if (selectedType === 'activity') {
        alert("Funcionalidad de actividad en desarrollo");
        onClose();
      }
    };

    const CreationOption = ({ type, icon, title, description }: any) => (
      <button
        onClick={() => setSelectedType(type)}
        className={`flex items-start p-4 border rounded-lg transition-all text-left w-full ${selectedType === type ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:border-blue-400'}`}
      >
        <div className={`p-2 rounded-full ${type === 'section' ? 'bg-gray-100' : type === 'lesson' ? 'bg-blue-100' : type === 'activity' ? 'bg-orange-100' : 'bg-red-100'}`}>
          {icon}
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </button>
    );

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
          <div className="p-5 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">{selectedType ? `Crear Nuevo ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}` : 'Crear Contenido'}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><X className="h-5 w-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            {!selectedType && (
              <div className="space-y-3">
                <CreationOption type="section" icon={<ClipboardList className="h-6 w-6 text-gray-600" />} title="Nueva Sección" description="Organiza el contenido en módulos." />
                <CreationOption type="lesson" icon={<BookOpen className="h-6 w-6 text-blue-600" />} title="Nueva Lección" description="Unidad de aprendizaje con video/texto." />
                <CreationOption type="activity" icon={<Rocket className="h-6 w-6 text-orange-600" />} title="Nueva Actividad" description="Tareas o elementos interactivos." />
                <CreationOption type="exam" icon={<GraduationCap className="h-6 w-6 text-red-600" />} title="Nueva Evaluación" description="Cuestionarios o exámenes." />
              </div>
            )}
            {(selectedType === 'lesson' || selectedType === 'activity') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Sección de Destino</label>
                <select value={targetSectionId} onChange={(e) => setTargetSectionId(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 border">
                  <option value="none">Sin sección</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              </div>
            )}
            <div className="flex justify-between pt-4">
              <button onClick={() => setSelectedType(null)} className={`px-4 py-2 text-sm font-medium rounded-lg ${selectedType ? 'text-gray-600 hover:bg-gray-100' : 'hidden'}`}>← Volver</button>
              <button onClick={handleConfirm} disabled={!selectedType} className={`px-6 py-2 text-sm font-semibold rounded-lg ${!selectedType ? 'hidden' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>Continuar</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      <style>{`
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fade-in-up { animation: fadeInScale 0.2s ease-out forwards; }
      `}</style>

      {/* New Sticky Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>
              <div className="flex flex-col">
                 <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 truncate max-w-[200px] sm:max-w-md">
                    {course?.title || 'Cargando curso...'}
                 </h1>
                 <span className="text-xs text-gray-500 font-medium">Editor de Contenido</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSaveCourse} 
                  disabled={loading} 
                  className="hidden sm:flex text-gray-600 hover:text-blue-600 hover:bg-blue-50"
               >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
               </Button>
               <button 
                  onClick={() => setShowCreationModal(true)} 
                  className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
               >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Crear
               </button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Course Details Collapsible */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 max-w-full mx-auto">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gray-500" />
                Información General
              </h2>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <Label className="text-gray-600">Título del Curso</Label>
                  <Input 
                    value={course?.title||''} 
                    onChange={e=>handleCourseChange('title', e.target.value)} 
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
              </div>
              <div className="space-y-2">
                  <Label className="text-gray-600">Descripción Corta</Label>
                  <Input 
                    value={course?.description||''} 
                    onChange={e=>handleCourseChange('description', e.target.value)} 
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                  />
              </div>
           </div>
        </div>

        {/* Main Content - Full Width */}
        <main className="space-y-4 w-full mx-auto">
            {sections.sort((a,b)=>(a.order_index||0)-(b.order_index||0)).map(section => {
                const sectionLessons = lessons.filter(l => l.section_id === section.id);
                const isExpanded = expandedSections[section.id!] !== false;

                return (
                    <div key={section.id} className="bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
                        {/* Section Header */}
                        <div 
                            className={`flex items-center justify-between p-4 cursor-pointer select-none ${isExpanded ? 'border-b border-gray-100' : ''}`}
                            onClick={() => toggleSectionExpansion(section.id!)}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400 cursor-grab active:cursor-grabbing hover:bg-gray-100 hover:text-gray-600 transition-colors" onClick={(e) => e.stopPropagation()}>
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <h2 className={`text-lg font-bold flex items-center gap-2 ${section.is_published !== false ? 'text-gray-800' : 'text-gray-400'}`}>
                                      {section.title}
                                      {section.is_published === false && (
                                          <span className="text-xs font-normal px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                            Oculto
                                          </span>
                                      )}
                                      <span className="text-xs font-normal px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                        {sectionLessons.length} items
                                      </span>
                                      {(section.available_from || section.available_until) && (
                                        <span className="text-xs font-normal px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {section.available_from ? new Date(section.available_from).toLocaleDateString() : 'Inicio'} 
                                          {' - '}
                                          {section.available_until ? new Date(section.available_until).toLocaleDateString() : 'Fin'}
                                        </span>
                                      )}
                                    </h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className={`p-2 rounded-full transition-colors ${section.is_published !== false ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSectionVisibility(section.id!, section.is_published !== false);
                                    }}
                                    title={section.is_published !== false ? "Visible para estudiantes" : "Oculto para estudiantes"}
                                >
                                    {section.is_published !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                                <button 
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setEditingSection(section);
                                    setShowSectionSettings(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <div className="p-2 text-gray-400">
                                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                </div>
                            </div>
                        </div>

                        {/* Section Content */}
                        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                            <div className="p-2 space-y-2 bg-gray-50/50 rounded-b-xl">
                                {sectionLessons.length > 0 ? (
                                    sectionLessons.map(lesson => {
                                        const { Icon, color } = getContentIcon('lesson');
                                        return (
                                            <div key={lesson.id} className="group flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <GripVertical className="h-4 w-4 text-gray-300 group-hover:text-gray-500 cursor-grab" />
                                                    <div className={`p-2 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
                                                      <Icon className={`h-5 w-5 ${color}`} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-800">{lesson.title}</span>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                          <span className="uppercase tracking-wider font-semibold">Lección</span>
                                                          <span>•</span>
                                                          <span>{lesson.duration_hours}h</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openLessonEditor(lesson)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                      <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => deleteLesson(lesson.id!)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                      <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-8 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
                                      <p className="text-gray-400 text-sm">Esta sección está vacía</p>
                                      <button onClick={() => setShowCreationModal(true)} className="mt-2 text-blue-600 text-sm font-medium hover:underline">Agregar contenido</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Unsectioned Lessons */}
            {lessons.filter(l => !l.section_id).length > 0 && (
                <div className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden">
                    <div className="bg-yellow-50 px-4 py-3 border-b border-yellow-100 flex items-center gap-2">
                      <div className="p-1 bg-yellow-100 rounded text-yellow-600">
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <h3 className="font-bold text-yellow-800">Contenido sin asignar</h3>
                    </div>
                    <div className="p-2 space-y-2 bg-gray-50">
                        {lessons.filter(l => !l.section_id).map(lesson => (
                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                                 <div className="flex items-center gap-3">
                                    <BookOpen className="h-5 w-5 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">{lesson.title}</span>
                                 </div>
                                 <div className="flex gap-2">
                                    <button onClick={() => openLessonEditor(lesson)} className="p-1 hover:bg-gray-100 rounded"><Pencil className="h-4 w-4 text-gray-500" /></button>
                                    <button onClick={() => deleteLesson(lesson.id!)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="h-4 w-4 text-red-500" /></button>
                                 </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Exams Section */}
            {courseId && (
                <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:shadow-md">
                    <div 
                        className={`flex items-center justify-between p-4 cursor-pointer select-none ${examsExpanded ? 'border-b border-gray-100' : ''}`}
                        onClick={() => setExamsExpanded(!examsExpanded)}
                    >
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-2 bg-red-50 rounded-lg text-red-500">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-800">Evaluaciones y Certificación</h2>
                        </div>
                        <div className="p-2 text-gray-400">
                            {examsExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </div>
                    </div>
                    
                    <div className={`transition-all duration-300 ease-in-out ${examsExpanded ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                        <div className="p-6">
                            <MoocExamManager courseId={courseId} />
                        </div>
                    </div>
                </div>
            )}
        </main>
      </div>

      {showCreationModal && <CreationModal onClose={() => setShowCreationModal(false)} />}

      {showExamForm && courseId && (
        <Dialog open={showExamForm} onOpenChange={setShowExamForm}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-0 overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <MoocExamForm
                courseId={courseId}
                exam={null}
                lessons={lessons.map(l=>({ id: l.id || '', title: l.title, order_index: l.order_index }))}
                onClose={(refresh) => {
                  setShowExamForm(false);
                  if (refresh && courseId) loadLessons(courseId);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showSectionSettings} onOpenChange={setShowSectionSettings}>
        <DialogContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configuración de la Sección</h3>
            <div>
              <Label>Título</Label>
              <Input 
                value={editingSection?.title || ''} 
                onChange={(e) => setEditingSection(prev => prev ? { ...prev, title: e.target.value } : null)} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Disponible desde</Label>
                <Input 
                  type="datetime-local"
                  value={editingSection?.available_from ? new Date(editingSection.available_from).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingSection(prev => prev ? { ...prev, available_from: e.target.value ? new Date(e.target.value).toISOString() : null } : null)}
                />
              </div>
              <div>
                <Label>Disponible hasta</Label>
                <Input 
                  type="datetime-local"
                  value={editingSection?.available_until ? new Date(editingSection.available_until).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingSection(prev => prev ? { ...prev, available_until: e.target.value ? new Date(e.target.value).toISOString() : null } : null)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSectionSettings(false)}>Cancelar</Button>
              <Button onClick={handleUpdateSection}>Guardar Cambios</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateLessonDialog} onOpenChange={setShowCreateLessonDialog}>
        <DialogContent>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Nueva Lección</h3>
            <div>
              <Label>Título de la lección</Label>
              <Input 
                value={newLessonTitle} 
                onChange={(e) => setNewLessonTitle(e.target.value)} 
                placeholder="Ej: Introducción al tema"
              />
            </div>
            <div>
              <Label>Sección (Opcional)</Label>
              <Select 
                value={newLessonSectionId || "none"} 
                onValueChange={(val) => setNewLessonSectionId(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sección" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sección</SelectItem>
                  {sections.map(s => (
                    <SelectItem key={s.id} value={s.id || "unknown"}>{s.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateLessonDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateLesson} disabled={!newLessonTitle.trim()}>Crear Lección</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
