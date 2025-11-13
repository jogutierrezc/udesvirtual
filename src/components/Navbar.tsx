import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronDown } from "lucide-react";
import { useIsUdesEmail } from "@/hooks/useIsUdesEmail";

type AppRole = "admin" | "professor" | "student";

interface NavLink {
  to?: string;
  label: string;
  isDropdown?: boolean;
  children?: { to: string; label: string }[];
}

interface UserInfo {
  id: string;
  name: string;
  role: AppRole;
  email: string;
  avatarUrl?: string;
}

export const Navbar = ({ topOffset = 0 }: { topOffset?: number }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isUdesEmail, isLoading: emailLoading } = useIsUdesEmail();

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

        const [profileRes, rolesRes] = await Promise.all([
          supabase.from("profiles").select("full_name,email").eq("id", userId).single(),
          // A user can have multiple roles; fetch all and resolve precedence below
          supabase.from("user_roles").select("role").eq("user_id", userId),
        ]);

        const name = profileRes.data?.full_name || session.user.user_metadata?.full_name || session.user.email || "Usuario";
        const email = profileRes.data?.email || session.user.email || "";
        const rolesArr = (rolesRes.data || []).map((r: any) => r.role);
        // precedence: admin > professor > student
        const role: AppRole = rolesArr.includes("admin") ? "admin" : rolesArr.includes("professor") ? "professor" : "student";
        const avatarUrl = session.user.user_metadata?.avatar_url;

        if (mounted) {
         setUser({ id: userId, name, email, role, avatarUrl });
        // fetch unread contact messages for professors
        try {
          if (role === 'professor') {
            const { data: cntData, count, error } = await (supabase.from('contact_messages') as any)
              .select('*', { count: 'exact', head: true })
              .eq('profile_id', userId)
              .eq('read', false);
            if (!error) setUnreadCount(Number(count) || 0);
          } else {
            setUnreadCount(0);
          }
        } catch (e) {
          console.error('Error fetching unread count', e);
        }
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

    // realtime subscription to contact_messages for the current user
    let channel: any = null;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        if (!uid) return;
        channel = supabase.channel(`public:contact_messages_user_${uid}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages', filter: `profile_id=eq.${uid}` }, (payload) => {
            // re-fetch unread count on any insert/update/delete for this profile
            (async () => {
              try {
                const { count, error } = await (supabase.from('contact_messages') as any)
                  .select('*', { count: 'exact', head: true })
                  .eq('profile_id', uid)
                  .eq('read', false);
                if (!error) setUnreadCount(Number(count) || 0);
              } catch (err) {
                console.error('Error refreshing unread count', err);
              }
            })();
          })
          .subscribe();
      } catch (err) {
        console.error(err);
      }
    })();

    return () => {
      mounted = false;
      authSub.subscription.unsubscribe();
      try { if (channel) channel.unsubscribe(); } catch (e) {}
    };
  }, []);

  const links = useMemo<NavLink[]>(() => {
        // Si es admin, mostrar navegación de administrador
    if (user?.role === "admin") {
      return [
        { to: "/admin/catalog", label: "Catálogo" },
        { to: "/admin/offerings", label: "Oferta" },
        { to: "/admin/registrations", label: "Registros" },
        { to: "/admin/mooc", label: "MOOC" },
        { to: "/admin/carousel", label: "Carrusel" },
        { to: "/admin/resend-settings", label: "Configuración Resend" }, // <-- Asegurado
      ];
    }
    
    // Si es estudiante, mostrar navegación personalizada
    if (user?.role === "student") {
      const studentLinks = [
        { to: "/catalog", label: "Clases para el estudiante" },
        { to: "/mooc", label: "Oferta de Cursos" },
        { to: "/dashboard", label: "Mis Cursos" },
        { to: "/profile", label: "Mi Perfil" },
      ];
      
      // Solo agregar Pasaporte si tiene email @mail.udes.edu.co
      if (isUdesEmail) {
        studentLinks.push({ to: "/passport", label: "Pasaporte" });
      }
      
      // (no admin-specific link inside student links)
      
      return studentLinks;
    }
    
    // Navegación para profesores y otros usuarios
    // Los profesores tienen navegación simplificada: ocultamos Catálogo, Oferta, COIL, MOOC y LIA
    if (user?.role === "professor") {
      return [
        { to: "/", label: "Inicio" },
        { to: "/professor", label: "Profesor" },
        { to: "/professor/buzon", label: "Buzón" },
        { to: "/professor/mis-estudiantes", label: "Mis Estudiantes" },
      ];
    }

    const base = [
      { to: "/", label: "Inicio" },
      { 
        label: "E-Exchange", 
        isDropdown: true,
        children: [
          { to: "/profesores", label: "Profesores UDES" },
          { to: "/catalog", label: "Catálogo UDES" },
          { to: "/professor-offerings", label: "Oferta Virtual" },
          { to: "/coil-offerings", label: "Proyectos COIL" },
        ]
      },
      { to: "/mooc", label: "MOOC" },
      { to: "/lia", label: "LIA" },
      { to: "/faq", label: "FAQ" }, // <-- Agregado
    ];

    return base;
  }, [user?.role, isUdesEmail]);

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
    <nav className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky z-50" style={{ top: topOffset }}>
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
            l.isDropdown ? (
              <DropdownMenu key={l.label}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="px-3 py-2 h-auto text-sm font-medium text-foreground/80 hover:text-foreground">
                    {l.label}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {l.children?.map((child) => (
                    <DropdownMenuItem key={child.to} asChild>
                      <Link to={child.to} className="cursor-pointer">
                        {child.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? "bg-primary/10 text-primary" : "text-foreground/80 hover:text-foreground"}`
                }
              >
                <span className="inline-flex items-center gap-2">
                  <span>{l.label}</span>
                  {l.to === '/professor/buzon' && unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center bg-red-600 text-white text-xs font-semibold rounded-full h-5 w-5">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </span>
              </NavLink>
            )
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
                    l.isDropdown ? (
                      <div key={l.label} className="flex flex-col">
                        <div className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                          {l.label}
                        </div>
                        {l.children?.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className="pl-8 pr-4 py-2 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-4 py-3 rounded-md text-sm font-medium hover:bg-muted transition-colors"
                      >
                        {l.label}
                      </Link>
                    )
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
