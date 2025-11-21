import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Video, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react';

/**
 * Componente para crear/editar la actividad asociada a una lección.
 * Props:
 * - lessonId: string
 * - activity: objeto de actividad (puede ser null)
 * - setActivity: setter para el objeto de actividad
 * - hasActivity: booleano para toggle
 * - setHasActivity: setter para toggle
 * - submissionTypes: objeto {file, video, link}
 * - setSubmissionTypes: setter para tipos de entrega
 */
export default function LessonActivitySection({
  lessonId,
  activity,
  setActivity,
  hasActivity,
  setHasActivity,
  submissionTypes,
  setSubmissionTypes
}: {
  lessonId: string;
  activity: any;
  setActivity: (a: any) => void;
  hasActivity: boolean;
  setHasActivity: (b: boolean) => void;
  submissionTypes: { file: boolean; video: boolean; link: boolean };
  setSubmissionTypes: (s: any) => void;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${hasActivity ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'}`}>
      {/* Header del Módulo con Toggle */}
      <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50 border-b border-gray-100 cursor-pointer" onClick={() => setHasActivity(!hasActivity)}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hasActivity ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            <UploadCloud size={20} />
          </div>
          <div>
            <h3 className={`font-semibold ${hasActivity ? 'text-blue-900' : 'text-gray-600'}`}>Evaluación y Entrega</h3>
            <p className="text-xs text-gray-500">Habilita esta opción si el estudiante debe enviar un trabajo.</p>
          </div>
        </div>
        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${hasActivity ? 'bg-blue-600' : 'bg-gray-300'}`}>
          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${hasActivity ? 'translate-x-6' : 'translate-x-0'}`}></div>
        </div>
      </div>
      {/* Contenido Expandible */}
      {hasActivity && (
        <div className="p-6 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="space-y-6">
            {/* Selector de Tipos de Entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Qué tipo de evidencia debe enviar el estudiante?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Opción: Archivo */}
                <button 
                  type="button"
                  onClick={() => setSubmissionTypes((prev:any) => ({ ...prev, file: !prev.file }))}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${submissionTypes.file ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {submissionTypes.file && <div className="absolute top-3 right-3 text-blue-500"><CheckCircle2 size={18} /></div>}
                  <FileText size={24} className={`mb-2 ${submissionTypes.file ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-semibold text-sm text-gray-800">Archivo</div>
                  <div className="text-xs text-gray-500 mt-1">PDF, Word, Imagen</div>
                </button>
                {/* Opción: Video */}
                <button 
                  type="button"
                  onClick={() => setSubmissionTypes((prev:any) => ({ ...prev, video: !prev.video }))}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${submissionTypes.video ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {submissionTypes.video && <div className="absolute top-3 right-3 text-blue-500"><CheckCircle2 size={18} /></div>}
                  <Video size={24} className={`mb-2 ${submissionTypes.video ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-semibold text-sm text-gray-800">Video</div>
                  <div className="text-xs text-gray-500 mt-1">MP4 o Grabación</div>
                </button>
                {/* Opción: Enlace */}
                <button 
                  type="button"
                  onClick={() => setSubmissionTypes((prev:any) => ({ ...prev, link: !prev.link }))}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${submissionTypes.link ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  {submissionTypes.link && <div className="absolute top-3 right-3 text-blue-500"><CheckCircle2 size={18} /></div>}
                  <LinkIcon size={24} className={`mb-2 ${submissionTypes.link ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="font-semibold text-sm text-gray-800">Enlace Externo</div>
                  <div className="text-xs text-gray-500 mt-1">YouTube, Drive, Web</div>
                </button>
              </div>
            </div>
            {/* Instrucciones de la Actividad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instrucciones de la Actividad
              </label>
              <textarea 
                className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all min-h-[100px]"
                placeholder="Explica detalladamente qué debe realizar el estudiante..."
                value={activity?.instructions || ''}
                onChange={e => setActivity((prev:any) => ({ ...prev, instructions: e.target.value }))}
              ></textarea>
            </div>
            {/* Fecha límite */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha límite de entrega</label>
              <input 
                type="date"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={activity?.due_date || ''}
                onChange={e => setActivity((prev:any) => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
            {/* Nota de advertencia */}
            <div className="flex gap-3 p-3 bg-amber-50 text-amber-800 rounded-lg text-xs border border-amber-100">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>Recuerda explicar claramente qué debe entregar el estudiante y la fecha límite.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
