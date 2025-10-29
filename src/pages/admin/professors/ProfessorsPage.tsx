import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ExternalLink, Mail, UserCheck, UserX } from "lucide-react";

type Row = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  campus?: string | null;
  program?: string | null;
  vinculation_type?: string | null;
  disabled?: boolean;
};

export const ProfessorsPage: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [campusFilter, setCampusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      // 1) Fetch all professors from user_roles
      const { data: roleRows, error: roleErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "professor");
      if (roleErr) throw roleErr;
      const ids = (roleRows || []).map((r: any) => r.user_id);
      if (!ids.length) { setRows([]); return; }

      // 2) Fetch profiles for those ids
      const { data: profs, error: profErr } = await (supabase.from("profiles") as any)
        .select("id, full_name, email, avatar_url, disabled")
        .in("id", ids);
      if (profErr) throw profErr;

      // 3) Fetch UDES relations for campus/program
      const { data: rels, error: relErr } = await (supabase.from("udes_relationships") as any)
        .select("profile_id, campus, program, vinculation_type")
        .in("profile_id", ids);
      if (relErr) throw relErr;
      const byId: Record<string, Row> = {};
      (profs || []).forEach((p: any) => {
        byId[p.id] = { id: p.id, full_name: p.full_name, email: p.email, avatar_url: p.avatar_url, disabled: !!p.disabled };
      });
      (rels || []).forEach((r: any) => {
        if (byId[r.profile_id]) {
          byId[r.profile_id].campus = r.campus;
          byId[r.profile_id].program = r.program;
          byId[r.profile_id].vinculation_type = r.vinculation_type;
        }
      });
      setRows(Object.values(byId));
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e?.message || "No se pudieron cargar los profesores", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const campuses = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.campus) set.add(r.campus); });
    return ["all", ...Array.from(set)];
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchName = search ? (r.full_name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase())) : true;
      const matchCampus = campusFilter === "all" ? true : (r.campus === campusFilter);
      return matchName && matchCampus;
    });
  }, [rows, search, campusFilter]);

  const toggleDisabled = async (row: Row) => {
    try {
      const newDisabled = !row.disabled;
      const { error } = await (supabase.from("profiles") as any).update({ disabled: newDisabled }).eq("id", row.id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, disabled: newDisabled } : r)));
      toast({ title: newDisabled ? "Cuenta deshabilitada" : "Cuenta habilitada", description: row.full_name });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e?.message || "No se pudo actualizar el estado de la cuenta", variant: "destructive" });
    }
  };

  const sendPasswordReset = async (row: Row) => {
    try {
      const redirectTo = window.location.origin + "/reset-password";
      const { error } = await supabase.auth.resetPasswordForEmail(row.email, { redirectTo });
      if (error) throw error;
      toast({ title: "Solicitud enviada", description: `Se envió el correo de cambio de contraseña a ${row.email}` });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e?.message || "No se pudo enviar el correo de restablecimiento", variant: "destructive" });
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Mis Profesores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
              <div className="flex gap-2 items-center w-full sm:w-auto">
                <Input placeholder="Buscar por nombre o email" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-80" />
                <Select value={campusFilter} onValueChange={setCampusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.map((c) => (
                      <SelectItem key={c} value={c}>{c === 'all' ? 'Todos los campus' : c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={load}>Recargar</Button>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground">No se encontraron profesores.</p>
            ) : (
              <div className="border rounded-md divide-y">
                {filtered.map((r) => {
                  const initials = (r.full_name || r.email || "?")
                    .split(" ")
                    .map((s) => s[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <div key={r.id} className="p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={r.avatar_url || undefined} alt={r.full_name} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate flex items-center gap-2">
                            <span className="truncate">{r.full_name}</span>
                            {r.disabled ? <span className="text-xs text-red-600 flex-shrink-0">(Deshabilitada)</span> : null}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {r.email}
                            {r.campus ? ` • ${r.campus}` : ""}
                            {r.program ? ` • ${r.program}` : ""}
                            {r.vinculation_type ? ` • ${r.vinculation_type}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link to={`/profile/${r.id}`} target="_blank" aria-label="Ver perfil">
                                <Button size="icon" variant="ghost">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>Ver perfil</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant={r.disabled ? "secondary" : "destructive"}
                                onClick={() => toggleDisabled(r)}
                                aria-label={r.disabled ? "Habilitar cuenta" : "Deshabilitar cuenta"}
                              >
                                {r.disabled ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{r.disabled ? "Habilitar" : "Deshabilitar"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="outline" onClick={() => sendPasswordReset(r)} aria-label="Enviar restablecimiento de contraseña">
                                <Mail className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Enviar reset</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfessorsPage;
