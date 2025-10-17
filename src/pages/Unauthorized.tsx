import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LogIn } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative overflow-hidden flex items-center justify-center">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
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
              src="https://lottie.host/3d87eba6-29bc-4e74-8758-a52730ecf957/2dK9mVQsOg.lottie"
              loop
              autoplay
              className="w-full"
            />
          </div>

          {/* Mensaje de error */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600">
              ¡Acceso No Autorizado!
            </h1>
            <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-md mx-auto">
              Esta área está protegida. Debes iniciar sesión con una cuenta autorizada para acceder 🔒
            </p>
          </div>

          {/* Botones de acción */}
          <div className="w-full max-w-md space-y-3 pt-2">
            <Link to="/auth" className="block">
              <Button 
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all" 
                size="lg"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Iniciar Sesión
              </Button>
            </Link>

            <Link to="/" className="block">
              <Button 
                variant="outline" 
                className="w-full border-2 border-orange-300 hover:bg-orange-50 text-orange-700 font-semibold" 
                size="lg"
              >
                <Home className="mr-2 h-5 w-5" />
                Regresar al Inicio
              </Button>
            </Link>
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

export default Unauthorized;
