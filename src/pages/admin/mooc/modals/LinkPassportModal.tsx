import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Award, Loader2 } from "lucide-react";

type PassportActivity = {
  id: string;
  name: string;
  activity_type: string;
  points_awarded: number;
  pathway_type: string;
};

type LinkPassportModalProps = {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  currentActivityId?: string;
  currentPoints?: number;
  onSuccess: () => void;
};

export const LinkPassportModal = ({
  open,
  onClose,
  courseId,
  courseTitle,
  currentActivityId,
  currentPoints,
  onSuccess,
}: LinkPassportModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<PassportActivity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>(currentActivityId || "");
  const [customPoints, setCustomPoints] = useState<number>(currentPoints || 50);

  useEffect(() => {
    if (open) {
      loadActivities();
      setSelectedActivityId(currentActivityId || "");
      setCustomPoints(currentPoints || 50);
    }
  }, [open, currentActivityId, currentPoints]);

  const loadActivities = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("passport_activities")
        .select("*")
        .eq("active", true)
        .order("points_awarded", { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (err: any) {
      console.error("Error loading activities:", err);
      toast({
        title: "Error",
        description: "No se pudieron cargar las actividades de pasaporte",
        variant: "destructive",
      });
    }
  };

  const handleLink = async () => {
    if (!selectedActivityId) {
      toast({
        title: "Campo requerido",
        description: "Selecciona una actividad de pasaporte",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("mooc_courses")
        .update({
          passport_activity_id: selectedActivityId,
          passport_points: customPoints,
        })
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Vinculación exitosa",
        description: `El curso ahora otorgará ${customPoints} puntos de pasaporte al completarse`,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error linking course:", err);
      toast({
        title: "Error",
        description: err.message || "No se pudo vincular el curso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("mooc_courses")
        .update({
          passport_activity_id: null,
          passport_points: null,
        })
        .eq("id", courseId);

      if (error) throw error;

      toast({
        title: "Desvinculado",
        description: "El curso ya no otorgará puntos de pasaporte",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error unlinking course:", err);
      toast({
        title: "Error",
        description: err.message || "No se pudo desvincular el curso",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Vincular con Pasaporte UDES
          </DialogTitle>
          <DialogDescription>
            Configura los puntos de pasaporte que se otorgarán al completar: <strong>{courseTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="activity">Actividad de Pasaporte</Label>
            <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
              <SelectTrigger id="activity">
                <SelectValue placeholder="Selecciona una actividad" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((act) => (
                  <SelectItem key={act.id} value={act.id}>
                    {act.name} - {act.points_awarded} pts ({act.pathway_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="points">Puntos a Otorgar</Label>
            <Input
              id="points"
              type="number"
              min={1}
              max={500}
              value={customPoints}
              onChange={(e) => setCustomPoints(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              Los estudiantes recibirán estos puntos automáticamente al completar el curso
            </p>
          </div>

          {selectedActivityId && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm">
              <p className="font-medium text-blue-900">Configuración actual:</p>
              <ul className="mt-2 space-y-1 text-blue-800">
                <li>
                  • Actividad:{" "}
                  {activities.find((a) => a.id === selectedActivityId)?.name}
                </li>
                <li>
                  • Sendero:{" "}
                  {activities.find((a) => a.id === selectedActivityId)?.pathway_type}
                </li>
                <li>• Puntos: {customPoints}</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {currentActivityId && (
            <Button
              variant="destructive"
              onClick={handleUnlink}
              disabled={loading}
            >
              Desvincular
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleLink} disabled={loading || !selectedActivityId}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Vincular
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
