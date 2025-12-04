import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ExamAttempt {
    id: string;
    exam_id: string;
    user_id: string;
    score_numeric: number;
    score_percent: number;
    passed: boolean;
    submitted_at: string;
    attempt_number: number;
}

interface StudentAttemptsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    studentName: string;
    examTitle: string;
    attempts: ExamAttempt[];
}

export function StudentAttemptsDialog({
    open,
    onOpenChange,
    studentName,
    examTitle,
    attempts,
}: StudentAttemptsDialogProps) {
    // Sort attempts by date descending
    const sortedAttempts = [...attempts].sort(
        (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Historial de Intentos</DialogTitle>
                    <DialogDescription>
                        Estudiante: <span className="font-medium text-foreground">{studentName}</span>
                        <br />
                        Examen: <span className="font-medium text-foreground">{examTitle}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="rounded-md border mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">Intento</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="text-center">Puntaje</TableHead>
                                <TableHead className="text-center">Porcentaje</TableHead>
                                <TableHead className="text-center">Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAttempts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                        No hay intentos registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedAttempts.map((attempt) => (
                                    <TableRow key={attempt.id}>
                                        <TableCell className="text-center font-medium">
                                            #{attempt.attempt_number}
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(attempt.submitted_at), "PPP p", { locale: es })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-bold">{attempt.score_numeric}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {attempt.score_percent}%
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={attempt.passed ? "default" : "destructive"}
                                                className={attempt.passed ? "bg-green-600 hover:bg-green-700" : ""}
                                            >
                                                {attempt.passed ? "Aprobado" : "Reprobado"}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
