import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, PlusCircle, BookOpen, GraduationCap, Package } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { TagInput } from "@/components/TagInput";

const Professor = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [myApprovedClasses, setMyApprovedClasses] = useState<any[]>([]);
  const [editClassId, setEditClassId] = useState<string | null>(null);
  const [editClassForm, setEditClassForm] = useState<any | null>(null);

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

  // Teacher form state
  const [teacherForm, setTeacherForm] = useState({
    teacher_name: "",
    profile_description: "",
    cvlac_link: "",
    orcid_link: "",
    campus: "",
    phone: "",
    email: "",
    interests: [] as string[],
  });

  // Offering form state
  const [offeringForm, setOfferingForm] = useState({
    title: "",
    description: "",
    offering_type: "exchange" as "exchange" | "programada",
    knowledge_area: [] as string[],
    profession: "",
    allied_professor: "",
    allied_institution: "",
    capacity: "",
    hours: "",
    campus: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      loadMyApprovedClasses();
    }
  }, [userId]);

  const loadMyApprovedClasses = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("created_by", userId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    if (!error) setMyApprovedClasses(data || []);
  };

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

    if (role?.role !== "professor") {
      navigate("/dashboard");
    }
    setLoading(false);
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
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Clase creada. Pendiente de aprobación.",
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

  const handleCreateTeacherProfile = async (e: React.FormEvent) => {
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
        description: "Perfil de docente investigador creado. Pendiente de aprobación.",
      });

      setTeacherForm({
        teacher_name: "",
        profile_description: "",
        cvlac_link: "",
        orcid_link: "",
        campus: "",
        phone: "",
        email: "",
        interests: [],
      });
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel de Profesor</h1>
            <p className="text-white/80">Crear Clases y Perfil de Investigador</p>
          </div>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <Tabs defaultValue="class" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="class">
              <BookOpen className="h-4 w-4 mr-2" />
              Crear Clase
            </TabsTrigger>
            <TabsTrigger value="teacher">
              <GraduationCap className="h-4 w-4 mr-2" />
              Perfil Investigador
            </TabsTrigger>
            <TabsTrigger value="myclasses">
              <Package className="h-4 w-4 mr-2" />
              Mis Clases Aprobadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="class">
          <TabsContent value="myclasses">
            <Card>
              <CardHeader>
                <CardTitle>Mis Clases Aprobadas</CardTitle>
              </CardHeader>
              <CardContent>
                {myApprovedClasses.length === 0 ? (
                  <p className="text-muted-foreground">No tienes clases aprobadas.</p>
                ) : (
                  <div className="space-y-4">
                    {myApprovedClasses.map((clase) => (
                      <Card key={clase.id} className="border">
                        <CardHeader>
                          <CardTitle>{clase.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div><strong>Fecha:</strong> {new Date(clase.class_date).toLocaleDateString("es-ES")}</div>
                          <div><strong>Tipo:</strong> {clase.class_type}</div>
                          <div><strong>Capacidad:</strong> {clase.capacity}</div>
                          <div><strong>Campus:</strong> {clase.campus}</div>
                          <div><strong>Profesor Aliado:</strong> {clase.allied_professor}</div>
                          <div><strong>Institución Aliada:</strong> {clase.allied_institution}</div>
                          <div><strong>Descripción:</strong> {clase.description}</div>
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditClassId(clase.id);
                            setEditClassForm({ ...clase });
                          }}>Editar</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                {/* Formulario de edición */}
                {editClassId && editClassForm && (
                  <form
                    className="mt-6 space-y-4 border-t pt-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setSubmitting(true);
                      const { error } = await supabase
                        .from("classes")
                        .update({
                          ...editClassForm,
                          capacity: parseInt(editClassForm.capacity),
                          hours: parseInt(editClassForm.hours),
                        })
                        .eq("id", editClassId);
                      setSubmitting(false);
                      if (!error) {
                        toast({ title: "Clase actualizada" });
                        setEditClassId(null);
                        setEditClassForm(null);
                        loadMyApprovedClasses();
                      } else {
                        toast({ title: "Error", description: error.message, variant: "destructive" });
                      }
                    }}
                  >
                    <Label>Título</Label>
                    <Input
                      value={editClassForm.title}
                      onChange={e => setEditClassForm({ ...editClassForm, title: e.target.value })}
                      required
                    />
                    <Label>Capacidad</Label>
                    <Input
                      type="number"
                      value={editClassForm.capacity}
                      onChange={e => setEditClassForm({ ...editClassForm, capacity: e.target.value })}
                      required
                    />
                    <Label>Horas</Label>
                    <Input
                      type="number"
                      value={editClassForm.hours}
                      onChange={e => setEditClassForm({ ...editClassForm, hours: e.target.value })}
                      required
                    />
                    <Label>Campus</Label>
                    <Input
                      value={editClassForm.campus}
                      onChange={e => setEditClassForm({ ...editClassForm, campus: e.target.value })}
                      required
                    />
                    <Label>Fecha</Label>
                    <Input
                      type="datetime-local"
                      value={editClassForm.class_date}
                      onChange={e => setEditClassForm({ ...editClassForm, class_date: e.target.value })}
                      required
                    />
                    <Label>Profesor Aliado</Label>
                    <Input
                      value={editClassForm.allied_professor}
                      onChange={e => setEditClassForm({ ...editClassForm, allied_professor: e.target.value })}
                    />
                    <Label>Institución Aliada</Label>
                    <Input
                      value={editClassForm.allied_institution}
                      onChange={e => setEditClassForm({ ...editClassForm, allied_institution: e.target.value })}
                    />
                    <Label>Descripción</Label>
                    <Textarea
                      value={editClassForm.description}
                      onChange={e => setEditClassForm({ ...editClassForm, description: e.target.value })}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" disabled={submitting}>Guardar</Button>
                      <Button type="button" variant="outline" onClick={() => { setEditClassId(null); setEditClassForm(null); }}>Cancelar</Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
            <Card>
              <CardHeader>
                <CardTitle>Nueva Clase Espejo / MasterClass</CardTitle>
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
                      <Label htmlFor="virtual_room_link">Link de Sala Virtual</Label>
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
                    Crear Clase
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teacher">
            <Card>
              <CardHeader>
                <CardTitle>Perfil de Docente Investigador</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateTeacherProfile} className="space-y-4">
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
                      <Label htmlFor="email">Correo Electrónico *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={teacherForm.email}
                        onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        value={teacherForm.phone}
                        onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campus">Campus *</Label>
                      <Input
                        id="campus"
                        value={teacherForm.campus}
                        onChange={(e) => setTeacherForm({ ...teacherForm, campus: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvlac_link">Link CVLAC</Label>
                      <Input
                        id="cvlac_link"
                        type="url"
                        placeholder="https://..."
                        value={teacherForm.cvlac_link}
                        onChange={(e) => setTeacherForm({ ...teacherForm, cvlac_link: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orcid_link">Link ORCID</Label>
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
                    <Label htmlFor="profile_description">Perfil / Descripción *</Label>
                    <Textarea
                      id="profile_description"
                      value={teacherForm.profile_description}
                      onChange={(e) =>
                        setTeacherForm({ ...teacherForm, profile_description: e.target.value })
                      }
                      required
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interests">Intereses (Tags) *</Label>
                    <TagInput
                      tags={teacherForm.interests}
                      onChange={(tags) => setTeacherForm({ ...teacherForm, interests: tags })}
                      placeholder="Escribir interés y presionar Enter"
                    />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full">
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <PlusCircle className="h-4 w-4 mr-2" />
                    )}
                    Crear Perfil de Investigador
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Professor;
