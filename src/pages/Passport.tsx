import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Compass, Heart, Award, AlertCircle, Mail, MapPin, Trophy, Star, Globe, Eye, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useIsUdesEmail } from "@/hooks/useIsUdesEmail";
import CelebrationPopup from "@/components/CelebrationPopup";
import RouteActivities from "@/components/passport/RouteActivities";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PassportDashboard from "@/pages/passport/PassportDashboard";
import PassportRoutes from "@/pages/passport/PassportRoutes";
import PassportAchievements from "@/pages/passport/PassportAchievements";
import PassportWelcomeModal from "@/pages/passport/PassportWelcomeModal";

/**
 * PASAPORTE UDES - Sistema de Gamificación Educativa
 *
 * SISTEMA DE PASOS POR SENDEROS:
 * Cada sendero tiene pasos definidos que representan hitos progresivos de aprendizaje.
 * Los pasos se configuran desde la tabla `passport_route_steps` y se pueden gestionar
 * por administradores desde la configuración del sistema.
 *
 * Estructura de pasos por sendero:
 * - Sendero de Conocimiento: Fundamentos → Especialización → Investigación
 * - Sendero de Descubrimiento: Introducción → Experiencias → Inmersión
 * - Sendero de Impacto Social: Sensibilización → Participación → Liderazgo
 *
 * Los pasos se muestran con indicadores visuales de progreso y se marcan como
 * completados cuando el estudiante alcanza los puntos requeridos.
 */

type Pathway = { id: string; name: string; description: string | null; pathway_type: string };
type PathwayStep = {
  id: string;
  route_id: string;
  order_index: number;
  title: string;
  description: string | null;
  points_required: number;
};
type UserRouteEnrollment = {
  id: string;
  user_id: string;
  route_id: string;
  enrollment_date: string;
  status: string;
  target_completion_date: string | null;
  notes: string | null;
  passport_routes: Pathway;
};
type Badge = {
  id: string;
  name: string;
  description: string | null;
  badge_type: string;
  color: string | null;
  points_required?: number;
};

export default function Passport() {
  const { isUdesEmail, isLoading: emailLoading, userEmail } = useIsUdesEmail();
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [pathwaySteps, setPathwaySteps] = useState<PathwayStep[]>([]);
  const [userRouteEnrollments, setUserRouteEnrollments] = useState<UserRouteEnrollment[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<Pathway[]>([]);
  const [pointsByPathway, setPointsByPathway] = useState<Record<string, number>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [userCertificates, setUserCertificates] = useState<any[]>([]);
  const [userRecognitions, setUserRecognitions] = useState<any[]>([]);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [celebrationPopup, setCelebrationPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    points?: number;
    badge?: { name: string; color?: string };
  }>({
    isOpen: false,
    title: "",
    message: "",
  });
  const [hasShownWelcomePopup, setHasShownWelcomePopup] = useState(false);
  const [enrollingRouteId, setEnrollingRouteId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<Pathway | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "professor" | "student">("student");
  const [allBadges, setAllBadges] = useState<any[]>([]);
  const [academicProfile, setAcademicProfile] = useState<any>(null);
  const [lastPointsCount, setLastPointsCount] = useState(0);
  const [lastBadgesCount, setLastBadgesCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id || null;
      setUserId(uid);

      if (uid) {
        // Load user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name,email")
          .eq("id", uid)
          .single();
        setUserProfile(profile);

        // Load pathways
        const { data: paths = [] } = await (supabase as any)
          .from("passport_routes")
          .select("id,name,description,pathway_type")
          .order("created_at", { ascending: true });
        setPathways(paths || []);

        // Load pathway steps
        const { data: steps = [] } = await (supabase as any)
          .from("passport_route_steps")
          .select("id,route_id,order_index,title,description,points_required")
          .order("order_index", { ascending: true });
        setPathwaySteps(steps || []);

        // Load user route enrollments
        const { data: enrollments = [] } = await (supabase as any)
          .from("passport_user_routes")
          .select(`
            id,user_id,route_id,enrollment_date,status,target_completion_date,notes,
            passport_routes(id,name,description,pathway_type)
          `)
          .eq("user_id", uid)
          .eq("status", "active");
        setUserRouteEnrollments(enrollments || []);

        // Determine available routes
        const enrolledRouteIds = enrollments?.map(e => e.route_id) || [];
        const available = paths?.filter(p => !enrolledRouteIds.includes(p.id)) || [];
        setAvailableRoutes(available);

        // Load points data
        const { data: ledger = [] } = await (supabase as any)
          .from("passport_points_ledger")
          .select(`*,passport_activities(name,description,activity_type,pathway_type)`)
          .eq("user_id", uid)
          .order("created_at", { ascending: false });

        let byPathway: Record<string, number> = {};
        let total = 0;
        ledger?.forEach((l: any) => {
          const pts = l.points || 0;
          total += pts;
          const pathwayType = l.passport_activities?.pathway_type || l.pathway_type;
          if (pathwayType) {
            byPathway[pathwayType] = (byPathway[pathwayType] || 0) + pts;
          }
        });

        setPointsByPathway(byPathway);
        setTotalPoints(total);
        setPointsHistory(ledger || []);

        // Load user badges
        const { data: ub = [] } = await (supabase as any)
          .from("passport_user_badges")
          .select("badge_id,passport_badges(id,name,description,badge_type,color)")
          .eq("user_id", uid);
        const userBadgesData = ub?.map((x: any) => x.passport_badges).filter(Boolean) || [];
        setUserBadges(userBadgesData);

        // Load user certificates
        const { data: certs = [] } = await (supabase as any)
          .from("mooc_certificates")
          .select("id,certificate_url,issued_at,mooc_course(title)")
          .eq("user_id", uid)
          .order("issued_at", { ascending: false });
        setUserCertificates(certs || []);

        // Load user recognitions
        const { data: recs = [] } = await (supabase as any)
          .from("passport_user_recognitions")
          .select("awarded_at,passport_recognitions(title,description,color)")
          .eq("user_id", uid)
          .order("awarded_at", { ascending: false });
        setUserRecognitions(recs || []);

        // Check user role
        const { data: roles = [] } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", uid);
        const role = roles[0]?.role || "student";
        setUserRole(role as "admin" | "professor" | "student");

        // Check if welcome modal should be shown
        const welcomeSeen = localStorage.getItem(`passport-welcome-seen-${uid}`);
        if (!welcomeSeen) {
          setShowWelcomeModal(true);
        }
      }
    };

    if (isUdesEmail && !emailLoading) {
      loadData();
    }
  }, [isUdesEmail, emailLoading]);

  // Si está cargando, mostrar spinner
  if (emailLoading) {
    return (
      <div className="container mx-auto max-w-6xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verificando acceso...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no tiene email UDES, mostrar mensaje de restricción
  if (!isUdesEmail) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Alert variant="destructive" className="border-2">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-semibold">Acceso Restringido</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>
              El <strong>Pasaporte UDES</strong> está disponible únicamente para usuarios con correo institucional.
            </p>
            <div className="bg-destructive/10 rounded-lg p-4 mt-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">Tu correo actual:</p>
                  <code className="text-sm bg-background px-2 py-1 rounded">{userEmail || 'No disponible'}</code>
                </div>
              </div>
            </div>
            <p className="text-sm">
              Para acceder al Pasaporte, debes tener una cuenta con correo <strong>@mail.udes.edu.co</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Si eres estudiante o profesor de UDES y no tienes acceso, contacta con el administrador del sistema.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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

  // Generate passport card number
  const generateCardNumber = (userId: string) => {
    const hash = userId.slice(-8).toUpperCase();
    return `UDES-${hash.slice(0, 4)}-${hash.slice(4, 8)}`;
  };

  // Calculate progress to global citizenship
  const getGlobalCitizenshipProgress = () => {
    const globalBadge = allBadges.find(b => b.badge_type === 'ciudadano_global');
    if (!globalBadge) return { progress: 0, requirements: [] };

    const requirements = [
      { label: 'Puntos Totales', current: totalPoints, required: globalBadge.points_required || 800, met: totalPoints >= (globalBadge.points_required || 800) },
      { label: 'Créditos Aprobados', current: academicProfile?.credits_approved || 0, required: 120, met: (academicProfile?.credits_approved || 0) >= 120 },
      { label: 'Nivel de Inglés', current: academicProfile?.english_level || 'N/A', required: 'B2', met: academicProfile?.english_level === 'B2' },
      { label: 'Senderos Completados', current: Object.values(pointsByPathway).filter(p => p >= 200).length, required: 3, met: Object.values(pointsByPathway).filter(p => p >= 200).length >= 3 }
    ];

    const metRequirements = requirements.filter(r => r.met).length;
    const progress = (metRequirements / requirements.length) * 100;

    return { progress, requirements };
  };

  // Handle route enrollment
  const handleEnrollInRoute = async (routeId: string) => {
    console.log('handleEnrollInRoute called with routeId:', routeId, 'userId:', userId);

    if (!userId) {
      console.error('No userId available for enrollment');
      alert('Error: Usuario no autenticado. Por favor, inicia sesión nuevamente.');
      return;
    }

    if (!routeId) {
      console.error('No routeId provided');
      alert('Error: ID de ruta no válido.');
      return;
    }

    setEnrollingRouteId(routeId);
    try {
      console.log('Attempting to insert enrollment...', { userId, routeId });

      const enrollmentData = {
        user_id: userId,
        route_id: routeId,
        enrollment_date: new Date().toISOString(),
        status: "active"
      };

      console.log('Enrollment data:', enrollmentData);

      const { data, error } = await (supabase as any)
        .from("passport_user_routes")
        .insert(enrollmentData)
        .select();

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Error enrolling in route:', error);
        alert(`Error al inscribirse en la ruta: ${error.message}`);
        return;
      }

      console.log('Enrollment successful, updating local state...');

      // Update local state
      const enrolledRoute = pathways.find(p => p.id === routeId);
      if (enrolledRoute) {
        const newEnrollment = {
          id: data?.[0]?.id || `temp-${Date.now()}`,
          user_id: userId,
          route_id: routeId,
          enrollment_date: new Date().toISOString(),
          status: "active",
          target_completion_date: null,
          notes: null,
          passport_routes: enrolledRoute
        };

        setUserRouteEnrollments(prev => [...prev, newEnrollment]);
        setAvailableRoutes(prev => prev.filter(r => r.id !== routeId));

        console.log('Local state updated successfully');
      }

      // Show celebration
      setCelebrationPopup({
        isOpen: true,
        title: "¡Inscripción Exitosa!",
        message: `Te has inscrito exitosamente en la ruta de aprendizaje.`,
      });

    } catch (error) {
      console.error('Failed to enroll in route:', error);
      alert(`Error inesperado al inscribirse en la ruta: ${error}`);
    } finally {
      setEnrollingRouteId(null);
    }
  };

  // Handle viewing route details
  const handleViewRouteDetails = (route: Pathway) => {
    setSelectedRoute(route);
  };

  // Handle back to routes list
  const handleBackToRoutes = () => {
    setSelectedRoute(null);
  };

  // Handle points update from activities
  const handlePointsUpdate = async () => {
    if (!userId) return;

    try {
      // Reload points data
      const { data: ledger = [], error: ledgerError } = await (supabase as any)
        .from("passport_points_ledger")
        .select(`
          *,
          passport_activities(name, description, activity_type, pathway_type)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!ledgerError && ledger) {
        let byPathway: Record<string, number> = {};
        let total = 0;
        let pointsHistoryData = ledger;

        (ledger || []).forEach((l: any) => {
          const pts = l.points || 0;
          total += pts;
          const pathwayType = l.passport_activities?.pathway_type || l.pathway_type;
          if (pathwayType) {
            byPathway[pathwayType] = (byPathway[pathwayType] || 0) + pts;
          }
        });

        setPointsByPathway(byPathway);
        setTotalPoints(total);
        setPointsHistory(pointsHistoryData);
      }
    } catch (error) {
      console.error('Failed to reload points:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 py-8">
      <div className="container mx-auto px-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="grid w-full max-w-lg grid-cols-3 bg-white/80 backdrop-blur-sm border border-white/50">
              <TabsTrigger value="dashboard" className="text-gray-700 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
                Mi Pasaporte
              </TabsTrigger>
              <TabsTrigger value="routes" className="text-gray-700 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
                Mis Rutas
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-gray-700 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800">
                Mis Logros
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Mi Pasaporte */}
          <TabsContent value="dashboard" className="space-y-8">
            <PassportDashboard
              userId={userId}
              userProfile={userProfile}
              pathways={pathways}
              pathwaySteps={pathwaySteps}
              pointsByPathway={pointsByPathway}
              totalPoints={totalPoints}
            />
          </TabsContent>

          {/* Tab: Mis Rutas */}
          <TabsContent value="routes" className="space-y-8">
            <PassportRoutes
              userId={userId}
              pathways={pathways}
              pathwaySteps={pathwaySteps}
              userRouteEnrollments={userRouteEnrollments}
              availableRoutes={availableRoutes}
              pointsByPathway={pointsByPathway}
              enrollingRouteId={enrollingRouteId}
              selectedRoute={selectedRoute}
              onEnrollInRoute={handleEnrollInRoute}
              onViewRouteDetails={handleViewRouteDetails}
              onBackToRoutes={handleBackToRoutes}
              onPointsUpdate={handlePointsUpdate}
            />
          </TabsContent>

          {/* Tab: Mis Logros */}
          <TabsContent value="achievements" className="space-y-8">
            <PassportAchievements
              pathways={pathways}
              pathwaySteps={pathwaySteps}
              pointsByPathway={pointsByPathway}
              totalPoints={totalPoints}
              userBadges={userBadges}
              userCertificates={userCertificates}
              userRecognitions={userRecognitions}
              pointsHistory={pointsHistory}
            />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="w-full mt-12">
          <div className="max-w-7xl mx-auto text-center">
            <div className="backdrop-blur-xl bg-white/60 rounded-2xl border border-white/40 shadow-xl p-6">
              <p className="text-gray-500 text-sm">
                Sistema de Pasaporte UDES v2.0 - Tres Senderos hacia la Excelencia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      <PassportWelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        userId={userId}
        userRole={userRole}
        userEmail={userEmail || ''}
      />

      {/* Celebration Popup */}
      <CelebrationPopup
        isOpen={celebrationPopup.isOpen}
        onClose={() => {
          setCelebrationPopup(prev => ({ ...prev, isOpen: false }));
          setTimeout(() => {
            setHasShownWelcomePopup(false);
          }, 30000);
        }}
        title={celebrationPopup.title}
        message={celebrationPopup.message}
        points={celebrationPopup.points}
        badge={celebrationPopup.badge}
      />
    </div>
  );
}
