import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/TagInput";
import { Loader2, PlusCircle } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { Tables } from "@/integrations/supabase/types";

type CoilProposal = Tables<"coil_proposals">;

interface CoilFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCoil?: CoilProposal | null;
}

export const CoilFormModal = ({ open, onOpenChange, editingCoil }: CoilFormModalProps) => {
  const { createCoil, updateCoil } = useAdmin();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    academic_program: "",
    course_name: "",
    academic_semester: "",
    external_capacity: "",
    project_topics: "",
    languages: [] as string[],
    sustainable_development_goals: [] as string[],
  });

  useEffect(() => {
    if (editingCoil) {
      setForm({
        full_name: editingCoil.full_name || "",
        email: editingCoil.email || "",
        academic_program: editingCoil.academic_program || "",
        course_name: editingCoil.course_name || "",
        academic_semester: editingCoil.academic_semester || "",
        external_capacity: String(editingCoil.external_capacity || ""),
        project_topics: editingCoil.project_topics || "",
        languages: Array.isArray(editingCoil.languages) ? editingCoil.languages : [],
        sustainable_development_goals: Array.isArray(editingCoil.sustainable_development_goals)
          ? editingCoil.sustainable_development_goals
          : [],
      });
    } else {
      resetForm();
    }
  }, [editingCoil, open]);

  const resetForm = () => {
    setForm({
      full_name: "",
      email: "",
      academic_program: "",
      course_name: "",
      academic_semester: "",
      external_capacity: "",
      project_topics: "",
      languages: [],
      sustainable_development_goals: [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        ...form,
        external_capacity: parseInt(form.external_capacity),
      };

      if (editingCoil) {
        await updateCoil(editingCoil.id, data);
      } else {
        await createCoil(data);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting COIL:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCoil ? "Editar COIL" : "Crear Propuesta COIL"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coil_full_name">Nombre Completo *</Label>
              <Input
                id="coil_full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coil_email">Correo Electrónico Institucional *</Label>
              <Input
                id="coil_email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coil_program">Programa Académico *</Label>
              <Input
                id="coil_program"
                value={form.academic_program}
                onChange={(e) => setForm({ ...form, academic_program: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coil_course">Nombre del Curso *</Label>
              <Input
                id="coil_course"
                value={form.course_name}
                onChange={(e) => setForm({ ...form, course_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coil_semester">Semestre Académico *</Label>
              <Input
                id="coil_semester"
                value={form.academic_semester}
                onChange={(e) => setForm({ ...form, academic_semester: e.target.value })}
                placeholder="Ej: 2025-1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coil_capacity">Cupos para IES Externa *</Label>
              <Input
                id="coil_capacity"
                type="number"
                value={form.external_capacity}
                onChange={(e) => setForm({ ...form, external_capacity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="coil_languages">Idiomas del Proyecto * (Tags)</Label>
              <TagInput
                tags={form.languages}
                onChange={(tags) => setForm({ ...form, languages: tags })}
                placeholder="Escribir idioma y presionar Enter"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="coil_sdg">Objetivos de Desarrollo Sostenible (ODS) * (Tags)</Label>
              <TagInput
                tags={form.sustainable_development_goals}
                onChange={(tags) => setForm({ ...form, sustainable_development_goals: tags })}
                placeholder="Escribir ODS y presionar Enter"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coil_topics">Temas Específicos del Proyecto COIL *</Label>
            <Textarea
              id="coil_topics"
              value={form.project_topics}
              onChange={(e) => setForm({ ...form, project_topics: e.target.value })}
              required
              rows={4}
              placeholder="Describa los temas específicos de interés para desarrollar el proyecto COIL acordes al syllabus del curso..."
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            {editingCoil ? "Actualizar Propuesta COIL" : "Crear Propuesta COIL"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
