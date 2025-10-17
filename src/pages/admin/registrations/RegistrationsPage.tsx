import { useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const RegistrationsPage = () => {
  const { registrations, loading } = useAdmin();
  const [selectedClassId, setSelectedClassId] = useState<string>("");

  const filteredRegistrations = selectedClassId
    ? registrations.filter((reg: any) => String(reg.class_id) === selectedClassId)
    : registrations;

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
            {/* Class Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Label htmlFor="classFilter" className="text-sm">Filtrar por clase:</Label>
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
