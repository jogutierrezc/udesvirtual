import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge as UIBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Simple student-facing passport page

type Step = { id: string; route_id: string; order_index: number; title: string; description: string | null; points_required: number };

export default function Passport() {
  const [userId, setUserId] = useState<string | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [userBadges, setUserBadges] = useState<Array<{ id: string; name: string }>>([]);
  const [userRecognitions, setUserRecognitions] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id || null;
      setUserId(uid);

      // Active route (pick first active)
      const { data: routes = [] } = await (supabase as any)
        .from("passport_routes")
        .select("id,name,active")
        .eq("active", true)
        .order("created_at", { ascending: true });
      const picked = routes?.[0]?.id || null;
      setRouteId(picked);

      if (picked) {
        const { data: stps = [] } = await (supabase as any)
          .from("passport_route_steps")
          .select("id,route_id,order_index,title,description,points_required")
          .eq("route_id", picked)
          .order("order_index", { ascending: true });
        setSteps(stps);
      }

      if (uid) {
        // Points sum
        const { data: ledger = [] } = await (supabase as any)
          .from("passport_points_ledger")
          .select("points")
          .eq("user_id", uid);
        const sum = (ledger || []).reduce((acc: number, r: any) => acc + (r.points || 0), 0);
        setTotalPoints(sum);

        // User badges
        const { data: ub = [] } = await (supabase as any)
          .from("passport_user_badges")
          .select("id,badge:passport_badges(name)")
          .eq("user_id", uid);
        setUserBadges((ub || []).map((x: any) => ({ id: x.id, name: x.badge?.name || "Insignia" })));

        // User recognitions
        const { data: ur = [] } = await (supabase as any)
          .from("passport_user_recognitions")
          .select("id,recognition:passport_recognitions(title)")
          .eq("user_id", uid);
        setUserRecognitions((ur || []).map((x: any) => ({ id: x.id, title: x.recognition?.title || "Reconocimiento" })));
      }
    };
    init();
  }, []);

  const currentStep = useMemo(() => {
    if (!steps?.length) return 0;
    const reached = steps.filter(s => totalPoints >= s.points_required).length;
    return reached;
  }, [steps, totalPoints]);

  const progressPercent = useMemo(() => {
    if (!steps?.length) return 0;
    const lastPoints = steps[steps.length - 1]?.points_required || 1;
    return Math.min(100, Math.round((totalPoints / lastPoints) * 100));
  }, [steps, totalPoints]);

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Pasaporte</h1>
        <p className="text-muted-foreground mt-1">Sigue tu Sendero Internacional, puntos y logros.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progreso general</CardTitle>
          <CardDescription>Ruta UDES • {totalPoints} puntos</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-3" />
          <div className="mt-2 text-sm text-muted-foreground">{progressPercent}% completado</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hitos de la Ruta</CardTitle>
          <CardDescription>Completa hitos acumulando puntos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {steps.length === 0 && <div className="text-sm text-muted-foreground">Aún no hay hitos definidos.</div>}
            {steps.map(s => {
              const done = totalPoints >= s.points_required;
              return (
                <div key={s.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{s.order_index}. {s.title}</div>
                    <div className="text-xs text-muted-foreground">Requiere {s.points_required} pts</div>
                  </div>
                  <UIBadge variant={done ? "default" : "outline"}>{done ? "Completado" : "Pendiente"}</UIBadge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Mis Insignias</CardTitle>
            <CardDescription>Logros desbloqueados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {userBadges.length === 0 && <div className="text-sm text-muted-foreground">Aún no tienes insignias.</div>}
              {userBadges.map(b => <UIBadge key={b.id}>{b.name}</UIBadge>)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reconocimientos</CardTitle>
            <CardDescription>Distinciones especiales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userRecognitions.length === 0 && <div className="text-sm text-muted-foreground">Sin reconocimientos aún.</div>}
              {userRecognitions.map(r => <div key={r.id} className="text-sm">• {r.title}</div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-xs text-muted-foreground text-center">Este módulo está en versión inicial. Próximamente: reglas automáticas y más visualizaciones.</div>
    </div>
  );
}
