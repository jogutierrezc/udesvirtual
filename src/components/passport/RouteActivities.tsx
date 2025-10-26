import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { CheckCircle, Circle, Trophy, Star, BookOpen, Users, Lightbulb, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface Route {
  id: string;
  name: string;
  description: string;
  pathway_type: 'conocimiento' | 'descubrimiento' | 'impacto_social';
}

interface Activity {
  id: string;
  name: string;
  description: string;
  points_awarded: number;
  pathway_type: 'conocimiento' | 'descubrimiento' | 'impacto_social';
  order_index: number;
  is_completed: boolean;
  completed_at?: string;
  has_pending_request?: boolean;
}

interface RouteActivitiesProps {
  route: Route;
  userId: string;
  onPointsUpdate: () => void;
}

const RouteActivities: React.FC<RouteActivitiesProps> = ({ route, userId, onPointsUpdate }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingActivity, setCompletingActivity] = useState<string | null>(null);

  const getPathwayIcon = (pathwayType: string) => {
    switch (pathwayType) {
      case 'conocimiento':
        return <BookOpen className="h-5 w-5" />;
      case 'descubrimiento':
        return <Lightbulb className="h-5 w-5" />;
      case 'impacto_social':
        return <Heart className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getPathwayColor = (pathwayType: string) => {
    switch (pathwayType) {
      case 'conocimiento':
        return 'bg-blue-100 text-blue-800';
      case 'descubrimiento':
        return 'bg-green-100 text-green-800';
      case 'impacto_social':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('passport_route_activities')
        .select(`
          order_index,
          passport_activities (
            id,
            name,
            description,
            points_awarded,
            pathway_type
          )
        `)
        .eq('route_id', route.id)
        .order('order_index');

      if (error) {
        console.error('Error loading route activities:', error);
        toast.error('Error al cargar las actividades');
        return;
      }

      // Get completion status for each activity
      const activityIds = data?.map(item => item.passport_activities.id) || [];
      if (activityIds.length > 0) {
        const { data: completions, error: completionError } = await supabase
          .from('passport_activity_completions')
          .select('activity_id, completed_at')
          .eq('user_id', userId)
          .in('activity_id', activityIds);

        if (completionError) {
          console.error('Error loading completions:', completionError);
        }

        // Get pending requests
        const { data: requests, error: requestError } = await supabase
          .from('passport_activity_requests')
          .select('activity_id, status')
          .eq('user_id', userId)
          .eq('status', 'pending')
          .in('activity_id', activityIds);

        if (requestError) {
          console.error('Error loading requests:', requestError);
        }

        const completionMap = new Map(
          completions?.map(c => [c.activity_id, c.completed_at]) || []
        );

        const requestMap = new Map(
          requests?.map(r => [r.activity_id, r.status]) || []
        );

        const activitiesWithCompletion = data?.map(item => ({
          id: item.passport_activities.id,
          name: item.passport_activities.name,
          description: item.passport_activities.description,
          points_awarded: item.passport_activities.points_awarded,
          pathway_type: item.passport_activities.pathway_type,
          order_index: item.order_index,
          is_completed: completionMap.has(item.passport_activities.id),
          completed_at: completionMap.get(item.passport_activities.id),
          has_pending_request: requestMap.has(item.passport_activities.id)
        })) || [];

        setActivities(activitiesWithCompletion);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const requestActivityApproval = async (activityId: string) => {
    console.log('🚀 REQUESTING ACTIVITY APPROVAL for activity:', activityId);
    try {
      setCompletingActivity(activityId);
      const { error } = await supabase
        .from('passport_activity_requests')
        .insert({
          user_id: userId,
          activity_id: activityId,
          route_id: route.id,
          status: 'pending',
          evidence_description: 'Solicitud de aprobación automática desde la plataforma'
        });

      if (error) {
        console.error('❌ Error requesting approval:', error);
        toast.error('Error al enviar la solicitud de aprobación');
        return;
      }

      console.log('✅ Approval request sent successfully');
      toast.success('¡Solicitud de aprobación enviada! El administrador revisará tu actividad.');
      await loadActivities(); // Reload to update request status
    } catch (error) {
      console.error('❌ Error requesting approval:', error);
      toast.error('Error al enviar la solicitud de aprobación');
    } finally {
      setCompletingActivity(null);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [route.id, userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const completedActivities = activities.filter(a => a.is_completed).length;
  const pendingActivities = activities.filter(a => a.has_pending_request).length;
  const totalActivities = activities.length;
  const progressPercentage = totalActivities > 0 ? ((completedActivities + pendingActivities) / totalActivities) * 100 : 0;
  const totalPoints = activities.reduce((sum, a) => sum + (a.is_completed ? a.points_awarded : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`p-6 rounded-lg ${getPathwayColor(route.pathway_type)}`}>
        <div className="flex items-center gap-3 mb-4">
          {getPathwayIcon(route.pathway_type)}
          <div>
            <h3 className="text-xl font-bold">{route.name}</h3>
            <p className="text-sm opacity-90">{route.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{completedActivities}/{totalActivities}</div>
            <div className="text-sm opacity-75">Actividades completadas</div>
            {pendingActivities > 0 && (
              <div className="text-xs opacity-60 mt-1">{pendingActivities} pendiente(s) de aprobación</div>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-sm opacity-75">Puntos obtenidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(progressPercentage)}%</div>
            <div className="text-sm opacity-75">Progreso</div>
          </div>
        </div>

        <div className="mt-4">
          <Progress value={progressPercentage} className="h-3" />
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Actividades de la ruta
        </h4>

        {activities.length === 0 ? (
          <Card className="backdrop-blur-xl bg-white/60 border border-white/40">
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay actividades disponibles para esta ruta.</p>
            </CardContent>
          </Card>
        ) : (
          activities
            .sort((a, b) => a.order_index - b.order_index)
            .map((activity) => (
              <Card
                key={activity.id}
                className={`backdrop-blur-xl bg-white/60 border border-white/40 shadow-lg transition-all duration-300 ${
                  activity.is_completed ? 'ring-2 ring-green-200' :
                  activity.has_pending_request ? 'ring-2 ring-yellow-200' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getPathwayColor(activity.pathway_type)}`}>
                        {activity.is_completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : activity.has_pending_request ? (
                          <Circle className="h-5 w-5 text-yellow-600" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {activity.name}
                          {activity.is_completed && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Completada
                            </Badge>
                          )}
                          {activity.has_pending_request && !activity.is_completed && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              Pendiente de Aprobación
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">{activity.points_awarded}</div>
                      <div className="text-xs text-gray-500">puntos</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {activity.is_completed && activity.completed_at && (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Completada el {new Date(activity.completed_at).toLocaleDateString()}
                        </>
                      )}
                      {activity.has_pending_request && !activity.is_completed && (
                        <>
                          <Circle className="h-4 w-4 text-yellow-600" />
                          Solicitud enviada - Esperando aprobación
                        </>
                      )}
                    </div>

                    {!activity.is_completed && !activity.has_pending_request && (
                      <Button
                        onClick={() => requestActivityApproval(activity.id)}
                        disabled={completingActivity === activity.id}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        {completingActivity === activity.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Solicitar Aprobación
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  );
};

export default RouteActivities;