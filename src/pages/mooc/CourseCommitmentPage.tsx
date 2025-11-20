import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, BookOpen, GraduationCap, AlertCircle, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CourseCommitmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    if (id) {
      loadCourse(id);
    }
  }, [id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setCurrentUser(user);
  };

  const loadCourse = async (courseId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("mooc_courses")
        .select("title, course_image_url")
        .eq("id", courseId)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error) {
      console.error("Error loading course:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del curso",
        variant: "destructive",
      });
      navigate('/mooc');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!isChecked || !id || !currentUser) return;

    try {
      setIsSubmitted(true);
      
      // Verify if already enrolled to avoid duplicates
      const { data: existing } = await supabase
        .from("mooc_enrollments")
        .select("id")
        .eq("course_id", id)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (existing) {
        toast({
          title: "Ya estás inscrito",
          description: "Continuarás desde donde lo dejaste",
        });
        navigate("/dashboard");
        return;
      }

      // Create enrollment
      const { error } = await supabase
        .from("mooc_enrollments")
        .insert({
          course_id: id,
          user_id: currentUser.id,
          progress: 0,
          completed: false,
        });

      if (error) throw error;

      toast({
        title: "¡Inscrito exitosamente!",
        description: "Bienvenido al curso",
      });
      
      // Small delay for UX
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (error: any) {
      console.error("Error enrolling:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la inscripción. Intenta de nuevo.",
        variant: "destructive",
      });
      setIsSubmitted(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#003366]" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      
      {/* Main Card Container */}
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Band - University Colors */}
        <div className="bg-[#003366] p-2"></div>

        {/* Logo and Branding Section */}
        <div className="p-8 border-b border-slate-100 relative">
            <Button 
                variant="ghost"
                onClick={() => navigate(`/mooc/${id}`)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
                Cancelar
            </Button>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* LOGO */}
            <div className="flex-shrink-0">
              <img 
                src="https://udes.edu.co/images/logo/logo-con-acreditada-color.png" 
                alt="Logo Universidad de Santander" 
                className="h-20 object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
            
            <div className="text-center md:text-right">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Dirección de Relaciones Nacionales e Internacionales</h2>
              <h1 className="text-2xl font-extrabold text-[#003366] mt-1">Portal E-Exchange</h1>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-800 text-xs font-semibold rounded-full border border-blue-100">
                Programa de Cursos MOOC
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-8 md:p-10 space-y-8">
          
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center gap-2 text-[#003366] mb-2">
                <ArrowLeft className="w-4 h-4 cursor-pointer hover:underline" onClick={() => navigate(`/mooc/${id}`)} />
                <span className="text-sm font-semibold uppercase tracking-wide">Volver al detalle del curso</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">Mi Compromiso Académico</h3>
            <p className="text-lg text-slate-600">
              Estás a punto de inscribirte en el curso: <br/>
              <span className="font-bold text-[#003366] text-xl">{course.title}</span>
            </p>
            <p className="text-slate-600">
              Antes de continuar, es importante formalizar tu participación.
            </p>
          </div>

          {/* The Benefit Statement Box */}
          <div className="bg-blue-50 border-l-4 border-[#003366] p-6 rounded-r-lg">
            <div className="flex items-start gap-4">
              <GraduationCap className="w-8 h-8 text-[#003366] flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-[#003366] text-lg mb-2">Beca de Formación 100% Subsidiada</h4>
                <p className="text-slate-700 leading-relaxed">
                  La <strong>Universidad de Santander (UDES)</strong>, a través de su portal E-Exchange, te brinda la posibilidad de formarte 
                  <strong> sin costo alguno</strong>. Este es un beneficio exclusivo que la institución otorga dentro de su programa de cursos MOOC 
                  para fomentar la excelencia académica y el acceso al conocimiento global.
                </p>
              </div>
            </div>
          </div>

          {/* Motivational / Strategy Section */}
          <div className="space-y-4">
            <p className="font-medium text-slate-900">Para honrar este beneficio, adoptaré las siguientes actitudes:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
                  <BookOpen size={18} />
                </div>
                <span className="text-sm text-slate-700 font-medium">Dedicación y Disciplina constante</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-sm text-slate-700 font-medium">Finalizaré todas las actividades</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                  <AlertCircle size={18} />
                </div>
                <span className="text-sm text-slate-700 font-medium">Pediré ayuda cuando me atasque</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-sm text-slate-700 font-medium">Honestidad en mis evaluaciones</span>
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Commitment Checkbox Section */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-center mt-1">
                <input 
                  type="checkbox" 
                  className="peer h-6 w-6 cursor-pointer appearance-none rounded-md border-2 border-slate-300 bg-white checked:border-[#003366] checked:bg-[#003366] transition-all"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                />
                <CheckCircle2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
              </div>
              <div className="flex-1">
                <span className={`block text-lg font-bold transition-colors ${isChecked ? 'text-[#003366]' : 'text-slate-800'}`}>
                  Acepto el compromiso
                </span>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  Entiendo que al tomar este curso gratuito, asumo la responsabilidad de <strong>culminarlo satisfactoriamente</strong>. 
                  Acepto cumplir con los <a href="#" className="text-[#003366] underline decoration-dotted hover:decoration-solid">términos y condiciones específicos</a> establecidos 
                  para este programa académico.
                </p>
              </div>
            </label>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2 gap-4">
            <button
                onClick={() => navigate(`/mooc/${id}`)}
                className="px-6 py-4 rounded-lg font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
                Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isChecked || isSubmitted}
              className={`
                flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg
                ${isChecked 
                  ? 'bg-[#003366] hover:bg-[#002a55] text-white transform hover:-translate-y-1' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }
              `}
            >
              {isSubmitted ? 'Procesando...' : 'Iniciar el Curso'}
              {!isSubmitted && <ChevronRight size={20} />}
            </button>
          </div>

        </div>
        
        {/* Footer Strip */}
        <div className="bg-slate-100 p-4 text-center border-t border-slate-200">
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Universidad de Santander - Todos los derechos reservados.</p>
        </div>

      </div>
    </div>
  );
}
