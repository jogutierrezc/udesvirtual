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

type Teacher = Tables<"teachers">;

interface TeacherFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTeacher?: Teacher | null;
}

export const TeacherFormModal = ({ open, onOpenChange, editingTeacher }: TeacherFormModalProps) => {
  const { createTeacher, updateTeacher } = useAdmin();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    teacher_name: "",
    campus: "",
    email: "",
    phone: "",
    profile_description: "",
    interests: [] as string[],
    cvlac_link: "",
    orcid_link: "",
  });

  useEffect(() => {
    if (editingTeacher) {
      setForm({
        teacher_name: editingTeacher.teacher_name || "",
        campus: editingTeacher.campus || "",
        email: editingTeacher.email || "",
        phone: editingTeacher.phone || "",
        profile_description: editingTeacher.profile_description || "",
        interests: Array.isArray(editingTeacher.interests) ? editingTeacher.interests : [],
        cvlac_link: editingTeacher.cvlac_link || "",
        orcid_link: editingTeacher.orcid_link || "",
      });
    } else {
      resetForm();
    }
  }, [editingTeacher, open]);

  const resetForm = () => {
    setForm({
      teacher_name: "",
      campus: "",
      email: "",
      phone: "",
      profile_description: "",
      interests: [],
      cvlac_link: "",
      orcid_link: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingTeacher) {
        await updateTeacher(editingTeacher.id, form);
      } else {
        await createTeacher(form);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting teacher:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTeacher ? "Editar Profesor" : "Crear Perfil de Profesor Investigador"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teacher_name">Nombre Completo *</Label>
              <Input
                id="teacher_name"
                value={form.teacher_name}
                onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_campus">Campus *</Label>
              <Input
                id="teacher_campus"
                value={form.campus}
                onChange={(e) => setForm({ ...form, campus: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_email">Correo Electrónico *</Label>
              <Input
                id="teacher_email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_phone">Teléfono *</Label>
              <Input
                id="teacher_phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvlac_link">Link CVLAC (Opcional)</Label>
              <Input
                id="cvlac_link"
                type="url"
                placeholder="https://..."
                value={form.cvlac_link}
                onChange={(e) => setForm({ ...form, cvlac_link: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orcid_link">Link ORCID (Opcional)</Label>
              <Input
                id="orcid_link"
                type="url"
                placeholder="https://..."
                value={form.orcid_link}
                onChange={(e) => setForm({ ...form, orcid_link: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile_description">Descripción del Perfil *</Label>
            <Textarea
              id="profile_description"
              value={form.profile_description}
              onChange={(e) => setForm({ ...form, profile_description: e.target.value })}
              required
              rows={4}
              placeholder="Experiencia, logros, áreas de investigación..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teacher_interests">Áreas de Interés * (Tags)</Label>
            <TagInput
              tags={form.interests}
              onChange={(tags) => setForm({ ...form, interests: tags })}
              placeholder="Escribir área y presionar Enter"
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            {editingTeacher ? "Actualizar Profesor" : "Crear Perfil de Profesor"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
