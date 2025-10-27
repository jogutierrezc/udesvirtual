import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CertData {
  id: string;
  course_id: string;
  hours: number;
  verification_code: string;
  issued_at: string;
  md5_hash?: string | null;
  course?: { title: string };
  user?: { full_name: string; city?: string | null };
}

interface CertificateSettings {
  template_html: string;
  signature_name: string;
  signature_title: string;
  qr_base_url: string;
  verification_url: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
}

export default function CertificateView() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertData | null>(null);
  const [settings, setSettings] = useState<CertificateSettings | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load certificate data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;

      const { data: certData, error: certError } = await supabase
        .from("mooc_certificates" as any)
        .select("id, course_id, hours, verification_code, issued_at, md5_hash, course:mooc_courses(title), user:profiles(full_name, city)")
        .eq("id", id)
        .single();

      if (certError) throw certError;
      setCert(certData as any);

      // Load certificate settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("certificate_settings")
        .select("template_html, signature_name, signature_title, qr_base_url, verification_url, logo_url, primary_color, secondary_color")
        .single();

      if (settingsError) throw settingsError;
      setSettings(settingsData);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const generateCertificateHTML = () => {
    if (!cert || !settings) return '';

    const issuedDate = new Date(cert.issued_at).toLocaleDateString('es-ES');
    const name = cert.user?.full_name || "Estudiante";
    const city = cert.user?.city || "";
    const cityText = city ? ` en ${city}` : "";
    const title = cert.course?.title || "Curso MOOC";

    const variables = {
      STUDENT_NAME: name,
      COURSE_TITLE: title,
      HOURS: cert.hours.toString(),
      ISSUED_DATE: issuedDate,
      CITY_TEXT: cityText,
      SIGNATURE_NAME: settings.signature_name,
      SIGNATURE_TITLE: settings.signature_title,
      VERIFICATION_CODE: cert.verification_code,
      MD5_HASH: (cert.md5_hash || '').toUpperCase(),
      LOGO_URL: settings.logo_url,
      QR_BASE_URL: settings.qr_base_url,
      VERIFICATION_URL: settings.verification_url,
      PRIMARY_COLOR: settings.primary_color,
      SECONDARY_COLOR: settings.secondary_color
    };

    let html = settings.template_html;
    Object.entries(variables).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return html;
  };

  if (loading || !cert || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const certificateHTML = generateCertificateHTML();

  return (
    <div className="flex flex-col items-center p-6 bg-gray-200 min-h-screen">
      <div className="mb-4 no-print">
        <Button onClick={handlePrint}>Imprimir / Guardar como PDF</Button>
      </div>

      <iframe
        ref={iframeRef}
        srcDoc={certificateHTML}
        className="border border-gray-300 shadow-xl"
        style={{ width: "27.94cm", height: "21.59cm" }}
        title="Certificado"
      />
    </div>
  );
}
