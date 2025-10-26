import React, { useState, useEffect } from 'react';
import { Check, Lock, Target, Award, BookOpen, Compass, Heart, Star, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CelebrationPopup from '@/components/CelebrationPopup';

interface Activity {
  id: string;
  name: string;
  description: string;
  activity_type: string;
  points_awarded: number;
  pathway_type: string;
  complexity_level: string;
  formative_value: string;
  active: boolean;
}

interface CompletedActivity {
  id: string;
  activity_id: string;
  user_id: string;
  points: number;
  completed_at: string;
  activity?: Activity;
}

interface RouteActivitiesProps {
  route: {
    id: string;
    name: string;
    description: string;
    pathway_type: string;
  };
  userId: string;
  onBack: () => void;
  onPointsUpdate?: () => void;
}

const RouteActivities: React.FC<RouteActivitiesProps> = ({
  route,
  userId,
  onBack,
  onPointsUpdate
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [completedActivities, setCompletedActivities] = useState<CompletedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingActivity, setCompletingActivity] = useState<string | null>(null);
  const [celebrationPopup, setCelebrationPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    points?: number;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    loadActivities();
    loadCompletedActivities();
  }, [route.id, userId]);

  const loadActivities = async () => {
    try {
      // Use the new function to get activities specific to this route
      const { data, error } = await supabase
        .rpc('get_route_activities', { p_route_id: route.id });

      if (error) {
        console.error('Error loading route activities:', error);
        return;
      }

      setActivities(data || []);
    } catch (error) {
      console.error('Failed to load route activities:', error);
    }
  };

  const loadCompletedActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('passport_points_ledger')
        .select(`
          id,
          activity_id,
          user_id,
          points,
          created_at,
          passport_activities(*)
        `)
        .eq('user_id', userId)
        .not('activity_id', 'is', null);

      if (error) {
        console.error('Error loading completed activities:', error);
        return;
      }

      setCompletedActivities(data || []);
    } catch (error) {
      console.error('Failed to load completed activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeActivity = async (activity: Activity) => {
    if (!userId) return;

    setCompletingActivity(activity.id);
    try {
      console.log('Completing activity:', activity);

      const { data, error } = await supabase
        .from('passport_points_ledger')
        .insert({
          user_id: userId,
          activity_id: activity.id,
          points: activity.points_awarded,
          pathway_type: activity.pathway_type,
          activity_type: activity.activity_type,
          description: `Completado: ${activity.name}`
        })
        .select();

      if (error) {
        console.error('Error completing activity:', error);
        alert(`Error al completar la actividad: ${error.message}`);
        return;
      }

      console.log('Activity completed successfully:', data);

      // Update local state
      const newCompletedActivity: CompletedActivity = {
        id: data[0].id,
        activity_id: activity.id,
        user_id: userId,
        points: activity.points_awarded,
        completed_at: new Date().toISOString(),
        activity: activity
      };

      setCompletedActivities(prev => [...prev, newCompletedActivity]);

      // Show celebration
      setCelebrationPopup({
        isOpen: true,
        title: "¡Actividad Completada!",
        message: `Felicitaciones! Has completado "${activity.name}" y ganado ${activity.points_awarded} puntos.`,
        points: activity.points_awarded,
      });

      // Notify parent component to update points
      if (onPointsUpdate) {
        onPointsUpdate();
      }

    } catch (error) {
      console.error('Failed to complete activity:', error);
      alert('Error inesperado al completar la actividad');
    } finally {
      setCompletingActivity(null);
    }
  };

  const isActivityCompleted = (activityId: string) => {
    return completedActivities.some(ca => ca.activity_id === activityId);
  };

  const getPathwayIcon = (type: string) => {
    if (type === "conocimiento") return <BookOpen className="h-5 w-5" />;
    if (type === "descubrimiento") return <Compass className="h-5 w-5" />;
    if (type === "impacto_social") return <Heart className="h-5 w-5" />;
    return <Award className="h-5 w-5" />;
  };

  const getPathwayColor = (type: string) => {
    if (type === "conocimiento") return "border-blue-600 bg-blue-50";
    if (type === "descubrimiento") return "border-green-600 bg-green-50";
    if (type === "impacto_social") return "border-orange-600 bg-orange-50";
    return "border-purple-600 bg-purple-50";
  };

  const getPathwayName = (type: string) => {
    if (type === "conocimiento") return "Conocimiento";
    if (type === "descubrimiento") return "Descubrimiento";
    if (type === "impacto_social") return "Impacto Social";
    return type;
  };

  const getComplexityColor = (level: string) => {
    if (level === "basico") return "bg-green-100 text-green-800";
    if (level === "intermedio") return "bg-yellow-100 text-yellow-800";
    if (level === "avanzado") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando actividades...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a Mis Rutas
          </button>

          <div className={`backdrop-blur-2xl bg-white/80 rounded-3xl border border-white/60 shadow-2xl p-8 ${getPathwayColor(route.pathway_type)}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="backdrop-blur-xl bg-white/20 rounded-2xl p-4 border border-white/30">
                {getPathwayIcon(route.pathway_type)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {route.name}
                </h1>
                <p className="text-gray-600 mt-1">
                  {route.description}
                </p>
              </div>
            </div>

            {/* Progress Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="backdrop-blur-xl bg-white/60 rounded-xl p-4 border border-white/40">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{activities.length}</div>
                  <div className="text-sm text-gray-600">Actividades Disponibles</div>
                </div>
              </div>
              <div className="backdrop-blur-xl bg-white/60 rounded-xl p-4 border border-white/40">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedActivities.length}</div>
                  <div className="text-sm text-gray-600">Actividades Completadas</div>
                </div>
              </div>
              <div className="backdrop-blur-xl bg-white/60 rounded-xl p-4 border border-white/40">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {completedActivities.reduce((sum, ca) => sum + ca.points, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Puntos Ganados</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="space-y-6">
          {activities.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay actividades disponibles para este sendero en este momento.
              </AlertDescription>
            </Alert>
          ) : (
            activities.map((activity) => {
              const isCompleted = isActivityCompleted(activity.id);
              const isCompleting = completingActivity === activity.id;

              return (
                <Card key={activity.id} className={`backdrop-blur-xl bg-white/80 border border-white/50 shadow-lg transition-all duration-300 ${isCompleted ? 'ring-2 ring-green-200' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-full ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {isCompleted ? (
                            <Check className="h-6 w-6 text-green-600" />
                          ) : (
                            <Target className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className={`text-xl ${isCompleted ? 'text-green-700' : 'text-gray-800'}`}>
                            {activity.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {activity.description}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge className={getComplexityColor(activity.complexity_level)}>
                              {activity.complexity_level}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {activity.points_awarded} puntos
                            </Badge>
                          </div>
                          {activity.formative_value && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              💡 {activity.formative_value}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {isCompleted ? (
                          <div className="text-center">
                            <div className="text-green-600 font-semibold mb-1">✓ Completada</div>
                            <div className="text-sm text-gray-500">
                              +{activity.points_awarded} pts
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => completeActivity(activity)}
                            disabled={isCompleting}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            {isCompleting ? 'Completando...' : 'Marcar como Completada'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="backdrop-blur-xl bg-white/60 rounded-2xl border border-white/40 shadow-xl p-6">
            <p className="text-gray-500 text-sm">
              Sistema de Pasaporte UDES - Actividades de Aprendizaje
            </p>
          </div>
        </div>
      </div>

      {/* Celebration Popup */}
      <CelebrationPopup
        isOpen={celebrationPopup.isOpen}
        onClose={() => {
          setCelebrationPopup(prev => ({ ...prev, isOpen: false }));
        }}
        title={celebrationPopup.title}
        message={celebrationPopup.message}
        points={celebrationPopup.points}
      />
    </div>
  );
};

export default RouteActivities;