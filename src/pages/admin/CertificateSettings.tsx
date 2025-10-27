import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Eye } from "lucide-react";

type CertificateSettings = {
  id: string;
  template_html: string;
  signature_name: string;
  signature_title: string;
  qr_base_url: string;
  verification_url: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
};

export const CertificateSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CertificateSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("certificate_settings")
        .select("*")
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const defaultSettings: Omit<CertificateSettings, 'id'> = {
          template_html: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Curso Mooc UDES</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap');
        body { font-family: 'Montserrat', sans-serif; background-color: #e5e7eb; display: flex; flex-direction: column; align-items: center; padding: 30px; }
        .certificado-container { width: 27.94cm; height: 21.59cm; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); margin: 30px; background-color: #ffffff; position: relative; overflow: hidden; border-radius: 0; border: 2px solid #ddd; }
        .certificado-container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: radial-gradient(#e5e7eb 1px, transparent 0); background-size: 5px 5px; opacity: 0.1; pointer-events: none; z-index: 0; }
        .accent-line { position: absolute; top: 0; left: 0; width: 100%; height: 5px; background-color: var(--color-primary); z-index: 2; }
        .title-display { font-family: 'Montserrat', sans-serif; color: var(--color-secondary); letter-spacing: 0.5px; font-weight: 500; }
        .recipient-name { font-family: 'Montserrat', sans-serif; color: var(--color-primary); font-weight: 800; }
        @media print { .certificado-container { box-shadow: none !important; margin: 0 !important; } }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
</head>
<body>
    <button id="export-btn" class="bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-full shadow-xl transition duration-300 transform hover:scale-105 mb-10 text-lg">Exportar Certificado a PDF</button>
    <div id="certificado-template" class="certificado-container">
        <div class="accent-line"></div>
        <div class="p-10 flex flex-col justify-between h-full relative z-10">
            <header class="mb-10 w-full flex flex-col items-center text-center">
                <div class="mb-2">
                    <img src="{{LOGO_URL}}" alt="Logo de la Institución" class="h-16 w-auto mx-auto" onerror="this.onerror=null; this.src='https://placehold.co/150x60/f0f0f0/333?text=Logo+Placeholder';">
                </div>
                <div class="mt-1">
                    <h1 class="title-display text-3xl leading-none tracking-wider uppercase">Certificado de Curso Mooc</h1>
                </div>
            </header>
            <main class="flex-grow flex flex-col justify-center items-center py-4">
                <p class="text-xl text-gray-600 mb-6 font-light uppercase">Se otorga este reconocimiento a:</p>
                <p id="nombreParticipante" class="recipient-name text-5xl pb-3 mb-8 px-12">{{STUDENT_NAME}}</p>
                <div class="max-w-4xl text-center">
                    <p class="text-2xl text-gray-700 leading-normal">
                        Por completar con éxito el programa especializado de:
                        <span class="font-bold italic" style="color: var(--color-primary);">"{{COURSE_TITLE}}"</span>,
                        equivalente a <span class="font-bold">{{HOURS}} horas</span> de contenido curricular.
                    </p>
                    <p class="text-lg mt-6 text-gray-500">
                        Finalizado el <span class="font-bold">{{ISSUED_DATE}}</span>{{CITY_TEXT}}.
                    </p>
                </div>
            </main>
            <footer class="flex justify-between items-end mt-8">
                <div class="flex-grow flex justify-center items-end">
                    <div class="text-center w-auto">
                        <div class="h-0.5 w-64 mb-2 mx-auto" style="background-color: var(--color-primary);"></div>
                        <p class="text-lg font-semibold text-gray-800">{{SIGNATURE_NAME}}</p>
                        <p class="text-sm text-gray-500 font-light">{{SIGNATURE_TITLE}}</p>
                        <p class="text-xs mt-3 text-gray-600 font-medium">Firma electrónica certificada mediante criptografía</p>
                        <p class="text-xs font-mono text-gray-500 mt-1">MD5: <span id="md5-code">{{MD5_HASH}}</span></p>
                        <p class="text-[10px] text-gray-500 mt-2 leading-tight max-w-xs mx-auto">
                            Para verificar la autenticidad de este código debe ingresar a {{VERIFICATION_URL}}
                            e ingresar el código del certificado para convalidar el mismo.
                        </p>
                    </div>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-sm text-gray-600 mb-2 font-semibold">Verificación Digital:</p>
                    <div id="qrcodeContainer" class="p-1 border border-gray-300 shadow-sm inline-block bg-white"></div>
                    <p class="text-xs font-mono text-gray-500 mt-1">ID: <span id="verification-id">{{VERIFICATION_CODE}}</span></p>
                </div>
            </footer>
        </div>
    </div>
    <script>
        const ID_VERIFICACION = "{{VERIFICATION_CODE}}";
        const URL_BASE_VERIFICACION = "{{QR_BASE_URL}}";
        const DATA_QR = URL_BASE_VERIFICACION + "?code=" + encodeURIComponent(ID_VERIFICACION);
        function generarQR() {
            const container = document.getElementById("qrcodeContainer");
            container.innerHTML = "";
            new QRCode(container, {
                text: DATA_QR,
                width: 100,
                height: 100,
                colorDark : "{{PRIMARY_COLOR}}",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
        }
        document.getElementById('export-btn').addEventListener('click', async () => {
            const element = document.getElementById('certificado-template');
            const button = document.getElementById('export-btn');
            button.innerHTML = 'Generando PDF...';
            button.disabled = true;
            try {
                const canvas = await html2canvas(element, { scale: 4, useCORS: true, logging: false, scrollY: -window.scrollY, scrollX: -window.scrollX });
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('l', 'mm', 'letter');
                const pdfWidth = 279.4;
                const pdfHeight = 215.9;
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(\`Certificado_Participacion_\${ID_VERIFICACION}.pdf\`);
            } catch (error) {
                console.error("Error al generar el PDF:", error);
                alert("Ocurrió un error crítico al generar el PDF. Revisa la consola para más detalles.");
            } finally {
                button.innerHTML = ' Exportar Certificado a PDF';
                button.disabled = false;
            }
        });
        window.onload = function() {
            document.getElementById("verification-id").innerText = ID_VERIFICACION;
            generarQR();
        }
    </script>
</body>
</html>`,
          signature_name: 'Dra. Mónica Beltrán',
          signature_title: 'Directora General de MOOC UDES',
          qr_base_url: 'https://udesvirtual.com/verificar-certificado',
          verification_url: 'https://mooc.udes.edu.co/verificar-certificado',
          logo_url: 'https://udes.edu.co/images/logo/logo-con-acreditada-color.png',
          primary_color: '#052c4e',
          secondary_color: '#2c3e50'
        };

        const { data: newData, error: insertError } = await supabase
          .from("certificate_settings")
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newData);
      }
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones de certificados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    // Validation
    const errors: string[] = [];
    if (!settings.signature_name || settings.signature_name.trim() === '') errors.push('El nombre de la firma es obligatorio.');
    if (!settings.signature_title || settings.signature_title.trim() === '') errors.push('El título/cargo de la firma es obligatorio.');
    if (!settings.verification_url || settings.verification_url.trim() === '') errors.push('La URL de verificación es obligatoria.');
    if (errors.length > 0) {
      toast({ title: 'Errores de validación', description: errors.join(' '), variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("certificate_settings")
        .update({
          template_html: settings.template_html,
          signature_name: settings.signature_name,
          signature_title: settings.signature_title,
          qr_base_url: settings.qr_base_url,
          verification_url: settings.verification_url,
          logo_url: settings.logo_url,
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          updated_at: new Date().toISOString()
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast({ title: "Éxito", description: "Configuración de certificados guardada correctamente" });
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({ title: "Error", description: "No se pudo guardar la configuración", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!settings) return;

    // Create a preview window with sample data
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) return;

    const sampleData = {
      STUDENT_NAME: 'Juan Pérez',
      COURSE_TITLE: 'Desarrollo Web Avanzado',
      HOURS: '40',
      ISSUED_DATE: new Date().toLocaleDateString('es-ES'),
      CITY_TEXT: ' en Bogotá',
      SIGNATURE_NAME: settings.signature_name,
      SIGNATURE_TITLE: settings.signature_title,
      VERIFICATION_CODE: 'CERT-2025-ABC123',
      MD5_HASH: 'ABC123DEF456',
      LOGO_URL: settings.logo_url,
      QR_BASE_URL: settings.qr_base_url,
      VERIFICATION_URL: settings.verification_url,
      PRIMARY_COLOR: settings.primary_color,
      SECONDARY_COLOR: settings.secondary_color
    };

    let html = settings.template_html;
    Object.entries(sampleData).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    previewWindow.document.write(html);
    previewWindow.document.close();
  };

  // Helper: insert variable token at cursor position in template textarea
  const insertVariable = (variable: string) => {
    if (!settings) return;
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = settings.template_html.slice(0, start);
    const after = settings.template_html.slice(end);
    const token = `{{${variable}}}`;
    const newHtml = before + token + after;
    setSettings({ ...settings, template_html: newHtml });
    // restore focus and move cursor after inserted token
    setTimeout(() => {
      textarea.focus();
      const pos = start + token.length;
      textarea.setSelectionRange(pos, pos);
    }, 0);
  };

  const AVAILABLE_VARIABLES = [
    'STUDENT_NAME', 'COURSE_TITLE', 'HOURS', 'ISSUED_DATE', 'CITY_TEXT',
    'SIGNATURE_NAME', 'SIGNATURE_TITLE', 'VERIFICATION_CODE', 'MD5_HASH',
    'LOGO_URL', 'QR_BASE_URL', 'VERIFICATION_URL', 'PRIMARY_COLOR', 'SECONDARY_COLOR'
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p>No se pudieron cargar las configuraciones</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Configuración de Certificados</h1>
            <p className="text-sm text-muted-foreground">
              Personaliza la plantilla HTML, firma y códigos QR de los certificados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración General */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Información de firma y enlaces</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature_name">Nombre de la Firma</Label>
                <Input
                  id="signature_name"
                  value={settings.signature_name}
                  onChange={(e) => setSettings({ ...settings, signature_name: e.target.value })}
                  placeholder="Ej: Dra. Mónica Beltrán"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signature_title">Título/Cargo</Label>
                <Input
                  id="signature_title"
                  value={settings.signature_title}
                  onChange={(e) => setSettings({ ...settings, signature_title: e.target.value })}
                  placeholder="Ej: Directora General de MOOC UDES"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">URL del Logo</Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification_url">URL de Verificación</Label>
                <Input
                  id="verification_url"
                  type="url"
                  value={settings.verification_url}
                  onChange={(e) => setSettings({ ...settings, verification_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr_base_url">URL Base para QR</Label>
                <Input
                  id="qr_base_url"
                  type="url"
                  value={settings.qr_base_url}
                  onChange={(e) => setSettings({ ...settings, qr_base_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Colores */}
          <Card>
            <CardHeader>
              <CardTitle>Colores del Tema</CardTitle>
              <CardDescription>Colores primario y secundario</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Color Primario</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    placeholder="#052c4e"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_color">Color Secundario</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={settings.secondary_color}
                    onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                    placeholder="#2c3e50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plantilla HTML */}
        <Card>
          <CardHeader>
            <CardTitle>Plantilla HTML</CardTitle>
            <CardDescription>
              Plantilla HTML del certificado. Usa variables como {"{{STUDENT_NAME}}"}, {"{{COURSE_TITLE}}"}, etc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <div className="flex flex-wrap gap-2 mb-2">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="px-2 py-1 bg-gray-100 rounded border text-xs hover:bg-gray-200"
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground mb-2">Haz clic en una variable para insertarla en la plantilla en la posición actual del cursor.</div>
            </div>
            <Textarea
              value={settings.template_html}
              onChange={(e) => setSettings({ ...settings, template_html: e.target.value })}
              rows={20}
              className="font-mono text-sm"
              placeholder="HTML del certificado..."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};