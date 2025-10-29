import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import MobileTable from "@/components/ui/MobileTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

type RankingRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
  total_points: number;
};

type PathwayMetrics = {
  conocimiento: number;
  descubrimiento: number;
  impacto_social: number;
};

export const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<RankingRow[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [pathwayMetrics, setPathwayMetrics] = useState<PathwayMetrics>({
    conocimiento: 0,
    descubrimiento: 0,
    impacto_social: 0,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) Get all students
        const { data: roleRows, error: rolesErr } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "student");
        if (rolesErr) throw rolesErr;
        const studentIds = (roleRows || []).map((r: any) => r.user_id);
        if (studentIds.length === 0) {
          setRows([]);
          setLoading(false);
          return;
        }

        // 2) Fetch all ledger entries for those users and sum points client-side (MVP)
        const { data: ledger = [], error: ledgerErr } = await supabase
          .from("passport_points_ledger" as any)
          .select("user_id, points, pathway_type")
          .in("user_id", studentIds);
        if (ledgerErr) throw ledgerErr;

        // Sum points by user_id
        const pointsMap = new Map<string, number>();
        let totalSum = 0;
        const pathways: PathwayMetrics = { conocimiento: 0, descubrimiento: 0, impacto_social: 0 };
        (ledger || []).forEach((r: any) => {
          const prev = pointsMap.get(r.user_id) || 0;
          pointsMap.set(r.user_id, prev + (r.points || 0));
          totalSum += r.points || 0;
          // Aggregate by pathway
          const pt = r.pathway_type as keyof PathwayMetrics | null;
          if (pt && pathways[pt] !== undefined) {
            pathways[pt] += r.points || 0;
          }
        });
        setTotalPoints(totalSum);
        setPathwayMetrics(pathways);
        const rankedIds = Array.from(pointsMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id);

        // 3) Profiles to enrich with name, email, avatar
        const topIds = rankedIds; // could slice for performance e.g., .slice(0, 100)
        const { data: profs = [], error: profErr } = await (supabase.from("profiles") as any)
          .select("id, full_name, email, avatar_url")
          .in("id", topIds);
        if (profErr) throw profErr;
        const byId = new Map<string, any>();
        profs.forEach((p: any) => byId.set(p.id, p));

        const list: RankingRow[] = topIds.map((id) => ({
          user_id: id,
          full_name: byId.get(id)?.full_name || null,
          email: byId.get(id)?.email || null,
          avatar_url: byId.get(id)?.avatar_url || null,
          total_points: pointsMap.get(id) || 0,
        }));

        setRows(list);
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.full_name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const initials = (name?: string | null, email?: string | null) => {
    const src = name || email || "";
    const parts = src.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "U";
    return "U";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes y Estadísticas</h1>
          <p className="text-muted-foreground mt-1">Métricas del Pasaporte Académico</p>
        </div>
        {loading && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

  {/* Summary Cards */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Puntos Totales Otorgados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "—" : totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">En todo el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estudiantes Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "—" : rows.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Con puntos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio de Puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading || rows.length === 0 ? "—" : Math.round(totalPoints / rows.length).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Por estudiante</p>
          </CardContent>
        </Card>
      </div>

      {/* Pathway Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por Sendero</CardTitle>
          <CardDescription>Puntos otorgados por cada sendero académico</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Sendero de Conocimiento</div>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? "—" : pathwayMetrics.conocimiento.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">puntos otorgados</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Sendero de Descubrimiento</div>
              <div className="text-2xl font-bold text-green-600">
                {loading ? "—" : pathwayMetrics.descubrimiento.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">puntos otorgados</div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Sendero de Impacto Social</div>
              <div className="text-2xl font-bold text-purple-600">
                {loading ? "—" : pathwayMetrics.impacto_social.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">puntos otorgados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ranking de Estudiantes</CardTitle>
          <CardDescription>Ordenado por puntos totales otorgados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por nombre o email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-96"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando ranking…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay datos para mostrar</div>
          ) : (
            <MobileTable
              items={filtered}
              renderItem={(r, idx) => (
                <div className="border rounded p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-xs font-semibold w-6 text-center">{idx + 1}</div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={r.avatar_url || undefined} alt={r.full_name || r.email || "Usuario"} />
                      <AvatarFallback>{initials(r.full_name, r.email)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.email || "—"}</div>
                    </div>
                  </div>
                  <div className="text-right font-semibold">{r.total_points}</div>
                </div>
              )}
              table={(
                <table className="min-w-full border text-sm bg-white">
                  <thead className="bg-muted">
                    <tr>
                      <th className="border px-2 py-1 w-12">#</th>
                      <th className="border px-2 py-1">Estudiante</th>
                      <th className="border px-2 py-1">Email</th>
                      <th className="border px-2 py-1 text-right">Puntos Totales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => (
                      <tr key={r.user_id} className="hover:bg-muted/40">
                        <td className="border px-2 py-1 text-center">{idx + 1}</td>
                        <td className="border px-2 py-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={r.avatar_url || undefined} alt={r.full_name || r.email || "Usuario"} />
                              <AvatarFallback>{initials(r.full_name, r.email)}</AvatarFallback>
                            </Avatar>
                            <span>{r.full_name || "—"}</span>
                          </div>
                        </td>
                        <td className="border px-2 py-1">{r.email || "—"}</td>
                        <td className="border px-2 py-1 text-right font-semibold">{r.total_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
