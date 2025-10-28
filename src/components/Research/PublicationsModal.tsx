import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string | null;
  onSaved?: () => void;
  // optional initial item for editing
  initial?: any | null;
};

export default function PublicationsModal({ open, onOpenChange, profileId, onSaved, initial }: Props) {
  const { toast } = useToast();
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [issnIsbn, setIssnIsbn] = useState('');
  const [page, setPage] = useState('');
  const [hasLink, setHasLink] = useState(false);
  const [link, setLink] = useState('');
  const [keywords, setKeywords] = useState('');
  const [areas, setAreas] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setType('');
    setTitle('');
    setYear('');
    setIssnIsbn('');
    setPage('');
    setHasLink(false);
    setLink('');
    setKeywords('');
    setAreas('');
  };

  useEffect(() => {
    if (open && initial) {
      setType(initial.type || '');
      setTitle(initial.title || '');
      setYear(initial.year ? String(initial.year) : '');
      setIssnIsbn(initial.issn_isbn || '');
      setPage(initial.page || '');
      setHasLink(!!initial.has_link);
      setLink(initial.link || '');
      setKeywords(initial.keywords ? (Array.isArray(initial.keywords) ? initial.keywords.join(', ') : String(initial.keywords)) : '');
      setAreas(initial.areas ? (Array.isArray(initial.areas) ? initial.areas.join(', ') : String(initial.areas)) : '');
    }
    if (!open) reset();
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileId) {
      toast({ title: 'Error', description: 'Perfil no disponible', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        profile_id: profileId,
        type,
        title,
        year: year ? parseInt(year, 10) : null,
        issn_isbn: issnIsbn || null,
        page: page || null,
        has_link: hasLink,
        link: hasLink ? link : null,
        keywords: keywords ? keywords.split(',').map(s => s.trim()).filter(Boolean) : null,
        areas: areas ? areas.split(',').map(s => s.trim()).filter(Boolean) : null,
      } as any;

      if (initial && initial.id) {
        // update
        const { error } = await supabase.from('publications').update(payload).eq('id', initial.id);
        if (error) throw error;
        toast({ title: 'Actualizado', description: 'Publicación actualizada' });
      } else {
        const { error } = await supabase.from('publications').insert(payload);
        if (error) throw error;
        toast({ title: 'Guardado', description: 'Publicación registrada' });
      }
      reset();
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.message || 'No se pudo guardar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{initial && initial.id ? 'Editar Publicación' : 'Agregar Publicación'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onValueChange={(v) => setType(v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Libro">Libro</SelectItem>
                <SelectItem value="TextoNoCientifico">Texto en publicaciones no científicas</SelectItem>
                <SelectItem value="DocumentoTrabajo">Documento de trabajo</SelectItem>
                <SelectItem value="LibroFormacion">Libro de formación</SelectItem>
                <SelectItem value="Articulo">Artículo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nombre del artículo / publicación</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Año</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div>
              <Label>ISSN / ISBN</Label>
              <Input value={issnIsbn} onChange={(e) => setIssnIsbn(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Página</Label>
            <Input value={page} onChange={(e) => setPage(e.target.value)} />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox checked={hasLink} onCheckedChange={(v) => setHasLink(!!v)} />
            <Label>¿Tiene enlace?</Label>
          </div>
          {hasLink && (
            <div>
              <Label>Enlace</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} />
            </div>
          )}

          <div>
            <Label>Palabras clave (separadas por coma)</Label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="ej: educación, aprendizaje" />
          </div>

          <div>
            <Label>Áreas (separadas por coma)</Label>
            <Input value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="ej: pedagogía, IA" />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : initial && initial.id ? 'Guardar' : 'Agregar publicación'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
