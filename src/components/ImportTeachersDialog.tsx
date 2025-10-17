import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUp, Download, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportTeachersDialogProps {
  onImportComplete: () => void;
}

export const ImportTeachersDialog = ({ onImportComplete }: ImportTeachersDialogProps) => {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Generar plantilla de Excel
  const downloadTemplate = () => {
    const templateData = [
      {
        "Nombre del Docente": "Ejemplo: Dr. Juan Pérez",
        "Descripción del Perfil": "Ejemplo: Doctor en Ciencias de la Computación con 10 años de experiencia en IA",
        "Link CvLAC": "Ejemplo: https://scienti.minciencias.gov.co/cvlac/...",
        "Link ORCID": "Ejemplo: https://orcid.org/0000-0000-0000-0000",
        "Campus": "Bucaramanga, Cúcuta o Valledupar",
        "Teléfono": "Ejemplo: +57 300 1234567",
        "Email": "Ejemplo: juan.perez@udes.edu.co",
        "Intereses (separados por coma)": "Ejemplo: Inteligencia Artificial, Machine Learning, Deep Learning",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla Docentes");

    // Ajustar anchos de columna
    worksheet["!cols"] = [
      { wch: 25 }, // Nombre
      { wch: 60 }, // Descripción
      { wch: 40 }, // CvLAC
      { wch: 40 }, // ORCID
      { wch: 15 }, // Campus
      { wch: 20 }, // Teléfono
      { wch: 30 }, // Email
      { wch: 50 }, // Intereses
    ];

    XLSX.writeFile(workbook, "plantilla_docentes_investigadores.xlsx");

    toast({
      title: "✅ Plantilla descargada",
      description: "Rellena la plantilla y súbela para importar docentes",
    });
  };

  // Validar datos del docente
  const validateTeacher = (teacher: any, rowIndex: number): string | null => {
    const requiredFields = [
      "Nombre del Docente",
      "Descripción del Perfil",
      "Campus",
      "Email",
    ];

    for (const field of requiredFields) {
      if (!teacher[field] || String(teacher[field]).trim() === "") {
        return `Fila ${rowIndex + 2}: Falta el campo "${field}"`;
      }
    }

    // Validar campus
    const validCampus = ["Bucaramanga", "Cúcuta", "Valledupar"];
    if (!validCampus.includes(teacher["Campus"])) {
      return `Fila ${rowIndex + 2}: Campus debe ser Bucaramanga, Cúcuta o Valledupar`;
    }

    // Validar email - acepta cualquier dominio válido con @
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const email = String(teacher["Email"]).trim();
    if (!emailRegex.test(email)) {
      return `Fila ${rowIndex + 2}: Email inválido. Debe tener formato correcto (ejemplo: usuario@dominio.com)`;
    }

    return null;
  };

  // Procesar archivo de Excel
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setErrors([]);

    try {
      // Leer archivo Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error("El archivo está vacío");
      }

      // Validar datos
      const validationErrors: string[] = [];
      const validTeachers: any[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const teacher = jsonData[i] as any;
        const error = validateTeacher(teacher, i);

        if (error) {
          validationErrors.push(error);
        } else {
          validTeachers.push(teacher);
        }
      }

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        toast({
          title: "❌ Errores de validación",
          description: `Se encontraron ${validationErrors.length} error(es). Revisa los detalles.`,
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      // Obtener usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Insertar docentes en la base de datos
      const teachersToInsert = validTeachers.map((teacher) => ({
        teacher_name: teacher["Nombre del Docente"],
        profile_description: teacher["Descripción del Perfil"],
        cvlac_link: teacher["Link CvLAC"] || null,
        orcid_link: teacher["Link ORCID"] || null,
        campus: teacher["Campus"],
        phone: teacher["Teléfono"] || "N/A", // Valor por defecto si no se proporciona
        email: teacher["Email"],
        interests: teacher["Intereses (separados por coma)"]
          ? teacher["Intereses (separados por coma)"]
              .split(",")
              .map((i: string) => i.trim())
          : [],
        user_id: user.id,
        status: "approved" as const, // Auto-aprobar cuando lo importa un admin
      }));

      const { error } = await supabase.from("teachers").insert(teachersToInsert);

      if (error) throw error;

      toast({
        title: "✅ Importación exitosa",
        description: `Se importaron ${validTeachers.length} docente(s) correctamente`,
      });

      setOpen(false);
      onImportComplete();
    } catch (error: any) {
      console.error("Error al importar:", error);
      toast({
        title: "❌ Error al importar",
        description: error.message || "No se pudo importar el archivo",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp className="h-4 w-4" />
          Importar Docentes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Importar Docentes Investigadores</DialogTitle>
          <DialogDescription>
            Descarga la plantilla, complétala con los datos y súbela para importar múltiples
            docentes a la vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Paso 1: Descargar plantilla */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Paso 1: Descargar Plantilla</h4>
            <Button onClick={downloadTemplate} variant="outline" className="w-full gap-2">
              <Download className="h-4 w-4" />
              Descargar Plantilla Excel
            </Button>
          </div>

          {/* Paso 2: Subir archivo */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Paso 2: Subir Archivo Completado</h4>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={importing}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>
            {importing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando docentes...
              </div>
            )}
          </div>

          {/* Errores de validación */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Se encontraron {errors.length} error(es):</p>
                  <ul className="list-disc list-inside text-sm space-y-1 max-h-40 overflow-y-auto">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Información */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Campos requeridos:</strong> Nombre, Descripción, Campus y Email.
              <br />
              <strong>Campos opcionales:</strong> Teléfono, Links CvLAC/ORCID, Intereses.
              <br />
              <strong>Campus válidos:</strong> Bucaramanga, Cúcuta, Valledupar.
              <br />
              <strong>Intereses:</strong> Separa múltiples intereses con comas.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
