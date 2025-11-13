import { useEffect, useRef } from "react";
import { CertificateModal } from "@/components/CertificateModal";

export function AutoDownloadCertificate({ certificateId, onFinish }: { certificateId: string, onFinish?: () => void }) {
  const shown = useRef(false);
  useEffect(() => {
    if (!shown.current && certificateId) {
      shown.current = true;
    }
  }, [certificateId]);

  // Renderiza el modal fuera de la vista (no usar display:none porque html2canvas necesita el DOM)
  return certificateId ? (
    <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', visibility: 'hidden' }}>
      <CertificateModal certificateId={certificateId} onClose={onFinish || (() => {})} />
    </div>
  ) : null;
}
