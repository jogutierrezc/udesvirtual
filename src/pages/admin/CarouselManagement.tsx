import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, GripVertical, Upload, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CarouselSlide {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface SlideFormData {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  order_index: number;
  active: boolean;
}

export default function CarouselManagement() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<SlideFormData>({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    order_index: 0,
    active: true,
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_carousel")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setSlides(data || []);
    } catch (error: any) {
      console.error("Error fetching slides:", error);
      toast.error("Error al cargar las imágenes del carrusel");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }

      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("carousel-images")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from("carousel-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: data.publicUrl });
      toast.success("Imagen subida correctamente");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.image_url) {
      toast.error("Título e imagen son obligatorios");
      return;
    }

    try {
      if (editingSlide) {
        // Actualizar slide existente
        const { error } = await supabase
          .from("hero_carousel")
          .update({
            title: formData.title,
            description: formData.description || null,
            image_url: formData.image_url,
            link_url: formData.link_url || null,
            order_index: formData.order_index,
            active: formData.active,
          })
          .eq("id", editingSlide.id);

        if (error) throw error;
        toast.success("Imagen actualizada correctamente");
      } else {
        // Crear nuevo slide
        const { error } = await supabase.from("hero_carousel").insert([
          {
            title: formData.title,
            description: formData.description || null,
            image_url: formData.image_url,
            link_url: formData.link_url || null,
            order_index: formData.order_index,
            active: formData.active,
          },
        ]);

        if (error) throw error;
        toast.success("Imagen agregada correctamente");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSlides();
    } catch (error: any) {
      console.error("Error saving slide:", error);
      toast.error("Error al guardar la imagen");
    }
  };

  const handleEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      description: slide.description || "",
      image_url: slide.image_url,
      link_url: slide.link_url || "",
      order_index: slide.order_index,
      active: slide.active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!slideToDelete) return;

    try {
      const { error } = await supabase
        .from("hero_carousel")
        .delete()
        .eq("id", slideToDelete);

      if (error) throw error;

      toast.success("Imagen eliminada correctamente");
      fetchSlides();
    } catch (error: any) {
      console.error("Error deleting slide:", error);
      toast.error("Error al eliminar la imagen");
    } finally {
      setIsDeleteDialogOpen(false);
      setSlideToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      link_url: "",
      order_index: slides.length,
      active: true,
    });
    setEditingSlide(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const toggleActive = async (slide: CarouselSlide) => {
    try {
      const { error } = await supabase
        .from("hero_carousel")
        .update({ active: !slide.active })
        .eq("id", slide.id);

      if (error) throw error;

      toast.success(`Imagen ${!slide.active ? "activada" : "desactivada"}`);
      fetchSlides();
    } catch (error: any) {
      console.error("Error toggling slide:", error);
      toast.error("Error al cambiar el estado");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestión del Carrusel</h1>
          <p className="text-gray-500 mt-1">
            Administra las imágenes del carrusel de la página de inicio
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-[#9b87f5] hover:bg-[#7E69AB]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Agregar Imagen
        </Button>
      </div>

      {/* Lista de slides */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Cargando...</p>
        </div>
      ) : slides.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">
              No hay imágenes en el carrusel aún
            </p>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar primera imagen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide) => (
            <Card key={slide.id} className="overflow-hidden">
              <div className="relative h-48 bg-gray-200">
                <img
                  src={slide.image_url}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      slide.active
                        ? "bg-green-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    {slide.active ? "Activa" : "Inactiva"}
                  </div>
                  <div className="px-2 py-1 rounded text-xs font-semibold bg-blue-500 text-white">
                    #{slide.order_index}
                  </div>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{slide.title}</CardTitle>
                {slide.description && (
                  <CardDescription className="line-clamp-2">
                    {slide.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActive(slide)}
                  className="flex-1"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {slide.active ? "Ocultar" : "Mostrar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(slide)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSlideToDelete(slide.id);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para agregar/editar */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSlide ? "Editar Imagen" : "Agregar Nueva Imagen"}
            </DialogTitle>
            <DialogDescription>
              Las imágenes del carrusel deben tener dimensiones de ancho completo x 720px de alto
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ej: Bienvenido a UdesVirtual"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descripción que aparecerá en la imagen"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Imagen * (Ancho completo x 720px)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  id="image"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById("image")?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Subiendo..." : "Subir"}
                </Button>
              </div>
              {formData.image_url && (
                <div className="mt-2">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-md"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500">
                O pega la URL de una imagen externa
              </p>
              <Input
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link_url">URL de enlace (opcional)</Label>
              <Input
                id="link_url"
                value={formData.link_url}
                onChange={(e) =>
                  setFormData({ ...formData, link_url: e.target.value })
                }
                placeholder="/catalog"
              />
              <p className="text-xs text-gray-500">
                Página a la que redirige al hacer clic en la imagen
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_index">Orden</Label>
              <Input
                id="order_index"
                type="number"
                value={formData.order_index}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order_index: parseInt(e.target.value) || 0,
                  })
                }
                min={0}
              />
              <p className="text-xs text-gray-500">
                Orden de aparición (menor número = aparece primero)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
              <Label htmlFor="active">Activa (visible en el carrusel)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#9b87f5] hover:bg-[#7E69AB]">
                {editingSlide ? "Actualizar" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para eliminar */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La imagen será eliminada
              permanentemente del carrusel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
