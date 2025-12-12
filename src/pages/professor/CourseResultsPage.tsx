import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Download, Search, FileText, Users, Trophy } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { StudentAttemptsDialog } from "./components/StudentAttemptsDialog";
import { Ban, MoreHorizontal, CheckCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Student {
    id: string;
    full_name: string | null;
    email: string | null;
    enrollment_status?: string; // active, retired, blocked
    enrollment_id?: string;
}

interface Exam {
    id: string;
    title: string;
    max_score: number;
    passing_score: number;
}

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

interface CourseData {
    id: string;
    title: string;
}

export default function CourseResultsPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState<CourseData | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog state
    const [attemptsDialogOpen, setAttemptsDialogOpen] = useState(false);
    const [selectedStudentForAttempts, setSelectedStudentForAttempts] = useState<{ name: string, id: string } | null>(null);
    const [selectedExamForAttempts, setSelectedExamForAttempts] = useState<{ title: string, id: string } | null>(null);

    useEffect(() => {
        if (courseId) {
            loadData();
        }
    }, [courseId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Load Course Info
            const { data: courseData, error: courseError } = await supabase
                .from("mooc_courses")
                .select("id, title")
                .eq("id", courseId)
                .single();

            if (courseError) throw courseError;
            setCourse(courseData);

            // 2. Load Enrolled Students with status
            const { data: enrollments, error: enrollError } = await supabase
                .from("mooc_enrollments")
                .select("id, user_id, status")
                .eq("course_id", courseId);

            if (enrollError) throw enrollError;

            const studentIds = enrollments.map(e => e.user_id);
            const enrollmentMap = new Map(enrollments.map(e => [e.user_id, e]));

            if (studentIds.length > 0) {
                const { data: studentsData, error: studentsError } = await supabase
                    .from("profiles")
                    .select("id, full_name, email")
                    .in("id", studentIds);

                if (studentsError) throw studentsError;

                // Merge profile with enrollment status
                const mergedStudents = (studentsData || []).map(s => ({
                    ...s,
                    enrollment_status: enrollmentMap.get(s.id)?.status || 'active',
                    enrollment_id: enrollmentMap.get(s.id)?.id
                }));

                setStudents(mergedStudents);
            }

            // 3. Load Exams
            const { data: examsData, error: examsError } = await supabase
                .from("mooc_exams")
                .select("id, title, max_score, passing_score")
                .eq("course_id", courseId)
                .order("order_index", { ascending: true });

            if (examsError) throw examsError;
            setExams(examsData || []);

            // 4. Load Attempts for these exams
            if (examsData && examsData.length > 0) {
                const examIds = examsData.map(e => e.id);
                const { data: attemptsData, error: attemptsError } = await supabase
                    .from("mooc_exam_attempts")
                    .select("id, exam_id, user_id, score_numeric, score_percent, passed, submitted_at, attempt_number")
                    .in("exam_id", examIds)
                    .not("submitted_at", "is", null); // Only completed attempts

                if (attemptsError) throw attemptsError;
                setAttempts(attemptsData || []);
            }

        } catch (error: any) {
            console.error("Error loading results:", error);
            toast({
                title: "Error",
                description: "No se pudieron cargar los resultados",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getBestAttempt = (studentId: string, examId: string) => {
        const studentAttempts = attempts.filter(
            a => a.user_id === studentId && a.exam_id === examId
        );

        if (studentAttempts.length === 0) return null;

        // Return attempt with highest score
        return studentAttempts.reduce((prev, current) =>
            (prev.score_numeric > current.score_numeric) ? prev : current
        );
    };

    const handleViewAttempts = (student: Student, exam: Exam) => {
        setSelectedStudentForAttempts({ name: student.full_name || "Estudiante", id: student.id });
        setSelectedExamForAttempts({ title: exam.title, id: exam.id });
        setAttemptsDialogOpen(true);
    };

    const handleToggleStudentStatus = async (student: Student, newStatus: string) => {
        try {
            if (!student.enrollment_id) return;

            const { error } = await supabase
                .from("mooc_enrollments")
                .update({ status: newStatus } as any) // Cast to any to avoid TS error if types are not generated
                .eq("id", student.enrollment_id);

            if (error) {
                if (error.code === '42703') { // Undefined column
                    toast({
                        title: "Actualización requerida",
                        description: "La base de datos necesita una actualización para soportar esta función. Por favor contacta al administrador.",
                        variant: "destructive",
                    });
                    return;
                }
                throw error;
            }

            toast({
                title: "Estado actualizado",
                description: `El estudiante ha sido ${newStatus === 'retired' ? 'retirado' : 'activado'}.`,
            });

            // Update local state
            setStudents(prev => prev.map(s =>
                s.id === student.id ? { ...s, enrollment_status: newStatus } : s
            ));

        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el estado del estudiante",
                variant: "destructive",
            });
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student =>
            (student.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (student.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const exportToExcel = () => {
        if (!course) return;

        const data = filteredStudents.map(student => {
            // Calculate average for export
            let totalScore = 0;
            exams.forEach(exam => {
                const attempt = getBestAttempt(student.id, exam.id);
                if (attempt) {
                    totalScore += (attempt.score_percent || 0);
                }
            });
            const avgPercent = exams.length > 0 ? totalScore / exams.length : 0;
            const avgScale5 = (avgPercent / 100) * 5;

            const row: any = {
                "Estudiante": student.full_name || "Sin nombre",
                "Email": student.email || "",
                "Promedio": avgScale5.toFixed(1),
            };

            exams.forEach(exam => {
                const attempt = getBestAttempt(student.id, exam.id);
                row[exam.title] = attempt ? `${attempt.score_numeric} (${attempt.passed ? 'Aprobado' : 'Reprobado'})` : "0 (Sin intento)";
            });

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Resultados");
        XLSX.writeFile(wb, `Resultados_${course.title.replace(/\s+/g, '_')}.xlsx`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold">Curso no encontrado</h2>
                <Button onClick={() => navigate("/professor")} className="mt-4">
                    Volver
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate("/professor")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Resultados: {course.title}</h1>
                        <p className="text-muted-foreground">
                            {students.length} estudiantes inscritos • {exams.length} exámenes
                        </p>
                    </div>
                </div>
                <Button onClick={exportToExcel} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Excel
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Calificaciones por Estudiante</CardTitle>
                        <div className="w-72">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar estudiante..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Estudiante</TableHead>
                                    <TableHead className="text-center">Promedio</TableHead>
                                    {exams.map(exam => (
                                        <TableHead key={exam.id} className="text-center">
                                            {exam.title}
                                            <div className="text-xs font-normal text-muted-foreground">
                                                Max: {exam.max_score}
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={exams.length + 1} className="text-center py-8 text-muted-foreground">
                                            No se encontraron estudiantes
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredStudents.map(student => {
                                        // Calculate average
                                        let totalScore = 0;
                                        exams.forEach(exam => {
                                            const attempt = getBestAttempt(student.id, exam.id);
                                            if (attempt) {
                                                totalScore += (attempt.score_percent || 0);
                                            }
                                        });
                                        // Divide by total exams count (unattempted = 0)
                                        const avgPercent = exams.length > 0 ? totalScore / exams.length : 0;
                                        const avgScale5 = (avgPercent / 100) * 5;
                                        const isRetired = student.enrollment_status === 'retired' || student.enrollment_status === 'blocked';

                                        return (
                                            <TableRow key={student.id} className={isRetired ? "opacity-50 bg-muted/50" : ""}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {student.full_name || "Sin nombre"}
                                                        {isRetired && <Badge variant="destructive" className="ml-2 text-[10px] h-5">Retirado</Badge>}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{student.email}</div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="font-bold text-lg">{avgScale5.toFixed(1)}</div>
                                                </TableCell>
                                                {exams.map(exam => {
                                                    const attempt = getBestAttempt(student.id, exam.id);
                                                    return (
                                                        <TableCell key={exam.id} className="text-center">
                                                            {attempt ? (
                                                                <div
                                                                    className="flex flex-col items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                                                                    onClick={() => handleViewAttempts(student, exam)}
                                                                    title="Ver historial de intentos"
                                                                >
                                                                    <Badge variant={attempt.passed ? "default" : "destructive"} className={attempt.passed ? "bg-green-600" : ""}>
                                                                        {attempt.score_numeric}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {attempt.score_percent}%
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">-</span>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menú</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => navigate(`/professor/student/${courseId}/${student.id}`)}>
                                                                Ver detalle completo
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {isRetired ? (
                                                                <DropdownMenuItem onClick={() => handleToggleStudentStatus(student, 'active')}>
                                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                                    Reactivar estudiante
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => handleToggleStudentStatus(student, 'retired')} className="text-destructive">
                                                                    <Ban className="mr-2 h-4 w-4" />
                                                                    Retirar del curso
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Mejores Estudiantes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredStudents
                                .map(student => {
                                    let totalScore = 0;
                                    let examsTaken = 0;
                                    exams.forEach(exam => {
                                        const attempt = getBestAttempt(student.id, exam.id);
                                        if (attempt) {
                                            totalScore += (attempt.score_percent || 0);
                                            examsTaken++;
                                        }
                                    });
                                    // Calculate average based on total exams (unattempted = 0)
                                    const avgPercent = exams.length > 0 ? totalScore / exams.length : 0;
                                    const avgScale5 = (avgPercent / 100) * 5;
                                    return { ...student, avg: avgScale5, examsTaken };
                                })
                                .filter(s => s.avg > 0) // Show students with some score
                                .sort((a, b) => b.avg - a.avg)
                                .slice(0, 5)
                                .map((student, index) => (
                                    <div key={student.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium">{student.full_name}</div>
                                                <div className="text-xs text-muted-foreground">{student.examsTaken} exámenes presentados</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">{student.avg.toFixed(1)}</div>
                                            <div className="text-xs text-muted-foreground">Promedio</div>
                                        </div>
                                    </div>
                                ))}
                            {filteredStudents.length === 0 && (
                                <div className="text-center text-muted-foreground py-4">No hay datos suficientes</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-500" />
                            Estadísticas por Examen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {exams.map(exam => {
                                const examAttempts = attempts.filter(a => a.exam_id === exam.id);
                                const passedCount = examAttempts.filter(a => a.passed).length;
                                const totalAttempts = examAttempts.length;
                                const passRate = totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0;

                                return (
                                    <div key={exam.id} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{exam.title}</span>
                                            <span className="text-muted-foreground">{passedCount}/{totalAttempts} aprobados</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-secondary">
                                            <div
                                                className="h-full rounded-full bg-green-500 transition-all"
                                                style={{ width: `${passRate}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {selectedStudentForAttempts && selectedExamForAttempts && (
                <StudentAttemptsDialog
                    open={attemptsDialogOpen}
                    onOpenChange={setAttemptsDialogOpen}
                    studentName={selectedStudentForAttempts.name}
                    examTitle={selectedExamForAttempts.title}
                    attempts={attempts.filter(
                        a => a.user_id === selectedStudentForAttempts.id && a.exam_id === selectedExamForAttempts.id
                    )}
                />
            )}
        </div>
    );
}
