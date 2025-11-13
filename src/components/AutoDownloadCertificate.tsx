import { useEffect, useRef } from "react";
import { CertificateModal } from "@/components/CertificateModal";

export function AutoDownloadCertificate({ certificateId, onFinish }: { certificateId: string, onFinish?: () => void }) {
  const shown = useRef(false);
  useEffect(() => {
    if (!shown.current && certificateId) {
      shown.current = true;
    }
  }, [certificateId]);

  // Renderiza el modal oculto, la descarga es automática por el efecto en CertificateModal
  return certificateId ? (
    <div style={{ display: 'none' }}>
      <CertificateModal certificateId={certificateId} onClose={onFinish || (() => {})} />
    </div>
  ) : null;
}
