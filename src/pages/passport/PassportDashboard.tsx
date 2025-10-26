import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Compass, Heart, Award, User, MapPin } from "lucide-react";

interface Pathway {
  id: string;
  name: string;
  description: string;
  pathway_type: string;
}

interface PathwayStep {
  id: string;
  route_id: string;
  order_index: number;
  title: string;
  description: string;
  points_required: number;
}

interface PassportDashboardProps {
  userId: string | null;
  userProfile: any;
  pathways: Pathway[];
  pathwaySteps: PathwayStep[];
  pointsByPathway: Record<string, number>;
  totalPoints: number;
}

const PassportDashboard: React.FC<PassportDashboardProps> = ({
  userId,
  userProfile,
  pathways,
  pathwaySteps,
  pointsByPathway,
  totalPoints,
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

  const getStepProgress = (step: PathwayStep, pathwayPoints: number) => {
    const progress = Math.min(100, (pathwayPoints / step.points_required) * 100);
    const isCompleted = pathwayPoints >= step.points_required;
    return { progress, isCompleted };
  };

  const getStepsForPathway = (pathwayType: string) => {
    const route = pathways.find(p => p.pathway_type === pathwayType);
    if (!route) return [];
    return pathwaySteps.filter(step => step.route_id === route.id);
  };

  const generateCardNumber = (userId: string) => {
    const hash = userId.slice(-8).toUpperCase();
    return `UDES-${hash.slice(0, 4)}-${hash.slice(4, 8)}`;
  };

  return (
    <div className="space-y-8">
      {/* Passport Card */}
      <Card className="backdrop-blur-xl bg-white/80 border-2 border-orange-200 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                <User className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white">
                <Award className="h-4 w-4 text-yellow-800" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {userProfile?.full_name || 'Usuario UDES'}
          </CardTitle>
          <p className="text-gray-600">{userProfile?.email}</p>
          <div className="mt-4 p-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg border border-orange-200">
            <p className="text-sm font-mono text-gray-700">
              <strong>Número de Pasaporte:</strong> {userId ? generateCardNumber(userId) : 'Cargando...'}
            </p>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-800">{pointsByPathway.conocimiento || 0}</p>
              <p className="text-sm text-blue-600">Conocimiento</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-center mb-2">
                <Compass className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-800">{pointsByPathway.descubrimiento || 0}</p>
              <p className="text-sm text-green-600">Descubrimiento</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-center mb-2">
                <Heart className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-800">{pointsByPathway.impacto_social || 0}</p>
              <p className="text-sm text-orange-600">Impacto Social</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-yellow-800">{totalPoints}</p>
            <p className="text-lg text-yellow-700">Puntos Totales</p>
          </div>
        </CardContent>
      </Card>

      {/* Pathway Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pathways.map((pathway) => {
          const pathwayPoints = pointsByPathway[pathway.pathway_type] || 0;
          const steps = getStepsForPathway(pathway.pathway_type);
          const completedSteps = steps.filter(step => pathwayPoints >= step.points_required).length;
          const totalSteps = steps.length;
          const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

          return (
            <Card key={pathway.id} className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getPathwayColor(pathway.pathway_type)}`}>
                    {getPathwayIcon(pathway.pathway_type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pathway.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progreso</span>
                    <Badge variant="secondary" className="bg-white/80">
                      {completedSteps}/{totalSteps} pasos
                    </Badge>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{pathwayPoints} pts</p>
                    <p className="text-sm text-gray-600">acumulados</p>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="mt-4 space-y-2">
                  {steps.slice(0, 3).map((step, index) => {
                    const { progress, isCompleted } = getStepProgress(step, pathwayPoints);
                    return (
                      <div key={step.id} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className={`text-xs ${isCompleted ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                          {step.title}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {step.points_required} pts
                        </span>
                      </div>
                    );
                  })}
                  {steps.length > 3 && (
                    <p className="text-xs text-gray-400 text-center">
                      +{steps.length - 3} pasos más...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PassportDashboard;
