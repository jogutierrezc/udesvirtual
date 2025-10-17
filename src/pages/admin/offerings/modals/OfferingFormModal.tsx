import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TagInput } from "@/components/TagInput";
import { Loader2, PlusCircle } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { Tables } from "@/integrations/supabase/types";

type Offering = Tables<"course_offerings">;

interface OfferingFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingOffering?: Offering | null;
}

export const OfferingFormModal = ({
  open,
  onOpenChange,
  editingOffering,
}: OfferingFormModalProps) => {
  const { createOffering, updateOffering } = useAdmin();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    offering_type: "exchange" as "exchange" | "programada",
    knowledge_area: [] as string[],
    profession: "",
    capacity: "",
    hours: "",
    campus: "",
    allied_professor: "",
    allied_institution: "",
    udes_professor_name: "",
    udes_professor_program: "",
    udes_professor_phone: "",
    udes_professor_email: "",
  });

  useEffect(() => {
    if (editingOffering) {
      setForm({
        title: editingOffering.title || "",
        description: editingOffering.description || "",
        offering_type: (editingOffering.offering_type as any) || "exchange",
        knowledge_area: Array.isArray(editingOffering.knowledge_area)
          ? editingOffering.knowledge_area
          : editingOffering.knowledge_area
          ? [String(editingOffering.knowledge_area)]
          : [],
        profession: editingOffering.profession || "",
        capacity: String(editingOffering.capacity || ""),
        hours: String(editingOffering.hours || ""),
        campus: editingOffering.campus || "",
        allied_professor: editingOffering.allied_professor || "",
        allied_institution: editingOffering.allied_institution || "",
        udes_professor_name: editingOffering.udes_professor_name || "",
        udes_professor_program: editingOffering.udes_professor_program || "",
        udes_professor_phone: editingOffering.udes_professor_phone || "",
        udes_professor_email: editingOffering.udes_professor_email || "",
      });
    } else {
      resetForm();
    }
  }, [editingOffering, open]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      offering_type: "exchange",
      knowledge_area: [],
      profession: "",
      capacity: "",
      hours: "",
      campus: "",
      allied_professor: "",
      allied_institution: "",
      udes_professor_name: "",
      udes_professor_program: "",
      udes_professor_phone: "",
      udes_professor_email: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        title: form.title,
        description: form.description,
        offering_type: form.offering_type,
        knowledge_area: form.knowledge_area,
        profession: form.profession,
        capacity: parseInt(form.capacity),
        hours: parseInt(form.hours),
        campus: form.campus,
        allied_professor: form.allied_professor,
        allied_institution: form.allied_institution,
        udes_professor_name: form.udes_professor_name,
        udes_professor_program: form.udes_professor_program,
        udes_professor_phone: form.udes_professor_phone,
        udes_professor_email: form.udes_professor_email,
      };

      if (editingOffering) {
        await updateOffering(editingOffering.id, data);
      } else {
        await createOffering(data);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting offering:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingOffering ? "Editar Oferta" : "Crear Nueva Oferta Académica"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="offering_title">Título de la Oferta *</Label>
              <Input
                id="offering_title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offering_type">Tipo de Oferta *</Label>
              <Select
                value={form.offering_type}
                onValueChange={(value: "exchange" | "programada") =>
                  setForm({ ...form, offering_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exchange">Exchange</SelectItem>
                  <SelectItem value="programada">Programada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="offering_capacity">Capacidad de Estudiantes *</Label>
              <Input
                id="offering_capacity"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offering_hours">Número de Horas *</Label>
              <Input
                id="offering_hours"
                type="number"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offering_campus">Campus *</Label>
              <Input
                id="offering_campus"
                value={form.campus}
                onChange={(e) => setForm({ ...form, campus: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offering_profession">Profesión/Programa *</Label>
              <Input
                id="offering_profession"
                value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="offering_knowledge_area">Áreas de Conocimiento * (Tags)</Label>
              <TagInput
                tags={form.knowledge_area}
                onChange={(tags) => setForm({ ...form, knowledge_area: tags })}
                placeholder="Escribir área y presionar Enter"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="offering_description">Descripción *</Label>
            <Textarea
              id="offering_description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
            />
          </div>
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold mb-4">Datos del Profesor UDES</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="udes_prof_name">Nombre Profesor UDES *</Label>
                <Input
                  id="udes_prof_name"
                  value={form.udes_professor_name}
                  onChange={(e) => setForm({ ...form, udes_professor_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="udes_prof_program">Programa al que pertenece *</Label>
                <Input
                  id="udes_prof_program"
                  value={form.udes_professor_program}
                  onChange={(e) => setForm({ ...form, udes_professor_program: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="udes_prof_phone">Teléfono *</Label>
                <Input
                  id="udes_prof_phone"
                  value={form.udes_professor_phone}
                  onChange={(e) => setForm({ ...form, udes_professor_phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="udes_prof_email">Correo *</Label>
                <Input
                  id="udes_prof_email"
                  type="email"
                  value={form.udes_professor_email}
                  onChange={(e) => setForm({ ...form, udes_professor_email: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            {editingOffering ? "Actualizar Oferta" : "Crear y Publicar Oferta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
