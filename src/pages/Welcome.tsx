import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Welcome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    checkAuth();
    startConfetti();
  }, []);

  const startConfetti = () => {
    // Crear canvas para confetti
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fuegos artificiales desde diferentes posiciones
      (window as any).confetti?.(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      }));
      (window as any).confetti?.(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      }));
    }, 250);
  };

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Obtener nombre del perfil
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      setUserName(profile?.full_name || "");
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Contenido principal */}
      <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-bounce">
          <div className="bg-white rounded-full p-6 shadow-2xl">
            <img
              src="https://udes.edu.co/images/logo/logo-con-acreditada-color.png"
              alt="Logo UDES"
              className="h-24 w-auto object-contain"
            />
          </div>
        </div>

        {/* Animación Lottie */}
        <div className="flex justify-center mb-8">
          <iframe
            src="https://lottie.host/embed/e0ad9025-42f8-43ed-9c0a-44888da72f63/0p1ckanY9n.json"
            style={{ width: "300px", height: "300px", border: "none" }}
            title="Welcome Animation"
          />
        </div>

        {/* Texto de bienvenida */}
        <div className="space-y-4 text-white">
          <h1 className="text-4xl md:text-6xl font-bold animate-fade-in">
            ¡Felicitaciones{userName ? `, ${userName.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-xl md:text-2xl font-medium opacity-90">
            Eres parte de las personas que piensan global
          </p>
          <p className="text-lg md:text-xl opacity-80">
            como la Universidad de Santander
          </p>
        </div>

        {/* Botón de continuar */}
        <div className="pt-8">
          <Button
            onClick={handleContinue}
            size="lg"
            className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold shadow-2xl transform hover:scale-105 transition-all"
          >
            Continuar al Portal
          </Button>
        </div>

        {/* Decoración adicional */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full animate-pulse delay-500" />
          <div className="absolute top-1/2 right-20 w-16 h-16 bg-white/10 rounded-full animate-pulse delay-1000" />
        </div>
      </div>
    </div>
  );
}
