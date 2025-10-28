import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ProfessorInbox: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      if (!userId) {
        setMessages([]);
        return;
      }

      const { data } = await (supabase.from("contact_messages") as any)
        .select("*")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false });

      setMessages(data || []);
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
            <CardTitle>Buzón</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground">No hay mensajes</p>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className="border rounded p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer" onClick={() => setSelected(m)}>
                    <div>
                      <div className="font-medium">{m.sender_name}</div>
                      <div className="text-sm text-muted-foreground">{m.university_representing} • {m.country}{m.department ? ` • ${m.department}` : ""}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
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
                <DialogTitle>Mensaje de {selected.sender_name}</DialogTitle>
                <DialogDescription>Detalle del mensaje recibido</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <p><strong>Universidad:</strong> {selected.university_representing}</p>
                <p><strong>País:</strong> {selected.country}{selected.department ? ` • ${selected.department}` : ""}</p>
                <p><strong>Correo:</strong> {selected.sender_email}</p>
                <p><strong>Motivo:</strong> {selected.reason}{selected.reason_other ? ` • ${selected.reason_other}` : ""}</p>
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

export default ProfessorInbox;
