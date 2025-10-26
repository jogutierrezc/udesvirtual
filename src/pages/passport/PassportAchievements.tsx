import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Award, Trophy, BookOpen, Calendar, Star, Medal, Crown, Target } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  badge_type: string;
  color: string;
}

interface Certificate {
  id: string;
  certificate_url: string;
  issued_at: string;
  mooc_course: {
    title: string;
  };
}

interface Recognition {
  awarded_at: string;
  passport_recognitions: {
    title: string;
    description: string;
    color: string;
  };
}

interface PointsHistoryItem {
  points: number;
  pathway_type: string;
  created_at: string;
  activity_type: string;
  description: string;
  passport_activities?: {
    name: string;
    description: string;
    activity_type: string;
    pathway_type: string;
  };
}

interface PassportAchievementsProps {
  pathways: any[];
  pathwaySteps: any[];
  pointsByPathway: Record<string, number>;
  totalPoints: number;
  userBadges: Badge[];
  userCertificates: Certificate[];
  userRecognitions: Recognition[];
  pointsHistory: PointsHistoryItem[];
}

const PassportAchievements: React.FC<PassportAchievementsProps> = ({
  pathways,
  pathwaySteps,
  pointsByPathway,
  totalPoints,
  userBadges,
  userCertificates,
  userRecognitions,
  pointsHistory,
}) => {
  const getPathwayIcon = (type: string) => {
    if (type === "conocimiento") return <BookOpen className="h-5 w-5" />;
    if (type === "descubrimiento") return <Trophy className="h-5 w-5" />;
    if (type === "impacto_social") return <Award className="h-5 w-5" />;
    return <Star className="h-5 w-5" />;
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'ciudadano_global': return <Crown className="h-6 w-6" />;
      case 'aprendiz': return <BookOpen className="h-6 w-6" />;
      case 'explorador': return <Trophy className="h-6 w-6" />;
      case 'contribuyente': return <Award className="h-6 w-6" />;
      default: return <Medal className="h-6 w-6" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Points History */}
      <Card className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Historial de Puntos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pointsHistory.length > 0 ? (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {pointsHistory.slice(0, 20).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {getPathwayIcon(item.pathway_type || item.passport_activities?.pathway_type)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {item.passport_activities?.name || item.activity_type || 'Actividad'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.passport_activities?.description || item.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      +{item.points} pts
                    </Badge>
                  </div>
                ))}
                {pointsHistory.length > 20 && (
                  <p className="text-center text-sm text-gray-500 py-2">
                    Y {pointsHistory.length - 20} actividades más...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aún no has ganado puntos</p>
                <p className="text-sm text-gray-400">Completa actividades para ver tu historial aquí</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Badges and Achievements */}
      <Card className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-yellow-600" />
            Insignias y Logros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userBadges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBadges.map((badge) => (
                <Dialog key={badge.id}>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-yellow-200">
                      <CardContent className="p-4 text-center">
                        <div className="flex justify-center mb-3">
                          <div className="p-3 bg-yellow-100 rounded-full">
                            {getBadgeIcon(badge.badge_type)}
                          </div>
                        </div>
                        <h3 className="font-semibold text-lg mb-1">{badge.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          {badge.badge_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-full">
                          {getBadgeIcon(badge.badge_type)}
                        </div>
                        {badge.name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-600">{badge.description}</p>
                      <div className="flex justify-center">
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-sm px-3 py-1">
                          {badge.badge_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Medal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aún no has obtenido insignias</p>
              <p className="text-sm text-gray-400">Sigue completando actividades para ganar tus primeras insignias</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificates */}
      <Card className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            Certificados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userCertificates.length > 0 ? (
            <div className="space-y-4">
              {userCertificates.map((cert) => (
                <Card key={cert.id} className="border border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <BookOpen className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{cert.mooc_course.title}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Emitido: {formatDate(cert.issued_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(cert.certificate_url, '_blank')}
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        Ver Certificado
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aún no has obtenido certificados</p>
              <p className="text-sm text-gray-400">Completa cursos MOOC para obtener certificados</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recognitions */}
      <Card className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            Reconocimientos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userRecognitions.length > 0 ? (
            <div className="space-y-4">
              {userRecognitions.map((recognition, index) => (
                <Card key={index} className="border border-purple-200 bg-purple-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Crown className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{recognition.passport_recognitions.title}</h3>
                        <p className="text-sm text-gray-600">{recognition.passport_recognitions.description}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          Otorgado: {formatDate(recognition.awarded_at)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aún no has recibido reconocimientos</p>
              <p className="text-sm text-gray-400">Los reconocimientos se otorgan por logros especiales</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PassportAchievements;
