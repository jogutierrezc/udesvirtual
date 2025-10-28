import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string | null;
  onSaved?: () => void;
};

export default function UdesRelationModal({ open, onOpenChange, profileId, onSaved }: Props) {
  const { toast } = useToast();
  const [program, setProgram] = useState('');
  const [campus, setCampus] = useState('');
  const [vinculation, setVinculation] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setProgram('');
    setCampus('');
    setVinculation('');
  };

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
        program,
        campus,
        vinculation_type: vinculation,
      } as any;

      const { error } = await supabase.from('udes_relationships').insert(payload);
      if (error) throw error;
      toast({ title: 'Guardado', description: 'Relación registrada' });
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
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Agregar Relación con la UDES</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Programa de la UDES</Label>
            <Input value={program} onChange={(e) => setProgram(e.target.value)} required />
          </div>

          <div>
            <Label>Campus</Label>
            <Select value={campus} onValueChange={(v) => setCampus(v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Valledupar">Valledupar</SelectItem>
                <SelectItem value="Bucaramanga">Bucaramanga</SelectItem>
                <SelectItem value="Cúcuta">Cúcuta</SelectItem>
                <SelectItem value="Bogotá">Bogotá</SelectItem>
                <SelectItem value="Arauca">Arauca</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo de vinculación</Label>
            <Select value={vinculation} onValueChange={(v) => setVinculation(v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Tiempo Completo">Tiempo Completo</SelectItem>
                <SelectItem value="Medio Tiempo">Medio Tiempo</SelectItem>
                <SelectItem value="Cátedra">Cátedra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Agregar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
