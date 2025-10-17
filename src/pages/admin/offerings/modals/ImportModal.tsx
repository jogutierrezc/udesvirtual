import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdmin } from "@/contexts/AdminContext";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

type ImportType = "offerings" | "coil";

export const ImportModal = ({ open, onClose }: ImportModalProps) => {
  const [importType, setImportType] = useState<ImportType>("offerings");
  const [csvData, setCsvData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { loadData } = useAdmin();

  const offeringsTemplate = `title,offering_type,campus,capacity,hours,profession,knowledge_area,udes_professor_name,udes_professor_program,udes_professor_email,description
Curso de Ejemplo,programada,Bucaramanga,30,40,Ingeniería,Tecnología,Juan Pérez,Ingeniería de Sistemas,juan@udes.edu.co,Descripción del curso`;

  const coilTemplate = `course_name,full_name,email,academic_program,academic_semester,external_capacity,languages,sustainable_development_goals,project_topics
Curso COIL Ejemplo,María García,maria@udes.edu.co,Ingeniería de Sistemas,5,25,"Inglés;Español","Educación de calidad;Industria innovación e infraestructura","Tecnología;Innovación"`;

  const getTemplate = () => {
    return importType === "offerings" ? offeringsTemplate : coilTemplate;
  };

  const downloadTemplate = () => {
    const template = getTemplate();
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `plantilla_${importType}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Plantilla descargada",
      description: `La plantilla de ${importType === "offerings" ? "Ofertas" : "COIL"} se ha descargado correctamente.`,
    });
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const parseCSV = (csv: string): any[] => {
    const lines = csv.trim().split("\n").filter(line => line.trim() !== "");
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.trim());
    const records: any[] = [];

    // Campos numéricos obligatorios para course_offerings (no pueden ser null)
    const requiredNumericFieldsOfferings = ["capacity", "hours"];
    // Campos numéricos opcionales
    const optionalNumericFields = ["academic_semester", "external_capacity"];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const record: any = {};
      
      headers.forEach((header, index) => {
        let value = values[index] || "";
        // Eliminar comillas si están al inicio y al final
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        // Procesar arrays separados por punto y coma
        if (header === "knowledge_area" || header === "languages" || 
            header === "sustainable_development_goals" || header === "project_topics") {
          record[header] = value ? value.split(";").map(v => v.trim()) : [];
        } 
        // Procesar campos numéricos obligatorios (para course_offerings)
        else if (requiredNumericFieldsOfferings.includes(header)) {
          if (!value || value === "") {
            record[header] = 0; // Valor por defecto para campos obligatorios
          } else {
            const numValue = parseInt(value, 10);
            record[header] = isNaN(numValue) ? 0 : numValue;
          }
        }
        // Procesar campos numéricos opcionales
        else if (optionalNumericFields.includes(header)) {
          if (!value || value === "") {
            record[header] = null;
          } else {
            const numValue = parseInt(value, 10);
            record[header] = isNaN(numValue) ? null : numValue;
          }
        } 
        // Campos de texto normales
        else {
          record[header] = value || null;
        }
      });

      // Agregar solo el status, created_at y created_by se agregarán después con el userId
      record.status = "approved";

      records.push(record);
    }

    return records;
  };

  const applyDefaultValues = (record: any, type: ImportType): any => {
    if (type === "offerings") {
      // Limpiar offering_type de espacios y normalizar
      let offeringType = record.offering_type ? record.offering_type.toString().trim().toLowerCase() : "";
      
      // Mapear variaciones comunes al valor correcto
      if (offeringType === "intercambio" || offeringType === "exchange") {
        offeringType = "exchange";
      } else if (offeringType === "programada" || offeringType === "scheduled") {
        offeringType = "programada";
      } else if (!offeringType) {
        offeringType = "programada"; // Valor por defecto
      }
      
      // Valores por defecto para campos obligatorios de course_offerings
      return {
        ...record,
        title: (record.title || "Sin título").toString().trim(),
        offering_type: offeringType, // Ya normalizado y limpio
        campus: (record.campus || "Bucaramanga").toString().trim(),
        capacity: record.capacity ?? 0,
        hours: record.hours ?? 0,
        profession: (record.profession || "General").toString().trim(),
        description: (record.description || "Sin descripción").toString().trim(),
        knowledge_area: record.knowledge_area || [],
      };
    }
    return record; // Para COIL, mantener como está
  };

  const validateOfferingRecord = (record: any): boolean => {
    // No hay campos obligatorios para ofertas de cursos
    return true;
  };

  const validateCoilRecord = (record: any): boolean => {
    const required = ["course_name", "full_name", "email", "academic_program"];
    return required.every(field => record[field] && record[field].trim() !== "");
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa datos para importar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "No se pudo obtener la información del usuario.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const records = parseCSV(csvData);
      
      console.log("📊 Registros parseados:", records);
      console.log("📝 Total de registros:", records.length);
      
      if (records.length === 0) {
        toast({
          title: "Error de formato",
          description: "No se encontraron registros válidos. Verifica que el CSV tenga al menos 2 líneas (encabezados + datos) y esté separado por comas.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Aplicar valores por defecto y agregar created_by y created_at a cada registro
      const recordsWithUser = records.map(record => {
        const recordWithDefaults = applyDefaultValues(record, importType);
        return {
          ...recordWithDefaults,
          created_by: user.id,
          created_at: new Date().toISOString(),
        };
      });

      console.log("✅ Registros con valores por defecto:", recordsWithUser);

      // Validar offering_type específicamente para ofertas
      if (importType === "offerings") {
        const invalidOfferings: number[] = [];
        recordsWithUser.forEach((record, index) => {
          if (record.offering_type !== "exchange" && record.offering_type !== "programada") {
            invalidOfferings.push(index + 2);
            console.warn(`⚠️ Registro ${index + 2}: offering_type inválido "${record.offering_type}"`);
          }
        });
        
        if (invalidOfferings.length > 0) {
          toast({
            title: "Error de validación",
            description: `Los registros en las líneas ${invalidOfferings.join(", ")} tienen un offering_type inválido. Solo se permiten: "exchange" o "programada"`,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      // Validar registros
      const invalidRecords: number[] = [];
      recordsWithUser.forEach((record, index) => {
        const isValid = importType === "offerings" 
          ? validateOfferingRecord(record)
          : validateCoilRecord(record);
        
        if (!isValid) {
          invalidRecords.push(index + 2); // +2 porque empezamos en línea 1 y header es línea 1
        }
      });

      if (invalidRecords.length > 0) {
        toast({
          title: "Error de validación",
          description: `Registros inválidos en las líneas: ${invalidRecords.join(", ")}. Verifica los campos obligatorios.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Insertar en Supabase
      const table = importType === "offerings" ? "course_offerings" : "coil_proposals";
      
      console.log("🚀 Intentando insertar en tabla:", table);
      console.log("📦 Datos a insertar:", JSON.stringify(recordsWithUser, null, 2));
      
      const { data, error } = await supabase
        .from(table)
        .insert(recordsWithUser)
        .select();

      if (error) {
        console.error("❌ Error de Supabase:", error);
        throw error;
      }

      console.log("✅ Datos insertados exitosamente:", data);

      toast({
        title: "Importación exitosa",
        description: `Se importaron ${data.length} registro(s) correctamente.`,
      });

      await loadData();
      setCsvData("");
      onClose();
    } catch (error: any) {
      console.error("❌ Error al importar:", error);
      
      let errorMessage = "Ocurrió un error durante la importación.";
      
      // Mensajes de error más específicos
      if (error.code === '23514') {
        errorMessage = `Error de validación: Verifica que "offering_type" sea "programada" o "exchange".`;
      } else if (error.code === '23502') {
        errorMessage = `Campo obligatorio vacío: ${error.message}`;
      } else if (error.code === '22P02') {
        errorMessage = `Formato de dato incorrecto: ${error.message}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error al importar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvData(text);
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Datos</DialogTitle>
          <DialogDescription>
            Importa múltiples registros desde un archivo CSV o texto separado por comas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tipo de importación */}
          <div className="space-y-3">
            <Label>Tipo de Importación</Label>
            <RadioGroup
              value={importType}
              onValueChange={(value) => {
                setImportType(value as ImportType);
                setCsvData("");
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="offerings" id="offerings" />
                <Label htmlFor="offerings" className="cursor-pointer">
                  Ofertas de Cursos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="coil" id="coil" />
                <Label htmlFor="coil" className="cursor-pointer">
                  Propuestas COIL
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Botones de plantilla */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla
            </Button>
            <div className="flex-1">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 border rounded-md px-4 py-2 hover:bg-accent transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Cargar Archivo CSV</span>
                </div>
              </Label>
              <input
                id="file-upload"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Información de campos */}
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <h4 className="font-semibold">
              Campos para {importType === "offerings" ? "Ofertas" : "COIL"}:
            </h4>
            {importType === "offerings" ? (
              <ul className="space-y-1 text-muted-foreground">
                <li><strong>Todos los campos son opcionales</strong> (se asignan valores por defecto si están vacíos):</li>
                <li className="ml-4 text-xs">
                  • <strong>title</strong>: "Sin título"<br/>
                  • <strong>offering_type</strong>: "programada" (valores permitidos: "programada" o "exchange")<br/>
                  • <strong>campus</strong>: "Bucaramanga"<br/>
                  • <strong>capacity</strong>: 0<br/>
                  • <strong>hours</strong>: 0<br/>
                  • <strong>profession</strong>: "General"<br/>
                  • <strong>description</strong>: "Sin descripción"<br/>
                  • <strong>knowledge_area</strong>: [] (array vacío)
                </li>
                <li><strong>Campos opcionales sin valor por defecto:</strong> udes_professor_name, udes_professor_program, udes_professor_email</li>
                <li><strong>Arrays (separar con ';'):</strong> knowledge_area</li>
              </ul>
            ) : (
              <ul className="space-y-1 text-muted-foreground">
                <li><strong>Obligatorios:</strong> course_name, full_name, email, academic_program</li>
                <li><strong>Opcionales:</strong> academic_semester, external_capacity</li>
                <li><strong>Arrays (separar con ';'):</strong> languages, sustainable_development_goals, project_topics</li>
              </ul>
            )}
          </div>

          {/* Área de texto para CSV */}
          <div className="space-y-2">
            <Label htmlFor="csv-data">Datos CSV (separados por comas)</Label>
            <Textarea
              id="csv-data"
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder={`Pega aquí tus datos CSV o carga un archivo arriba...\n\nEjemplo:\n${getTemplate()}`}
              className="min-h-[200px] font-mono text-xs"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={isLoading || !csvData.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
