import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Users, MapPin, BookOpen, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { LiaChat } from "@/components/LiaChat";

const ProfessorOfferings = () => {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOffering, setSelectedOffering] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      const { data, error } = await supabase
        .from("course_offerings")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOfferings(data || []);
    } catch (error) {
      console.error("Error loading offerings:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOfferings = offerings.filter((o) => {
    const searchLower = searchTerm.toLowerCase();
    const areasMatch = Array.isArray(o.knowledge_area)
      ? o.knowledge_area.some((area) => area.toLowerCase().includes(searchLower))
      : o.knowledge_area?.toLowerCase().includes(searchLower);

    return (
      o.title.toLowerCase().includes(searchLower) ||
      areasMatch ||
      o.profession.toLowerCase().includes(searchLower) ||
      o.udes_professor_name?.toLowerCase().includes(searchLower) ||
      o.udes_professor_program?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Oferta para Profesores</h1>
          <p className="text-white/80">
            Cursos UDES disponibles para intercambio con otras Instituciones de Educación Superior
          </p>
          <div className="flex gap-2 mt-4">
            <Link to="/catalog">
              <Button variant="secondary">Ver Catálogo</Button>
            </Link>
            <Link to="/">
              <Button variant="secondary">Inicio</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por título, área de conocimiento, programa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Offerings Section */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Cursos Disponibles</h2>
          <p className="text-muted-foreground">
            Estos cursos están disponibles para establecer intercambios académicos con otras IES
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : filteredOfferings.length === 0 ? (
          <p className="text-muted-foreground">No se encontraron ofertas</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredOfferings.map((offering) => (
              <Card 
                key={offering.id} 
                className="shadow-card hover:shadow-elegant transition-all cursor-pointer"
                onClick={() => {
                  setSelectedOffering(offering);
                  setShowModal(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{offering.title}</CardTitle>
                      <CardDescription>
                        <strong>Programa:</strong> {offering.profession}
                      </CardDescription>
                    </div>
                    <Badge variant={offering.offering_type === "exchange" ? "default" : "secondary"}>
                      {offering.offering_type === "exchange" ? "Exchange" : "Programada"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 text-justify">{offering.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {offering.campus}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Capacidad: {offering.capacity} estudiantes
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      Duración: {offering.hours} horas
                    </div>
                  </div>

                  {/* Áreas de conocimiento */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {Array.isArray(offering.knowledge_area) ? (
                      offering.knowledge_area.map((area, i) => (
                        <Badge key={i} variant="outline">
                          {area}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline">{offering.knowledge_area}</Badge>
                    )}
                  </div>

                  {/* Vista previa del profesor UDES */}
                  {offering.udes_professor_name && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-xs text-muted-foreground">Haz clic para ver más detalles del profesor UDES</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modal con detalles completos */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedOffering && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <DialogTitle className="text-2xl pr-4">{selectedOffering.title}</DialogTitle>
                  <Badge variant={selectedOffering.offering_type === "exchange" ? "default" : "secondary"}>
                    {selectedOffering.offering_type === "exchange" ? "Exchange" : "Programada"}
                  </Badge>
                </div>
                <DialogDescription>
                  <strong>Programa:</strong> {selectedOffering.profession}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Descripción completa */}
                <div>
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-sm text-muted-foreground text-justify">{selectedOffering.description}</p>
                </div>

                {/* Detalles del curso */}
                <div>
                  <h3 className="font-semibold mb-2">Detalles del Curso</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Campus:</strong> {selectedOffering.campus}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Capacidad:</strong> {selectedOffering.capacity} estudiantes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Duración:</strong> {selectedOffering.hours} horas</span>
                    </div>
                  </div>
                </div>

                {/* Áreas de conocimiento */}
                {selectedOffering.knowledge_area && (
                  <div>
                    <h3 className="font-semibold mb-2">Áreas de Conocimiento</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedOffering.knowledge_area) ? (
                        selectedOffering.knowledge_area.map((area, i) => (
                          <Badge key={i} variant="outline">
                            {area}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">{selectedOffering.knowledge_area}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Información del profesor UDES */}
                {selectedOffering.udes_professor_name && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Profesor UDES a Cargo</h3>
                    <div className="space-y-3">
                      <p className="font-medium text-lg">{selectedOffering.udes_professor_name}</p>
                      {selectedOffering.udes_professor_program && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Programa:</strong> {selectedOffering.udes_professor_program}
                        </p>
                      )}
                      <div className="flex flex-col gap-2 mt-4">
                        {selectedOffering.udes_professor_email && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => window.location.href = `mailto:${selectedOffering.udes_professor_email}`}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            {selectedOffering.udes_professor_email}
                          </Button>
                        )}
                        {selectedOffering.udes_professor_phone && (
                          <Button 
                            variant="outline" 
                            className="w-full justify-start"
                            onClick={() => window.location.href = `tel:${selectedOffering.udes_professor_phone}`}
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            {selectedOffering.udes_professor_phone}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <LiaChat />
    </div>
  );
};

export default ProfessorOfferings;
