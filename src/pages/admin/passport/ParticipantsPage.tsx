import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trophy, UserCheck, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MobileTable from "@/components/ui/MobileTable";

type Role = "student" | "professor";
type Participant = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
  city?: string | null;
  department?: string | null;
  role: Role;
  campus?: string | null;
  disabled?: boolean;
};

export const ParticipantsPage: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [campusFilter, setCampusFilter] = useState<string>("all");

  // Award modal state
  const [awardOpen, setAwardOpen] = useState(false);
  const [selected, setSelected] = useState<Participant | null>(null);
  const [awardPoints, setAwardPoints] = useState<number>(10);
  const [awardPathway, setAwardPathway] = useState<string>("conocimiento");
  const [awardReason, setAwardReason] = useState<string>("");
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<string>("none");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) Read roles for students and professors
        const { data: roles, error: rolesErr } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("role", ["student", "professor"]);
        if (rolesErr) throw rolesErr;

        const ids = (roles || []).map((r: any) => r.user_id);
        const roleById = new Map<string, Role>();
        (roles || []).forEach((r: any) => roleById.set(r.user_id, r.role as Role));

        if (ids.length === 0) {
          setParticipants([]);
          setLoading(false);
          return;
        }

        // 2) Read profiles for those ids
        const { data: profs, error: profErr } = await (supabase.from("profiles") as any)
          .select("id, full_name, email, avatar_url, city, department, disabled")
          .in("id", ids);
        if (profErr) throw profErr;

        // 3) UDES relationships for campus (if any)
        const { data: rels = [], error: relErr } = await (supabase.from("udes_relationships") as any)
          .select("profile_id, campus")
          .in("profile_id", ids);
        if (relErr) throw relErr;
        const campusById = new Map<string, string | null>();
        (rels || []).forEach((r: any) => campusById.set(r.profile_id, r.campus));

        const list: Participant[] = (profs || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          avatar_url: p.avatar_url,
          city: p.city,
          department: p.department,
          role: (roleById.get(p.id) || "student") as Role,
          campus: campusById.get(p.id) || null,
          disabled: !!p.disabled,
        }));

        // 3) Optional: activities for award modal
        const { data: acts = [] } = await (supabase.from("passport_activities") as any)
          .select("id, name, points_awarded")
          .order("points_awarded", { ascending: false });

        setActivities(acts || []);
        setParticipants(list.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")));
      } catch (e: any) {
        console.error(e);
        toast({ title: "Error", description: e?.message || "No se pudieron cargar los participantes", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const campuses = useMemo(() => {
    const set = new Set<string>();
    participants.forEach((p) => { if (p.campus) set.add(p.campus); });
    return ["all", ...Array.from(set)];
  }, [participants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return participants.filter((p) => {
      const matchesText = !q || (p.full_name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" ? true : p.role === roleFilter;
      const matchesCampus = campusFilter === "all" ? true : (p.campus === campusFilter);
      return matchesText && matchesRole && matchesCampus;
    });
  }, [participants, search, roleFilter, campusFilter]);

  const initials = (name?: string | null, email?: string | null) => {
    const src = name || email || "";
    const parts = src.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return "U";
  };

  const openAward = (p: Participant) => {
    setSelected(p);
    setAwardPoints(10);
    setAwardPathway("conocimiento");
    setAwardReason("");
    setSelectedActivity("none");
    setAwardOpen(true);
  };

  const awardPointsToUser = async () => {
    if (!selected || !awardPoints) {
      toast({ title: "Error", description: "Participante y puntos son obligatorios", variant: "destructive" });
      return;
    }
    try {
      const activityId = selectedActivity === "none" ? null : selectedActivity;
      const { error } = await (supabase.from("passport_points_ledger") as any)
        .insert([{
          user_id: selected.id,
          points: awardPoints,
          pathway_type: awardPathway,
          activity_id: activityId,
          reason: awardReason || "Asignación manual",
          source: "admin",
        }]);
      if (error) throw error;
      toast({ title: "Éxito", description: `${awardPoints} puntos asignados a ${selected.full_name || selected.email}` });
      setAwardOpen(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e?.message || "No se pudo asignar puntos", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Participantes del Pasaporte</h1>
          <p className="text-muted-foreground mt-1">Estudiantes y profesores con participación en el Pasaporte</p>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Incluye estudiantes y profesores; con avatar y etiqueta de rol.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
            <Input
              placeholder="Buscar por nombre o email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full lg:w-80"
            />
            <div className="flex gap-3">
              <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="student">Estudiantes</SelectItem>
                  <SelectItem value="professor">Profesores</SelectItem>
                </SelectContent>
              </Select>
              <Select value={campusFilter} onValueChange={setCampusFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Campus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((c) => (
                    <SelectItem key={c} value={c}>{c === 'all' ? 'Todos los campus' : c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No se encontraron participantes</div>
          ) : (
            <MobileTable
              items={filtered}
              renderItem={(p) => (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={p.avatar_url || undefined} alt={p.full_name || p.email || "Usuario"} />
                      <AvatarFallback>{initials(p.full_name, p.email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base truncate">{p.full_name || p.email || "Usuario"}</div>
                      <div className="text-sm text-muted-foreground truncate">{p.email}</div>
                      {(p.city || p.department) && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {p.city || ""}{p.city && p.department ? ", " : ""}{p.department || ""}
                        </div>
                      )}
                      <div className="mt-2">
                        <Badge variant={p.role === "professor" ? "default" : "secondary"} className="text-xs">
                          {p.role === "professor" ? "Profesor" : "Estudiante"}
                        </Badge>
                        {p.campus && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {p.campus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openAward(p)} className="flex-1">
                      <Trophy className="h-4 w-4 mr-1" />
                      Asignar Puntos
                    </Button>
                    <Button
                      size="sm"
                      variant={p.disabled ? "secondary" : "destructive"}
                      onClick={async () => {
                        try {
                          const newDisabled = !p.disabled;
                          const { error } = await (supabase.from("profiles") as any)
                            .update({ disabled: newDisabled })
                            .eq("id", p.id);
                          if (error) throw error;
                          setParticipants((prev) => prev.map((x) => (x.id === p.id ? { ...x, disabled: newDisabled } : x)));
                          toast({ title: newDisabled ? "Cuenta deshabilitada" : "Cuenta habilitada", description: p.full_name || p.email || "Usuario" });
                        } catch (e: any) {
                          console.error(e);
                          toast({ title: "Error", description: e?.message || "No se pudo actualizar el estado de la cuenta", variant: "destructive" });
                        }
                      }}
                      className="flex-1"
                    >
                      {p.disabled ? <UserCheck className="h-4 w-4 mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
                      {p.disabled ? "Habilitar" : "Deshabilitar"}
                    </Button>
                  </div>
                </div>
              )}
              table={(
                <table className="min-w-full border text-sm bg-white">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border px-3 py-2 text-left">Participante</th>
                      <th className="border px-3 py-2 text-left">Email</th>
                      <th className="border px-3 py-2 text-left">Rol</th>
                      <th className="border px-3 py-2 text-left">Ubicación</th>
                      <th className="border px-3 py-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/40">
                        <td className="border px-3 py-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={p.avatar_url || undefined} alt={p.full_name || p.email || "Usuario"} />
                              <AvatarFallback>{initials(p.full_name, p.email)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{p.full_name || p.email || "Usuario"}</span>
                          </div>
                        </td>
                        <td className="border px-3 py-2">{p.email}</td>
                        <td className="border px-3 py-2">
                          <Badge variant={p.role === "professor" ? "default" : "secondary"}>
                            {p.role === "professor" ? "Profesor" : "Estudiante"}
                          </Badge>
                        </td>
                        <td className="border px-3 py-2 text-sm text-muted-foreground">
                          {(p.city || p.department) ? (
                            <>
                              {p.city || ""}{p.city && p.department ? ", " : ""}{p.department || ""}
                            </>
                          ) : "—"}
                        </td>
                        <td className="border px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" onClick={() => openAward(p)} aria-label="Asignar puntos">
                                    <Trophy className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Asignar puntos</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant={p.disabled ? "secondary" : "destructive"}
                                    onClick={async () => {
                                      try {
                                        const newDisabled = !p.disabled;
                                        const { error } = await (supabase.from("profiles") as any)
                                          .update({ disabled: newDisabled })
                                          .eq("id", p.id);
                                        if (error) throw error;
                                        setParticipants((prev) => prev.map((x) => (x.id === p.id ? { ...x, disabled: newDisabled } : x)));
                                        toast({ title: newDisabled ? "Cuenta deshabilitada" : "Cuenta habilitada", description: p.full_name || p.email || "Usuario" });
                                      } catch (e: any) {
                                        console.error(e);
                                        toast({ title: "Error", description: e?.message || "No se pudo actualizar el estado de la cuenta", variant: "destructive" });
                                      }
                                    }}
                                    aria-label={p.disabled ? "Habilitar cuenta" : "Deshabilitar cuenta"}
                                  >
                                    {p.disabled ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>{p.disabled ? "Habilitar" : "Deshabilitar"}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Modal para asignar puntos */}
      <Dialog open={awardOpen} onOpenChange={setAwardOpen}>
  <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asignar Puntos</DialogTitle>
            <DialogDescription>
              {selected && (
                <>A: <strong>{selected.full_name || selected.email}</strong></>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Puntos</Label>
                <Input type="number" value={awardPoints} min={1} onChange={(e) => setAwardPoints(parseInt(e.target.value || "0", 10))} />
              </div>
              <div>
                <Label>Sendero</Label>
                <Select value={awardPathway} onValueChange={setAwardPathway}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conocimiento">Conocimiento</SelectItem>
                    <SelectItem value="descubrimiento">Descubrimiento</SelectItem>
                    <SelectItem value="impacto_social">Impacto Social</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Actividad (Opcional)</Label>
              <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona actividad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin actividad específica</SelectItem>
                  {activities.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} ({a.points_awarded} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo / Razón</Label>
              <Textarea value={awardReason} onChange={(e) => setAwardReason(e.target.value)} rows={3} placeholder="Ej: Participación destacada en COIL" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAwardOpen(false)}>Cancelar</Button>
              <Button onClick={awardPointsToUser} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Asignar Puntos
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParticipantsPage;
