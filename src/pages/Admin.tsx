import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, LogOut, Users, BookOpen, GraduationCap, PlusCircle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Class = Tables<"classes">;
type Teacher = Tables<"teachers">;
type Registration = Tables<"class_registrations">;

const Admin = () => {
  // Estado para filtro de clase en registros
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingClasses, setPendingClasses] = useState<Class[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  // Class form state
  const [classForm, setClassForm] = useState({
    title: "",
    capacity: "",
    hours: "",
    allied_professor: "",
    description: "",
    virtual_room_required: false,
    virtual_room_link: "",
    campus: "",
    class_date: "",
    class_type: "mirror" as "mirror" | "masterclass",
    knowledge_area: "",
    profession: "",
  });

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (role?.role !== "admin") {
      navigate("/dashboard");
    }
  };

  const loadData = async () => {
    try {
      const [classesRes, teachersRes, regsRes] = await Promise.all([
        supabase.from("classes").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("teachers").select("*").eq("status", "pending").order("created_at", { ascending: false }),
  supabase.from("class_registrations").select("*, classes(*)").order("created_at", { ascending: false }),
      ]);

      setPendingClasses(classesRes.data || []);
      setPendingTeachers(teachersRes.data || []);
      setRegistrations(regsRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Error al cargar datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateClassStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("classes")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Clase ${status === "approved" ? "aprobada" : "rechazada"}`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTeacherStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("teachers")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Docente ${status === "approved" ? "aprobado" : "rechazado"}`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("classes").insert({
        ...classForm,
        capacity: parseInt(classForm.capacity),
        hours: parseInt(classForm.hours),
        created_by: userId,
        status: "approved", // Admin can approve directly
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Clase creada y aprobada automáticamente.",
      });

      setClassForm({
        title: "",
        capacity: "",
        hours: "",
        allied_professor: "",
        description: "",
        virtual_room_required: false,
        virtual_room_link: "",
        campus: "",
        class_date: "",
        class_type: "mirror",
        knowledge_area: "",
        profession: "",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-primary to-accent text-white py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-white/80">Gestión de Clases y Docentes</p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">
              <PlusCircle className="h-4 w-4 mr-2" />
              Crear Clase
            </TabsTrigger>
            <TabsTrigger value="classes">
              <BookOpen className="h-4 w-4 mr-2" />
              Pendientes ({pendingClasses.length})
            </TabsTrigger>
            <TabsTrigger value="teachers">
              <GraduationCap className="h-4 w-4 mr-2" />
              Docentes ({pendingTeachers.length})
            </TabsTrigger>
            <TabsTrigger value="registrations">
              <Users className="h-4 w-4 mr-2" />
              Registros ({registrations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Clase Espejo / MasterClass</CardTitle>
                <CardDescription>Las clases creadas por el administrador se aprueban automáticamente</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título de la Clase *</Label>
                      <Input
                        id="title"
                        value={classForm.title}
                        onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class_type">Tipo de Clase *</Label>
                      <Select
                        value={classForm.class_type}
                        onValueChange={(value: "mirror" | "masterclass") =>
                          setClassForm({ ...classForm, class_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mirror">Clase Espejo</SelectItem>
                          <SelectItem value="masterclass">MasterClass</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="allied_professor">Profesor Aliado *</Label>
                      <Input
                        id="allied_professor"
                        value={classForm.allied_professor}
                        onChange={(e) => setClassForm({ ...classForm, allied_professor: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacidad de Estudiantes *</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={classForm.capacity}
                        onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hours">Número de Horas *</Label>
                      <Input
                        id="hours"
                        type="number"
                        value={classForm.hours}
                        onChange={(e) => setClassForm({ ...classForm, hours: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campus">Campus *</Label>
                      <Input
                        id="campus"
                        value={classForm.campus}
                        onChange={(e) => setClassForm({ ...classForm, campus: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="class_date">Fecha y Hora *</Label>
                      <Input
                        id="class_date"
                        type="datetime-local"
                        value={classForm.class_date}
                        onChange={(e) => setClassForm({ ...classForm, class_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="knowledge_area">Área de Conocimiento *</Label>
                      <Input
                        id="knowledge_area"
                        value={classForm.knowledge_area}
                        onChange={(e) => setClassForm({ ...classForm, knowledge_area: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="profession">Profesión *</Label>
                      <Input
                        id="profession"
                        value={classForm.profession}
                        onChange={(e) => setClassForm({ ...classForm, profession: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción *</Label>
                    <Textarea
                      id="description"
                      value={classForm.description}
                      onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                      required
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="virtual_room"
                      checked={classForm.virtual_room_required}
                      onCheckedChange={(checked) =>
                        setClassForm({ ...classForm, virtual_room_required: checked })
                      }
                    />
                    <Label htmlFor="virtual_room">Requiere Sala Virtual</Label>
                  </div>

                  {classForm.virtual_room_required && (
                    <div className="space-y-2">
                      <Label htmlFor="virtual_room_link">Link de Sala Virtual (Teams, Meet, Zoom)</Label>
                      <Input
                        id="virtual_room_link"
                        type="url"
                        placeholder="https://..."
                        value={classForm.virtual_room_link}
                        onChange={(e) => setClassForm({ ...classForm, virtual_room_link: e.target.value })}
                      />
                    </div>
                  )}

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-2" />
                    )}
                    Crear y Publicar Clase
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            {pendingClasses.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay clases pendientes</p>
            ) : (
              pendingClasses.map((classItem) => (
                <Card key={classItem.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{classItem.title}</CardTitle>
                        <CardDescription>Por: {classItem.allied_professor}</CardDescription>
                      </div>
                      <Badge variant={classItem.class_type === "mirror" ? "default" : "secondary"}>
                        {classItem.class_type === "mirror" ? "Clase Espejo" : "MasterClass"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{classItem.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Capacidad:</strong> {classItem.capacity}</p>
                      <p><strong>Horas:</strong> {classItem.hours}</p>
                      <p><strong>Campus:</strong> {classItem.campus}</p>
                      <p><strong>Fecha:</strong> {new Date(classItem.class_date).toLocaleDateString("es-ES")}</p>
                      <p><strong>Área:</strong> {classItem.knowledge_area}</p>
                      <p><strong>Profesión:</strong> {classItem.profession}</p>
                    </div>
                    {classItem.virtual_room_required && (
                      <p className="text-sm"><strong>Link virtual:</strong> {classItem.virtual_room_link}</p>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => updateClassStatus(classItem.id, "approved")} className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button onClick={() => updateClassStatus(classItem.id, "rejected")} variant="destructive" className="flex-1">
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            {pendingTeachers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay docentes pendientes</p>
            ) : (
              pendingTeachers.map((teacher) => (
                <Card key={teacher.id}>
                  <CardHeader>
                    <CardTitle>{teacher.teacher_name}</CardTitle>
                    <CardDescription>{teacher.campus}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{teacher.profile_description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Email:</strong> {teacher.email}</p>
                      <p><strong>Teléfono:</strong> {teacher.phone}</p>
                      {teacher.cvlac_link && <p><strong>CVLAC:</strong> <a href={teacher.cvlac_link} target="_blank" rel="noopener noreferrer" className="text-primary">Ver</a></p>}
                      {teacher.orcid_link && <p><strong>ORCID:</strong> <a href={teacher.orcid_link} target="_blank" rel="noopener noreferrer" className="text-primary">Ver</a></p>}
                    </div>
                    {teacher.interests && teacher.interests.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Intereses:</p>
                        <div className="flex flex-wrap gap-2">
                          {teacher.interests.map((interest, idx) => (
                            <Badge key={idx} variant="outline">{interest}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => updateTeacherStatus(teacher.id, "approved")} className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button onClick={() => updateTeacherStatus(teacher.id, "rejected")} variant="destructive" className="flex-1">
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="registrations" className="space-y-4">
            {registrations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay registros</p>
            ) : (
              <div className="space-y-4">
                {/* Selector de clase para filtrar */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                  <Label htmlFor="classFilter">Filtrar por clase:</Label>
                  <Select
                    value={selectedClassId || "all"}
                    onValueChange={(value) => setSelectedClassId(value === "all" ? "" : value)}
                  >
                    <SelectTrigger className="min-w-[200px]">
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
                      ).map((classId) => (
                        <SelectItem key={classId} value={classId}>
                          {classId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Tabla solo participantes, formato Excel */}
                <div className="overflow-x-auto">
                  <table className="min-w-full border text-sm bg-white">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border px-2 py-1">Nombre</th>
                        <th className="border px-2 py-1">Universidad de Origen</th>
                        <th className="border px-2 py-1">País</th>
                        <th className="border px-2 py-1">Curso Seleccionado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations
                        .filter((reg: any) => !selectedClassId || reg.class_id === selectedClassId)
                        .map((reg: any) => (
                          <tr key={reg.id} className="hover:bg-muted/40">
                            <td className="border px-2 py-1">{reg.full_name}</td>
                            <td className="border px-2 py-1">{reg.institution}</td>
                            <td className="border px-2 py-1">{reg.country}</td>
                            <td className="border px-2 py-1">{reg.class_id}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
  // ...existing code...
  // Estado para filtro de clase en registros

        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
