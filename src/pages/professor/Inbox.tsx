import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ProfessorInbox: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const { toast } = useToast();

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

  const markAsRead = async (msgId: string) => {
    try {
      // Use RPC to mark read (RPC runs with SECURITY DEFINER so RLS on updates stays strict)
      const { error } = await (supabase as any).rpc("mark_contact_message_set_read", { msg_id: msgId, new_read: true });
      if (error) throw error;
      // update local state
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, read: true } : m)));
      if (selected?.id === msgId) setSelected((s: any) => ({ ...s, read: true }));
    } catch (err) {
      console.error("Error marking message read", err);
      toast({ title: "Error", description: "No se pudo marcar el mensaje como leído", variant: "destructive" });
    }
  };

  const toggleRead = async (msgId: string, current: boolean) => {
    try {
      const { error } = await (supabase as any).rpc("mark_contact_message_set_read", { msg_id: msgId, new_read: !current });
      if (error) throw error;
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, read: !current } : m)));
      if (selected?.id === msgId) setSelected((s: any) => ({ ...s, read: !current }));
    } catch (err) {
      console.error("Error toggling read", err);
      toast({ title: "Error", description: "No se pudo actualizar el estado de lectura", variant: "destructive" });
    }
  };

  const handleOpenMessage = async (m: any) => {
    setSelected(m);
    // Auto-mark as read when opening if not already read
    if (!m.read) {
      await markAsRead(m.id);
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
                  <div key={m.id} className="border rounded p-3 flex items-center justify-between hover:bg-muted/50 cursor-pointer" onClick={() => handleOpenMessage(m)}>
                    <div className="flex items-center">
                      {!m.read && <span className="inline-block h-2 w-2 rounded-full bg-red-500 mr-3" aria-hidden />}
                      <div>
                        <div className="font-medium">{m.sender_name}</div>
                        <div className="text-sm text-muted-foreground">{m.university_representing} • {m.country}{m.department ? ` • ${m.department}` : ""}</div>
                      </div>
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
                <div className="flex justify-end mt-4 space-x-2">
                  {/* Toggle read/unread */}
                  <Button variant="ghost" onClick={() => setSelected(null)}>Cerrar</Button>
                  {selected && (
                    <Button onClick={() => toggleRead(selected.id, !!selected.read)}>{selected.read ? "Marcar como no leído" : "Marcar como leído"}</Button>
                  )}
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
