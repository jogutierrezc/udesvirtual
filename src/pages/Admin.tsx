import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, LogOut, Users, BookOpen, GraduationCap } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type Class = Tables<"classes">;
type Teacher = Tables<"teachers">;
type Registration = Tables<"class_registrations">;

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pendingClasses, setPendingClasses] = useState<Class[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

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
        supabase.from("class_registrations").select("*, classes(title)").order("created_at", { ascending: false }),
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
        <Tabs defaultValue="classes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="classes">
              <BookOpen className="h-4 w-4 mr-2" />
              Clases Pendientes ({pendingClasses.length})
            </TabsTrigger>
            <TabsTrigger value="teachers">
              <GraduationCap className="h-4 w-4 mr-2" />
              Docentes Pendientes ({pendingTeachers.length})
            </TabsTrigger>
            <TabsTrigger value="registrations">
              <Users className="h-4 w-4 mr-2" />
              Registros ({registrations.length})
            </TabsTrigger>
          </TabsList>

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
              <div className="grid gap-4">
                {registrations.map((reg: any) => (
                  <Card key={reg.id}>
                    <CardHeader>
                      <CardTitle>{reg.full_name}</CardTitle>
                      <CardDescription>Clase: {reg.classes?.title || "N/A"}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Email:</strong> {reg.email}</p>
                      <p><strong>Teléfono:</strong> {reg.phone}</p>
                      <p><strong>Institución:</strong> {reg.institution}</p>
                      <p><strong>País:</strong> {reg.country}</p>
                      <p><strong>Tipo:</strong> {reg.participant_type}</p>
                      <p><strong>Fecha:</strong> {new Date(reg.created_at).toLocaleDateString("es-ES")}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
