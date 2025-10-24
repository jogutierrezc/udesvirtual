import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

type AppRole = "admin" | "professor" | "student";

interface UserInfo {
  id: string;
  name: string;
  role: AppRole;
  email: string;
  avatarUrl?: string;
}

export const Navbar = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        if (mounted) {
         setUser({ id: userId, name, email, role, avatarUrl });
        }
      } catch (e) {
        console.error("Navbar auth load error", e);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      // Re-run load on any auth change
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

  const links = useMemo(() => {
        // Si es admin, mostrar navegación de administrador
    if (user?.role === "admin") {
      return [
        { to: "/admin/catalog", label: "Catálogo" },
        { to: "/admin/offerings", label: "Oferta" },
        { to: "/admin/registrations", label: "Registros" },
        { to: "/admin/mooc", label: "MOOC" },
        { to: "/admin/carousel", label: "Carrusel" },
      ];
    }
    
    // Si es estudiante, mostrar navegación personalizada
    if (user?.role === "student") {
      return [
        { to: "/mooc", label: "Oferta de Cursos" },
        { to: "/dashboard", label: "Mis Cursos" },
        { to: "/profile", label: "Mi Perfil" },
      ];
    }
    
    // Navegación para profesores y otros usuarios
    const base = [
      { to: "/", label: "Inicio" },
      { to: "/catalog", label: "Catálogo" },
      { to: "/professor-offerings", label: "Oferta" },
      { to: "/coil-offerings", label: "COIL" },
      { to: "/mooc", label: "MOOC" },
      { to: "/lia", label: "LIA" },
    ];
    
    if (user?.role === "professor") base.push({ to: "/professor", label: "Profesor" });
    return base;
  }, [user?.role]);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    const parts = user.name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-4 py-1">
          <div className="flex items-center h-12">
            <img
              src="https://udes.edu.co/images/logo/logo-con-acreditada-color.png"
              alt="Logo UDES"
              className="h-10 w-auto object-contain"
              style={{ maxWidth: 140 }}
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:text-foreground"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium leading-tight">{user.name}</div>
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Panel</Link>
                  </DropdownMenuItem>
                  {user.role === "professor" && (
                    <DropdownMenuItem asChild>
                      <Link to="/professor">Profesor</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
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

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>
                  {user ? (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <div className="text-base font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">{user.role}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-left">Menú</div>
                  )}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-4">
                {/* Navigation Links */}
                <div className="flex flex-col gap-2">
                  {links.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>

                {/* User Actions */}
                {user ? (
                  <>
                    <DropdownMenuSeparator />
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                      >
                        Mi Perfil
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                      >
                        Panel
                      </Link>
                      {user.role === "professor" && (
                        <Link
                          to="/professor"
                          onClick={() => setMobileMenuOpen(false)}
                          className="px-4 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                        >
                          Profesor
                        </Link>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        Cerrar sesión
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <DropdownMenuSeparator />
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full">Iniciar sesión</Button>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
