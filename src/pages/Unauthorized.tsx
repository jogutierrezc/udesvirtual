import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Home, LogIn } from "lucide-react";

const Unauthorized = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Acceso Restringido</CardTitle>
          <CardDescription className="text-base">
            Esta área está protegida y requiere autenticación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">¿Por qué veo esto?</h3>
            <p className="text-sm text-muted-foreground">
              El área de administración requiere que inicies sesión con una cuenta autorizada. 
              Solo los usuarios con permisos de administrador o profesor pueden acceder a esta sección.
            </p>
          </div>

          <div className="space-y-3">
            <Link to="/auth" className="block">
              <Button className="w-full" size="lg">
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/" className="block">
              <Button variant="outline" className="w-full" size="lg">
                <Home className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Button>
            </Link>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            <p>¿No tienes una cuenta?</p>
            <p className="mt-1">
              Contacta al administrador del sistema para solicitar acceso.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;
