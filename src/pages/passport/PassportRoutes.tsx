import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plane, Map, QrCode, Clock, ChevronRight, CheckCircle, ArrowLeft } from "lucide-react";
import RouteActivities from "@/components/passport/RouteActivities";

interface Pathway {
  id: string;
  name: string;
  description: string;
  pathway_type: 'conocimiento' | 'descubrimiento' | 'impacto_social';
}

interface PathwayStep {
  id: string;
  route_id: string;
  order_index: number;
  title: string;
  description: string;
  points_required: number;
}

interface UserRouteEnrollment {
  id: string;
  user_id: string;
  route_id: string;
  enrollment_date: string;
  status: string;
  target_completion_date: string | null;
  notes: string | null;
  passport_routes: Pathway;
}

interface PassportRoutesProps {
  userId: string | null;
  pathways: Pathway[];
  pathwaySteps: PathwayStep[];
  userRouteEnrollments: UserRouteEnrollment[];
  availableRoutes: Pathway[];
  pointsByPathway: Record<string, number>;
  enrollingRouteId: string | null;
  selectedRoute: Pathway | null;
  onEnrollInRoute: (routeId: string) => void;
  onViewRouteDetails: (route: Pathway) => void;
  onBackToRoutes: () => void;
  onPointsUpdate: () => void;
}

const PassportRoutes: React.FC<PassportRoutesProps> = ({
  userId,
  pathways,
  pathwaySteps,
  userRouteEnrollments,
  availableRoutes,
  pointsByPathway,
  enrollingRouteId,
  selectedRoute,
  onEnrollInRoute,
  onViewRouteDetails,
  onBackToRoutes,
  onPointsUpdate,
}) => {
  const getPathwayIcon = (type: string) => {
    if (type === "conocimiento") return <BookOpen className="h-5 w-5" />;
    if (type === "descubrimiento") return <Compass className="h-5 w-5" />;
    if (type === "impacto_social") return <Heart className="h-5 w-5" />;
    return <Award className="h-5 w-5" />;
  };

  const getPathwayColor = (type: string) => {
    if (type === "conocimiento") return "bg-blue-500";
    if (type === "descubrimiento") return "bg-green-500";
    if (type === "impacto_social") return "bg-orange-500";
    return "bg-purple-500";
  };

  const getStepsForPathway = (pathwayType: string) => {
    const route = pathways.find(p => p.pathway_type === pathwayType);
    if (!route) return [];
    return pathwaySteps.filter(step => step.route_id === route.id);
  };

  if (selectedRoute) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={onBackToRoutes}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Rutas
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
              <Plane size={24} className="transform -rotate-45" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{selectedRoute.name}</h2>
              <p className="text-gray-600">{selectedRoute.description}</p>
            </div>
          </div>
        </div>
        <RouteActivities
          route={selectedRoute}
          userId={userId}
          onPointsUpdate={onPointsUpdate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Enrolled Routes (Progress Card) */}
      {userRouteEnrollments.length > 0 && (
        <div className="mb-12">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-6">
            <CheckCircle className="text-green-500" size={24} />
            Mis Rutas Inscritas
          </h2>
          {userRouteEnrollments.map((enrollment) => {
            const route = enrollment.passport_routes;
            const pathwayPoints = pointsByPathway[route.pathway_type] || 0;
            const steps = getStepsForPathway(route.pathway_type);
            const completedSteps = steps.filter(step => pathwayPoints >= step.points_required).length;
            const totalSteps = steps.length;
            const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
            return (
              <div key={enrollment.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden mb-8 group transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer" onClick={() => onViewRouteDetails(route)}>
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg text-green-600">
                      <Map size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{route.name}</h3>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                    EN CURSO
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-gray-700">{pathwayPoints} millas acumuladas</span>
                    <span className="text-gray-500">Progreso del vuelo</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="bg-orange-500 h-3 rounded-full" style={{ width: `${progressPercentage}%` }}>
                      <Plane size={16} className="text-orange-500 absolute -right-2 -top-3 transform rotate-90" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Available Routes (Ticket Cards) */}
      {availableRoutes.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-6">
            <Plane className="text-blue-600" size={24} />
            Próximas Salidas (Rutas Disponibles)
          </h2>
          <div className="space-y-6">
            {availableRoutes.map((route) => {
              const steps = getStepsForPathway(route.pathway_type);
              const isEnrolling = enrollingRouteId === route.id;
              return (
                <div key={route.id} className="group relative w-full max-w-4xl mx-auto mb-8 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="flex flex-col md:flex-row bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
                    <div className="h-4 md:h-auto md:w-4 bg-blue-600"></div>
                    <div className="flex-1 p-6 flex flex-col justify-between relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <Plane size={24} className="transform -rotate-45" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Aerolínea UDES</p>
                            <h3 className="text-xl font-bold text-gray-800">{route.name}</h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded border border-orange-200">
                            ECONOMY CLASS
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm mb-6 line-clamp-2">
                        {route.description}
                      </p>
                      <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Vuelo</p>
                          <p className="font-mono font-bold text-gray-700">UDES-{route.id.slice(-3).toUpperCase()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Duración</p>
                          <p className="font-bold text-gray-700 flex items-center gap-1">
                            <Clock size={14} /> {steps.length} semanas
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Millas (Pts)</p>
                          <p className="font-bold text-blue-600">+{steps.reduce((acc, s) => acc + s.points_required, 0)}</p>
                        </div>
                      </div>
                      <div className="absolute -top-3 right-[-12px] w-6 h-6 bg-[#FFFBF0] rounded-full z-10 hidden md:block"></div>
                      <div className="absolute -bottom-3 right-[-12px] w-6 h-6 bg-[#FFFBF0] rounded-full z-10 hidden md:block"></div>
                    </div>
                    <div className="relative w-full md:w-auto flex md:flex-col items-center justify-center">
                      <div className="hidden md:block h-full border-l-2 border-dashed border-gray-300 mx-2 relative"></div>
                      <div className="md:hidden w-full border-t-2 border-dashed border-gray-300 my-2 relative"></div>
                    </div>
                    <div className="w-full md:w-64 bg-gray-50 p-6 flex flex-col items-center justify-center relative border-l md:border-l-0">
                      <div className="absolute -top-3 left-[-12px] w-6 h-6 bg-[#FFFBF0] rounded-full z-10 hidden md:block"></div>
                      <div className="absolute -bottom-3 left-[-12px] w-6 h-6 bg-[#FFFBF0] rounded-full z-10 hidden md:block"></div>
                      <div className="text-center w-full">
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 uppercase mb-1">Puerta / Gate</p>
                          <p className="text-3xl font-bold text-gray-800">A-{route.id.slice(-2).toUpperCase()}</p>
                        </div>
                        <div className="mb-6">
                          <p className="text-xs text-gray-400 uppercase mb-1">Pasajero</p>
                          <p className="text-sm font-medium text-gray-700">ESTUDIANTE</p>
                        </div>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all transform active:scale-95 shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                          onClick={() => onEnrollInRoute(route.id)}
                          disabled={isEnrolling}
                        >
                          <span>{isEnrolling ? 'Procesando...' : 'Check-in'}</span>
                          <ChevronRight size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {userRouteEnrollments.length === 0 && availableRoutes.length === 0 && (
        <Card className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl">
          <CardContent className="text-center py-12">
            <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay rutas disponibles</h3>
            <p className="text-gray-500">
              Las rutas de aprendizaje estarán disponibles próximamente. ¡Mantente atento!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PassportRoutes;
