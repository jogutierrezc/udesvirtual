import React, { useState } from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface AttendanceFormProps {
  email: string;
  userId?: string | null;
  onRegisterClick?: () => void;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({ email, userId, onRegisterClick }) => {
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    if (email.endsWith("@mail.udes.edu.co") && !userId) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [email, userId]);

  return (
    <>
      {/* ...form fields for attendance... */}
      {showModal && (
        <AlertDialog open={showModal} onOpenChange={setShowModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¡Regístrate para más beneficios!</AlertDialogTitle>
              <AlertDialogDescription>
                Tu correo es institucional UDES pero no tienes cuenta registrada.<br />
                Regístrate en la plataforma para recibir beneficios internacionales, seguimiento de puntos Pasaporte y más oportunidades.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={onRegisterClick}>
                Registrarme ahora
              </AlertDialogAction>
              <AlertDialogCancel onClick={() => setShowModal(false)}>
                Continuar sin registro
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
