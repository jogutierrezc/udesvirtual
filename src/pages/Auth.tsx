import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, Globe, BookOpen, Users, Sparkles, ArrowRight, CheckCircle } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Verificar si el perfil está completo
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if ((profile as any)?.profile_completed) {
          navigate("/dashboard");
        } else {
          navigate("/profile-setup");
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        // Verificar si el perfil está completo
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if ((profile as any)?.profile_completed) {
          navigate("/dashboard");
        } else {
          navigate("/profile-setup");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/profile-setup`,
          },
        });
        
        if (error) throw error;
        
        toast({
          title: "¡Cuenta creada!",
          description: "Revisa tu email para confirmar tu cuenta",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/profile-setup`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Columna Izquierda - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full filter blur-3xl opacity-20 translate-x-1/3 translate-y-1/3"></div>
        
        <div className="w-full max-w-md z-10">
          {/* Logo */}
          <div className="mb-8 text-center">
            <img 
              src="https://udes.edu.co/images/logo/logo-con-acreditada-color.png" 
              alt="Logo UDES" 
              className="h-16 mx-auto mb-6 object-contain"
            />
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {isLogin ? "¡Bienvenido de nuevo!" : "Únete a UDES Virtual"}
            </h1>
            <p className="text-gray-600">
              {isLogin ? "Inicia sesión para continuar" : "Crea tu cuenta y comienza tu viaje"}
            </p>
          </div>

          {/* Formulario */}
          <Card className="border-0 shadow-xl">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : isLogin ? (
                  "Iniciar sesión"
                ) : (
                  "Crear cuenta"
                )}
              </Button>

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  o continuar con
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLogin ? "Iniciar sesión" : "Registrarse"} con Google
              </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>Creado por Estudiantes UDES</p>
            <p className="mt-1">Licenciado para la Universidad de Santander</p>
          </div>
        </div>
      </div>

      {/* Columna Derecha - Panel de Bienvenida con Glassmorphism */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
        {/* Patrón de fondo con círculos */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-200/30 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-orange-200/30 rounded-full filter blur-3xl"></div>
        </div>

        {/* Contenido con efecto cristal */}
        <div className="relative z-10 flex flex-col justify-center items-center px-12 w-full">
          <div className="max-w-md">
            {/* Card principal con glassmorphism */}
            <div className="bg-white/60 backdrop-blur-lg rounded-3xl p-8 border border-white/80 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl mb-4">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  UDES Virtual
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Conectando el mundo a través de la educación internacional
                </p>
              </div>

              {/* Características con efecto cristal */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-gray-700">
                    <div className="font-medium">Alcance Global</div>
                    <div className="text-xs text-gray-500">Universidades internacionales</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-gray-700">
                    <div className="font-medium">Cursos MOOC</div>
                    <div className="text-xs text-gray-500">Certificados verificables</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-xl p-3 border border-gray-200/50">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-gray-700">
                    <div className="font-medium">IA Integrada</div>
                    <div className="text-xs text-gray-500">Asistente LIA disponible</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats minimalistas */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-lg">
                  <div className="text-2xl font-bold text-gray-800">500+</div>
                  <div className="text-xs text-gray-600 mt-1">Estudiantes</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-lg">
                  <div className="text-2xl font-bold text-gray-800">50+</div>
                  <div className="text-xs text-gray-600 mt-1">Cursos</div>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-lg">
                  <div className="text-2xl font-bold text-gray-800">20+</div>
                  <div className="text-xs text-gray-600 mt-1">Países</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Auth;
