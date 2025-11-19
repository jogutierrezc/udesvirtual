import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (createdId?: string) => void;
};

export const MoocCategoryFormModal = ({ open, onOpenChange, onCreated }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) setFile(f);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: 'Título requerido', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      let finalImageUrl = imageUrl || null;

      // Si se subió un archivo, subirlo al bucket 'mooc-categories'
      if (file) {
        const path = `categories/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from('mooc-categories').upload(path, file, { upsert: false });
        if (uploadError) {
          console.warn('Error uploading category image', uploadError);
        } else {
          const { data: publicData } = supabase.storage.from('mooc-categories').getPublicUrl(path);
          finalImageUrl = publicData?.publicUrl || finalImageUrl;
        }
      }

      const slug = title.trim().toLowerCase().replace(/[^a-z0-9\- ]/g, '').replace(/\s+/g, '-');

      const { data, error } = await supabase.from('mooc_categories').insert([{ title: title.trim(), slug, image_url: finalImageUrl, description: description.trim() || null }]).select().single();
      if (error) throw error;

      toast({ title: 'Categoría creada', description: 'La categoría fue creada correctamente' });
      onCreated && onCreated(data.id);
      onOpenChange(false);
    } catch (e:any) {
      console.error('Error creating category', e);
      toast({ title: 'Error', description: e.message || 'No se pudo crear la categoría', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear categoría</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Inteligencia Artificial" />
          </div>

          <div>
            <Label>Imagen (URL)</Label>
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
            <div className="text-sm text-muted-foreground mt-2">O sube un archivo de imagen</div>
            <Input type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          <div>
            <Label>Descripción (opcional)</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoocCategoryFormModal;
