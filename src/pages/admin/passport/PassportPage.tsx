import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, Trophy, Medal, Settings, BarChart2, BookOpen, Users, Award, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import BadgeManager from "./BadgeManager";
import PathwayManager from "./PathwayManager";
import AdminActivityRequests from "@/components/admin/AdminActivityRequests";

type Activity = {
  id: string;
  name: string;
  description: string | null;
  activity_type: string;
  points_awarded: number;
  pathway_type: string | null;
  complexity_level: string | null;
  active: boolean;
};

type Badge = {
  id: string;
  name: string;
  description: string | null;
  badge_type: string;
  points_required: number;
  credits_required: number | null;
  english_level_required: string | null;
  pathway_completion_required: string[] | null;
  color: string | null;
  active: boolean;
};

export const PassportPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [pathways, setPathways] = useState<any[]>([]);

  // Forms
  const [newActivity, setNewActivity] = useState({
    name: "",
    description: "",
    activity_type: "mooc",
    points_awarded: 30,
    pathway_type: "conocimiento",
    complexity_level: "basico",
  });

  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    activity_type: "mooc",
    points_awarded: 30,
    pathway_type: "conocimiento",
    complexity_level: "basico",
  });

  const [awardEmail, setAwardEmail] = useState("");
  const [awardPoints, setAwardPoints] = useState(10);
  const [awardPathway, setAwardPathway] = useState("conocimiento");
  const [awardReason, setAwardReason] = useState("");
  const [selectedActivity, setSelectedActivity] = useState("none");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  
  // Modal states
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [selectedStudentForAward, setSelectedStudentForAward] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Loading passport data...");
      // Settings
      const { data: s, error: sErr } = await (supabase as any)
        .from("passport_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      
      if (sErr) {
        console.error("Settings error:", sErr);
      }
      
      setSettings(s || {
        min_points_for_badge: 100,
        min_credits_for_global_citizen: 120,
        min_english_level: "B1",
      });

      // Activities
      const { data: acts = [], error: actsErr } = await (supabase as any)
        .from("passport_activities")
        .select("*")
        .order("points_awarded", { ascending: false });
      
      if (actsErr) {
        console.error("Activities error:", actsErr);
      }
      setActivities(acts);

      // Badges
      const { data: bdgs = [], error: bdgsErr } = await (supabase as any)
        .from("passport_badges")
        .select("*")
        .order("points_required", { ascending: true });
      
      if (bdgsErr) {
        console.error("Badges error:", bdgsErr);
      }
      setBadges(bdgs);

      // Pathways
      const { data: paths = [], error: pathsErr } = await (supabase as any)
        .from("passport_routes")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });
      
      if (pathsErr) {
        console.error("Pathways error:", pathsErr);
      }
      setPathways(paths);

      // Students with UDES domains (try multiple patterns)
      let studs = [];
      try {
        // First try @mail.udes.edu.co
        const { data: mailStuds = [], error: mailErr } = await (supabase as any)
          .from("profiles")
          .select("id, full_name, email, city, department, active")
          .ilike("email", "%@mail.udes.edu.co")
          .order("full_name", { ascending: true });
        
        if (mailErr) {
          console.error("Mail UDES error:", mailErr);
        } else {
          studs = mailStuds;
          console.log("Mail UDES students found:", mailStuds.length);
        }

        // If no students found, try other UDES domains
        if (studs.length === 0) {
          const { data: udesStuds = [], error: udesErr } = await (supabase as any)
            .from("profiles")
            .select("id, full_name, email, city, department, active")
            .ilike("email", "%@udes.edu.co")
            .order("full_name", { ascending: true });
          
          if (udesErr) {
            console.error("UDES error:", udesErr);
          } else {
            studs = udesStuds;
            console.log("UDES students found:", udesStuds.length);
          }
        }

        // TEMPORAL: If still no students, get ALL profiles for debugging
        if (studs.length === 0) {
          console.log("No UDES students found, trying ALL profiles for debugging...");
          const { data: allProfiles = [], error: allErr } = await (supabase as any)
            .from("profiles")
            .select("id, full_name, email, city, department")
            .limit(20);
          
          if (allErr) {
            console.error("All profiles error:", allErr);
          } else {
            console.log("All profiles (first 20 for debugging):", allProfiles);
            // Add active: true by default for debugging
            studs = allProfiles.map(p => ({ ...p, active: true }));
          }
        }
      } catch (error) {
        console.error("Error loading students:", error);
      }
      
      setStudents(studs);
      
      console.log("Data loaded:", { activities: acts?.length, badges: bdgs?.length, pathways: paths?.length, students: studs?.length });
    } catch (e: any) {
      console.error("Load data error:", e);
      setError(e.message);
      toast({ title: "Error cargando datos", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("passport_settings")
        .upsert(settings, { onConflict: "id" });
      if (error) throw error;
      toast({ title: "Configuración guardada" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async () => {
    if (!newActivity.name) return;
    setLoading(true);
    try {
      // Insert the activity and get the created record
      const { data: createdActivity, error } = await (supabase as any)
        .from("passport_activities")
        .insert([{
          ...newActivity,
          formative_value: newActivity.description,
          active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      // Auto-link activity to matching routes (except for "multiple" type)
      if (newActivity.pathway_type !== "multiple") {
        try {
          // Get all active routes with matching pathway_type
          const { data: matchingRoutes, error: routesError } = await (supabase as any)
            .from("passport_routes")
            .select("id, name")
            .eq("pathway_type", newActivity.pathway_type)
            .eq("active", true);

          if (routesError) {
            console.error("Error fetching matching routes:", routesError);
          } else if (matchingRoutes && matchingRoutes.length > 0) {
            // For each matching route, get the next order_index and create the link
            const routeActivityLinks = [];

            for (const route of matchingRoutes) {
              // Get current max order_index for this route
              const { data: existingLinks, error: linkError } = await (supabase as any)
                .from("passport_route_activities")
                .select("order_index")
                .eq("route_id", route.id)
                .order("order_index", { ascending: false })
                .limit(1);

              if (linkError) {
                console.error(`Error getting order_index for route ${route.id}:`, linkError);
                continue;
              }

              const nextOrderIndex = existingLinks && existingLinks.length > 0
                ? existingLinks[0].order_index + 1
                : 1;

              routeActivityLinks.push({
                route_id: route.id,
                activity_id: createdActivity.id,
                order_index: nextOrderIndex,
                required: false,
                active: true,
              });
            }

            // Insert all route-activity links
            if (routeActivityLinks.length > 0) {
              const { error: linkInsertError } = await (supabase as any)
                .from("passport_route_activities")
                .insert(routeActivityLinks);

              if (linkInsertError) {
                console.error("Error creating route-activity links:", linkInsertError);
                toast({
                  title: "Advertencia",
                  description: "Actividad creada pero no se pudo vincular automáticamente a rutas",
                  variant: "destructive",
                });
              } else {
                console.log(`Actividad vinculada automáticamente a ${routeActivityLinks.length} ruta(s)`);
              }
            }
          }
        } catch (linkError) {
          console.error("Error in auto-linking:", linkError);
          // Don't fail the whole operation if auto-linking fails
        }
      }

      toast({ title: "Actividad creada exitosamente" });
      loadData();
      setNewActivity({
        name: "",
        description: "",
        activity_type: "mooc",
        points_awarded: 30,
        pathway_type: "conocimiento",
        complexity_level: "basico",
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setEditForm({
      name: activity.name,
      description: activity.description || "",
      activity_type: activity.activity_type,
      points_awarded: activity.points_awarded,
      pathway_type: activity.pathway_type || "conocimiento",
      complexity_level: activity.complexity_level || "basico",
    });
  };

  const cancelEditActivity = () => {
    setEditingActivity(null);
    setEditForm({
      name: "",
      description: "",
      activity_type: "mooc",
      points_awarded: 30,
      pathway_type: "conocimiento",
      complexity_level: "basico",
    });
  };

  const updateActivity = async () => {
    if (!editingActivity || !editForm.name) return;
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("passport_activities")
        .update({
          name: editForm.name,
          description: editForm.description,
          formative_value: editForm.description,
          activity_type: editForm.activity_type,
          points_awarded: editForm.points_awarded,
          pathway_type: editForm.pathway_type,
          complexity_level: editForm.complexity_level,
        })
        .eq("id", editingActivity.id);
      if (error) throw error;
      toast({ title: "Actividad actualizada" });
      loadData();
      cancelEditActivity();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleActivityStatus = async (activity: Activity) => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("passport_activities")
        .update({ active: !activity.active })
        .eq("id", activity.id);
      if (error) throw error;
      toast({ title: `Actividad ${!activity.active ? "activada" : "desactivada"}` });
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteActivity = async (activity: Activity) => {
    if (!confirm(`¿Estás seguro de eliminar la actividad "${activity.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("passport_activities")
        .delete()
        .eq("id", activity.id);
      if (error) throw error;
      toast({ title: "Actividad eliminada" });
      loadData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const debugStudents = async () => {
    console.log("=== DEBUGGING ESTUDIANTES ===");
    
    try {
      // Check current user and roles
      const { data: { user } } = await (supabase as any).auth.getUser();
      console.log("Current user:", user);
      
      if (user) {
        const { data: userRoles, error: rolesErr } = await (supabase as any)
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id);
        console.log("User roles:", userRoles, "Error:", rolesErr);
      }
      
      // Get all profiles
      const { data: allProfiles, error: allErr } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, email, city, department, active")
        .limit(20);
      
      console.log("All profiles:", allProfiles);
      console.log("All profiles error:", allErr);
      
      // Check for UDES emails
      const udesProfiles = allProfiles?.filter(p => p.email?.includes('udes.edu.co')) || [];
      console.log("UDES profiles:", udesProfiles);
      
      // Check for mail.udes.edu.co specifically
      const mailUdesProfiles = allProfiles?.filter(p => p.email?.includes('mail.udes.edu.co')) || [];
      console.log("Mail UDES profiles:", mailUdesProfiles);
      
      // Try the same queries as in loadData
      console.log("=== TESTING LOAD DATA QUERIES ===");
      
      // First try @mail.udes.edu.co
      const { data: mailStuds, error: mailErr } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, email, city, department, active")
        .ilike("email", "%@mail.udes.edu.co")
        .order("full_name", { ascending: true });
      
      console.log("Mail UDES query result:", mailStuds, "Error:", mailErr);
      
      // Try other UDES domains
      const { data: udesStuds, error: udesErr } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, email, city, department, active")
        .ilike("email", "%@udes.edu.co")
        .order("full_name", { ascending: true });
      
      console.log("UDES query result:", udesStuds, "Error:", udesErr);
      
    } catch (error) {
      console.error("Debug error:", error);
    }
  };

  const openAwardModal = (student: any) => {
    setSelectedStudentForAward(student);
    setAwardPoints(10); // Reset to default
    setAwardPathway("conocimiento"); // Reset to default
    setAwardReason(""); // Reset
    setSelectedActivity("none"); // Reset
    setAwardModalOpen(true);
  };

  const closeAwardModal = () => {
    setAwardModalOpen(false);
    setSelectedStudentForAward(null);
  };

  const toggleStudentStatus = async (student: any) => {
    if (!confirm(`¿Estás seguro de ${student.active ? 'deshabilitar' : 'habilitar'} al estudiante "${student.full_name}"?`)) {
      return;
    }

    setLoading(true);
    try {
      // Check if active field exists, if not, skip the update
      if (student.active === undefined) {
        toast({
          title: "Campo no disponible",
          description: "El campo 'active' no está disponible. Aplica la migración primero.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await (supabase as any)
        .from("profiles")
        .update({ active: !student.active })
        .eq("id", student.id);

      if (error) {
        console.error("Error updating student status:", error);
        throw new Error(`Error al ${student.active ? 'deshabilitar' : 'habilitar'} estudiante: ${error.message}`);
      }

      toast({
        title: "Estado actualizado",
        description: `Estudiante ${student.active ? 'deshabilitado' : 'habilitado'} exitosamente`,
      });

      // Reload data to reflect changes
      await loadData();

    } catch (e: any) {
      console.error("Error toggling student status:", e);
      toast({
        title: "Error",
        description: e.message || "Error desconocido al cambiar estado del estudiante",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const awardPointsToUser = async () => {
    if (!selectedStudentForAward || !awardPoints) {
      toast({
        title: "Error",
        description: "Estudiante y puntos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const activityId = selectedActivity === "none" ? null : selectedActivity;

      console.log("Intentando insertar puntos:", {
        user_id: selectedStudentForAward.id,
        points: awardPoints,
        pathway_type: awardPathway,
        activity_id: activityId,
        reason: awardReason || "Asignación manual",
        source: "admin",
      });

      const { data, error } = await (supabase as any)
        .from("passport_points_ledger")
        .insert([{
          user_id: selectedStudentForAward.id,
          points: awardPoints,
          pathway_type: awardPathway,
          activity_id: activityId,
          reason: awardReason || "Asignación manual",
          source: "admin",
        }])
        .select();

      if (error) {
        console.error("Error insertando puntos:", error);
        throw new Error(`Error al otorgar puntos: ${error.message}`);
      }

      console.log("Puntos otorgados exitosamente:", data);

      toast({
        title: "Éxito",
        description: `${awardPoints} puntos asignados a ${selectedStudentForAward.full_name}`,
      });

      // Limpiar formulario y cerrar modal
      closeAwardModal();

    } catch (e: any) {
      console.error("Error completo:", e);
      toast({
        title: "Error",
        description: e.message || "Error desconocido al otorgar puntos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading and error states
  if (loading && !settings && activities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando módulo de Pasaporte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {error}</p>
          <Button onClick={loadData}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Pasaporte Académico UDES</h1>
            <p className="text-muted-foreground mt-1">
              Sistema de 3 senderos: Conocimiento, Descubrimiento e Impacto Social
            </p>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
        </div>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="pathways">
              <BookOpen className="h-4 w-4 mr-2" />
              Senderos
            </TabsTrigger>
            <TabsTrigger value="activities">
              <Trophy className="h-4 w-4 mr-2" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Medal className="h-4 w-4 mr-2" />
              Insignias
            </TabsTrigger>
            <TabsTrigger value="requests">
              <Award className="h-4 w-4 mr-2" />
              Solicitudes
            </TabsTrigger>
            <TabsTrigger value="award">
              <Users className="h-4 w-4 mr-2" />
              Participantes
            </TabsTrigger>
            <TabsTrigger value="reports">
              <BarChart2 className="h-4 w-4 mr-2" />
              Reportes
            </TabsTrigger>
          </TabsList>

          {/* Configuración Global */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configuración Global</CardTitle>
                <CardDescription>
                  Parámetros generales del sistema de Pasaporte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Puntos mínimos para insignia</Label>
                        <Input
                          type="number"
                          value={settings.min_points_for_badge || 100}
                          onChange={(e) =>
                            setSettings({ ...settings, min_points_for_badge: parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label>Créditos mínimos (Ciudadano Global)</Label>
                        <Input
                          type="number"
                          value={settings.min_credits_for_global_citizen || 120}
                          onChange={(e) =>
                            setSettings({ ...settings, min_credits_for_global_citizen: parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <Label>Nivel mínimo de inglés</Label>
                        <Select
                          value={settings.min_english_level || "B1"}
                          onValueChange={(v) => setSettings({ ...settings, min_english_level: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A1">A1 - Básico</SelectItem>
                            <SelectItem value="A2">A2 - Elemental</SelectItem>
                            <SelectItem value="B1">B1 - Intermedio</SelectItem>
                            <SelectItem value="B2">B2 - Intermedio Alto</SelectItem>
                            <SelectItem value="C1">C1 - Avanzado</SelectItem>
                            <SelectItem value="C2">C2 - Maestría</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={saveSettings}>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Configuración
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Senderos */}
          <TabsContent value="pathways">
            <PathwayManager />
          </TabsContent>

          {/* Catálogo de Actividades */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle>Catálogo de Actividades</CardTitle>
                <CardDescription>
                  <CardDescription>
                Administra actividades elegibles y puntos asignados. Las nuevas actividades se vinculan automáticamente a senderos existentes.
              </CardDescription>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Form to create new activity */}
                <div className="border rounded p-4 space-y-4 bg-muted/30">
                  <h3 className="font-semibold">Crear Nueva Actividad</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input
                        value={newActivity.name}
                        onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                        placeholder="Ej: Taller de Liderazgo"
                      />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={newActivity.activity_type}
                        onValueChange={(v) => setNewActivity({ ...newActivity, activity_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="coil">COIL</SelectItem>
                          <SelectItem value="intercambio">Intercambio</SelectItem>
                          <SelectItem value="semillero">Semillero</SelectItem>
                          <SelectItem value="clase_espejo">Clase Espejo</SelectItem>
                          <SelectItem value="mooc">MOOC</SelectItem>
                          <SelectItem value="evento">Evento</SelectItem>
                          <SelectItem value="proyecto">Proyecto</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Puntos Asignados</Label>
                      <Input
                        type="number"
                        value={newActivity.points_awarded}
                        onChange={(e) =>
                          setNewActivity({ ...newActivity, points_awarded: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div>
                      <Label>Sendero</Label>
                      <Select
                        value={newActivity.pathway_type}
                        onValueChange={(v) => setNewActivity({ ...newActivity, pathway_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conocimiento">Conocimiento</SelectItem>
                          <SelectItem value="descubrimiento">Descubrimiento</SelectItem>
                          <SelectItem value="impacto_social">Impacto Social</SelectItem>
                          <SelectItem value="multiple">Múltiple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Complejidad</Label>
                      <Select
                        value={newActivity.complexity_level}
                        onValueChange={(v) => setNewActivity({ ...newActivity, complexity_level: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basico">Básico</SelectItem>
                          <SelectItem value="intermedio">Intermedio</SelectItem>
                          <SelectItem value="avanzado">Avanzado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Valor Formativo / Descripción</Label>
                      <Textarea
                        value={newActivity.description}
                        onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                        placeholder="Describe el valor formativo de esta actividad"
                      />
                    </div>
                  </div>
                  <Button onClick={createActivity}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear y Vincular Actividad
                  </Button>
                </div>

                {/* List of existing activities */}
                <div>
                  <h3 className="font-semibold mb-3">Actividades Registradas ({activities.length})</h3>
                  
                  {/* Edit Form */}
                  {editingActivity && (
                    <div className="border rounded p-4 space-y-4 bg-blue-50 mb-4">
                      <h4 className="font-semibold">Editando: {editingActivity.name}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Nombre</Label>
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Tipo</Label>
                          <Select
                            value={editForm.activity_type}
                            onValueChange={(v) => setEditForm({ ...editForm, activity_type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="coil">COIL</SelectItem>
                              <SelectItem value="intercambio">Intercambio</SelectItem>
                              <SelectItem value="semillero">Semillero</SelectItem>
                              <SelectItem value="clase_espejo">Clase Espejo</SelectItem>
                              <SelectItem value="mooc">MOOC</SelectItem>
                              <SelectItem value="evento">Evento</SelectItem>
                              <SelectItem value="proyecto">Proyecto</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Puntos Asignados</Label>
                          <Input
                            type="number"
                            value={editForm.points_awarded}
                            onChange={(e) =>
                              setEditForm({ ...editForm, points_awarded: parseInt(e.target.value) })
                            }
                          />
                        </div>
                        <div>
                          <Label>Sendero</Label>
                          <Select
                            value={editForm.pathway_type}
                            onValueChange={(v) => setEditForm({ ...editForm, pathway_type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conocimiento">Conocimiento</SelectItem>
                              <SelectItem value="descubrimiento">Descubrimiento</SelectItem>
                              <SelectItem value="impacto_social">Impacto Social</SelectItem>
                              <SelectItem value="multiple">Múltiple</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Complejidad</Label>
                          <Select
                            value={editForm.complexity_level}
                            onValueChange={(v) => setEditForm({ ...editForm, complexity_level: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basico">Básico</SelectItem>
                              <SelectItem value="intermedio">Intermedio</SelectItem>
                              <SelectItem value="avanzado">Avanzado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label>Valor Formativo / Descripción</Label>
                          <Textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={updateActivity}>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </Button>
                        <Button variant="outline" onClick={cancelEditActivity}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {activities.map((act) => (
                      <div key={act.id} className={`border rounded p-3 flex items-center justify-between ${!act.active ? "bg-gray-50 opacity-75" : ""}`}>
                        <div className="flex-1">
                          <div className="font-medium">{act.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {act.activity_type} • {act.pathway_type} • {act.complexity_level}
                          </div>
                          {act.description && (
                            <div className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                              {act.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            <div className="font-bold text-lg">{act.points_awarded} pts</div>
                            <div className={`text-xs ${act.active ? "text-green-600" : "text-gray-400"}`}>
                              {act.active ? "Activo" : "Inactivo"}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditActivity(act)}
                              disabled={editingActivity?.id === act.id}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleActivityStatus(act)}
                              title={act.active ? "Desactivar actividad" : "Activar actividad"}
                            >
                              {act.active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteActivity(act)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insignias */}
          <TabsContent value="badges">
            <BadgeManager />
          </TabsContent>

          {/* Solicitudes de Actividades */}
          <TabsContent value="requests">
            <AdminActivityRequests />
          </TabsContent>

          {/* Participantes */}
          <TabsContent value="award">
            <Card>
              <CardHeader>
                <CardTitle>Participantes del Pasaporte</CardTitle>
                <CardDescription>Lista de estudiantes registrados. Si no ves estudiantes, haz clic en "Debug Estudiantes" para diagnosticar.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Cargando estudiantes...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No se encontraron estudiantes registrados</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Verifica que tengas permisos de admin y que existan perfiles con emails UDES
                    </p>
                    <Button onClick={debugStudents} variant="outline" size="sm" className="mt-4">
                      Debug Estudiantes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {students.length} estudiante{students.length !== 1 ? 's' : ''} encontrado{students.length !== 1 ? 's' : ''}
                        {students.some(s => s.active === undefined) && (
                          <span className="text-yellow-600 ml-2">
                            ⚠️ Campo 'active' no disponible - aplica la migración
                          </span>
                        )}
                      </p>
                      <Button onClick={debugStudents} variant="outline" size="sm">
                        Debug Estudiantes
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {students.map((student) => (
                        <div key={student.id} className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors ${student.active === false ? "bg-red-50 border-red-200" : ""}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-lg flex items-center gap-2">
                                {student.full_name || 'Sin nombre'}
                                {student.active === false && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                    Deshabilitado
                                  </span>
                                )}
                                {student.active === undefined && (
                                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                    Pendiente migración
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {student.city && student.department ? 
                                  `${student.city}, ${student.department}` : 
                                  'Ubicación no especificada'
                                }
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => openAwardModal(student)}
                              >
                                <Trophy className="h-4 w-4 mr-1" />
                                Asignar Puntos
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleStudentStatus(student)}
                                disabled={student.active === undefined}
                                className={student.active === true ? "text-orange-600 hover:text-orange-700" : student.active === false ? "text-green-600 hover:text-green-700" : ""}
                              >
                                {student.active === true ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-1" />
                                    Deshabilitar
                                  </>
                                ) : student.active === false ? (
                                  <>
                                    <Eye className="h-4 w-4 mr-1" />
                                    Habilitar
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-1" />
                                    Estado N/A
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // TODO: Implement view passport functionality
                                  toast({ title: "Función próximamente", description: "Ver pasaporte estará disponible pronto" });
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver Pasaporte
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  // TODO: Implement delete student functionality
                                  toast({ title: "Función próximamente", description: "Eliminar estudiante estará disponible pronto" });
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reportes */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reportes y Estadísticas</CardTitle>
                <CardDescription>Vista general del sistema de Pasaporte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded p-4">
                    <div className="text-sm text-muted-foreground">Actividades Registradas</div>
                    <div className="text-3xl font-bold">{activities.length}</div>
                  </div>
                  <div className="border rounded p-4">
                    <div className="text-sm text-muted-foreground">Insignias Configuradas</div>
                    <div className="text-3xl font-bold">{badges.length}</div>
                  </div>
                  <div className="border rounded p-4">
                    <div className="text-sm text-muted-foreground">Senderos Activos</div>
                    <div className="text-3xl font-bold">{pathways.filter((p) => p.active).length}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Próximamente: Rankings de estudiantes, puntos totales otorgados, y más métricas.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal para asignar puntos */}
        <Dialog open={awardModalOpen} onOpenChange={setAwardModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Asignar Puntos al Estudiante</DialogTitle>
              <DialogDescription>
                {selectedStudentForAward && (
                  <>Asignando puntos a: <strong>{selectedStudentForAward.full_name}</strong> ({selectedStudentForAward.email})</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Puntos</Label>
                  <Input
                    type="number"
                    value={awardPoints}
                    onChange={(e) => setAwardPoints(parseInt(e.target.value))}
                    min="1"
                  />
                </div>
                <div>
                  <Label>Sendero</Label>
                  <Select value={awardPathway} onValueChange={setAwardPathway}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conocimiento">Conocimiento</SelectItem>
                      <SelectItem value="descubrimiento">Descubrimiento</SelectItem>
                      <SelectItem value="impacto_social">Impacto Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Actividad (Opcional)</Label>
                <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona actividad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin actividad específica</SelectItem>
                    {activities.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} ({a.points_awarded} pts)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Motivo / Razón</Label>
                <Textarea
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  placeholder="Ej: Participación destacada en COIL"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={closeAwardModal}>
                  Cancelar
                </Button>
                <Button onClick={awardPointsToUser} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Asignando...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Asignar Puntos
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
};
