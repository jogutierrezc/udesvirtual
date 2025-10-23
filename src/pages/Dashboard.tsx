import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import StudentDashboard from "./student/StudentDashboard";

const Dashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          window.location.href = "/auth";
          return;
        }

        // Get user role
        const { data: roles, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();

        if (error) throw error;

        const role = roles?.role || "student";
        setUserRole(role);

        // Redirect based on role
        if (role === "admin") {
          window.location.href = "/admin";
        } else if (role === "professor") {
          window.location.href = "/professor";
        }
        // Si es student, se renderiza StudentDashboard en lugar de redirigir
      } catch (error: any) {
        console.error("Error checking auth:", error);
        toast({
          title: "Error",
          description: "Error al verificar autenticación",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si es estudiante, mostrar el StudentDashboard
  if (userRole === "student") {
    return <StudentDashboard />;
  }

  // Para admin y professor ya fueron redirigidos
  return null;
};

export default Dashboard;
