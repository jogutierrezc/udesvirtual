import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, MessageCircle, BookOpen } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const errorMessages = [
  "¡Ups! Parece que esta página está de intercambio en otra dimensión 🌍✈️",
  "Error 404: Esta ruta académica no existe en nuestro catálogo internacional 📚🌎",
  "¡Conexión perdida! Esta página está en una videoconferencia COIL virtual 💻🌐",
  "Esta URL se fue de movilidad académica y no regresó 🎓✈️",
  "404: Página no encontrada. ¿Quizás está en clase espejo? 🪞🌍",
  "¡Oops! Esta ruta no está en el mapa de internacionalización 🗺️❌",
];

const NotFound = () => {
  const location = useLocation();
  const [randomErrorMsg] = useState(() => 
    errorMessages[Math.floor(Math.random() * errorMessages.length)]
  );

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex items-center justify-center">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Contenido centrado */}
      <div className="relative z-10 max-w-2xl w-full px-4">
        <div className="flex flex-col items-center space-y-6">
          {/* Logo UDES */}
          <div className="flex justify-center">
            <img
              src="https://udes.edu.co/images/logo/logo-con-acreditada-color.png"
              alt="Logo UDES"
              className="h-16 md:h-20 object-contain"
            />
          </div>

          {/* Animación Lottie */}
          <div className="w-full max-w-sm -my-4">
            <DotLottieReact
              src="https://lottie.host/8fe05372-88f4-4f8e-bda8-513fb9e9cad8/p5uC5NX6dP.lottie"
              loop
              autoplay
              className="w-full"
            />
          </div>

          {/* Mensaje de error */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              ¡Página No Encontrada!
            </h1>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-md mx-auto">
              {randomErrorMsg}
            </p>
          </div>

          {/* Botones de acción */}
          <div className="w-full max-w-md space-y-3 pt-2">
            <Link to="/" className="block">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all" 
                size="lg"
              >
                <Home className="mr-2 h-5 w-5" />
                Regresar al Inicio
              </Button>
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <Link to="/catalog" className="block">
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold" 
                  size="lg"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Catálogo
                </Button>
              </Link>
              <Link to="/lia" className="block">
                <Button 
                  variant="outline" 
                  className="w-full border-2 border-purple-300 hover:bg-purple-50 text-purple-700 font-semibold" 
                  size="lg"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Hablar con LIA
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
