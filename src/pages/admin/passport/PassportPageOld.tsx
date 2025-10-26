import { AdminLayout } from "../layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, Trophy, Medal, Target, Settings, BarChart2 } from "lucide-react";

type Route = { id: string; name: string; description: string | null; active: boolean };
type Step = { id: string; route_id: string; order_index: number; title: string; description: string | null; points_required: number };
type Badge = { id: string; name: string; description: string | null; color: string | null; icon_url: string | null; points_required: number; active: boolean };
type Recognition = { id: string; title: string; description: string | null; color: string | null; icon_url: string | null; active: boolean };

export const PassportPage = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<{ id?: string; min_points_for_badge: number } | null>(null);

  // Ruta UDES
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const selectedRoute = useMemo(() => routes.find(r => r.id === selectedRouteId) || null, [routes, selectedRouteId]);

  // Gamificación
  const [awardEmail, setAwardEmail] = useState("");
  const [awardPoints, setAwardPoints] = useState<number>(10);
  const [awardReason, setAwardReason] = useState("Contribución académica");
  const [recentLedger, setRecentLedger] = useState<any[]>([]);

  // Insignias y Reconocimientos
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);

  useEffect(() => {
    // Load settings, route, steps, badges, recognitions, recent ledger
    const loadAll = async () => {
      setLoading(true);
      try {
        // Settings (up to one row)
        const { data: s } = await (supabase as any)
          .from("passport_settings")
          .select("id,min_points_for_badge")
          .limit(1)
          .maybeSingle();
        setSettings(s || { min_points_for_badge: 100 });

        // Routes
        const { data: rts = [] } = await (supabase as any)
          .from("passport_routes")
          .select("id,name,description,active")
          .order("created_at", { ascending: true });
        setRoutes(rts);
        if (rts?.length && !selectedRouteId) setSelectedRouteId(rts[0].id);

        // Badges
        const { data: bds = [] } = await (supabase as any)
          .from("passport_badges")
          .select("id,name,description,color,icon_url,points_required,active")
          .order("points_required", { ascending: true });
        setBadges(bds);

        // Recognitions
        const { data: recs = [] } = await (supabase as any)
          .from("passport_recognitions")
          .select("id,title,description,color,icon_url,active")
          .order("created_at", { ascending: false });
        setRecognitions(recs);

        // Recent ledger
        const { data: led = [] } = await (supabase as any)
          .from("passport_points_ledger")
          .select("id,points,reason,source,created_at, user_id, profiles:profiles(full_name,email)")
          .order("created_at", { ascending: false })
          .limit(10);
        setRecentLedger(led);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    const loadSteps = async () => {
      if (!selectedRouteId) return;
      const { data: stps = [] } = await (supabase as any)
        .from("passport_route_steps")
        .select("id,route_id,order_index,title,description,points_required")
        .eq("route_id", selectedRouteId)
        .order("order_index", { ascending: true });
      setSteps(stps);
    };
    loadSteps();
  }, [selectedRouteId]);

  const saveSettings = async () => {
    if (!settings) return;
    setLoading(true);
    try {
      const upsertPayload = { id: settings.id, min_points_for_badge: settings.min_points_for_badge };
      const { error } = await (supabase as any)
        .from("passport_settings")
        .upsert(upsertPayload, { onConflict: "id" });
      if (error) throw error;
      toast({ title: "Configuración guardada" });
    } catch (e: any) {
      toast({ title: "Error guardando configuración", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const ensureRoute = async () => {
    setLoading(true);
    try {
      const name = "Ruta UDES";
      const { data: existing } = await (supabase as any)
        .from("passport_routes")
        .select("id")
        .eq("name", name)
        .maybeSingle();
      if (existing?.id) {
        setSelectedRouteId(existing.id);
        return;
      }
      const { data, error } = await (supabase as any)
        .from("passport_routes")
        .insert([{ name, description: "Sendero internacional con hitos por puntos", active: true }])
        .select("id")
        .single();
      if (error) throw error;
      setRoutes(prev => [...prev, { id: data.id, name, description: "Sendero internacional con hitos por puntos", active: true }]);
      setSelectedRouteId(data.id);
      toast({ title: "Ruta UDES creada" });
    } catch (e: any) {
      toast({ title: "No se pudo crear la ruta", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addStep = async (payload: { title: string; points_required: number }) => {
    if (!selectedRouteId) return;
    setLoading(true);
    try {
      const order_index = (steps[steps.length - 1]?.order_index || 0) + 1;
      const { data, error } = await (supabase as any)
        .from("passport_route_steps")
        .insert([{ route_id: selectedRouteId, order_index, title: payload.title, description: null, points_required: payload.points_required }])
        .select("id,route_id,order_index,title,description,points_required")
        .single();
      if (error) throw error;
      setSteps(prev => [...prev, data].sort((a, b) => a.order_index - b.order_index));
      toast({ title: "Hito agregado" });
    } catch (e: any) {
      toast({ title: "No se pudo agregar el hito", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createBadge = async (payload: { name: string; description?: string; points_required: number; color?: string }) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("passport_badges")
        .insert([{ name: payload.name, description: payload.description || null, points_required: payload.points_required, color: payload.color || null, active: true }])
        .select("id,name,description,color,icon_url,points_required,active")
        .single();
      if (error) throw error;
      setBadges(prev => [...prev, data].sort((a, b) => a.points_required - b.points_required));
      toast({ title: "Insignia creada" });
    } catch (e: any) {
      toast({ title: "No se pudo crear la insignia", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createRecognition = async (payload: { title: string; description?: string; color?: string }) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("passport_recognitions")
        .insert([{ title: payload.title, description: payload.description || null, color: payload.color || null, active: true }])
        .select("id,title,description,color,icon_url,active")
        .single();
      if (error) throw error;
      setRecognitions(prev => [data, ...prev]);
      toast({ title: "Reconocimiento creado" });
    } catch (e: any) {
      toast({ title: "No se pudo crear el reconocimiento", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const awardPointsToEmail = async () => {
    if (!awardEmail || !awardPoints) return;
    setLoading(true);
    try {
      const { data: profile, error: pErr } = await (supabase as any)
        .from("profiles")
        .select("id,full_name,email")
        .ilike("email", awardEmail)
        .maybeSingle();
      if (pErr || !profile) throw new Error("No se encontró el usuario por ese email");

      const { error } = await (supabase as any)
        .from("passport_points_ledger")
        .insert([{ user_id: profile.id, points: awardPoints, reason: awardReason, source: "admin" }]);
      if (error) throw error;
      toast({ title: `Asignados ${awardPoints} puntos a ${profile.full_name}` });

      // refresh recent ledger
      const { data: led = [] } = await (supabase as any)
        .from("passport_points_ledger")
        .select("id,points,reason,source,created_at, user_id, profiles:profiles(full_name,email)")
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentLedger(led);
    } catch (e: any) {
      toast({ title: "No se pudieron asignar puntos", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Simple local forms state
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepPoints, setNewStepPoints] = useState<number>(50);
  const [newBadgeName, setNewBadgeName] = useState("");
  const [newBadgePoints, setNewBadgePoints] = useState<number>(100);
  const [newBadgeDesc, setNewBadgeDesc] = useState("");
  const [newRecognitionTitle, setNewRecognitionTitle] = useState("");
  const [newRecognitionDesc, setNewRecognitionDesc] = useState("");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pasaporte Académico</h1>
            <p className="text-muted-foreground mt-1">Configura reglas globales, define la Ruta UDES y gestiona gamificación.</p>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2" />Configuración</TabsTrigger>
            <TabsTrigger value="route"><Target className="h-4 w-4 mr-2" />Ruta UDES</TabsTrigger>
            <TabsTrigger value="gamification"><Trophy className="h-4 w-4 mr-2" />Gamificación</TabsTrigger>
            <TabsTrigger value="badges"><Medal className="h-4 w-4 mr-2" />Insignias</TabsTrigger>
            <TabsTrigger value="recognitions"><Medal className="h-4 w-4 mr-2" />Reconocimientos</TabsTrigger>
            <TabsTrigger value="reports"><BarChart2 className="h-4 w-4 mr-2" />Reportes</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Parámetros globales</CardTitle>
                <CardDescription>Define requisitos mínimos y reglas generales de la plataforma.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <Label htmlFor="minPoints">Puntos mínimos para insignias</Label>
                    <Input id="minPoints" type="number" min={0}
                      value={settings?.min_points_for_badge ?? 100}
                      onChange={(e) => setSettings(s => ({ ...(s||{} as any), min_points_for_badge: parseInt(e.target.value || '0', 10) }))}
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-2">
                    <Button onClick={saveSettings}><Save className="h-4 w-4 mr-2"/>Guardar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="route">
            <Card>
              <CardHeader>
                <CardTitle>Ruta UDES (Sendero internacional)</CardTitle>
                <CardDescription>Define hitos por puntos y visualiza el progreso esperado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3">
                  <select className="border rounded px-3 py-2 bg-background"
                    value={selectedRouteId || ""}
                    onChange={(e) => setSelectedRouteId(e.target.value)}>
                    <option value="" disabled>Selecciona ruta…</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <Button variant="secondary" onClick={ensureRoute}><Plus className="h-4 w-4 mr-2"/>Crear “Ruta UDES”</Button>
                </div>

                {selectedRoute && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div className="md:col-span-2">
                        <Label htmlFor="stepTitle">Nuevo hito</Label>
                        <Input id="stepTitle" value={newStepTitle} onChange={(e) => setNewStepTitle(e.target.value)} placeholder="Nombre del hito" />
                      </div>
                      <div>
                        <Label htmlFor="stepPoints">Puntos requeridos</Label>
                        <Input id="stepPoints" type="number" min={0} value={newStepPoints}
                          onChange={(e) => setNewStepPoints(parseInt(e.target.value || '0', 10))}/>
                      </div>
                      <Button onClick={() => newStepTitle && addStep({ title: newStepTitle, points_required: newStepPoints })}>
                        <Plus className="h-4 w-4 mr-2"/>Agregar hito
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold">Hitos</h3>
                      <div className="border rounded divide-y">
                        {steps.length === 0 && (
                          <div className="p-3 text-sm text-muted-foreground">Aún no hay hitos definidos.</div>
                        )}
                        {steps.map(s => (
                          <div key={s.id} className="p-3 flex items-center justify-between">
                            <div>
                              <div className="font-medium">{s.order_index}. {s.title}</div>
                              <div className="text-sm text-muted-foreground">Requiere {s.points_required} puntos</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gamification">
            <Card>
              <CardHeader>
                <CardTitle>Asignación de puntos</CardTitle>
                <CardDescription>Entrega puntos manualmente a estudiantes por email (MVP).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Label htmlFor="awardEmail">Email del estudiante</Label>
                    <Input id="awardEmail" value={awardEmail} onChange={(e) => setAwardEmail(e.target.value)} placeholder="nombre@udes.edu.co" />
                  </div>
                  <div>
                    <Label htmlFor="awardPoints">Puntos</Label>
                    <Input id="awardPoints" type="number" min={1} value={awardPoints}
                      onChange={(e) => setAwardPoints(parseInt(e.target.value || '0', 10))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="awardReason">Motivo</Label>
                    <Input id="awardReason" value={awardReason} onChange={(e) => setAwardReason(e.target.value)} />
                  </div>
                  <div className="md:col-span-5">
                    <Button onClick={awardPointsToEmail}><Trophy className="h-4 w-4 mr-2"/>Asignar puntos</Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Últimas asignaciones</h3>
                  <div className="border rounded divide-y">
                    {recentLedger.length === 0 && <div className="p-3 text-sm text-muted-foreground">Aún no hay movimientos.</div>}
                    {recentLedger.map((l) => (
                      <div key={l.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium">{l.profiles?.full_name || l.user_id}</div>
                          <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()} • {l.reason || '—'}</div>
                        </div>
                        <div className="font-semibold">+{l.points} pts</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges">
            <Card>
              <CardHeader>
                <CardTitle>Insignias</CardTitle>
                <CardDescription>Diseña y publica insignias desbloqueables por puntos o logros.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Label htmlFor="badgeName">Nombre</Label>
                    <Input id="badgeName" value={newBadgeName} onChange={(e) => setNewBadgeName(e.target.value)} placeholder="Embajador UDES" />
                  </div>
                  <div>
                    <Label htmlFor="badgePoints">Puntos requeridos</Label>
                    <Input id="badgePoints" type="number" min={0} value={newBadgePoints}
                      onChange={(e) => setNewBadgePoints(parseInt(e.target.value || '0', 10))} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="badgeDesc">Descripción</Label>
                    <Input id="badgeDesc" value={newBadgeDesc} onChange={(e) => setNewBadgeDesc(e.target.value)} placeholder="Alcanza 100 pts en Ruta UDES" />
                  </div>
                  <Button onClick={() => newBadgeName && createBadge({ name: newBadgeName, points_required: newBadgePoints, description: newBadgeDesc })}>
                    <Plus className="h-4 w-4 mr-2"/>Crear insignia
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {badges.length === 0 && <div className="text-sm text-muted-foreground">Aún no hay insignias.</div>}
                  {badges.map(b => (
                    <div key={b.id} className="border rounded p-3">
                      <div className="font-semibold">{b.name}</div>
                      <div className="text-sm text-muted-foreground">{b.description || '—'}</div>
                      <div className="text-sm mt-2">Requiere <span className="font-medium">{b.points_required}</span> pts</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recognitions">
            <Card>
              <CardHeader>
                <CardTitle>Reconocimientos</CardTitle>
                <CardDescription>Define reconocimientos especiales (no necesariamente por puntos).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Label htmlFor="recTitle">Título</Label>
                    <Input id="recTitle" value={newRecognitionTitle} onChange={(e) => setNewRecognitionTitle(e.target.value)} placeholder="Embajador Internacional" />
                  </div>
                  <div className="md:col-span-3">
                    <Label htmlFor="recDesc">Descripción</Label>
                    <Input id="recDesc" value={newRecognitionDesc} onChange={(e) => setNewRecognitionDesc(e.target.value)} placeholder="Reconocimiento por aporte destacado" />
                  </div>
                  <Button onClick={() => newRecognitionTitle && createRecognition({ title: newRecognitionTitle, description: newRecognitionDesc })}>
                    <Plus className="h-4 w-4 mr-2"/>Crear reconocimiento
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recognitions.length === 0 && <div className="text-sm text-muted-foreground">Aún no hay reconocimientos.</div>}
                  {recognitions.map(r => (
                    <div key={r.id} className="border rounded p-3">
                      <div className="font-semibold">{r.title}</div>
                      <div className="text-sm text-muted-foreground">{r.description || '—'}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <ReportsSection />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

const ReportsSection = () => {
  const [loading, setLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [topStudents, setTopStudents] = useState<Array<{ user_id: string; full_name: string; email: string; points: number }>>([]);
  const [badgesCount, setBadgesCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Sum points (client-side sum for MVP)
        const { data: allPoints = [] } = await (supabase as any)
          .from("passport_points_ledger")
          .select("points");
        setTotalPoints((allPoints || []).reduce((acc: number, r: any) => acc + (r.points || 0), 0));

        // Top students: sum by user_id (MVP client-side)
        const { data: withUsers = [] } = await (supabase as any)
          .from("passport_points_ledger")
          .select("user_id, points, profiles:profiles(full_name,email)");
        const map = new Map<string, { user_id: string; full_name: string; email: string; points: number }>();
        (withUsers || []).forEach((r: any) => {
          const k = r.user_id;
          const prev = map.get(k) || { user_id: k, full_name: r.profiles?.full_name || k, email: r.profiles?.email || '', points: 0 };
          prev.points += r.points || 0;
          prev.full_name = r.profiles?.full_name || prev.full_name;
          prev.email = r.profiles?.email || prev.email;
          map.set(k, prev);
        });
        setTopStudents(Array.from(map.values()).sort((a, b) => b.points - a.points).slice(0, 5));

        // Badges awarded count
        const { count } = await (supabase as any)
          .from("passport_user_badges")
          .select("id", { count: "exact", head: true });
        setBadgesCount(count || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reportes y estadísticas</CardTitle>
        <CardDescription>Totales y rankings del Pasaporte.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded p-4">
            <div className="text-sm text-muted-foreground">Puntos totales otorgados</div>
            <div className="text-2xl font-bold">{loading ? '—' : totalPoints}</div>
          </div>
          <div className="border rounded p-4">
            <div className="text-sm text-muted-foreground">Insignias otorgadas</div>
            <div className="text-2xl font-bold">{loading ? '—' : badgesCount}</div>
          </div>
          <div className="border rounded p-4">
            <div className="text-sm text-muted-foreground">Top estudiantes</div>
            <ul className="mt-2 space-y-1">
              {topStudents.map(s => (
                <li key={s.user_id} className="flex items-center justify-between text-sm">
                  <span>{s.full_name}</span>
                  <span className="font-medium">{s.points} pts</span>
                </li>
              ))}
              {topStudents.length === 0 && <li className="text-muted-foreground">—</li>}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
