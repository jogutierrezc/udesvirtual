import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Compass, Heart, Award, X, CheckCircle } from "lucide-react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface PassportWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userRole: "admin" | "professor" | "student";
  userEmail: string;
}

const PassportWelcomeModal: React.FC<PassportWelcomeModalProps> = ({
  isOpen,
  onClose,
  userId,
  userRole,
  userEmail,
}) => {
  const handleClose = () => {
    // Mark as seen for this user
    if (userId) {
      localStorage.setItem(`passport-welcome-seen-${userId}`, 'true');
    }
    onClose();
  };

  const getRoleMessage = () => {
    switch (userRole) {
      case 'professor':
        return {
          title: "¡Bienvenido, Docente UDES!",
          subtitle: "Tu viaje hacia la excelencia académica comienza aquí",
          description: "Como profesor de la Universidad de Santander, tienes el poder de inspirar y guiar a la próxima generación. El Pasaporte UDES te ayudará a desarrollar tus habilidades pedagógicas y contribuir al crecimiento académico de nuestros estudiantes."
        };
      case 'admin':
        return {
          title: "¡Bienvenido, Administrador UDES!",
          subtitle: "Líder en la transformación educativa",
          description: "Como administrador de la Universidad de Santander, eres parte fundamental de nuestra misión educativa. El Pasaporte UDES te brinda herramientas para potenciar tu liderazgo y contribuir a la innovación académica."
        };
      default:
        return {
          title: "¡Bienvenido, Estudiante UDES!",
          subtitle: "Tu viaje hacia la ciudadanía global comienza aquí",
          description: "Como estudiante de la Universidad de Santander, tienes la oportunidad de desarrollar habilidades que te prepararán para los desafíos del siglo XXI. El Pasaporte UDES es tu compañero en este viaje de crecimiento personal y profesional."
        };
    }
  };

  const roleMessage = getRoleMessage();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-white/20 shadow-2xl backdrop-blur-xl relative">
        {/* Gaussian gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-orange-50 opacity-80"></div>
        <div className="absolute inset-0 bg-gradient-radial from-blue-100/30 via-transparent to-orange-100/30"></div>
        
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg"></div>
        
        <div className="relative z-10">
          <DialogHeader className="text-center pb-4">
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 rounded-full hover:bg-white/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Fixed UDES Logo at the top */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full shadow-lg border-4 border-white/50 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">UDES</span>
              </div>
            </div>

            <DialogTitle className="text-3xl font-bold text-gray-800 mb-2">
              {roleMessage.title}
            </DialogTitle>
            <p className="text-lg text-orange-700 font-medium">
              {roleMessage.subtitle}
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Lottie Animation in the center */}
            <div className="flex justify-center py-6">
              <div className="w-72 h-72 bg-white/30 backdrop-blur-md rounded-3xl border border-white/40 shadow-2xl overflow-hidden">
                <DotLottieReact
                  src="https://lottie.host/add1a583-9936-4d09-b55b-262322c0e1e7/3IRxCioo5B.lottie"
                  loop
                  autoplay
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Welcome Message */}
            <Card className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-xl">
              <CardContent className="p-6">
                <p className="text-gray-700 leading-relaxed text-center">
                  {roleMessage.description}
                </p>
              </CardContent>
            </Card>

            {/* Pathways Preview */}
            <div>
              <h3 className="text-xl font-semibold text-center mb-6 text-gray-800">
                Tres Senderos hacia la Excelencia
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="backdrop-blur-xl bg-white/60 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-blue-800 mb-2">Conocimiento</h4>
                    <p className="text-sm text-blue-700">
                      Desarrolla habilidades académicas avanzadas y conocimientos especializados en tu campo.
                    </p>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-xl bg-white/60 border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-green-100 rounded-full">
                        <Compass className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-green-800 mb-2">Descubrimiento</h4>
                    <p className="text-sm text-green-700">
                      Explora nuevas perspectivas, innova y contribuye al avance del conocimiento.
                    </p>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-xl bg-white/60 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-orange-100 rounded-full">
                        <Heart className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-orange-800 mb-2">Impacto Social</h4>
                    <p className="text-sm text-orange-700">
                      Contribuye al bienestar de la comunidad y genera un impacto positivo en la sociedad.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* How it Works */}
            <Card className="backdrop-blur-xl bg-white/80 border border-white/40 shadow-xl">
              <CardContent className="p-6">
                <h4 className="font-semibold text-center mb-4 text-gray-800">¿Cómo funciona?</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <p className="text-sm font-medium">Inscríbete en rutas</p>
                    <p className="text-xs text-gray-600">Elige los senderos que quieres explorar</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <p className="text-sm font-medium">Completa actividades</p>
                    <p className="text-xs text-gray-600">Participa en cursos, proyectos y desafíos</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <p className="text-sm font-medium">Gana reconocimientos</p>
                    <p className="text-xs text-gray-600">Obtén insignias, certificados y puntos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <div className="text-center space-y-4">
              <Button
                onClick={handleClose}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 text-lg font-semibold shadow-lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                ¡Comenzar mi viaje!
              </Button>
              <p className="text-sm text-gray-600">
                Tu progreso se guardará automáticamente. ¡Puedes continuar en cualquier momento!
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PassportWelcomeModal;