import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, Clock, User, FileText, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ActivityRequest {
  id: string;
  user_id: string;
  activity_id: string;
  route_id: string;
  status: 'pending' | 'approved' | 'rejected';
  evidence_url?: string;
  evidence_description?: string;
  admin_notes?: string;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  profiles: {
    full_name: string;
    email: string;
  };
  passport_activities: {
    name: string;
    description: string;
    points_awarded: number;
    pathway_type: string;
  };
  passport_routes: {
    name: string;
  };
}

const AdminActivityRequests: React.FC = () => {
  const [requests, setRequests] = useState<ActivityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('passport_activity_requests')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          ),
          passport_activities:activity_id (
            name,
            description,
            points_awarded,
            pathway_type
          ),
          passport_routes:route_id (
            name
          )
        `)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      if (error) {
        console.error('Error loading requests:', error);
        toast.error('Error al cargar las solicitudes');
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: string) => {
    try {
      setProcessingRequest(requestId);
      const { error } = await supabase
        .rpc('approve_activity_request', {
          p_request_id: requestId,
          p_admin_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        console.error('Error approving request:', error);
        toast.error('Error al aprobar la solicitud');
        return;
      }

      toast.success('Solicitud aprobada exitosamente');
      await loadRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Error al aprobar la solicitud');
    } finally {
      setProcessingRequest(null);
    }
  };

  const rejectRequest = async (requestId: string, adminNotes: string = '') => {
    try {
      setProcessingRequest(requestId);
      const { error } = await supabase
        .rpc('reject_activity_request', {
          p_request_id: requestId,
          p_admin_id: (await supabase.auth.getUser()).data.user?.id,
          p_admin_notes: adminNotes
        });

      if (error) {
        console.error('Error rejecting request:', error);
        toast.error('Error al rechazar la solicitud');
        return;
      }

      toast.success('Solicitud rechazada');
      await loadRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error al rechazar la solicitud');
    } finally {
      setProcessingRequest(null);
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

  useEffect(() => {
    loadRequests();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Solicitudes de Aprobación de Actividades</h2>
        <Badge variant="secondary" className="ml-auto">
          {requests.length} pendiente(s)
        </Badge>
      </div>

      {requests.length === 0 ? (
        <Card className="backdrop-blur-xl bg-white/60 border border-white/40">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay solicitudes pendientes</h3>
            <p className="text-gray-500">
              Todas las solicitudes han sido procesadas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card
              key={request.id}
              className="backdrop-blur-xl bg-white/60 border border-white/40 shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{request.passport_activities.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {request.profiles.full_name} ({request.profiles.email})
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {request.passport_routes.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.requested_at).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{request.passport_activities.description}</p>
                    {request.evidence_description && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Evidencia proporcionada:</p>
                        <p className="text-sm text-gray-600">{request.evidence_description}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-gray-800">{request.passport_activities.points_awarded}</div>
                    <div className="text-xs text-gray-500">puntos</div>
                    <Badge className={`mt-2 ${getPathwayColor(request.passport_activities.pathway_type)}`}>
                      {request.passport_activities.pathway_type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => rejectRequest(request.id, 'Solicitud rechazada por el administrador')}
                    disabled={processingRequest === request.id}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {processingRequest === request.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => approveRequest(request.id)}
                    disabled={processingRequest === request.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingRequest === request.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminActivityRequests;