import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Maximize2, Minimize2 } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

export type FaqType = "catalogo" | "mooc" | "estudiantes" | "profesores" | "becas_movilidad";

const CATEGORY_LABELS: Record<FaqType, string> = {
  catalogo: "Catálogo",
  mooc: "MOOC",
  estudiantes: "Estudiantes",
  profesores: "Profesores",
  becas_movilidad: "Becas de Movilidad",
};

type FaqRow = {
  id: string;
  title: string;
  content: string;
  type: FaqType;
  status: "draft" | "published";
  sort_order: number;
  attachments: Array<{ name: string; url: string }>;
  updated_at: string;
};

export const FaqAdminPage: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"todas" | FaqType>("todas");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FaqRow | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<FaqType>("catalogo");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [sortOrder, setSortOrder] = useState<number>(0);
  // TipTap editor is encapsulated in RichTextEditor; no ref needed here

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setType("catalogo");
    setContent("");
    setPublished(false);
    setSortOrder(0);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("faqs" as any)
      .select("id,title,content,type,status,sort_order,attachments,updated_at")
      .order("sort_order", { ascending: true });
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las FAQs" });
    } else {
      setItems((data || []) as unknown as FaqRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    // Render editor only after mount to avoid minor dev warnings/hydration issues
    setMounted(true);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((f) =>
      (category === "todas" || f.type === category) &&
      (!q || f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q))
    );
  }, [items, query, category]);

  const onOpenNew = () => {
    resetForm();
    setOpen(true);
  };

  const onEdit = (row: FaqRow) => {
    setEditing(row);
    setTitle(row.title);
    setType(row.type);
    setContent(row.content);
    setPublished(row.status === "published");
    setSortOrder(row.sort_order || 0);
    setOpen(true);
  };

  const onDelete = async (row: FaqRow) => {
    if (!confirm("¿Eliminar esta FAQ?")) return;
    const { error } = await supabase.from("faqs" as any).delete().eq("id", row.id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar." });
    } else {
      toast({ title: "Eliminado", description: "La FAQ fue eliminada." });
      load();
    }
  };

  const onSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Faltan datos", description: "Título y contenido son obligatorios." });
      return;
    }
    const payload = {
      title: title.trim(),
      content: content, // HTML desde el editor
      type,
      status: published ? "published" : "draft",
      sort_order: sortOrder || 0,
    };
    if (editing) {
      const { error } = await supabase.from("faqs" as any).update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar." });
      } else {
        toast({ title: "Actualizado", description: "Cambios guardados." });
        setOpen(false);
        resetForm();
        load();
      }
    } else {
      const { error } = await supabase.from("faqs" as any).insert(payload);
      if (error) {
        toast({ title: "Error", description: "No se pudo crear." });
      } else {
        toast({ title: "Creado", description: "La FAQ fue creada." });
        setOpen(false);
        resetForm();
        load();
      }
    }
  };

  // TipTap is used via RichTextEditor component, which handles uploads and formatting

  // Adjuntos UI eliminado del listado para una vista más compacta

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-semibold">Preguntas Frecuentes (FAQ)</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={onOpenNew}>
              <Plus className="h-4 w-4 mr-2" /> Nueva FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className={`${fullscreen ? 'sm:max-w-[98vw] w-[98vw] h-[96vh]' : 'sm:max-w-4xl w-[96vw] max-h-[90vh]'} p-0`}>
            <div className="px-4 pt-4">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar FAQ" : "Crear FAQ"}</DialogTitle>
              </DialogHeader>
              <div className="absolute right-4 top-4 flex items-center gap-2">
                <Button variant="ghost" size="icon" aria-label={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'} onClick={() => setFullscreen((v) => !v)}>
                  {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className={`p-4 overflow-y-auto ${fullscreen ? 'h-[calc(96vh-4rem)]' : 'max-h-[calc(90vh-4rem)]'} space-y-4`}>
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Categoría</Label>
                <Select value={type} onValueChange={(v) => setType(v as FaqType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABELS) as FaqType[]).map((t) => (
                      <SelectItem key={t} value={t}>{CATEGORY_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Contenido</Label>
                <div className="border rounded-md overflow-visible">
                  {mounted && (
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      height={fullscreen ? '70vh' : 420}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch id="published" checked={published} onCheckedChange={setPublished} />
                  <Label htmlFor="published">Publicado</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sort">Orden</Label>
                  <Input id="sort" type="number" className="w-24" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                <Button onClick={onSave}>{editing ? "Guardar cambios" : "Crear"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar por título o contenido" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as any)}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {(Object.keys(CATEGORY_LABELS) as FaqType[]).map((t) => (
                <SelectItem key={t} value={t}>{CATEGORY_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay resultados.</div>
        ) : (
          <div className="divide-y">
            {filtered.map((row) => (
              <div key={row.id} className="py-3 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{row.title}</div>
                    <div className="text-xs text-muted-foreground">{CATEGORY_LABELS[row.type]} • {row.status === 'published' ? 'Publicado' : 'Borrador'} • Orden {row.sort_order}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => onEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => onDelete(row)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default FaqAdminPage;
