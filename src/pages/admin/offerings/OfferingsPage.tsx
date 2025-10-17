import { useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit2, Trash2, EyeOff, Loader2, Globe } from "lucide-react";
import { OfferingFormModal } from "./modals/OfferingFormModal";
import { CoilFormModal } from "./modals/CoilFormModal";
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
  const [editingOffering, setEditingOffering] = useState<Offering | null>(null);
  const [editingCoil, setEditingCoil] = useState<CoilProposal | null>(null);

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
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Offerings List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Ofertas de Cursos</CardTitle>
              <CardDescription className="text-xs md:text-sm">Ofertas académicas aprobadas</CardDescription>
            </CardHeader>
            <CardContent>
              {catalogOfferings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No hay ofertas publicadas</p>
              ) : (
                <div className="space-y-2">
                  {catalogOfferings.map((offering) => (
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* COIL Proposals List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Propuestas COIL</CardTitle>
              <CardDescription className="text-xs md:text-sm">Proyectos COIL aprobados</CardDescription>
            </CardHeader>
            <CardContent>
              {catalogCoilProposals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No hay propuestas COIL</p>
              ) : (
                <div className="space-y-2">
                  {catalogCoilProposals.map((coil) => (
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
    </div>
  );
};
