import { ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Package, Users, Globe, Settings, ChevronDown, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  type AppRole = "admin" | "professor" | "student";
  interface UserInfo {
    id: string;
    name: string;
    role: AppRole;
    email: string;
    avatarUrl?: string;
  }

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (mounted) setUser(null);
          return;
        }

        const userId = session.user.id;
        const [profileRes, roleRes] = await Promise.all([
          supabase.from("profiles").select("full_name,email").eq("id", userId).single(),
          supabase.from("user_roles").select("role").eq("user_id", userId).single(),
        ]);

        const name = profileRes.data?.full_name || session.user.user_metadata?.full_name || session.user.email || "Usuario";
        const email = profileRes.data?.email || session.user.email || "";
        const role = (roleRes.data?.role as AppRole) || "student";
        const avatarUrl = session.user.user_metadata?.avatar_url;

        if (mounted) setUser({ id: userId, name, email, role, avatarUrl });
      } catch (e) {
        console.error("AdminLayout auth load error", e);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setLoading(false);
      } else {
        setLoading(true);
        load();
      }
    });
    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    const parts = user.name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar simplificado con dropdowns */}
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Brand / Logo */}
            <div className="flex items-center gap-3 min-w-0">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="https://udes.edu.co/images/logo/logo-con-acreditada-color.png"
                  alt="Logo UDES"
                  className="h-8 w-auto object-contain"
                />
                <span className="hidden sm:inline text-sm text-muted-foreground truncate">Panel de Administración</span>
              </Link>
            </div>

            {/* Middle Nav Controls */}
            <div className="flex items-center gap-3">
            {/* Exchange Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={
                    location.pathname.includes('/admin/catalog') ||
                    location.pathname.includes('/admin/offerings') ||
                    location.pathname.includes('/admin/registrations')
                      ? "default" 
                      : "outline"
                  } 
                  className="gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Exchange
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => navigate("/admin/catalog")}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Catálogo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/offerings")}>
                  <Package className="h-4 w-4 mr-2" />
                  Oferta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/registrations")}>
                  <Users className="h-4 w-4 mr-2" />
                  Registros
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* MOOC Button */}
            <Button
              variant={location.pathname.includes('/admin/mooc') ? "default" : "outline"}
              onClick={() => navigate("/admin/mooc")}
              className="gap-2"
            >
              <Globe className="h-4 w-4" />
              MOOC
            </Button>

            {/* Pasaporte Button */}
            <Button
              variant={location.pathname.includes('/admin/passport') ? "default" : "outline"}
              onClick={() => navigate("/admin/passport")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Pasaporte
            </Button>

            {/* Configuración Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={location.pathname.includes('/admin/carousel') ? "default" : "outline"}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configuración
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => navigate("/admin/carousel")}>
                  <Image className="h-4 w-4 mr-2" />
                  Carrusel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>

            {/* Right: User identity */}
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-medium leading-tight truncate max-w-[180px]">{user.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="h-9 w-9 cursor-pointer">
                        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to="/profile">Mi Perfil</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/dashboard">Panel</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>Cerrar sesión</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Link to="/auth">
                  <Button>Iniciar sesión</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
};
