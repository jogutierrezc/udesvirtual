import { useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

export const RegistrationsPage = () => {
  const { registrations, loading } = useAdmin();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const { toast } = useToast();

  const filteredRegistrations = selectedClassId
    ? registrations.filter((reg: any) => String(reg.class_id) === selectedClassId)
    : registrations;

  const exportToExcel = () => {
    if (filteredRegistrations.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay registros para exportar",
        variant: "destructive",
      });
      return;
    }

    // Preparar los datos para Excel
    const excelData = filteredRegistrations.map((reg: any) => ({
      "Nombre Completo": reg.full_name || "",
      "Email": reg.email || "",
      "Universidad de Origen": reg.institution || "",
      "País": reg.country || "",
      "Curso Seleccionado": reg.classes?.title || reg.class_id || "",
      "Tipo de Clase": reg.classes?.class_type === "mirror" ? "Clase Espejo" : "MasterClass",
      "Campus": reg.classes?.campus || "",
      "Fecha de Registro": reg.created_at ? new Date(reg.created_at).toLocaleDateString("es-ES") : "",
    }));

    // Crear el libro de trabajo
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registros");

    // Ajustar el ancho de las columnas
    const maxWidth = 50;
    const colWidths = Object.keys(excelData[0] || {}).map((key) => ({
      wch: Math.min(
        Math.max(
          key.length,
          ...excelData.map((row: any) => String(row[key] || "").length)
        ),
        maxWidth
      ),
    }));
    worksheet["!cols"] = colWidths;

    // Nombre del archivo
    const fileName = selectedClassId
      ? `registros_${filteredRegistrations[0]?.classes?.title || "clase"}_${new Date().toLocaleDateString("es-ES").replace(/\//g, "-")}.xlsx`
      : `registros_completos_${new Date().toLocaleDateString("es-ES").replace(/\//g, "-")}.xlsx`;

    // Descargar el archivo
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "✅ Exportación exitosa",
      description: `Se descargaron ${filteredRegistrations.length} registro(s) a Excel`,
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="space-y-4 md:space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Registros de Estudiantes</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            {filteredRegistrations.length} registro(s) encontrado(s)
          </p>
        </div>

        {registrations.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm md:text-base">No hay registros</p>
        ) : (
          <div className="space-y-4">
            {/* Class Filter and Export Button */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                <Label htmlFor="classFilter" className="text-sm whitespace-nowrap">Filtrar por clase:</Label>
                <Select
                  value={selectedClassId || "all"}
                  onValueChange={(value) => setSelectedClassId(value === "all" ? "" : value)}
                >
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Todas las clases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las clases</SelectItem>
                    {Array.from(
                      new Set(
                        registrations
                          .map((r: any) =>
                            r.class_id !== undefined && r.class_id !== null
                              ? String(r.class_id).trim()
                              : ""
                          )
                          .filter((classId) => classId !== "")
                      )
                    ).map((classId) => {
                      const regClass = registrations.find(
                        (r: any) => String(r.class_id).trim() === classId
                      );
                      const courseName = (regClass as any)?.classes?.title || classId;
                      return (
                        <SelectItem key={classId} value={classId}>
                          {courseName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              <Button
                onClick={exportToExcel}
                disabled={filteredRegistrations.length === 0}
                className="w-full sm:w-auto gap-2"
                variant="default"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar a Excel
              </Button>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-3">
              {filteredRegistrations.map((reg: any) => (
                <Card key={reg.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{reg.full_name}</p>
                        <p className="text-xs text-muted-foreground">{reg.institution}</p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {reg.country}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Curso seleccionado:</p>
                      <p className="text-sm font-medium">{reg.classes?.title || reg.class_id}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-border bg-background">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Universidad de Origen
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">País</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Curso Seleccionado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRegistrations.map((reg: any) => (
                    <tr key={reg.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 text-sm">{reg.full_name}</td>
                      <td className="px-4 py-3 text-sm">{reg.institution}</td>
                      <td className="px-4 py-3 text-sm">{reg.country}</td>
                      <td className="px-4 py-3 text-sm">{reg.classes?.title || reg.class_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
