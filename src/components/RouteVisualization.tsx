import React, { useState, useMemo } from 'react';
import { Check, Lock, ChevronRight, ArrowLeft, Target, Award } from 'lucide-react';

// Interfaz para los pasos de la ruta
interface RouteStep {
  id: string;
  title: string;
  description: string | null;
  points_required: number;
  order_index: number;
}

// Props del componente
interface RouteVisualizationProps {
  routeName: string;
  routeDescription?: string;
  steps: RouteStep[];
  currentPoints: number;
  pathwayType: string;
  onBack: () => void;
}

// Componente de visualización de ruta
const RouteVisualization: React.FC<RouteVisualizationProps> = ({
  routeName,
  routeDescription,
  steps,
  currentPoints,
  pathwayType,
  onBack
}) => {
  // Calcular progreso general
  const { totalRequiredPoints, completedSteps, progressPercentage, currentStepIndex } = useMemo(() => {
    if (steps.length === 0) return {
      totalRequiredPoints: 0,
      completedSteps: [],
      progressPercentage: 0,
      currentStepIndex: -1
    };

    const sortedSteps = [...steps].sort((a, b) => a.order_index - b.order_index);
    const total = sortedSteps[sortedSteps.length - 1].points_required;
    const completed = sortedSteps.filter(step => step.points_required <= currentPoints);
    const percentage = Math.min(100, (currentPoints / total) * 100);

    // Encontrar el paso actual (el primero que no está completado)
    const currentIndex = sortedSteps.findIndex(step => step.points_required > currentPoints);

    return {
      totalRequiredPoints: total,
      completedSteps: completed.map(step => step.id),
      progressPercentage: percentage,
      currentStepIndex: currentIndex === -1 ? sortedSteps.length - 1 : currentIndex
    };
  }, [steps, currentPoints]);

  const getStepStatus = (step: RouteStep, index: number) => {
    if (completedSteps.includes(step.id)) {
      return 'completed';
    }
    if (index === currentStepIndex) {
      return 'current';
    }
    return 'pending';
  };

  const getPathwayColor = (type: string) => {
    if (type === "conocimiento") return "border-blue-600 bg-blue-50";
    if (type === "descubrimiento") return "border-green-600 bg-green-50";
    if (type === "impacto_social") return "border-orange-600 bg-orange-50";
    return "border-purple-600 bg-purple-50";
  };

  const getPathwayIcon = (type: string) => {
    if (type === "conocimiento") return <Target className="h-6 w-6 text-blue-600" />;
    if (type === "descubrimiento") return <ChevronRight className="h-6 w-6 text-green-600" />;
    if (type === "impacto_social") return <Award className="h-6 w-6 text-orange-600" />;
    return <Target className="h-6 w-6 text-purple-600" />;
  };

  const sortedSteps = [...steps].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header con botón de volver */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a Mis Rutas
          </button>

          <div className={`backdrop-blur-2xl bg-white/80 rounded-3xl border border-white/60 shadow-2xl p-8 ${getPathwayColor(pathwayType)}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-4 border border-white/30">
                {getPathwayIcon(pathwayType)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{routeName}</h1>
                {routeDescription && (
                  <p className="text-gray-600 mt-1">{routeDescription}</p>
                )}
              </div>
            </div>

            {/* Barra de progreso general */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                <span>Progreso Actual: <span className="font-bold text-gray-800">{currentPoints} puntos</span></span>
                <span>Meta Total: <span className="font-bold text-gray-800">{totalRequiredPoints} puntos</span></span>
                <span>Completado: <span className="font-bold text-gray-800">{progressPercentage.toFixed(1)}%</span></span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 via-yellow-400 to-red-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <div className="text-center text-sm text-gray-600">
                {completedSteps.length} de {steps.length} pasos completados
              </div>
            </div>
          </div>
        </div>

        {/* Timeline de pasos */}
        <div className="relative p-4">
          {/* Línea de conexión principal */}
          <div
            className="absolute left-0 top-0 h-full w-1 bg-gray-200 ml-5 transform translate-x-1/2 rounded-full"
            aria-hidden="true"
          ></div>

          {sortedSteps.map((step, index) => {
            const status = getStepStatus(step, index);
            const isCompleted = status === 'completed';
            const isActive = status === 'current';

            // Estilos dinámicos
            const iconBg = isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-300';
            const iconBorder = isCompleted ? 'border-green-700' : isActive ? 'border-blue-700' : 'border-gray-500';
            const textColor = isCompleted ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-gray-500';

            // Determinar si la línea que conecta debe estar coloreada
            const isPreviousCompleted = index > 0 && completedSteps.includes(sortedSteps[index - 1].id);
            const lineFillColor = isPreviousCompleted || isCompleted ? 'bg-green-500' : 'bg-gray-200';

            return (
              <div key={step.id} className="relative mb-8 last:mb-0">
                {/* Línea de progreso rellenada */}
                {index > 0 && (
                  <div
                    className={`absolute left-0 top-[-8px] h-4 w-1 ml-5 transform translate-x-1/2 rounded-full ${lineFillColor}`}
                    style={{ height: '50px' }}
                  ></div>
                )}

                {/* Contenedor del Paso */}
                <div className="flex items-start">
                  {/* Icono del checkpoint */}
                  <div className={`z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 ${iconBg} ${iconBorder} text-white shrink-0 shadow-lg mr-6`}>
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : isActive ? (
                      <ChevronRight className="w-6 h-6 animate-pulse" />
                    ) : (
                      <Lock className="w-6 h-6" />
                    )}
                  </div>

                  {/* Tarjeta de Contenido */}
                  <div className={`flex-1 backdrop-blur-xl bg-white/80 p-6 rounded-2xl border border-white/50 shadow-lg transition-all duration-300 ${isActive ? 'ring-4 ring-blue-200/80 shadow-2xl' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className={`text-xl font-bold ${textColor}`}>
                        Paso {step.order_index}: {step.title}
                      </h3>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        isCompleted
                          ? 'bg-green-100 text-green-800'
                          : isActive
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isCompleted ? 'COMPLETADO' : isActive ? 'EN PROGRESO' : 'PENDIENTE'}
                      </span>
                    </div>

                    {step.description && (
                      <p className="text-sm text-gray-600 mb-4">{step.description}</p>
                    )}

                    <div className="border-t border-dashed pt-3 flex justify-between items-center text-sm font-medium text-gray-500">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span>
                          {isCompleted ? (
                            `¡Completado con ${step.points_required} puntos!`
                          ) : (
                            `Requiere ${step.points_required} puntos`
                          )}
                        </span>
                      </div>

                      {isActive && (
                        <span className="text-blue-600 font-semibold">
                          🎯 META ACTUAL
                        </span>
                      )}
                    </div>

                    {/* Barra de progreso individual del paso */}
                    {isActive && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, (currentPoints / step.points_required) * 100)}%`
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          {Math.min(currentPoints, step.points_required)} / {step.points_required} puntos
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="backdrop-blur-xl bg-white/60 rounded-2xl border border-white/40 shadow-xl p-6">
            <p className="text-gray-500 text-sm">
              Sistema de Pasaporte UDES - Ruta de Aprendizaje Personalizada
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteVisualization;