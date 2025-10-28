import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const WelcomeProfesor: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Bienvenido, Profesor</CardTitle>
            <CardDescription>
              Gracias por registrarte como profesor UDES. Soy LIA — la asistente de la plataforma — y te ayudaré a integrar tus propuestas académicas y coordinar actividades internacionales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-700">
              <p>
                En los próximos pasos podrás completar tu perfil institucional. Si tu cuenta requiere verificación por parte del equipo administrativo, recibirás instrucciones por correo.
              </p>

              <ul className="list-disc pl-5 space-y-2">
                <li>Completa tu perfil académico y la información de la universidad.</li>
                <li>Accede a la sección "Oferta para Profesores" para publicar o solicitar actividades.</li>
                <li>Si necesitas ayuda, pide a LIA usando el chat en la parte inferior derecha.</li>
              </ul>

              <div className="pt-4">
                <Button onClick={() => navigate("/profile-setup")} className="mr-2">Completar perfil</Button>
                <Button variant="outline" onClick={() => navigate("/")}>Ir al inicio</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WelcomeProfesor;
