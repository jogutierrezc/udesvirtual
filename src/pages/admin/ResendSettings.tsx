import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ResendSettings: React.FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    // Aquí deberías llamar a la edge function para guardar el secreto
    try {
      const response = await fetch("/functions/v1/save-resend-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, link }),
      });
      if (response.ok) {
        setMessage("Configuración guardada correctamente.");
      } else {
        setMessage("Error al guardar la configuración.");
      }
    } catch (err) {
      setMessage("Error de red o servidor.");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6">Configuración de Resend</h2>
      <Card className="p-6 space-y-4">
        <div>
          <label className="block font-medium mb-1">API Key de Resend</label>
          <Input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="Ingresa tu API Key de Resend"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Link de Resend</label>
          <Input
            type="text"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://resend.com/..."
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Guardando..." : "Guardar configuración"}
        </Button>
        {message && <div className="mt-2 text-center text-sm text-primary">{message}</div>}
      </Card>
    </div>
  );
};

export default ResendSettings;
