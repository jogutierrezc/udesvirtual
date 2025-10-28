import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  "Colombia",
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Ecuador",
  "Perú",
  "Venezuela",
  "México",
  "España",
  "Estados Unidos",
  "Reino Unido",
  "Alemania",
  "Francia",
  "Italia",
  "Portugal",
  "Canadá",
  "Australia",
  "Nueva Zelanda",
];

const COLOMBIA_DEPARTMENTS = [
  "Amazonas","Antioquia","Arauca","Atlántico","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca","Cesar","Chocó","Córdoba","Cundinamarca","Guainía","Guaviare","Huila","La Guajira","Magdalena","Meta","Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés y Providencia","Santander","Sucre","Tolima","Valle del Cauca","Vaupés","Vichada","Distrito Capital de Bogotá"
];

const REASONS = [
  { value: "Master Class", label: "Master Class" },
  { value: "Clase Espejo", label: "Clase Espejo" },
  { value: "Proyecto COIL", label: "Proyecto COIL" },
  { value: "MOOC", label: "MOOC" },
  { value: "Evaluador de Proyecto", label: "Evaluador de Proyecto" },
  { value: "Proyecto Internacional", label: "Proyecto Internacional" },
  { value: "Otro", label: "Otro" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
};

const ContactProfessorModal: React.FC<Props> = ({ open, onOpenChange, profileId }) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [reason, setReason] = useState(REASONS[0].value);
  const [reasonOther, setReasonOther] = useState("");
  const [country, setCountry] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setUniversity("");
      setReason(REASONS[0].value);
      setReasonOther("");
      setCountry("");
      setDepartment("");
      setMessage("");
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name || !email || !university || !reason || !country || (country === "Colombia" && !department) || !message) {
      toast({ title: "Faltan datos", description: "Por favor completa los campos obligatorios", variant: "destructive" });
      return;
    }

    if (message.length > 2000) {
      toast({ title: "Mensaje muy largo", description: "El mensaje no puede exceder 2000 caracteres", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id ?? null;

  const { error } = await (supabase.from("contact_messages") as any).insert({
        profile_id: profileId,
        sender_name: name,
        sender_email: email,
        university_representing: university,
        reason,
        reason_other: reason === "Otro" ? reasonOther : null,
        country,
        department: country === "Colombia" ? department : null,
        message,
        created_by: userId,
      });

      if (error) throw error;

      toast({ title: "Mensaje enviado", description: "UDES E-Exchange ha notificado al profesor. El/ella se comunicará por correo en los próximos días." });
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Error al enviar el mensaje", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Contactar al Profesor</DialogTitle>
            <DialogDescription>Rellena los datos para contactar al profesor. El profesor será notificado por correo.</DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nombre Completo *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label className="text-sm font-medium">Correo Electrónico *</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div>
              <label className="text-sm font-medium">Universidad que representa *</label>
              <Input value={university} onChange={(e) => setUniversity(e.target.value)} required />
            </div>

            <div>
              <label className="text-sm font-medium">Motivo de contacto *</label>
              <Select value={reason} onValueChange={(v) => setReason(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {reason === "Otro" && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Detalle de otro motivo *</label>
                <Input value={reasonOther} onChange={(e) => setReasonOther(e.target.value)} required />
              </div>
            )}

            <div>
              <label className="text-sm font-medium">País *</label>
              <Select value={country} onValueChange={(v) => setCountry(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un país" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {country === "Colombia" && (
              <div>
                <label className="text-sm font-medium">Departamento *</label>
                <Select value={department} onValueChange={(v) => setDepartment(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOMBIA_DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Mensaje *</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} />
            <div className="text-xs text-muted-foreground mt-1">Máximo 2000 caracteres. {message.length}/2000</div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Contactar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactProfessorModal;
