import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const BuzonPage: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // First, select requests (try including relation). If relation is not populated
      // we'll do an explicit fetch for the related offerings and attach title/campus.
      const { data: relData, error: relError } = await supabase
        .from("offering_requests")
        .select("*, course_offerings (title, campus)")
        .order("created_at", { ascending: false });

      let requestsList: any[] = relData || [];

      // If relation was not returned/populated, fetch plain requests and then fetch offerings separately
      if (relError || requestsList.length === 0 || !requestsList[0].course_offerings) {
        const { data: reqOnly } = await supabase.from("offering_requests").select("*").order("created_at", { ascending: false });
        requestsList = reqOnly || [];

        // Gather offering ids and fetch their titles/campus
        const offeringIds = Array.from(new Set(requestsList.map((r: any) => r.offering_id).filter(Boolean)));
        if (offeringIds.length > 0) {
          const { data: offers } = await supabase.from("course_offerings").select("id,title,campus").in("id", offeringIds);
          const offersMap: Record<string, any> = {};
          (offers || []).forEach((o: any) => { offersMap[o.id] = o; });
          // attach course_offerings shim to each request
          requestsList = requestsList.map((r: any) => ({ ...r, course_offerings: offersMap[r.offering_id] || null }));
        }
      }

      setRequests(requestsList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Buzón de Solicitudes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : requests.length === 0 ? (
              <p className="text-muted-foreground">No hay solicitudes</p>
            ) : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="border rounded p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer" onClick={() => setSelected(r)}>
                    <div>
                      <div className="font-medium">{r.full_name}</div>
                      <div className="text-sm text-muted-foreground">{r.university_representing} • {r.country}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {r.course_offerings?.title || r.offering_title || r.offering_id}
                      {r.course_offerings?.campus ? ` • ${r.course_offerings.campus}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Solicitud de {selected.full_name}</DialogTitle>
                <DialogDescription>Detalle de la solicitud</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <p><strong>Universidad:</strong> {selected.university_representing}</p>
                <p><strong>País:</strong> {selected.country}{selected.department ? ` • ${selected.department}` : ""}</p>
                <p>
                  <strong>Oferta:</strong> {selected.course_offerings?.title || selected.offering_title || selected.offering_id}
                  {selected.course_offerings?.campus ? <span>{` • ${selected.course_offerings.campus}`}</span> : null}
                </p>
                <p><strong>Correo:</strong> {selected.institutional_email}</p>
                <p><strong>Tipo:</strong> {selected.proposal_type}</p>
                {selected.message && (
                  <div>
                    <strong>Mensaje:</strong>
                    <p className="mt-2 text-sm text-muted-foreground">{selected.message}</p>
                  </div>
                )}
                <div className="flex justify-end mt-4">
                  <Button variant="ghost" onClick={() => setSelected(null)}>Cerrar</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuzonPage;
