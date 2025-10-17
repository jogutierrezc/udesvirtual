import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Users, BookOpen, Mail, GraduationCap, Globe, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { LiaChat } from "@/components/LiaChat";
import { EmptyState } from "@/components/EmptyState";

const CoilOfferings = () => {
  const [proposals, setProposals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      const { data, error } = await supabase
        .from("coil_proposals")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error("Error loading COIL proposals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProposals = proposals.filter((p) => {
    const searchLower = searchTerm.toLowerCase();
    const languagesMatch = Array.isArray(p.languages)
      ? p.languages.some((lang) => lang.toLowerCase().includes(searchLower))
      : false;
    const sdgMatch = Array.isArray(p.sustainable_development_goals)
      ? p.sustainable_development_goals.some((sdg) => sdg.toLowerCase().includes(searchLower))
      : false;

    return (
      p.full_name.toLowerCase().includes(searchLower) ||
      p.academic_program.toLowerCase().includes(searchLower) ||
      p.course_name.toLowerCase().includes(searchLower) ||
      p.project_topics.toLowerCase().includes(searchLower) ||
      languagesMatch ||
      sdgMatch
    );
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Propuestas COIL</h1>
          <p className="text-white/80">
            Proyectos de Aprendizaje Colaborativo Internacional en Línea (COIL) disponibles
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
            placeholder="Buscar por profesor, programa, curso, temas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Proposals Section */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Proyectos Disponibles</h2>
          <p className="text-muted-foreground">
            Estas propuestas COIL están disponibles para colaboración internacional
          </p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : filteredProposals.length === 0 ? (
          <EmptyState type="coil" searchTerm={searchTerm || undefined} />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredProposals.map((proposal) => (
              <Card 
                key={proposal.id} 
                className="shadow-card hover:shadow-elegant transition-all cursor-pointer"
                onClick={() => {
                  setSelectedProposal(proposal);
                  setShowModal(true);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{proposal.course_name}</CardTitle>
                      <CardDescription>
                        <strong>Programa:</strong> {proposal.academic_program}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 text-justify">{proposal.project_topics}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="h-4 w-4" />
                      {proposal.full_name}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Capacidad: {proposal.external_capacity} estudiantes
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      Semestre: {proposal.academic_semester}
                    </div>
                  </div>

                  {/* Idiomas */}
                  {Array.isArray(proposal.languages) && proposal.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {proposal.languages.map((lang, i) => (
                        <Badge key={i} variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <p className="text-xs text-muted-foreground">Haz clic para ver más detalles</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Modal con detalles completos */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedProposal && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl pr-4">{selectedProposal.course_name}</DialogTitle>
                <DialogDescription>
                  <strong>Programa:</strong> {selectedProposal.academic_program}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Temas del proyecto */}
                <div>
                  <h3 className="font-semibold mb-2">Temas del Proyecto COIL</h3>
                  <p className="text-sm text-muted-foreground text-justify">{selectedProposal.project_topics}</p>
                </div>

                {/* Detalles del curso */}
                <div>
                  <h3 className="font-semibold mb-2">Detalles del Curso</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Semestre:</strong> {selectedProposal.academic_semester}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Capacidad:</strong> {selectedProposal.external_capacity} estudiantes</span>
                    </div>
                  </div>
                </div>

                {/* Idiomas */}
                {Array.isArray(selectedProposal.languages) && selectedProposal.languages.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Idiomas del Proyecto</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProposal.languages.map((lang, i) => (
                        <Badge key={i} variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* ODS */}
                {Array.isArray(selectedProposal.sustainable_development_goals) && selectedProposal.sustainable_development_goals.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Objetivos de Desarrollo Sostenible (ODS)</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProposal.sustainable_development_goals.map((sdg, i) => (
                        <Badge key={i} variant="secondary">
                          <Target className="h-3 w-3 mr-1" />
                          {sdg}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Información del profesor */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Información del Profesor</h3>
                  <div className="space-y-3">
                    <p className="font-medium text-lg">{selectedProposal.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Programa:</strong> {selectedProposal.academic_program}
                    </p>
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 justify-start"
                          onClick={() => window.location.href = `mailto:${selectedProposal.email}`}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Enviar correo
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => copyToClipboard(selectedProposal.email)}
                          title="Copiar correo"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        {selectedProposal.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <LiaChat />
    </div>
  );
};

export default CoilOfferings;
