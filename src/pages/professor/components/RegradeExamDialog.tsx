import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface RegradeExamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    exam: {
        id: string;
        title: string;
    } | null;
    onRegradeComplete: () => void;
}

interface RegradeResult {
    attempt_id: string;
    student_id: string;
    old_score: string | number;
    new_score: string | number;
    old_passed: string | boolean;
    new_passed: string | boolean;
}

export function RegradeExamDialog({
    open,
    onOpenChange,
    exam,
    onRegradeComplete,
}: RegradeExamDialogProps) {
    const { toast } = useToast();
    const [regrading, setRegrading] = useState(false);
    const [results, setResults] = useState<RegradeResult[]>([]);
    const [studentNames, setStudentNames] = useState<Record<string, string>>({});

    const handleRegrade = async () => {
        if (!exam) return;

        setRegrading(true);
        setResults([]);

        try {
            // Call the regrade function
            const { data, error } = await supabase.rpc("regrade_exam", {
                p_exam_id: parseInt(exam.id),
            });

            if (error) {
                console.error("RPC Error:", error);
                throw error;
            }

            // data is an array of results
            if (data && Array.isArray(data) && data.length > 0) {
                // Convert string values to proper types
                const processedData = data.map((r: any) => ({
                    attempt_id: r.attempt_id,
                    student_id: r.student_id,
                    old_score: parseFloat(r.old_score),
                    new_score: parseFloat(r.new_score),
                    old_passed: r.old_passed === 'true' || r.old_passed === true,
                    new_passed: r.new_passed === 'true' || r.new_passed === true,
                }));

                setResults(processedData);

                // Fetch student names for better display
                const userIds = [...new Set(processedData.map((r: RegradeResult) => r.student_id))];
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, full_name")
                    .in("id", userIds);

                if (profiles) {
                    const nameMap: Record<string, string> = {};
                    profiles.forEach(p => {
                        nameMap[p.id] = p.full_name || "Sin nombre";
                    });
                    setStudentNames(nameMap);
                }

                toast({
                    title: "Recalificación completada",
                    description: `Se recalificaron ${processedData.length} intentos de examen.`,
                });

                onRegradeComplete();
            } else {
                toast({
                    title: "Sin cambios",
                    description: "No hay intentos de examen para recalificar.",
                });
            }
        } catch (error: any) {
            console.error("Error regrading exam:", error);
            toast({
                title: "Error",
                description: error.message || "No se pudo recalificar el examen",
                variant: "destructive",
            });
        } finally {
            setRegrading(false);
        }
    };

    const hasChanges = results.some(
        r => r.old_score !== r.new_score || r.old_passed !== r.new_passed
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-blue-600" />
                        Recalificar Examen
                    </DialogTitle>
                    <DialogDescription>
                        {exam && !results.length && (
                            <span>
                                Esta acción recalculará las notas de todos los estudiantes que completaron
                                <strong> {exam.title}</strong> basándose en las respuestas correctas actuales.
                            </span>
                        )}
                        {results.length > 0 && (
                            <span>Resultados de la recalificación para <strong>{exam?.title}</strong></span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {!results.length && (
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Importante:</strong> Esta acción es útil si actualizaste las respuestas correctas
                            después de que los estudiantes ya tomaron el examen. Las nuevas notas se calcularán
                            automáticamente basándose en las opciones marcadas como correctas actualmente.
                        </AlertDescription>
                    </Alert>
                )}

                {results.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-green-50">
                                    {results.filter(r => r.new_score > r.old_score).length}
                                </Badge>
                                <span className="text-muted-foreground">Mejoraron</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-red-50">
                                    {results.filter(r => r.new_score < r.old_score).length}
                                </Badge>
                                <span className="text-muted-foreground">Empeoraron</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                    {results.filter(r => r.new_score === r.old_score).length}
                                </Badge>
                                <span className="text-muted-foreground">Sin cambios</span>
                            </div>
                        </div>

                        {hasChanges && (
                            <div className="rounded-md border max-h-96 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Estudiante</TableHead>
                                            <TableHead className="text-center">Nota Anterior</TableHead>
                                            <TableHead className="text-center">Nueva Nota</TableHead>
                                            <TableHead className="text-center">Estado</TableHead>
                                            <TableHead className="text-center">Cambio</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {results
                                            .filter(r => r.old_score !== r.new_score || r.old_passed !== r.new_passed)
                                            .map((result) => {
                                                const oldScore = Number(result.old_score);
                                                const newScore = Number(result.new_score);
                                                const oldPassed = result.old_passed === true || result.old_passed === 'true';
                                                const newPassed = result.new_passed === true || result.new_passed === 'true';
                                                const improved = newScore > oldScore;
                                                const worsened = newScore < oldScore;

                                                return (
                                                    <TableRow key={result.attempt_id}>
                                                        <TableCell className="font-medium">
                                                            {studentNames[result.student_id] || "Cargando..."}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant={oldPassed ? "default" : "destructive"}>
                                                                {oldScore}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge 
                                                                variant={newPassed ? "default" : "destructive"}
                                                                className={newPassed ? "bg-green-600" : ""}
                                                            >
                                                                {newScore}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {oldPassed !== newPassed && (
                                                                <Badge variant={newPassed ? "default" : "outline"}>
                                                                    {newPassed ? "Ahora Aprobado ✓" : "Ahora Reprobado"}
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            {improved && (
                                                                <span className="text-green-600 font-semibold">
                                                                    +{(newScore - oldScore).toFixed(2)}
                                                                </span>
                                                            )}
                                                            {worsened && (
                                                                <span className="text-red-600 font-semibold">
                                                                    {(newScore - oldScore).toFixed(2)}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {!hasChanges && (
                            <Alert>
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertDescription>
                                    Se procesaron {results.length} intentos pero las notas no cambiaron.
                                    Esto significa que las respuestas correctas actuales coinciden con las
                                    que estaban configuradas cuando los estudiantes tomaron el examen.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={regrading}>
                        {results.length > 0 ? "Cerrar" : "Cancelar"}
                    </Button>
                    {!results.length && (
                        <Button
                            onClick={handleRegrade}
                            disabled={regrading || !exam}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {regrading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Recalificando...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Recalificar Ahora
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
