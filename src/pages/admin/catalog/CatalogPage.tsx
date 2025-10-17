import { useState, useMemo } from "react";
import { useAdmin } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit2, Trash2, EyeOff, Loader2, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { ClassFormModal } from "./modals/ClassFormModal";
import { TeacherFormModal } from "./modals/TeacherFormModal";
import { ImportTeachersDialog } from "@/components/ImportTeachersDialog";
import { Tables } from "@/integrations/supabase/types";

type Class = Tables<"classes">;
type Teacher = Tables<"teachers">;

export const CatalogPage = () => {
  const { catalogClasses, catalogTeachers, deleteClass, deleteTeacher, updateClass, loading, loadData } = useAdmin();
  
  const [showClassModal, setShowClassModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Estados para filtros y paginación de Clases
  const [classSearchTerm, setClassSearchTerm] = useState("");
  const [classCampusFilter, setClassCampusFilter] = useState<string>("all");
  const [classProfessionFilter, setClassProfessionFilter] = useState<string>("all");
  const [classPage, setClassPage] = useState(1);
  const classesPerPage = 10;

  // Estados para filtros y paginación de Profesores
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [teacherCampusFilter, setTeacherCampusFilter] = useState<string>("all");
  const [teacherPage, setTeacherPage] = useState(1);
  const teachersPerPage = 10;

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

  // Obtener listas únicas de campus y profesiones para clases
  const classCampusList = useMemo(() => {
    const uniqueCampus = new Set(catalogClasses.map(c => c.campus));
    return Array.from(uniqueCampus).sort();
  }, [catalogClasses]);

  const classProfessionsList = useMemo(() => {
    const uniqueProfessions = new Set(catalogClasses.map(c => c.profession));
    return Array.from(uniqueProfessions).sort();
  }, [catalogClasses]);

  // Obtener lista única de campus para profesores
  const teacherCampusList = useMemo(() => {
    const uniqueCampus = new Set(catalogTeachers.map(t => t.campus));
    return Array.from(uniqueCampus).sort();
  }, [catalogTeachers]);

  // Filtrar clases
  const filteredClasses = useMemo(() => {
    return catalogClasses.filter(classItem => {
      const matchesSearch = classItem.title.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
                          classItem.profession.toLowerCase().includes(classSearchTerm.toLowerCase());
      const matchesCampus = classCampusFilter === "all" || classItem.campus === classCampusFilter;
      const matchesProfession = classProfessionFilter === "all" || classItem.profession === classProfessionFilter;
      
      return matchesSearch && matchesCampus && matchesProfession;
    });
  }, [catalogClasses, classSearchTerm, classCampusFilter, classProfessionFilter]);

  // Paginar clases
  const paginatedClasses = useMemo(() => {
    const startIndex = (classPage - 1) * classesPerPage;
    const endIndex = startIndex + classesPerPage;
    return filteredClasses.slice(startIndex, endIndex);
  }, [filteredClasses, classPage]);

  const totalClassPages = Math.ceil(filteredClasses.length / classesPerPage);

  // Filtrar profesores
  const filteredTeachers = useMemo(() => {
    return catalogTeachers.filter(teacher => {
      const matchesSearch = teacher.teacher_name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                          teacher.email.toLowerCase().includes(teacherSearchTerm.toLowerCase());
      const matchesCampus = teacherCampusFilter === "all" || teacher.campus === teacherCampusFilter;
      
      return matchesSearch && matchesCampus;
    });
  }, [catalogTeachers, teacherSearchTerm, teacherCampusFilter]);

  // Paginar profesores
  const paginatedTeachers = useMemo(() => {
    const startIndex = (teacherPage - 1) * teachersPerPage;
    const endIndex = startIndex + teachersPerPage;
    return filteredTeachers.slice(startIndex, endIndex);
  }, [filteredTeachers, teacherPage]);

  const totalTeacherPages = Math.ceil(filteredTeachers.length / teachersPerPage);

  // Reset página al cambiar filtros
  const handleClassFilterChange = () => {
    setClassPage(1);
  };

  const handleTeacherFilterChange = () => {
    setTeacherPage(1);
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
          <ImportTeachersDialog onImportComplete={loadData} />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Classes List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Clases (Catálogo)</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Clases espejo y masterclass aprobadas ({filteredClasses.length})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros para Clases */}
              <div className="space-y-3">
                <Input
                  placeholder="Buscar por título o programa..."
                  value={classSearchTerm}
                  onChange={(e) => {
                    setClassSearchTerm(e.target.value);
                    handleClassFilterChange();
                  }}
                  className="text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Campus</Label>
                    <Select
                      value={classCampusFilter}
                      onValueChange={(value) => {
                        setClassCampusFilter(value);
                        handleClassFilterChange();
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los campus</SelectItem>
                        {classCampusList.map(campus => (
                          <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Programa</Label>
                    <Select
                      value={classProfessionFilter}
                      onValueChange={(value) => {
                        setClassProfessionFilter(value);
                        handleClassFilterChange();
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los programas</SelectItem>
                        {classProfessionsList.map(profession => (
                          <SelectItem key={profession} value={profession}>{profession}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {catalogClasses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No hay clases en el catálogo</p>
              ) : filteredClasses.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No se encontraron resultados</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedClasses.map((classItem) => (
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

                {/* Paginación para Clases */}
                {totalClassPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Página {classPage} de {totalClassPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClassPage(p => Math.max(1, p - 1))}
                        disabled={classPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClassPage(p => Math.min(totalClassPages, p + 1))}
                        disabled={classPage === totalClassPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
              )}
            </CardContent>
          </Card>

          {/* Teachers List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg md:text-xl">Docentes (Catálogo)</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Docentes investigadores aprobados ({filteredTeachers.length})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros para Profesores */}
              <div className="space-y-3">
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={teacherSearchTerm}
                  onChange={(e) => {
                    setTeacherSearchTerm(e.target.value);
                    handleTeacherFilterChange();
                  }}
                  className="text-sm"
                />
                <div className="space-y-1">
                  <Label className="text-xs">Campus</Label>
                  <Select
                    value={teacherCampusFilter}
                    onValueChange={(value) => {
                      setTeacherCampusFilter(value);
                      handleTeacherFilterChange();
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los campus</SelectItem>
                      {teacherCampusList.map(campus => (
                        <SelectItem key={campus} value={campus}>{campus}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {catalogTeachers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No hay docentes en el catálogo
                </p>
              ) : filteredTeachers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No se encontraron resultados</p>
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedTeachers.map((teacher) => (
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

                {/* Paginación para Profesores */}
                {totalTeacherPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Página {teacherPage} de {totalTeacherPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTeacherPage(p => Math.max(1, p - 1))}
                        disabled={teacherPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTeacherPage(p => Math.min(totalTeacherPages, p + 1))}
                        disabled={teacherPage === totalTeacherPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
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
