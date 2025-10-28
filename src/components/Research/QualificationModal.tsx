import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

export default function QualificationModal({ open, onOpenChange, profileId, onSaved }: Props) {
  const { toast } = useToast();
  const [level, setLevel] = useState('');
  const [institution, setInstitution] = useState('');
  const [program, setProgram] = useState('');
  const [campus, setCampus] = useState('');
  const [startYear, setStartYear] = useState<string>('');
  const [endYear, setEndYear] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setLevel('');
    setInstitution('');
    setProgram('');
    setCampus('');
    setStartYear('');
    setEndYear('');
    setNotes('');
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
        level,
        institution,
        program,
        campus,
        start_year: startYear ? parseInt(startYear, 10) : null,
        end_year: endYear ? parseInt(endYear, 10) : null,
        notes,
      } as any;

      const { error } = await supabase.from('academic_qualifications').insert(payload);
      if (error) throw error;
      toast({ title: 'Guardado', description: 'Formación registrada' });
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
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Agregar Formación Académica</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nivel de formación</Label>
            <Select value={level} onValueChange={(v) => setLevel(v)}>
              <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Pregrado">Pregrado</SelectItem>
                <SelectItem value="Especialización">Especialización</SelectItem>
                <SelectItem value="Maestría">Maestría / Magíster</SelectItem>
                <SelectItem value="Doctorado">Doctorado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Institución</Label>
            <Input value={institution} onChange={(e) => setInstitution(e.target.value)} />
          </div>

          <div>
            <Label>Programa</Label>
            <Input value={program} onChange={(e) => setProgram(e.target.value)} />
          </div>

          <div>
            <Label>Campus / Vinculación UDES (si aplica)</Label>
            <Input value={campus} onChange={(e) => setCampus(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Inicio (año)</Label>
              <Input value={startYear} onChange={(e) => setStartYear(e.target.value)} />
            </div>
            <div>
              <Label>Finalización (año)</Label>
              <Input value={endYear} onChange={(e) => setEndYear(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
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
