import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCodeLib from 'qrcode';
import { Loader2 } from 'lucide-react';

interface CertData { id: string; course_id: string; hours: number; verification_code: string; issued_at: string; md5_hash?: string | null; course?: { title: string }; user?: { full_name: string; city?: string | null }; signature_code?: string | null; signature_filename?: string | null }
interface CertificateSettings { signature_name?: string; signature_title?: string; qr_base_url?: string; verification_url?: string; logo_url?: string; primary_color?: string; secondary_color?: string; default_signature_profile_id?: string | null }
const DEFAULT_SETTINGS: CertificateSettings = { signature_name: 'Dra. Mónica Beltrán', signature_title: 'Directora General de MOOC UDES', qr_base_url: 'https://udesvirtual.com/verificar-certificado', verification_url: 'https://mooc.udes.edu.co/verificar-certificado', logo_url: 'https://udes.edu.co/images/logo/logo-con-acreditada-color.png', primary_color: '#052c4e', secondary_color: '#2c3e50' };

export function CertificateModal({ certificateId, onClose }: { certificateId: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertData | null>(null);
  const [settings, setSettings] = useState<CertificateSettings>(DEFAULT_SETTINGS);
  const [signaturePublicUrl, setSignaturePublicUrl] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const certificateRef = useRef<HTMLDivElement | null>(null);

  const fetchData = useCallback(async () => {
    if (!certificateId) return;
    setLoading(true);
    try {
      const { data: certData, error: certError } = await supabase.from('mooc_certificates').select('id, course_id, hours, verification_code, issued_at, md5_hash, signature_code, signature_filename, course:mooc_courses(title), user_id').eq('id', certificateId).single();
      if (certError) throw certError;

      let profile: any = null;
      if ((certData as any)?.user_id) {
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('full_name, city').eq('id', (certData as any).user_id).single();
        if (!profileError) profile = profileData;
      }
      setCert({ ...(certData as any), user: profile } as CertData);

      const { data: settingsData } = await supabase.from('certificate_settings').select('signature_name, signature_title, qr_base_url, verification_url, logo_url, primary_color, secondary_color, default_signature_profile_id').maybeSingle();
      if (settingsData) setSettings({ ...DEFAULT_SETTINGS, ...(settingsData as any) });
      else setSettings(DEFAULT_SETTINGS);

      // Determine signature image: use certificate-specific filename first, otherwise use default profile from settings
      let sigFilename = (certData as any).signature_filename || null;
      if (!sigFilename && settingsData?.default_signature_profile_id) {
        try {
          const { data: profileData, error: profileErr } = await supabase.from('signature_profiles').select('id, name, filename').eq('id', settingsData.default_signature_profile_id).maybeSingle();
          if (!profileErr && profileData && profileData.filename) {
            sigFilename = profileData.filename;
            if (!settingsData.signature_name) setSettings(s => ({ ...s, signature_name: profileData.name } as any));
          }
        } catch (e) { console.error('Error loading default signature profile', e); }
      }

      if (sigFilename) {
        const publicUrl = supabase.storage.from('certificate-signatures').getPublicUrl(sigFilename).data.publicUrl;
        setSignaturePublicUrl(publicUrl || '');
      }
    } catch (e) {
      console.error('Error loading certificate data', e);
    } finally { setLoading(false); }
  }, [certificateId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const qrUrl = `${settings.qr_base_url || DEFAULT_SETTINGS.qr_base_url}?code=${encodeURIComponent(cert?.verification_code || '')}`;

  useEffect(() => {
    let mounted = true;
    if (!qrUrl) { setQrDataUrl(''); return; }
    (async () => {
      try {
        const dataUrl = await QRCodeLib.toDataURL(qrUrl, { margin: 1, width: 200, color: { dark: settings.primary_color || DEFAULT_SETTINGS.primary_color, light: '#FFFFFF' } });
        if (mounted) setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Error generating QR', err);
        if (mounted) setQrDataUrl('');
      }
    })();
    return () => { mounted = false; };
  }, [qrUrl, settings.primary_color]);

  const exportToPDF = async () => {
    if (!certificateRef.current) return;
    const btn = document.getElementById('export-btn');
    if (btn) { btn.innerHTML = 'Generando PDF...'; btn.setAttribute('disabled', 'true'); }
    try {
      // Convert any canvases inside the certificate to images so html2canvas captures them reliably (e.g., QR libs)
      const canvases = Array.from(certificateRef.current.querySelectorAll('canvas')) as HTMLCanvasElement[];
      const replacedImgs: HTMLImageElement[] = [];
      canvases.forEach((c) => {
        try {
          const dataUrl = c.toDataURL();
          const img = document.createElement('img');
          img.src = dataUrl;
          img.width = c.width;
          img.height = c.height;
          img.style.maxWidth = c.style.maxWidth || '100%';
          img.style.display = c.style.display || 'block';
          c.replaceWith(img);
          replacedImgs.push(img);
        } catch (e) {
          console.warn('Could not convert canvas to image for export', e);
        }
      });

      // Wait for all images inside the certificate to finish loading
      const imgs = Array.from(certificateRef.current.querySelectorAll('img')) as HTMLImageElement[];
      await Promise.all(imgs.map((img) => new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth !== 0) return resolve();
        img.onload = () => resolve();
        img.onerror = () => resolve();
      })));

      // small delay to ensure DOM stabilizes
      await new Promise((r) => setTimeout(r, 50));

      const canvas = await html2canvas(certificateRef.current as HTMLElement, { scale: 4, useCORS: true, logging: false, scrollY: -window.scrollY, scrollX: -window.scrollX });
      const pdf = new jsPDF('l', 'mm', 'letter');
      const pdfWidth = 279.4; const pdfHeight = 215.9;
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Certificado_Participacion_${cert?.verification_code || 'cert'}.pdf`);
    } catch (e) { console.error('Error al generar el PDF:', e); alert('Ocurrió un error al generar el PDF. Revisa la consola.'); }
    finally { if (btn) { btn.innerHTML = ' Exportar Certificado a PDF'; btn.removeAttribute('disabled'); } }
  };

  if (loading) return (<div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  if (!cert) return (<div className="p-8">No se encontró el certificado.</div>);

  const issuedDate = new Date(cert.issued_at).toLocaleDateString('es-ES');
  const name = cert.user?.full_name || 'Estudiante';
  const city = cert.user?.city || '';
  const cityText = city ? ` en ${city}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-white p-4 rounded shadow-lg max-w-full overflow-auto">
        <button className="absolute -top-6 -right-6 bg-white rounded-full p-2 shadow" onClick={onClose} aria-label="Cerrar">✕</button>
        <div className="flex flex-col items-center p-4">
          <button id="export-btn" onClick={exportToPDF} className="bg-blue-800 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-full shadow-xl transition duration-300 transform hover:scale-105 mb-4 text-lg">Exportar Certificado a PDF</button>

          <div ref={certificateRef} id="certificado-template" className="certificado-container" style={{ width: '27.94cm', height: '21.59cm' }}>
            <div className="accent-line" />
            <div className="p-10 flex flex-col justify-between h-full relative z-10">
              <header className="mb-10 w-full flex flex-col items-center text-center">
                <div className="mb-2">
                  <img src={settings.logo_url || DEFAULT_SETTINGS.logo_url} alt="Logo de la Institución" className="h-16 w-auto mx-auto" onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = 'https://placehold.co/150x60/f0f0f0/333?text=Logo+Placeholder'; }} />
                </div>
                <div className="mt-1"><h1 className="title-display text-3xl leading-none tracking-wider uppercase">Certificado de Curso Mooc</h1></div>
              </header>

              <main className="flex-grow flex flex-col justify-center items-center py-4">
                <p className="text-xl text-gray-600 mb-6 font-light uppercase">Se otorga este reconocimiento a:</p>
                <p className="recipient-name text-5xl pb-3 mb-8 px-12">{name}</p>
                <div className="max-w-4xl text-center">
                  <p className="text-2xl text-gray-700 leading-normal">Por completar con éxito el programa especializado de: <span className="font-bold italic" style={{ color: 'var(--color-primary)' }}>&quot;{cert.course?.title || 'Curso MOOC'}&quot;</span>, equivalente a <span className="font-bold">{cert.hours} horas</span> de contenido curricular.</p>
                  <p className="text-lg mt-6 text-gray-500">Finalizado el <span className="font-bold">{issuedDate}</span>{cityText}.</p>
                </div>
              </main>

              <footer className="flex justify-between items-end mt-8">
                <div className="flex-grow flex justify-center items-end">
                  <div className="text-center w-auto">
                    {signaturePublicUrl && (
                      <div className="mb-2">
                        <img src={signaturePublicUrl} alt="Firma" className="h-16 object-contain mx-auto" />
                      </div>
                    )}
                    <div className="h-0.5 w-64 mb-2 mx-auto" style={{ backgroundColor: 'var(--color-primary)' }} />
                    <p className="text-lg font-semibold text-gray-800">{settings.signature_name || DEFAULT_SETTINGS.signature_name}</p>
                    <p className="text-sm text-gray-500 font-light">{settings.signature_title || DEFAULT_SETTINGS.signature_title}</p>
                    <p className="text-xs mt-3 text-gray-600 font-medium">Firma electrónica certificada mediante criptografía</p>
                    <p className="text-xs font-mono text-gray-500 mt-1">MD5: <span id="md5-code">{(cert.md5_hash || '').toUpperCase()}</span></p>
                    <p className="text-[10px] text-gray-500 mt-2 leading-tight max-w-xs mx-auto">Para verificar la autenticidad de este código debe ingresar a {settings.verification_url || DEFAULT_SETTINGS.verification_url} e ingresar el código del certificado para convalidar el mismo.</p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Verificación Digital:</p>
                  <div id="qrcodeContainer" className="p-1 border border-gray-300 shadow-sm inline-block bg-white">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR" width={100} height={100} />
                    ) : (
                      <div className="w-[100px] h-[100px] flex items-center justify-center text-xs text-gray-400">QR</div>
                    )}
                  </div>
                  <p className="text-xs font-mono text-gray-500 mt-1">ID: <span>{cert.verification_code}</span></p>
                </div>
              </footer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
