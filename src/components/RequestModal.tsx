import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offeringId: string;
  offeringTitle?: string;
};

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
  // ... se pueden ampliar si se desea
];

const COLOMBIA_DEPARTMENTS = [
  "Amazonas","Antioquia","Arauca","Atlántico","Bolívar","Boyacá","Caldas","Caquetá","Casanare","Cauca","Cesar","Chocó","Córdoba","Cundinamarca","Guainía","Guaviare","Huila","La Guajira","Magdalena","Meta","Nariño","Norte de Santander","Putumayo","Quindío","Risaralda","San Andrés y Providencia","Santander","Sucre","Tolima","Valle del Cauca","Vaupés","Vichada","Distrito Capital de Bogotá"
];

export const RequestModal: React.FC<Props> = ({ open, onOpenChange, offeringId, offeringTitle }) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [department, setDepartment] = useState("");
  const [university, setUniversity] = useState("");
  const [institutionEmail, setInstitutionEmail] = useState("");
  const [proposalType, setProposalType] = useState("masterclass");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      // reset form when modal closes
      setName("");
      setCountry("");
      setDepartment("");
      setUniversity("");
      setInstitutionEmail("");
      setProposalType("masterclass");
      setMessage("");
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name || !country || !university || !institutionEmail || !proposalType) {
      toast({ title: "Faltan datos", description: "Por favor completa los campos obligatorios", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Try to include user id if available, but allow anonymous submissions (created_by can be null)
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id ?? null;

      const { error } = await supabase.from("offering_requests").insert({
        offering_id: offeringId,
        full_name: name,
        country,
        department: country === "Colombia" ? department : null,
        university_representing: university,
        institutional_email: institutionEmail,
        proposal_type: proposalType,
        message,
        created_by: userId,
      });

      if (error) throw error;

      toast({ title: "Solicitud enviada", description: "Tu solicitud ha sido enviada al Buzón del administrador" });
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err?.message || "Error al enviar la solicitud", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Solicitar Intercambio{offeringTitle ? ` — ${offeringTitle}` : ""}</DialogTitle>
            <DialogDescription>Rellena los datos para enviar tu solicitud al Buzón</DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Nombre Completo *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <label className="text-sm font-medium">Universidad que representa *</label>
              <Input value={university} onChange={(e) => setUniversity(e.target.value)} required />
            </div>

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

            <div>
              <label className="text-sm font-medium">Correo Electrónico Institucional *</label>
              <Input type="email" value={institutionEmail} onChange={(e) => setInstitutionEmail(e.target.value)} required />
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de Propuesta *</label>
              <Select value={proposalType} onValueChange={(v) => setProposalType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="masterclass">Master Class</SelectItem>
                  <SelectItem value="mirror">Clase Espejo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Mensaje (opcional)</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RequestModal;
