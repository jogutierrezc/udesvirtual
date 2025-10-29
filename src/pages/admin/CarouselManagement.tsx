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
  image_url: string | null;
  video_url?: string | null;
  media_type?: string;
  link_url: string | null;
  button_text?: string | null;
  content_type?: 'static' | 'mooc' | 'coil' | 'clase_espejo' | 'masterclass';
  content_id?: string | null;
  order_index: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SlideFormData {
  title: string;
  description: string;
  image_url: string;
  video_url: string;
  media_type: 'image' | 'video';
  link_url: string;
  button_text: string;
  content_type: 'static' | 'mooc' | 'coil' | 'clase_espejo' | 'masterclass';
  content_id: string;
  order_index: number;
  active: boolean;
}

export function CarouselManagement() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<string | null>(null);
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Estados para contenido dinámico
  const [moocCourses, setMoocCourses] = useState<any[]>([]);
  const [coilProposals, setCoilProposals] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState<SlideFormData>({
    title: "",
    description: "",
    image_url: "",
    video_url: "",
    media_type: "image",
    link_url: "",
    button_text: "Explorar cursos",
    content_type: "static",
    content_id: "",
    order_index: 0,
    active: true,
  });

  useEffect(() => {
    fetchSlides();
    fetchDynamicContent();
  }, []);

  const fetchDynamicContent = async () => {
    try {
      // Cargar cursos MOOC aprobados
      const { data: moocData } = await supabase
        .from("mooc_courses")
        .select("id, title, description, course_image_url, profession")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (moocData) setMoocCourses(moocData);

      // Cargar propuestas COIL aprobadas
      const { data: coilData } = await supabase
        .from("coil_proposals")
        .select("id, course_name, academic_program, project_topics, full_name")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (coilData) setCoilProposals(coilData);

      // Cargar clases espejo y masterclass aprobadas
      const { data: classesData } = await supabase
        .from("classes")
        .select("id, title, description, class_type, university, country")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (classesData) setClasses(classesData);
    } catch (error) {
      console.error("Error loading dynamic content:", error);
    }
  };

  const fetchSlides = async () => {
    setFetchError(null);
    try {
      // Helpful debug: log current configured Supabase URL from the Vite env
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        console.debug("VITE_SUPABASE_URL:", import.meta.env.VITE_SUPABASE_URL);
      } catch (e) {
        // ignore
      }

      console.debug("Fetching hero_carousel from Supabase...");
      const { data, error, status, statusText } = await supabase
        .from("hero_carousel")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) {
        // Build a detailed message to show in UI
        const details = {
          message: error.message,
          code: error.code,
          hint: (error as any).hint || null,
          status,
          statusText: statusText || null,
        };
        const msg = JSON.stringify(details, null, 2);
        console.error("Error fetching slides:", details);
        setFetchError(msg);
        toast.error("Error al cargar las imágenes del carrusel (ver detalles)");
        return;
      }

      setSlides(data || []);
    } catch (error: any) {
      console.error("Unexpected error fetching slides:", error);
      setFetchError(String(error?.message || error));
      toast.error("Error al cargar las imágenes del carrusel (ver consola)");
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        .from("carousel-videos")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from("carousel-videos")
        .getPublicUrl(filePath);

      setFormData({ ...formData, video_url: data.publicUrl });
      toast.success("Video subido correctamente");
    } catch (error: any) {
      console.error("Error uploading video:", error);
      toast.error("Error al subir el video");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Título es obligatorio");
      return;
    }

    // Validar según content_type
    if (formData.content_type === 'static') {
      if (formData.media_type === 'image' && !formData.image_url) {
        toast.error("Imagen es obligatoria para slides estáticos de imagen");
        return;
      }

      if (formData.media_type === 'video' && !formData.video_url) {
        toast.error("Video es obligatorio para slides estáticos de video");
        return;
      }
    } else {
      // Contenido dinámico
      if (!formData.content_id) {
        toast.error(`Debes seleccionar un ${formData.content_type === 'mooc' ? 'curso MOOC' : formData.content_type === 'coil' ? 'proyecto COIL' : 'clase'}`);
        return;
      }
    }

    try {
      if (editingSlide) {
        // Actualizar slide existente
        const { error } = await supabase
          .from("hero_carousel")
          .update({
            title: formData.title,
            description: formData.description || null,
            image_url: formData.image_url || null,
            video_url: formData.video_url || null,
            media_type: formData.media_type,
            link_url: formData.link_url || null,
            button_text: formData.button_text || "Explorar cursos",
            content_type: formData.content_type || "static",
            content_id: formData.content_id || null,
            order_index: formData.order_index,
            active: formData.active,
          })
          .eq("id", editingSlide.id);

        if (error) throw error;
        toast.success("Slide actualizado correctamente");
      } else {
        // Crear nuevo slide
        const { error } = await supabase.from("hero_carousel").insert([
          {
            title: formData.title,
            description: formData.description || null,
            image_url: formData.image_url || null,
            video_url: formData.video_url || null,
            media_type: formData.media_type,
            link_url: formData.link_url || null,
            button_text: formData.button_text || "Explorar cursos",
            content_type: formData.content_type || "static",
            content_id: formData.content_id || null,
            order_index: formData.order_index,
            active: formData.active,
          },
        ]);

        if (error) throw error;
        toast.success("Slide agregado correctamente");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSlides();
    } catch (error: any) {
      console.error("Error saving slide:", error);
      toast.error("Error al guardar el slide");
    }
  };

  const handleEdit = (slide: CarouselSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      description: slide.description || "",
      image_url: slide.image_url || "",
      video_url: slide.video_url || "",
      media_type: (slide.media_type as 'image' | 'video') || "image",
      link_url: slide.link_url || "",
      button_text: slide.button_text || "Explorar cursos",
      content_type: (slide.content_type as any) || "static",
      content_id: slide.content_id || "",
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
      video_url: "",
      media_type: "image",
      link_url: "",
      button_text: "Explorar cursos",
      content_type: "static",
      content_id: "",
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
      {/* If there was a fetch error, show details and retry */}
      {fetchError && (
        <Card className="border border-red-200 bg-red-50">
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-red-700">Error consultando hero_carousel</h2>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-red-800 max-h-48 overflow-auto">{fetchError}</pre>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLoading(true);
                    fetchSlides();
                  }}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Page title (non-sticky, simple) */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Gestión del Carrusel</h1>
        <p className="text-gray-500 mt-1">Administra las imágenes y videos del carrusel de la página de inicio</p>
        <div className="flex justify-end">
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="bg-[#9b87f5] hover:bg-[#7E69AB]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar Slide
          </Button>
        </div>
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
              No hay slides en el carrusel aún
            </p>
            <Button
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar primer slide
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slides.map((slide) => (
            <Card key={slide.id} className="overflow-hidden">
              <div className="relative h-48 bg-gray-200">
                {slide.media_type === 'video' && slide.video_url ? (
                  <video
                    src={slide.video_url}
                    className="w-full h-full object-cover"
                    muted
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => e.currentTarget.pause()}
                  />
                ) : (
                  <img
                    src={slide.image_url}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                )}
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
                  <div className="px-2 py-1 rounded text-xs font-semibold bg-purple-500 text-white">
                    {slide.media_type === 'video' ? 'Video' : 'Imagen'}
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
              {editingSlide ? "Editar Slide" : "Agregar Nuevo Slide"}
            </DialogTitle>
            <DialogDescription>
              Los slides del carrusel deben tener dimensiones de ancho completo x 720px de alto
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
              <Label htmlFor="content_type">Tipo de Contenido *</Label>
              <select
                id="content_type"
                value={formData.content_type}
                onChange={(e) =>
                  setFormData({ ...formData, content_type: e.target.value as any, content_id: "" })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9b87f5] focus:border-transparent"
              >
                <option value="static">Contenido Estático (manual)</option>
                <option value="mooc">Curso MOOC</option>
                <option value="coil">Proyecto COIL</option>
                <option value="clase_espejo">Clase Espejo</option>
                <option value="masterclass">Masterclass</option>
              </select>
              <p className="text-xs text-gray-500">
                {formData.content_type === 'static' 
                  ? 'Sube tu propia imagen/video y configura el contenido manualmente' 
                  : `El contenido se cargará automáticamente desde los ${formData.content_type === 'mooc' ? 'cursos MOOC' : formData.content_type === 'coil' ? 'proyectos COIL' : 'clases'} aprobados`
                }
              </p>
            </div>

            {formData.content_type !== 'static' && (
              <div className="space-y-2">
                <Label htmlFor="content_id">
                  Seleccionar {formData.content_type === 'mooc' ? 'Curso MOOC' : formData.content_type === 'coil' ? 'Proyecto COIL' : 'Clase'} *
                </Label>
                <select
                  id="content_id"
                  value={formData.content_id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setFormData({ ...formData, content_id: selectedId });
                    
                    // Auto-llenar título y descripción según el contenido seleccionado
                    if (selectedId) {
                      if (formData.content_type === 'mooc') {
                        const course = moocCourses.find(c => c.id === selectedId);
                        if (course) {
                          setFormData(prev => ({
                            ...prev,
                            title: course.title,
                            description: course.description || `Curso de ${course.profession}`,
                            link_url: `/mooc/${course.id}`,
                          }));
                        }
                      } else if (formData.content_type === 'coil') {
                        const coil = coilProposals.find(c => c.id === selectedId);
                        if (coil) {
                          setFormData(prev => ({
                            ...prev,
                            title: coil.course_name,
                            description: `Proyecto COIL - ${coil.academic_program}`,
                            link_url: "/coil",
                          }));
                        }
                      } else {
                        const classItem = classes.find(c => c.id === selectedId);
                        if (classItem) {
                          setFormData(prev => ({
                            ...prev,
                            title: classItem.title,
                            description: `${classItem.class_type === 'mirror' ? 'Clase Espejo' : 'Masterclass'} con ${classItem.university}, ${classItem.country}`,
                            link_url: "/catalog",
                          }));
                        }
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9b87f5] focus:border-transparent"
                >
                  <option value="">-- Seleccionar --</option>
                  {formData.content_type === 'mooc' && moocCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.profession})
                    </option>
                  ))}
                  {formData.content_type === 'coil' && coilProposals.map(coil => (
                    <option key={coil.id} value={coil.id}>
                      {coil.course_name} - {coil.full_name} ({coil.academic_program})
                    </option>
                  ))}
                  {(formData.content_type === 'clase_espejo' || formData.content_type === 'masterclass') && 
                    classes.filter(c => 
                      (formData.content_type === 'clase_espejo' && c.class_type === 'mirror') ||
                      (formData.content_type === 'masterclass' && c.class_type === 'masterclass')
                    ).map(classItem => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.title} - {classItem.university}, {classItem.country}
                      </option>
                    ))
                  }
                </select>
                <p className="text-xs text-gray-500">
                  Al seleccionar, el título y descripción se llenarán automáticamente
                </p>
              </div>
            )}

            {formData.content_type === 'static' && (
            <div className="space-y-2">
              <Label htmlFor="media_type">Tipo de medio</Label>
              <select
                id="media_type"
                value={formData.media_type}
                onChange={(e) =>
                  setFormData({ ...formData, media_type: e.target.value as 'image' | 'video' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#9b87f5] focus:border-transparent"
              >
                <option value="image">Imagen</option>
                <option value="video">Video</option>
              </select>
            </div>
            )}

            {formData.content_type === 'static' && formData.media_type === 'image' ? (
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
            ) : formData.content_type === 'static' && formData.media_type === 'video' ? (
              <div className="space-y-2">
                <Label htmlFor="video">Video * (MP4 recomendado, ancho completo x 720px)</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    id="video"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById("video")?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Subiendo..." : "Subir"}
                  </Button>
                </div>
                {formData.video_url && (
                  <div className="mt-2">
                    <video
                      src={formData.video_url}
                      controls
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  O pega la URL de un video externo
                </p>
                <Input
                  value={formData.video_url}
                  onChange={(e) =>
                    setFormData({ ...formData, video_url: e.target.value })
                  }
                  placeholder="https://ejemplo.com/video.mp4"
                />
              </div>
            ) : null}

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
              <Label htmlFor="button_text">Texto del botón</Label>
              <Input
                id="button_text"
                value={formData.button_text}
                onChange={(e) =>
                  setFormData({ ...formData, button_text: e.target.value })
                }
                placeholder="Explorar cursos"
              />
              <p className="text-xs text-gray-500">
                Texto que aparece en el botón del slide (solo si hay URL de enlace)
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

export default CarouselManagement;
