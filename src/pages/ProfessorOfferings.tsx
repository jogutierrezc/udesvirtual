import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Users, MapPin, BookOpen, Mail, Phone, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LiaChat } from "@/components/LiaChat";
import RequestModal from "@/components/RequestModal";
import { EmptyState } from "@/components/EmptyState";

const ProfessorOfferings = () => {
  const [offerings, setOfferings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [campusFilter, setCampusFilter] = useState<string>("all");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [selectedOffering, setSelectedOffering] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
    } catch (err) {
      console.error("Error loading offerings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener listas únicas de campus y programas
  const campusList = useMemo(() => {
    const uniqueCampus = new Set(offerings.map(o => o.campus));
    return Array.from(uniqueCampus).sort();
  }, [offerings]);

  const programsList = useMemo(() => {
    const uniquePrograms = new Set(offerings.map(o => o.profession));
    return Array.from(uniquePrograms).sort();
  }, [offerings]);

  // Filtrar ofertas
  const filteredOfferings = useMemo(() => {
    return offerings.filter((o) => {
      const searchLower = searchTerm.toLowerCase();
      const areasMatch = Array.isArray(o.knowledge_area)
        ? o.knowledge_area.some((area: string) => area.toLowerCase().includes(searchLower))
        : o.knowledge_area?.toLowerCase().includes(searchLower);

      const matchesSearch =
        o.title?.toLowerCase().includes(searchLower) ||
        areasMatch ||
        o.profession?.toLowerCase().includes(searchLower) ||
        o.udes_professor_name?.toLowerCase().includes(searchLower) ||
        o.udes_professor_program?.toLowerCase().includes(searchLower);

      const matchesCampus = campusFilter === "all" || o.campus === campusFilter;
      const matchesProgram = programFilter === "all" || o.profession === programFilter;

      return matchesSearch && matchesCampus && matchesProgram;
    });
  }, [offerings, searchTerm, campusFilter, programFilter]);

  // Paginar ofertas
  const paginatedOfferings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOfferings.slice(startIndex, endIndex);
  }, [filteredOfferings, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOfferings.length / itemsPerPage);

  // Reset página al cambiar filtros
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Reset página al cambiar items por página
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const renderAlliedProfessor = (offering: any) => {
    const parts = (offering.allied_professor || "").split(" | ");
    const name = parts[0] || "";
    const phone = parts[1] || "";
    const email = parts[2] || "";

    const instParts = (offering.allied_institution || "").split(" | ");
    const career = instParts[0] || "";
    const campus = instParts[1] || "";

    return (
      <>
        {name && <p className="font-medium text-lg">{name}</p>}
        {(career || campus) && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {career && <p><strong>Carrera:</strong> {career}</p>}
            {campus && <p><strong>Campus:</strong> {campus}</p>}
          </div>
        )}
        <div className="flex flex-col gap-2 mt-4">
          {email && (
            <Button variant="outline" className="w-full justify-start" onClick={() => (window.location.href = `mailto:${email}`)}>
              <Mail className="h-4 w-4 mr-2" />
              {email}
            </Button>
          )}
          {phone && (
            <Button variant="outline" className="w-full justify-start" onClick={() => (window.location.href = `tel:${phone}`)}>
              <Phone className="h-4 w-4 mr-2" />
              {phone}
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Oferta para Profesores</h1>
          <p className="text-white/80">Cursos UDES disponibles para intercambio con otras Instituciones de Educación Superior</p>
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

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-4">
          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por título, área de conocimiento, programa..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              className="pl-10"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              value={campusFilter}
              onValueChange={(value) => {
                setCampusFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los campus</SelectItem>
                {campusList.map(campus => (
                  <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={programFilter}
              onValueChange={(value) => {
                setProgramFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los programas</SelectItem>
                {programsList.map(program => (
                  <SelectItem key={program} value={program}>{program}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resultados y selector de items por página */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Mostrando {paginatedOfferings.length} de {filteredOfferings.length} resultado(s)
            </span>
            <div className="flex items-center gap-2">
              <span>Mostrar:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Offerings Section */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Cursos Disponibles</h2>
          <p className="text-muted-foreground">Estos cursos están disponibles para establecer intercambios académicos con otras IES</p>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : filteredOfferings.length === 0 ? (
          <EmptyState 
            type="professor-offerings" 
            searchTerm={searchTerm || campusFilter !== "all" || programFilter !== "all" ? 
              `${searchTerm} ${campusFilter !== "all" ? campusFilter : ''} ${programFilter !== "all" ? programFilter : ''}`.trim() : 
              undefined
            } 
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {paginatedOfferings.map((offering) => (
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
                      offering.knowledge_area.map((area: string, i: number) => (
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

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
        )}
      </section>

      {/* Modal con detalles completos */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-full max-w-5xl mx-4 sm:mx-auto rounded-lg p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
          {selectedOffering && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <DialogTitle className="text-2xl pr-4">{selectedOffering.title}</DialogTitle>
                  <div className="flex items-center gap-3">
                    <Badge variant={selectedOffering.offering_type === "exchange" ? "default" : "secondary"}>
                      {selectedOffering.offering_type === "exchange" ? "Exchange" : "Programada"}
                    </Badge>
                    {/* Solicitar button only for Exchange offers */}
                    {selectedOffering.offering_type === "exchange" && (
                      <Button onClick={() => setShowRequestModal(true)} variant="secondary">Solicitar</Button>
                    )}
                    <Button variant="ghost" onClick={() => setShowModal(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <DialogDescription>
                  <strong>Programa:</strong> {selectedOffering.profession}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="md:col-span-2">
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-sm text-muted-foreground text-justify">{selectedOffering.description}</p>
                </div>

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

                {selectedOffering.knowledge_area && (
                  <div>
                    <h3 className="font-semibold mb-2">Áreas de Conocimiento</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedOffering.knowledge_area) ? (
                        selectedOffering.knowledge_area.map((area: string, i: number) => (
                          <Badge key={i} variant="outline">{area}</Badge>
                        ))
                      ) : (
                        <Badge variant="outline">{selectedOffering.knowledge_area}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Profesor UDES o aliado */}
                {(selectedOffering.udes_professor_name || selectedOffering.allied_professor || selectedOffering.allied_institution) && (
                  <div className="border-t pt-4 md:col-span-2">
                    <h3 className="font-semibold mb-3">Profesor a Cargo</h3>
                    <div className="space-y-3">
                      {selectedOffering.udes_professor_name ? (
                        <>
                          <p className="font-medium text-lg">{selectedOffering.udes_professor_name}</p>
                          {selectedOffering.udes_professor_program && (
                            <p className="text-sm text-muted-foreground"><strong>Programa:</strong> {selectedOffering.udes_professor_program}</p>
                          )}
                          <div className="flex flex-col gap-2 mt-4">
                            {selectedOffering.udes_professor_email && (
                              <Button variant="outline" className="w-full justify-start" onClick={() => (window.location.href = `mailto:${selectedOffering.udes_professor_email}`)}>
                                <Mail className="h-4 w-4 mr-2" />
                                {selectedOffering.udes_professor_email}
                              </Button>
                            )}
                            {selectedOffering.udes_professor_phone && (
                              <Button variant="outline" className="w-full justify-start" onClick={() => (window.location.href = `tel:${selectedOffering.udes_professor_phone}`)}>
                                <Phone className="h-4 w-4 mr-2" />
                                {selectedOffering.udes_professor_phone}
                              </Button>
                            )}
                          </div>
                        </>
                      ) : (
                        renderAlliedProfessor(selectedOffering)
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Solicitud */}
      <RequestModal
        open={showRequestModal}
        onOpenChange={setShowRequestModal}
        offeringId={selectedOffering?.id}
        offeringTitle={selectedOffering?.title}
      />

      <LiaChat />
    </div>
  );
};

export default ProfessorOfferings;
 
