import React, { useState } from "react";
import { AttendanceForm } from "@/components/AttendanceForm";

interface AttendancePageProps {
  userId?: string | null;
  email: string;
  classId: string;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ userId, email, classId }) => {
  // Simulate attendance registration logic
  const [attended, setAttended] = useState(false);

  const handleRegisterClick = () => {
    // Redirect to registration page or open registration modal
    window.location.href = "/register";
  };

  const handleAttendance = () => {
    // Here you would call your backend to register attendance
    setAttended(true);
    // Optionally, show a toast or confirmation
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Registro de Asistencia</h2>
      <AttendanceForm email={email} userId={userId} onRegisterClick={handleRegisterClick} />
      <button
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleAttendance}
        disabled={attended}
      >
        {attended ? "Asistencia registrada" : "Registrar asistencia"}
      </button>
    </div>
  );
};
