import { useState, useMemo, useEffect } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit2, Trash2, EyeOff, Loader2, Globe, Upload, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { OfferingFormModal } from "./modals/OfferingFormModal";
import { CoilFormModal } from "./modals/CoilFormModal";
import { ImportModal } from "./modals/ImportModal";

import { Badge } from "@/components/ui/badge";
import { Tables } from "@/integrations/supabase/types";

type Offering = Tables<"course_offerings">;
type CoilProposal = Tables<"coil_proposals">;

export const OfferingsPage = () => {
  const {
    catalogOfferings,
    catalogCoilProposals,
    deleteOffering,
    deleteCoil,
    updateOffering,
    loading,
  } = useAdmin();

  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [showCoilModal, setShowCoilModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);
  const [editingCoil, setEditingCoil] = useState<CoilProposal | null>(null);

  // Estados para filtros y paginación de Ofertas
  const [offeringSearchTerm, setOfferingSearchTerm] = useState("");
  const [offeringCampusFilter, setOfferingCampusFilter] = useState<string>("all");
  const [offeringProfessionFilter, setOfferingProfessionFilter] = useState<string>("all");
  const [offeringPage, setOfferingPage] = useState(1);
  const offeringsPerPage = 10;

  // Estados para paginación de COIL
  const [coilPage, setCoilPage] = useState(1);
  const coilPerPage = 10;

  const handleEditOffering = (offering: Offering) => {
    setEditingOffering(offering);
    setShowOfferingModal(true);
  };

  const handleDeleteOffering = async (id: string) => {
    if (!confirm("¿Eliminar esta oferta? Esta acción es irreversible.")) return;
    await deleteOffering(id);
  };

  const handleDisableOffering = async (id: string) => {
    if (!confirm("¿Deshabilitar esta oferta?")) return;
    await updateOffering(id, { status: "rejected" });
  };

  

  const handleEditCoil = (coil: CoilProposal) => {
    setEditingCoil(coil);
    setShowCoilModal(true);
  };

  const handleDeleteCoil = async (id: string) => {
    if (!confirm("¿Eliminar esta propuesta COIL? Esta acción es irreversible.")) return;
    await deleteCoil(id);
  };

  const handleCloseOfferingModal = () => {
    setShowOfferingModal(false);
    setEditingOffering(null);
  };

  const handleCloseCoilModal = () => {
    setShowCoilModal(false);
    setEditingCoil(null);
  };

  // Obtener listas únicas de campus y profesiones
  const campusList = useMemo(() => {
    const uniqueCampus = new Set(catalogOfferings.map(o => o.campus));
    return Array.from(uniqueCampus).sort();
  }, [catalogOfferings]);

  const professionsList = useMemo(() => {
    const uniqueProfessions = new Set(catalogOfferings.map(o => o.profession));
    return Array.from(uniqueProfessions).sort();
  }, [catalogOfferings]);

  // Filtrar ofertas
  const filteredOfferings = useMemo(() => {
    return catalogOfferings.filter(offering => {
      const matchesSearch = offering.title.toLowerCase().includes(offeringSearchTerm.toLowerCase()) ||
                          offering.description.toLowerCase().includes(offeringSearchTerm.toLowerCase());
      const matchesCampus = offeringCampusFilter === "all" || offering.campus === offeringCampusFilter;
      const matchesProfession = offeringProfessionFilter === "all" || offering.profession === offeringProfessionFilter;
      
      return matchesSearch && matchesCampus && matchesProfession;
    });
  }, [catalogOfferings, offeringSearchTerm, offeringCampusFilter, offeringProfessionFilter]);

  // Paginar ofertas
  const paginatedOfferings = useMemo(() => {
    const startIndex = (offeringPage - 1) * offeringsPerPage;
    const endIndex = startIndex + offeringsPerPage;
    return filteredOfferings.slice(startIndex, endIndex);
  }, [filteredOfferings, offeringPage, offeringsPerPage]);

  const totalOfferingPages = Math.ceil(filteredOfferings.length / offeringsPerPage);

  // Paginar COIL
  const paginatedCoil = useMemo(() => {
    const startIndex = (coilPage - 1) * coilPerPage;
    const endIndex = startIndex + coilPerPage;
    return catalogCoilProposals.slice(startIndex, endIndex);
  }, [catalogCoilProposals, coilPage, coilPerPage]);

  const totalCoilPages = Math.ceil(catalogCoilProposals.length / coilPerPage);

  // Reset página al cambiar filtros
  const handleFilterChange = () => {
    setOfferingPage(1);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="space-y-4 md:space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => setShowOfferingModal(true)} className="w-full sm:w-auto">
            <PlusCircle className="h-4 w-4 mr-2" /> Crear Oferta
          </Button>
          <Button onClick={() => setShowCoilModal(true)} variant="secondary" className="w-full sm:w-auto">
            <Globe className="h-4 w-4 mr-2" /> Crear COIL
          </Button>
          <Button onClick={() => setShowImportModal(true)} variant="outline" className="w-full sm:w-auto">
            <Upload className="h-4 w-4 mr-2" /> Importar Datos
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Offerings List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Ofertas de Cursos</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {filteredOfferings.length} de {catalogOfferings.length} ofertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título o descripción..."
                    value={offeringSearchTerm}
                    onChange={(e) => {
                      setOfferingSearchTerm(e.target.value);
                      handleFilterChange();
                    }}
                    className="pl-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={offeringCampusFilter}
                    onValueChange={(value) => {
                      setOfferingCampusFilter(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Campus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los campus</SelectItem>
                      {campusList.map(campus => (
                        <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={offeringProfessionFilter}
                    onValueChange={(value) => {
                      setOfferingProfessionFilter(value);
                      handleFilterChange();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Profesión" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las profesiones</SelectItem>
                      {professionsList.map(profession => (
                        <SelectItem key={profession} value={profession}>{profession}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista */}
              {filteredOfferings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  {catalogOfferings.length === 0 ? "No hay ofertas publicadas" : "No se encontraron ofertas con los filtros aplicados"}
                </p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {paginatedOfferings.map((offering) => (
                    <div
                      key={offering.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded p-3 hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm md:text-base">{offering.title}</div>
                        <div className="text-xs md:text-sm text-muted-foreground truncate">
                          {offering.campus} • {offering.profession}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditOffering(offering)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDeleteOffering(offering.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisableOffering(offering.id)}
                          className="h-8 w-8 p-0"
                        >
                          <EyeOff className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        {/* Buzón / Requests summary */}
                        {/* additional actions can go here */}
                      </div>
                    </div>
                  ))}
                </div>

                  {/* Paginación de Ofertas */}
                  {totalOfferingPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Página {offeringPage} de {totalOfferingPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOfferingPage(prev => Math.max(1, prev - 1))}
                          disabled={offeringPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOfferingPage(prev => Math.min(totalOfferingPages, prev + 1))}
                          disabled={offeringPage === totalOfferingPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* COIL Proposals List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Propuestas COIL</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {catalogCoilProposals.length} proyecto(s) COIL
              </CardDescription>
            </CardHeader>
            <CardContent>
              {catalogCoilProposals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No hay propuestas COIL</p>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {paginatedCoil.map((coil) => (
                    <div
                      key={coil.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded p-3 hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm md:text-base">{coil.course_name}</div>
                        <div className="text-xs md:text-sm text-muted-foreground truncate">
                          {coil.academic_program} • {coil.full_name}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-4">
                        <Button variant="ghost" size="sm" onClick={() => handleEditCoil(coil)} className="h-8 w-8 p-0">
                          <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteCoil(coil.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                  {/* Paginación de COIL */}
                  {totalCoilPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Página {coilPage} de {totalCoilPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCoilPage(prev => Math.max(1, prev - 1))}
                          disabled={coilPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCoilPage(prev => Math.min(totalCoilPages, prev + 1))}
                          disabled={coilPage === totalCoilPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <OfferingFormModal
        open={showOfferingModal}
        onOpenChange={handleCloseOfferingModal}
        editingOffering={editingOffering}
      />
      <CoilFormModal
        open={showCoilModal}
        onOpenChange={handleCloseCoilModal}
        editingCoil={editingCoil}
      />
      <ImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* Buzón modal removed — moved to separate /admin/buzon page */}
    </div>
  );
};
