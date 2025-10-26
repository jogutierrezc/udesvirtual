import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Compass, Heart, Award, MapPin, CheckCircle, Clock, Users, ArrowLeft } from "lucide-react";
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
            <div className={`p-2 rounded-lg ${getPathwayColor(selectedRoute.pathway_type)}`}>
              {getPathwayIcon(selectedRoute.pathway_type)}
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
    <div className="space-y-8">
      {/* Enrolled Routes */}
      {userRouteEnrollments.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Mis Rutas Inscritas
          </h3>
          <div className="space-y-4">
            {userRouteEnrollments.map((enrollment) => {
              const route = enrollment.passport_routes;
              const pathwayPoints = pointsByPathway[route.pathway_type] || 0;
              const steps = getStepsForPathway(route.pathway_type);
              const completedSteps = steps.filter(step => pathwayPoints >= step.points_required).length;
              const totalSteps = steps.length;
              const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

              return (
                <Card
                  key={enrollment.id}
                  className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer w-full"
                  onClick={() => onViewRouteDetails(route)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getPathwayColor(route.pathway_type)}`}>
                              {getPathwayIcon(route.pathway_type)}
                            </div>
                            <h4 className="text-xl font-semibold text-gray-800">{route.name}</h4>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            Inscrito
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-justify mb-4 line-clamp-2">
                          {route.description.length > 150 
                            ? `${route.description.substring(0, 150)}...` 
                            : route.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-sm font-medium">Progreso</span>
                              <Badge variant="secondary" className="bg-white/80">
                                {completedSteps}/{totalSteps} pasos
                              </Badge>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-bold text-gray-800">{pathwayPoints} pts</p>
                              <p className="text-xs text-gray-600">acumulados</p>
                            </div>
                          </div>
                          <Button variant="outline" className="ml-4">
                            <MapPin className="h-4 w-4 mr-2" />
                            Ver Actividades
                          </Button>
                        </div>
                        <Progress value={progressPercentage} className="h-2 mt-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Routes */}
      {availableRoutes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Compass className="h-5 w-5 text-blue-600" />
            Rutas Disponibles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRoutes.map((route) => {
              const steps = getStepsForPathway(route.pathway_type);
              const isEnrolling = enrollingRouteId === route.id;

              return (
                <Card
                  key={route.id}
                  className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getPathwayColor(route.pathway_type)}`}>
                        {getPathwayIcon(route.pathway_type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{route.name}</CardTitle>
                        <p className="text-sm text-gray-600 text-justify">{route.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{steps.length} actividades</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Disponible
                        </Badge>
                      </div>

                      {/* Preview of first few steps */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Actividades destacadas:</p>
                        {steps.slice(0, 2).map((step, index) => (
                          <div key={step.id} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            <span className="text-gray-600">{step.title}</span>
                            <span className="text-gray-400 ml-auto">{step.points_required} pts</span>
                          </div>
                        ))}
                        {steps.length > 2 && (
                          <p className="text-xs text-gray-400 text-center">
                            +{steps.length - 2} actividades más...
                          </p>
                        )}
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => onEnrollInRoute(route.id)}
                        disabled={isEnrolling}
                      >
                        {isEnrolling ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Inscribiendo...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Inscribirme
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {userRouteEnrollments.length === 0 && availableRoutes.length === 0 && (
        <Card className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl">
          <CardContent className="text-center py-12">
            <Compass className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
