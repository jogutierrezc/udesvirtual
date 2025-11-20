import React, { useState } from 'react';
import { CheckCircle2, BookOpen, GraduationCap, AlertCircle, ChevronRight } from 'lucide-react';

interface CourseCommitmentProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CourseCommitment({ onConfirm, onCancel }: CourseCommitmentProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleStart = () => {
    if (isChecked) {
      setIsSubmitted(true);
      // Simulate a small delay or just call onConfirm
      setTimeout(() => {
        onConfirm();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 font-sans text-slate-800 overflow-y-auto">
      
      {/* Main Card Container */}
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header Band - University Colors */}
        <div className="bg-[#003366] p-2"></div>

        {/* Logo and Branding Section */}
        <div className="p-8 border-b border-slate-100 relative">
            <button 
                onClick={onCancel}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Cerrar"
            >
                ✕
            </button>
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
            <h3 className="text-3xl font-bold text-slate-900">Mi Compromiso Académico</h3>
            <p className="text-lg text-slate-600">
              Estás a punto de iniciar tu aprendizaje. Antes de continuar, es importante formalizar tu participación.
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
                onClick={onCancel}
                className="px-6 py-4 rounded-lg font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
                Cancelar
            </button>
            <button
              onClick={handleStart}
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
