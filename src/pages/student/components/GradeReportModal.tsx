import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";
import * as XLSX from 'xlsx';

interface GradeReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseId: string;
    userId: string;
}

type ExamGrade = {
    id: string;
    title: string;
    passed: boolean;
    score: number | null;
    attempts: number;
    status: 'passed' | 'failed' | 'pending';
};

export function GradeReportModal({ isOpen, onClose, courseId, userId }: GradeReportModalProps) {
    const [loading, setLoading] = useState(false);
    const [grades, setGrades] = useState<ExamGrade[]>([]);
    const [averageScore, setAverageScore] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && courseId && userId) {
            fetchGrades();
        }
    }, [isOpen, courseId, userId]);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            // Fetch all exams for the course
            const { data: exams, error: examsError } = await supabase
                .from('mooc_exams')
                .select('id, title, passing_score')
                .eq('course_id', courseId)
                .eq('status', 'published')
                .order('order_index', { ascending: true });

            if (examsError) throw examsError;

            if (!exams || exams.length === 0) {
                setGrades([]);
                setAverageScore(null);
                return;
            }

            // Fetch attempts for these exams
            const examIds = exams.map(e => e.id);
            const { data: attempts, error: attemptsError } = await supabase
                .from('mooc_exam_attempts')
                .select('exam_id, score_numeric, passed, created_at')
                .eq('user_id', userId)
                .in('exam_id', examIds)
                .order('created_at', { ascending: false });

            if (attemptsError) throw attemptsError;

            // Process grades
            const processedGrades: ExamGrade[] = exams.map(exam => {
                const examAttempts = attempts?.filter(a => a.exam_id === exam.id) || [];

                // Logic to determine the "best" score. 
                // Usually highest score is preferred for the student record.
                const bestAttempt = examAttempts.reduce((prev, current) => {
                    return (prev.score_numeric || 0) > (current.score_numeric || 0) ? prev : current;
                }, examAttempts[0]);

                const score = bestAttempt?.score_numeric ?? null;
                const passed = examAttempts.some(a => a.passed);
                const attemptsCount = examAttempts.length;

                let status: 'passed' | 'failed' | 'pending' = 'pending';
                if (attemptsCount > 0) {
                    status = passed ? 'passed' : 'failed';
                }

                return {
                    id: exam.id,
                    title: exam.title,
                    passed,
                    score,
                    attempts: attemptsCount,
                    status
                };
            });

            setGrades(processedGrades);

            // Calculate Average
            // Only include exams that have a score (i.e., have been taken)
            const takenExams = processedGrades.filter(g => g.score !== null);
            if (takenExams.length > 0) {
                const totalScore = takenExams.reduce((sum, g) => sum + (g.score || 0), 0);
                const avg = totalScore / takenExams.length;
                setAverageScore(avg);
            } else {
                setAverageScore(null);
            }

        } catch (error) {
            console.error("Error fetching grades:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        // Prepare data for export
        const exportData = grades.map(g => ({
            'Examen': g.title,
            'Intentos': g.attempts,
            'Nota': g.score !== null ? g.score.toFixed(1) : 'N/A',
            'Estado': g.status === 'passed' ? 'Aprobado' : g.status === 'failed' ? 'Reprobado' : 'No iniciado'
        }));

        // Add Average Row if applicable
        if (averageScore !== null) {
            exportData.push({
                'Examen': 'PROMEDIO GENERAL',
                'Intentos': 0, // Placeholder
                'Nota': averageScore.toFixed(1),
                'Estado': '-'
            });
        }

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Notas");
        XLSX.writeFile(wb, "Reporte_Notas.xlsx");
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>Reporte de Notas</DialogTitle>
                    {grades.length > 0 && (
                        <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2">
                            <Download className="h-4 w-4" />
                            Exportar Excel
                        </Button>
                    )}
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : grades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No hay exámenes registrados en este curso.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Examen</TableHead>
                                    <TableHead className="text-center">Intentos</TableHead>
                                    <TableHead className="text-center">Nota (Máx)</TableHead>
                                    <TableHead className="text-center">Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {grades.map((grade) => (
                                    <TableRow key={grade.id}>
                                        <TableCell className="font-medium">{grade.title}</TableCell>
                                        <TableCell className="text-center">{grade.attempts}</TableCell>
                                        <TableCell className="text-center">
                                            {grade.score !== null ? grade.score.toFixed(1) : '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {grade.status === 'passed' && (
                                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                                                    Aprobado
                                                </Badge>
                                            )}
                                            {grade.status === 'failed' && (
                                                <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">
                                                    Reprobado
                                                </Badge>
                                            )}
                                            {grade.status === 'pending' && (
                                                <Badge variant="outline" className="text-slate-500">
                                                    No iniciado
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                            <TableFooter>
                                <TableRow className="bg-slate-50 font-bold">
                                    <TableCell colSpan={2} className="text-right">Promedio General:</TableCell>
                                    <TableCell className="text-center text-lg">
                                        {averageScore !== null ? averageScore.toFixed(1) : '-'}
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
