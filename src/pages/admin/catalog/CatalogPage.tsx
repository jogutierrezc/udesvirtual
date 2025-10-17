import { useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit2, Trash2, EyeOff, Loader2, GraduationCap } from "lucide-react";
import { ClassFormModal } from "./modals/ClassFormModal";
import { TeacherFormModal } from "./modals/TeacherFormModal";
import { Tables } from "@/integrations/supabase/types";

type Class = Tables<"classes">;
type Teacher = Tables<"teachers">;

export const CatalogPage = () => {
  const { catalogClasses, catalogTeachers, deleteClass, deleteTeacher, updateClass, loading } = useAdmin();
  
  const [showClassModal, setShowClassModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setShowClassModal(true);
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("¿Eliminar esta clase? Esta acción es irreversible.")) return;
    await deleteClass(id);
  };

  const handleDisableClass = async (id: string) => {
    if (!confirm("¿Deshabilitar esta clase?")) return;
    await updateClass(id, { status: "rejected" });
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setShowTeacherModal(true);
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("¿Eliminar este profesor? Esta acción es irreversible.")) return;
    await deleteTeacher(id);
  };

  const handleCloseClassModal = () => {
    setShowClassModal(false);
    setEditingClass(null);
  };

  const handleCloseTeacherModal = () => {
    setShowTeacherModal(false);
    setEditingTeacher(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 md:py-8">
      <div className="space-y-4 md:space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => setShowClassModal(true)} className="w-full sm:w-auto">
            <PlusCircle className="h-4 w-4 mr-2" /> Crear Clase
          </Button>
          <Button onClick={() => setShowTeacherModal(true)} variant="secondary" className="w-full sm:w-auto">
            <GraduationCap className="h-4 w-4 mr-2" /> Crear Profesor
          </Button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Classes List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Clases (Catálogo)</CardTitle>
              <CardDescription className="text-xs md:text-sm">Clases espejo y masterclass aprobadas</CardDescription>
            </CardHeader>
            <CardContent>
              {catalogClasses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No hay clases en el catálogo</p>
              ) : (
                <div className="space-y-2">
                  {catalogClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded p-3 hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm md:text-base">{classItem.title}</div>
                        <div className="text-xs md:text-sm text-muted-foreground truncate">
                          {classItem.campus} • {classItem.profession}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-4">
                        <Button variant="ghost" size="sm" onClick={() => handleEditClass(classItem)} className="h-8 w-8 p-0">
                          <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClass(classItem.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisableClass(classItem.id)}
                          className="h-8 w-8 p-0"
                        >
                          <EyeOff className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teachers List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Docentes (Catálogo)</CardTitle>
              <CardDescription className="text-xs md:text-sm">Docentes investigadores aprobados</CardDescription>
            </CardHeader>
            <CardContent>
              {catalogTeachers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No hay docentes en el catálogo
                </p>
              ) : (
                <div className="space-y-2">
                  {catalogTeachers.map((teacher) => (
                    <div
                      key={teacher.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between border rounded p-3 hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm md:text-base">{teacher.teacher_name}</div>
                        <div className="text-xs md:text-sm text-muted-foreground truncate">
                          {teacher.campus} • {teacher.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-4">
                        <Button variant="ghost" size="sm" onClick={() => handleEditTeacher(teacher)} className="h-8 w-8 p-0">
                          <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ClassFormModal
        open={showClassModal}
        onOpenChange={handleCloseClassModal}
        editingClass={editingClass}
      />
      <TeacherFormModal
        open={showTeacherModal}
        onOpenChange={handleCloseTeacherModal}
        editingTeacher={editingTeacher}
      />
    </div>
  );
};
