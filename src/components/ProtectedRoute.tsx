import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Verificar sesión activa
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // Check if profile is completed
      const { data: profile } = await supabase
        .from("profiles")
        .select("profile_completed")
        .eq("id", session.user.id)
        .single();

      setProfileCompleted(profile?.profile_completed || false);

      // Si se requiere admin, verificar el rol
      if (requireAdmin) {
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id);

        if (error) {
          console.error("Error checking role:", error);
          setIsAdmin(false);
        } else {
          // El usuario es admin si tiene el rol 'admin' o 'professor'
          const hasAdminRole = roles?.some(r => r.role === "admin" || r.role === "professor");
          setIsAdmin(hasAdminRole || false);
        }
      }
    } catch (error) {
      console.error("Error in auth check:", error);
      setIsAuthenticated(false);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar loader mientras se verifica
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a Auth
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Si el perfil no está completo, redirigir a ProfileSetup
  if (!profileCompleted) {
    return <Navigate to="/profile-setup" replace />;
  }

  // Si se requiere admin y no lo es, redirigir a Unauthorized
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si todo está bien, mostrar el contenido
  return <>{children}</>;
};

export default ProtectedRoute;
