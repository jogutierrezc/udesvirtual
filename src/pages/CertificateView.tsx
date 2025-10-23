import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
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

export default function CertificateView() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertData | null>(null);

  useEffect(() => {
    loadCert();
  }, [id]);


  const loadCert = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;
      const { data, error } = await supabase
        .from("mooc_certificates" as any)
        .select("id, course_id, hours, verification_code, issued_at, md5_hash, course:mooc_courses(title), user:profiles(full_name, city)")
        .eq("id", id)
        .single();
      if (error) throw error;
      setCert(data as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !cert) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const issuedDate = new Date(cert.issued_at).toLocaleDateString();
  const name = cert.user?.full_name || "Estudiante";
  const city = cert.user?.city || "";
  const title = cert.course?.title || "Curso MOOC";

  return (
    <div className="flex flex-col items-center p-6 print:p-0 bg-gray-200 min-h-screen">
      <div className="mb-4 no-print">
        <Button onClick={handlePrint}>Imprimir / Guardar como PDF</Button>
      </div>

      <div className="certificado-container bg-white relative overflow-hidden shadow-xl border border-gray-200" style={{ width: "27.94cm", height: "21.59cm" }}>
        <div className="accent-line absolute top-0 left-0 w-full" style={{ height: "5px", backgroundColor: "#052c4e", zIndex: 2 }} />

        <div className="p-10 flex flex-col justify-between h-full relative z-10">
          <header className="mb-10 w-full flex flex-col items-center text-center">
            <div className="mb-2">
              <img
                src="https://udes.edu.co/images/logo/logo-con-acreditada-color.png"
                alt="Logo de la Institución"
                className="h-16 w-auto mx-auto"
                onError={(e: any) => (e.currentTarget.src = "https://placehold.co/150x60/f0f0f0/333?text=UDES")}
              />
            </div>
            <div className="mt-1">
              <h1 className="text-3xl leading-none tracking-wider uppercase" style={{ color: "#2c3e50", fontWeight: 500 }}>Certificado de Curso Mooc</h1>
            </div>
          </header>

          <main className="flex-grow flex flex-col justify-center items-center py-4">
            <p className="text-xl text-gray-600 mb-6 font-light uppercase">Se otorga este reconocimiento a:</p>
            <p className="text-5xl pb-3 mb-8 px-12" style={{ color: "#052c4e", fontWeight: 800 }}>{name}</p>
            <div className="max-w-4xl text-center">
              <p className="text-2xl text-gray-700 leading-normal">
                Por completar con éxito el programa especializado de:
                <span className="font-bold italic" style={{ color: "#052c4e" }}> "{title}"</span>,
                equivalente a <span className="font-bold">{cert.hours} horas</span> de contenido curricular.
              </p>
              <p className="text-lg mt-6 text-gray-500">
                Finalizado el <span className="font-bold">{issuedDate}</span>{city ? ` en ${city}` : ""}.
              </p>
            </div>
          </main>

          <footer className="flex justify-between items-end mt-8">
            <div className="flex-grow flex justify-center items-end">
              <div className="text-center w-auto">
                <div className="h-0.5 w-64 mb-2 mx-auto" style={{ backgroundColor: "#052c4e" }} />
                <p className="text-lg font-semibold text-gray-800">Dra. Mónica Beltrán</p>
                <p className="text-sm text-gray-500 font-light">Directora General de MOOC UDES</p>
                <p className="text-xs mt-3 text-gray-600 font-medium">Firma electrónica certificada mediante criptografía</p>
                <p className="text-xs font-mono text-gray-500 mt-1">MD5: <span>{(cert.md5_hash || '').toUpperCase()}</span></p>
                <p className="text-[10px] text-gray-500 mt-2 leading-tight max-w-xs mx-auto">
                  Para verificar la autenticidad de este código visite mooc.udes.edu.co/verificar-certificado
                  e ingrese el código del certificado para convalidar el mismo.
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm text-gray-600 mb-2 font-semibold">Verificación Digital:</p>
              <div className="p-1 border border-gray-300 shadow-sm inline-block bg-white">
                <QRCodeSVG value={`${window.location.origin}/verificar-certificado?code=${encodeURIComponent(cert.verification_code)}`} width={120} height={120} fgColor="#052c4e" bgColor="#ffffff"/>
              </div>
              <p className="text-xs font-mono text-gray-500 mt-1">ID: <span>{cert.verification_code}</span></p>
            </div>
          </footer>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>
    </div>
  );
}
