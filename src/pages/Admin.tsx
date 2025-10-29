import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, CheckCircle, XCircle, Users, BookOpen, GraduationCap, PlusCircle, Package, Globe, Edit2, Trash2, EyeOff, ChevronDown, Settings, FileText, Image } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import CarouselManagement from "@/pages/admin/CarouselManagement";
// Legacy combined PassportPage removed; use dedicated admin/passport routes instead
import { TagInput } from "@/components/TagInput";
import { ImportTeachersDialog } from "@/components/ImportTeachersDialog";
import { CertificateSettings } from "@/pages/admin/CertificateSettings";

type Class = Tables<"classes">;
type Teacher = Tables<"teachers">;
type Registration = Tables<"class_registrations">;
type Offering = Tables<"course_offerings">;
type CoilProposal = Tables<"coil_proposals">;

const Admin = () => {
  // Estado para filtro de clase en registros
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("catalog");
  const location = useLocation();
  const [userId, setUserId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingClasses, setPendingClasses] = useState<Class[]>([]);
  const [pendingTeachers, setPendingTeachers] = useState<Teacher[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [pendingOfferings, setPendingOfferings] = useState<Offering[]>([]);
  const [pendingCoilProposals, setPendingCoilProposals] = useState<CoilProposal[]>([]);
  // Catalog / approved lists
  const [catalogClasses, setCatalogClasses] = useState<Class[]>([]);
  const [catalogTeachers, setCatalogTeachers] = useState<Teacher[]>([]);
  const [catalogOfferings, setCatalogOfferings] = useState<Offering[]>([]);

  // Editing ids
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);

  // Class form state
  const [classForm, setClassForm] = useState({
    title: "",
    capacity: "",
    hours: "",
    allied_professor: "",
    allied_institution: "",
    description: "",
    virtual_room_required: false,
    virtual_room_link: "",
    campus: "",
    class_date: "",
    class_type: "mirror" as "mirror" | "masterclass",
    knowledge_area: [] as string[],
    profession: "",
  });

  // Offering form state
  const [offeringForm, setOfferingForm] = useState({
    title: "",
    description: "",
    offering_type: "exchange" as "exchange" | "programada",
    knowledge_area: [] as string[],
    profession: "",
    capacity: "",
    hours: "",
    campus: "",
    allied_professor: "",
    allied_institution: "",
    udes_professor_name: "",
    udes_professor_program: "",
    udes_professor_phone: "",
    udes_professor_email: "",
  });

  // Teacher form state
  const [teacherForm, setTeacherForm] = useState({
    teacher_name: "",
    campus: "",
    email: "",
    phone: "",
    profile_description: "",
    interests: [] as string[],
    cvlac_link: "",
    orcid_link: "",
  });

  // COIL form state
  const [coilForm, setCoilForm] = useState({
    full_name: "",
    email: "",
    academic_program: "",
    course_name: "",
    academic_semester: "",
    external_capacity: "",
    project_topics: "",
    languages: [] as string[],
    sustainable_development_goals: [] as string[],
  });

  useEffect(() => {
    checkAuth();
    loadData();
    // If a ?tab= query param is present, open that tab (useful for external links)
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam) setActiveTab(tabParam);
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
      const [classesPendingRes, teachersPendingRes, regsRes, offeringsPendingRes, coilRes, classesApprovedRes, teachersApprovedRes, offeringsApprovedRes] = await Promise.all([
        supabase.from("classes").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("teachers").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("class_registrations").select("*, classes(*)").order("created_at", { ascending: false }),
        supabase.from("course_offerings").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        supabase.from("coil_proposals").select("*").eq("status", "pending").order("created_at", { ascending: false }),
        // approved / catalog lists
        supabase.from("classes").select("*").eq("status", "approved").order("created_at", { ascending: false }),
        supabase.from("teachers").select("*").eq("status", "approved").order("created_at", { ascending: false }),
        supabase.from("course_offerings").select("*").eq("status", "approved").order("created_at", { ascending: false }),
      ]);

      setPendingClasses(classesPendingRes.data || []);
      setPendingTeachers(teachersPendingRes.data || []);
      setRegistrations(regsRes.data || []);
      setPendingOfferings(offeringsPendingRes.data || []);
      setPendingCoilProposals(coilRes.data || []);

      setCatalogClasses(classesApprovedRes.data || []);
      setCatalogTeachers(teachersApprovedRes.data || []);
      setCatalogOfferings(offeringsApprovedRes.data || []);
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
      let error = null;
      if (editingClassId) {
        const res = await supabase.from("classes").update({
          ...classForm,
          capacity: parseInt(classForm.capacity),
          hours: parseInt(classForm.hours),
        }).eq("id", editingClassId);
        error = res.error;
      } else {
        const res = await supabase.from("classes").insert({
          ...classForm,
          capacity: parseInt(classForm.capacity),
          hours: parseInt(classForm.hours),
          created_by: userId,
          status: "approved", // Admin can approve directly
        });
        error = res.error;
      }

      if (error) throw error;

      toast({
        title: "Éxito",
        description: editingClassId ? "Clase actualizada." : "Clase creada y aprobada automáticamente.",
      });

      setClassForm({
        title: "",
        capacity: "",
        hours: "",
        allied_professor: "",
        allied_institution: "",
        description: "",
        virtual_room_required: false,
        virtual_room_link: "",
        campus: "",
        class_date: "",
        class_type: "mirror",
        knowledge_area: [],
        profession: "",
      });

  // reset editing
  setEditingClassId(null);

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

  const handleCreateOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let error = null;
      if (editingOfferingId) {
        const res = await supabase.from("course_offerings").update({
          title: offeringForm.title,
          description: offeringForm.description,
          offering_type: offeringForm.offering_type,
          knowledge_area: offeringForm.knowledge_area,
          profession: offeringForm.profession,
          capacity: parseInt(offeringForm.capacity),
          hours: parseInt(offeringForm.hours),
          campus: offeringForm.campus,
          allied_professor: offeringForm.allied_professor,
          allied_institution: offeringForm.allied_institution,
          udes_professor_name: offeringForm.udes_professor_name,
          udes_professor_program: offeringForm.udes_professor_program,
          udes_professor_phone: offeringForm.udes_professor_phone,
          udes_professor_email: offeringForm.udes_professor_email,
        }).eq("id", editingOfferingId);
        error = res.error;
      } else {
        const res = await supabase.from("course_offerings").insert({
          title: offeringForm.title,
          description: offeringForm.description,
          offering_type: offeringForm.offering_type,
          knowledge_area: offeringForm.knowledge_area,
          profession: offeringForm.profession,
          capacity: parseInt(offeringForm.capacity),
          hours: parseInt(offeringForm.hours),
          campus: offeringForm.campus,
          allied_professor: offeringForm.allied_professor,
          allied_institution: offeringForm.allied_institution,
          udes_professor_name: offeringForm.udes_professor_name,
          udes_professor_program: offeringForm.udes_professor_program,
          udes_professor_phone: offeringForm.udes_professor_phone,
          udes_professor_email: offeringForm.udes_professor_email,
          created_by: userId,
        });
        error = res.error;
      }

      if (error) throw error;

      toast({
        title: "Éxito",
        description: editingOfferingId ? "Oferta actualizada." : "Oferta creada y aprobada automáticamente.",
      });

      setOfferingForm({
        title: "",
        description: "",
        offering_type: "exchange",
        knowledge_area: [],
        profession: "",
        capacity: "",
        hours: "",
        campus: "",
        allied_professor: "",
        allied_institution: "",
        udes_professor_name: "",
        udes_professor_program: "",
        udes_professor_phone: "",
        udes_professor_email: "",
      });

      setEditingOfferingId(null);

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

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("teachers").insert({
        ...teacherForm,
        user_id: userId,
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Perfil de profesor creado y aprobado automáticamente.",
      });

      setTeacherForm({
        teacher_name: "",
        campus: "",
        email: "",
        phone: "",
        profile_description: "",
        interests: [],
        cvlac_link: "",
        orcid_link: "",
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

  const handleCreateCoil = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from("coil_proposals").insert({
        ...coilForm,
        external_capacity: parseInt(coilForm.external_capacity),
        created_by: userId,
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Propuesta COIL creada y aprobada automáticamente.",
      });

      setCoilForm({
        full_name: "",
        email: "",
        academic_program: "",
        course_name: "",
        academic_semester: "",
        external_capacity: "",
        project_topics: "",
        languages: [],
        sustainable_development_goals: [],
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

  const updateOfferingStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("course_offerings")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Oferta ${status === "approved" ? "aprobada" : "rechazada"}`,
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

  const updateCoilStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("coil_proposals")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Propuesta COIL ${status === "approved" ? "aprobada" : "rechazada"}`,
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

  // Catalog actions: edit / delete / disable
  const handleEditClass = (item: Class) => {
    // populate form and switch to create tab
    setClassForm({
      title: item.title || "",
      capacity: String(item.capacity || ""),
      hours: String(item.hours || ""),
      allied_professor: item.allied_professor || "",
      allied_institution: item.allied_institution || "",
      description: item.description || "",
      virtual_room_required: !!item.virtual_room_required,
      virtual_room_link: item.virtual_room_link || "",
      campus: item.campus || "",
      class_date: item.class_date || "",
      class_type: (item.class_type as any) || "mirror",
      knowledge_area: Array.isArray(item.knowledge_area) ? item.knowledge_area : (item.knowledge_area ? [String(item.knowledge_area)] : []),
      profession: item.profession || "",
    });
    setEditingClassId(item.id);
    setActiveTab("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("¿Eliminar esta clase? Esta acción es irreversible.")) return;
    try {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Clase eliminada." });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDisableClass = async (id: string) => {
    if (!confirm("¿Deshabilitar esta clase? Puede volver a activarla más tarde.")) return;
    try {
      // Asumimos que la tabla permite un estado 'disabled'. Si no, se puede usar 'rejected' o un flag "active"
  const { error } = await supabase.from("classes").update({ status: "rejected" }).eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Clase deshabilitada." });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Offerings actions
  const handleEditOffering = (item: Offering) => {
    setOfferingForm({
      title: item.title || "",
      description: item.description || "",
      offering_type: (item.offering_type as any) || "exchange",
      knowledge_area: Array.isArray(item.knowledge_area) ? item.knowledge_area : (item.knowledge_area ? [String(item.knowledge_area)] : []),
      profession: item.profession || "",
      capacity: String(item.capacity || ""),
      hours: String(item.hours || ""),
      campus: item.campus || "",
      allied_professor: item.allied_professor || "",
      allied_institution: item.allied_institution || "",
      udes_professor_name: item.udes_professor_name || "",
      udes_professor_program: item.udes_professor_program || "",
      udes_professor_phone: item.udes_professor_phone || "",
      udes_professor_email: item.udes_professor_email || "",
    });
    setEditingOfferingId(item.id);
    setActiveTab("create-offering");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteOffering = async (id: string) => {
    if (!confirm("¿Eliminar esta oferta? Esta acción es irreversible.")) return;
    try {
      const { error } = await supabase.from("course_offerings").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Oferta eliminada." });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDisableOffering = async (id: string) => {
    if (!confirm("¿Deshabilitar esta oferta?")) return;
    try {
  const { error } = await supabase.from("course_offerings").update({ status: "rejected" }).eq("id", id);
      if (error) throw error;
      toast({ title: "Éxito", description: "Oferta deshabilitada." });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Top-level admin tabs */}
          <TabsList className="mb-4 flex flex-wrap gap-2">
            <TabsTrigger value="catalog">Catálogo</TabsTrigger>
            <TabsTrigger value="create">Crear Clase</TabsTrigger>
            <TabsTrigger value="create-teacher">Crear Docente</TabsTrigger>
            <TabsTrigger value="create-offering">Crear Oferta</TabsTrigger>
            <TabsTrigger value="carousel">Carrusel</TabsTrigger>
            <TabsTrigger value="passport">Pasaporte</TabsTrigger>
            <TabsTrigger value="certificates">Configuración de Certificados</TabsTrigger>
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
                      <Label htmlFor="allied_institution">Institución Aliada (IES) *</Label>
                      <Input
                        id="allied_institution"
                        value={classForm.allied_institution}
                        onChange={(e) => setClassForm({ ...classForm, allied_institution: e.target.value })}
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
                      <Label htmlFor="knowledge_area">Áreas de Conocimiento * (Tags)</Label>
                      <TagInput
                        tags={classForm.knowledge_area}
                        onChange={(tags) => setClassForm({ ...classForm, knowledge_area: tags })}
                        placeholder="Escribir área y presionar Enter"
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
                    {editingClassId ? "Actualizar Clase" : "Crear y Publicar Clase"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-teacher">
            <Card>
              <CardHeader>
                <CardTitle>Crear Perfil de Profesor Investigador</CardTitle>
                <CardDescription>Los perfiles creados por el administrador se aprueban automáticamente</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTeacher} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher_name">Nombre Completo *</Label>
                      <Input
                        id="teacher_name"
                        value={teacherForm.teacher_name}
                        onChange={(e) => setTeacherForm({ ...teacherForm, teacher_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher_campus">Campus *</Label>
                      <Input
                        id="teacher_campus"
                        value={teacherForm.campus}
                        onChange={(e) => setTeacherForm({ ...teacherForm, campus: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher_email">Correo Electrónico *</Label>
                      <Input
                        id="teacher_email"
                        type="email"
                        value={teacherForm.email}
                        onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teacher_phone">Teléfono *</Label>
                      <Input
                        id="teacher_phone"
                        value={teacherForm.phone}
                        onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvlac_link">Link CVLAC (Opcional)</Label>
                      <Input
                        id="cvlac_link"
                        type="url"
                        placeholder="https://..."
                        value={teacherForm.cvlac_link}
                        onChange={(e) => setTeacherForm({ ...teacherForm, cvlac_link: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orcid_link">Link ORCID (Opcional)</Label>
                      <Input
                        id="orcid_link"
                        type="url"
                        placeholder="https://..."
                        value={teacherForm.orcid_link}
                        onChange={(e) => setTeacherForm({ ...teacherForm, orcid_link: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profile_description">Descripción del Perfil *</Label>
                    <Textarea
                      id="profile_description"
                      value={teacherForm.profile_description}
                      onChange={(e) => setTeacherForm({ ...teacherForm, profile_description: e.target.value })}
                      required
                      rows={4}
                      placeholder="Experiencia, logros, áreas de investigación..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacher_interests">Áreas de Interés * (Tags)</Label>
                    <TagInput
                      tags={teacherForm.interests}
                      onChange={(tags) => setTeacherForm({ ...teacherForm, interests: tags })}
                      placeholder="Escribir área y presionar Enter"
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-2" />
                    )}
                    Crear Perfil de Profesor
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-coil">
            <Card>
              <CardHeader>
                <CardTitle>Crear Propuesta COIL</CardTitle>
                <CardDescription>Proyectos de Aprendizaje Colaborativo Internacional en Línea</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCoil} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="coil_full_name">Nombre Completo *</Label>
                      <Input
                        id="coil_full_name"
                        value={coilForm.full_name}
                        onChange={(e) => setCoilForm({ ...coilForm, full_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coil_email">Correo Electrónico Institucional *</Label>
                      <Input
                        id="coil_email"
                        type="email"
                        value={coilForm.email}
                        onChange={(e) => setCoilForm({ ...coilForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coil_program">Programa Académico *</Label>
                      <Input
                        id="coil_program"
                        value={coilForm.academic_program}
                        onChange={(e) => setCoilForm({ ...coilForm, academic_program: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coil_course">Nombre del Curso *</Label>
                      <Input
                        id="coil_course"
                        value={coilForm.course_name}
                        onChange={(e) => setCoilForm({ ...coilForm, course_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coil_semester">Semestre Académico *</Label>
                      <Input
                        id="coil_semester"
                        value={coilForm.academic_semester}
                        onChange={(e) => setCoilForm({ ...coilForm, academic_semester: e.target.value })}
                        placeholder="Ej: 2025-1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coil_capacity">Cupos para IES Externa *</Label>
                      <Input
                        id="coil_capacity"
                        type="number"
                        value={coilForm.external_capacity}
                        onChange={(e) => setCoilForm({ ...coilForm, external_capacity: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="coil_languages">Idiomas del Proyecto * (Tags)</Label>
                      <TagInput
                        tags={coilForm.languages}
                        onChange={(tags) => setCoilForm({ ...coilForm, languages: tags })}
                        placeholder="Escribir idioma y presionar Enter"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="coil_sdg">Objetivos de Desarrollo Sostenible (ODS) * (Tags)</Label>
                      <TagInput
                        tags={coilForm.sustainable_development_goals}
                        onChange={(tags) => setCoilForm({ ...coilForm, sustainable_development_goals: tags })}
                        placeholder="Escribir ODS y presionar Enter"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coil_topics">Temas Específicos del Proyecto COIL *</Label>
                    <Textarea
                      id="coil_topics"
                      value={coilForm.project_topics}
                      onChange={(e) => setCoilForm({ ...coilForm, project_topics: e.target.value })}
                      required
                      rows={4}
                      placeholder="Describa los temas específicos de interés para desarrollar el proyecto COIL acordes al syllabus del curso..."
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-2" />
                    )}
                    Crear Propuesta COIL
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-offering">
            <Card>
              <CardHeader>
                <CardTitle>Crear Nueva Oferta Académica</CardTitle>
                <CardDescription>Oferta pública y abierta de cursos cortos con profesor UDES</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOffering} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="offering_title">Título de la Oferta *</Label>
                      <Input
                        id="offering_title"
                        value={offeringForm.title}
                        onChange={(e) => setOfferingForm({ ...offeringForm, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="offering_type">Tipo de Oferta *</Label>
                      <Select
                        value={offeringForm.offering_type}
                        onValueChange={(value: "exchange" | "programada") =>
                          setOfferingForm({ ...offeringForm, offering_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exchange">Exchange</SelectItem>
                          <SelectItem value="programada">Programada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="offering_capacity">Capacidad de Estudiantes *</Label>
                      <Input
                        id="offering_capacity"
                        type="number"
                        value={offeringForm.capacity}
                        onChange={(e) => setOfferingForm({ ...offeringForm, capacity: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="offering_hours">Número de Horas *</Label>
                      <Input
                        id="offering_hours"
                        type="number"
                        value={offeringForm.hours}
                        onChange={(e) => setOfferingForm({ ...offeringForm, hours: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="offering_campus">Campus *</Label>
                      <Input
                        id="offering_campus"
                        value={offeringForm.campus}
                        onChange={(e) => setOfferingForm({ ...offeringForm, campus: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="offering_profession">Profesión/Programa *</Label>
                      <Input
                        id="offering_profession"
                        value={offeringForm.profession}
                        onChange={(e) => setOfferingForm({ ...offeringForm, profession: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="offering_knowledge_area">Áreas de Conocimiento * (Tags)</Label>
                      <TagInput
                        tags={offeringForm.knowledge_area}
                        onChange={(tags) => setOfferingForm({ ...offeringForm, knowledge_area: tags })}
                        placeholder="Escribir área y presionar Enter"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="offering_description">Descripción *</Label>
                    <Textarea
                      id="offering_description"
                      value={offeringForm.description}
                      onChange={(e) => setOfferingForm({ ...offeringForm, description: e.target.value })}
                      required
                      rows={4}
                    />
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-4">Datos del Profesor UDES</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="udes_prof_name">Nombre Profesor UDES *</Label>
                        <Input
                          id="udes_prof_name"
                          value={offeringForm.udes_professor_name}
                          onChange={(e) => setOfferingForm({ ...offeringForm, udes_professor_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="udes_prof_program">Programa al que pertenece *</Label>
                        <Input
                          id="udes_prof_program"
                          value={offeringForm.udes_professor_program}
                          onChange={(e) => setOfferingForm({ ...offeringForm, udes_professor_program: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="udes_prof_phone">Teléfono *</Label>
                        <Input
                          id="udes_prof_phone"
                          value={offeringForm.udes_professor_phone}
                          onChange={(e) => setOfferingForm({ ...offeringForm, udes_professor_phone: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="udes_prof_email">Correo *</Label>
                        <Input
                          id="udes_prof_email"
                          type="email"
                          value={offeringForm.udes_professor_email}
                          onChange={(e) => setOfferingForm({ ...offeringForm, udes_professor_email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-2" />
                    )}
                    {editingOfferingId ? "Actualizar Oferta" : "Crear y Publicar Oferta"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New: Catalog list (approved classes/teachers) */}
          <TabsContent value="catalog" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Clases (Catálogo)</CardTitle>
                  <CardDescription>Clases aprobadas</CardDescription>
                </CardHeader>
                <CardContent>
                  {catalogClasses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay clases en el catálogo</p>
                  ) : (
                    <div className="space-y-2">
                      {catalogClasses.map((c) => (
                        <div key={c.id} className="flex items-center justify-between border rounded p-3">
                          <div>
                            <div className="font-medium">{c.title}</div>
                            <div className="text-sm text-muted-foreground">{c.campus} • {c.profession}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditClass(c)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(c.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDisableClass(c.id)}>
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle>Docentes (Catálogo)</CardTitle>
                      <CardDescription>Docentes investigadores aprobados</CardDescription>
                    </div>
                    <ImportTeachersDialog onImportComplete={loadData} />
                  </div>
                </CardHeader>
                <CardContent>
                  {catalogTeachers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No hay docentes en el catálogo</p>
                  ) : (
                    <div className="space-y-2">
                      {catalogTeachers.map((t) => (
                        <div key={t.id} className="flex items-center justify-between border rounded p-3">
                          <div>
                            <div className="font-medium">{t.teacher_name}</div>
                            <div className="text-sm text-muted-foreground">{t.campus} • {t.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { /* could add edit teacher */ }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={async () => {
                              if (!confirm('¿Eliminar docente?')) return;
                              try {
                                const { error } = await supabase.from('teachers').delete().eq('id', t.id);
                                if (error) throw error;
                                toast({ title: 'Éxito', description: 'Docente eliminado.' });
                                loadData();
                              } catch (err: any) {
                                toast({ title: 'Error', description: err.message, variant: 'destructive' });
                              }
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* New: Offerings list (approved) */}
          <TabsContent value="offerings" className="space-y-4">
            {catalogOfferings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay ofertas publicadas</p>
            ) : (
              <div className="space-y-2">
                {catalogOfferings.map((off) => (
                  <div key={off.id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="font-medium">{off.title}</div>
                      <div className="text-sm text-muted-foreground">{off.campus} • {off.profession}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditOffering(off)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteOffering(off.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDisableOffering(off.id)}>
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offerings-old" className="space-y-4">
            {pendingOfferings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay ofertas pendientes</p>
            ) : (
              pendingOfferings.map((offering) => (
                <Card key={offering.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{offering.title}</CardTitle>
                        <CardDescription>
                          {offering.allied_professor && `Por: ${offering.allied_professor}`}
                          {offering.allied_institution && ` - ${offering.allied_institution}`}
                        </CardDescription>
                      </div>
                      <Badge variant={offering.offering_type === "exchange" ? "default" : "secondary"}>
                        {offering.offering_type === "exchange" ? "Exchange" : "Programada"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{offering.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Capacidad:</strong> {offering.capacity}</p>
                      <p><strong>Horas:</strong> {offering.hours}</p>
                      <p><strong>Campus:</strong> {offering.campus}</p>
                      <p><strong>Profesión:</strong> {offering.profession}</p>
                    </div>
                    {offering.knowledge_area && offering.knowledge_area.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <strong className="text-sm">Áreas:</strong>
                        {offering.knowledge_area.map((area, i) => (
                          <Badge key={i} variant="outline">{area}</Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => updateOfferingStatus(offering.id, "approved")} className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprobar
                      </Button>
                      <Button onClick={() => updateOfferingStatus(offering.id, "rejected")} variant="destructive" className="flex-1">
                        <XCircle className="h-4 w-4 mr-2" />
                        Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
                      <p><strong>Área:</strong> {Array.isArray(classItem.knowledge_area) ? classItem.knowledge_area.join(", ") : classItem.knowledge_area}</p>
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
                      ).map((classId) => {
                        const regClass = registrations.find((r: any) => String(r.class_id).trim() === classId);
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
                            <td className="border px-2 py-1">{reg.classes?.title || reg.class_id}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Nuevo: Carrusel Management */}
          <TabsContent value="carousel">
            <CarouselManagement />
          </TabsContent>

          {/* Nuevo: Pasaporte */}
          <TabsContent value="passport">
            <Card>
              <CardHeader>
                <CardTitle>Pasaporte Académico</CardTitle>
                <CardDescription>Accede a los módulos segmentados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Button variant="outline" onClick={() => navigate('/admin/passport/config')}>Configuración</Button>
                  <Button variant="outline" onClick={() => navigate('/admin/passport/senderos')}>Senderos</Button>
                  <Button variant="outline" onClick={() => navigate('/admin/passport/catalogo')}>Catálogo de Actividades</Button>
                  <Button variant="outline" onClick={() => navigate('/admin/passport/insignias')}>Insignias y Reconocimientos</Button>
                  <Button variant="outline" onClick={() => navigate('/admin/passport/solicitudes')}>Solicitudes de Puntos</Button>
                  <Button variant="outline" onClick={() => navigate('/admin/passport/participantes')}>Participantes</Button>
                  <Button variant="outline" onClick={() => navigate('/admin/passport/reportes')}>Reporte de Pasaportes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nuevo: Configuración de Certificados */}
          <TabsContent value="certificates">
            <CertificateSettings />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
