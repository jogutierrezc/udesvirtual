import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/TagInput";
import { Loader2, PlusCircle } from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { Tables } from "@/integrations/supabase/types";

type Class = Tables<"classes">;

interface ClassFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClass?: Class | null;
}

export const ClassFormModal = ({ open, onOpenChange, editingClass }: ClassFormModalProps) => {
  const { createClass, updateClass } = useAdmin();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    capacity: "",
    hours: "",
    allied_professor: "",
    allied_institution: "",
    description: "",
    virtual_room_required: false,
    virtual_room_link: "",
    campus: "",
    class_date: "",
    class_type: "mirror" as "mirror" | "masterclass",
    knowledge_area: [] as string[],
    profession: "",
  });

  useEffect(() => {
    if (editingClass) {
      setForm({
        title: editingClass.title || "",
        capacity: String(editingClass.capacity || ""),
        hours: String(editingClass.hours || ""),
        allied_professor: editingClass.allied_professor || "",
        allied_institution: editingClass.allied_institution || "",
        description: editingClass.description || "",
        virtual_room_required: !!editingClass.virtual_room_required,
        virtual_room_link: editingClass.virtual_room_link || "",
        campus: editingClass.campus || "",
        class_date: editingClass.class_date || "",
        class_type: (editingClass.class_type as any) || "mirror",
        knowledge_area: Array.isArray(editingClass.knowledge_area)
          ? editingClass.knowledge_area
          : editingClass.knowledge_area
          ? [String(editingClass.knowledge_area)]
          : [],
        profession: editingClass.profession || "",
      });
    } else {
      resetForm();
    }
  }, [editingClass, open]);

  const resetForm = () => {
    setForm({
      title: "",
      capacity: "",
      hours: "",
      allied_professor: "",
      allied_institution: "",
      description: "",
      virtual_room_required: false,
      virtual_room_link: "",
      campus: "",
      class_date: "",
      class_type: "mirror",
      knowledge_area: [],
      profession: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        ...form,
        capacity: parseInt(form.capacity),
        hours: parseInt(form.hours),
      };

      if (editingClass) {
        await updateClass(editingClass.id, data);
      } else {
        await createClass(data);
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting class:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingClass ? "Editar Clase" : "Crear Nueva Clase Espejo / MasterClass"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la Clase *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class_type">Tipo de Clase *</Label>
              <Select
                value={form.class_type}
                onValueChange={(value: "mirror" | "masterclass") =>
                  setForm({ ...form, class_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mirror">Clase Espejo</SelectItem>
                  <SelectItem value="masterclass">MasterClass</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allied_professor">Profesor Aliado *</Label>
              <Input
                id="allied_professor"
                value={form.allied_professor}
                onChange={(e) => setForm({ ...form, allied_professor: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allied_institution">Institución Aliada (IES) *</Label>
              <Input
                id="allied_institution"
                value={form.allied_institution}
                onChange={(e) => setForm({ ...form, allied_institution: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidad de Estudiantes *</Label>
              <Input
                id="capacity"
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours">Número de Horas *</Label>
              <Input
                id="hours"
                type="number"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campus">Campus *</Label>
              <Input
                id="campus"
                value={form.campus}
                onChange={(e) => setForm({ ...form, campus: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class_date">Fecha y Hora *</Label>
              <Input
                id="class_date"
                type="datetime-local"
                value={form.class_date}
                onChange={(e) => setForm({ ...form, class_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="knowledge_area">Áreas de Conocimiento * (Tags)</Label>
              <TagInput
                tags={form.knowledge_area}
                onChange={(tags) => setForm({ ...form, knowledge_area: tags })}
                placeholder="Escribir área y presionar Enter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profession">Profesión *</Label>
              <Input
                id="profession"
                value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              rows={4}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="virtual_room"
              checked={form.virtual_room_required}
              onCheckedChange={(checked) => setForm({ ...form, virtual_room_required: checked })}
            />
            <Label htmlFor="virtual_room">Requiere Sala Virtual</Label>
          </div>
          {form.virtual_room_required && (
            <div className="space-y-2">
              <Label htmlFor="virtual_room_link">Link de Sala Virtual (Teams, Meet, Zoom)</Label>
              <Input
                id="virtual_room_link"
                type="url"
                placeholder="https://..."
                value={form.virtual_room_link}
                onChange={(e) => setForm({ ...form, virtual_room_link: e.target.value })}
              />
            </div>
          )}
          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-2" />
            )}
            {editingClass ? "Actualizar Clase" : "Crear y Publicar Clase"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
