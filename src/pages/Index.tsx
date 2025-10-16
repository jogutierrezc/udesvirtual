import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary to-accent text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
            <GraduationCap className="w-4 h-4" />
            <span>Universidad de Santander - UDES</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            UDES Exchange
          </h1>
          
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Portal de Oferta Pública y Abierta de Cursos Cortos, Master Class y Clases Espejo e Investigadores UDES
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="font-semibold">
                Iniciar Sesión
              </Button>
            </Link>
            <Link to="/catalog">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Ver Catálogo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* LIA Section */}
      <section className="bg-gradient-to-br from-accent/10 to-primary/10 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full text-sm shadow-card">
            <MessageSquare className="w-4 h-4 text-accent" />
            <span className="font-semibold text-foreground">Conoce a LIA</span>
          </div>
          
          <h2 className="text-3xl font-bold">Tu Asistente Inteligente</h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            LIA es más que una inteligencia artificial; es la embajadora digital de UDES, 
            diseñada para ayudarte con información sobre clases, docentes y movilidad académica.
          </p>

          <div className="grid md:grid-cols-2 gap-4 pt-6">
            <div className="bg-white p-6 rounded-lg shadow-card">
              <h3 className="font-semibold mb-2">🌟 Humana y Divertida</h3>
              <p className="text-sm text-muted-foreground">
                Lenguaje cercano y moderno con un toque de calidez
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-card">
              <h3 className="font-semibold mb-2">⚡ Joven y Dinámica</h3>
              <p className="text-sm text-muted-foreground">
                Respuestas rápidas y siempre actualizada
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-card">
              <h3 className="font-semibold mb-2">🎓 Formación Impecable</h3>
              <p className="text-sm text-muted-foreground">
                Respuestas precisas y estructuradas
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-card">
              <h3 className="font-semibold mb-2">🌍 Multilingüe</h3>
              <p className="text-sm text-muted-foreground">
                Español, inglés y portugués
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">¿Listo para comenzar?</h2>
          <p className="text-lg text-muted-foreground">
            Únete a la comunidad académica internacional de UDES
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="font-semibold">
                Crear Cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
