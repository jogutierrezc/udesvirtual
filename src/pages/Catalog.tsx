import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LiaChat } from "@/components/LiaChat";
import { Search, Calendar, Users, MapPin, Video, BookOpen, UserPlus, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Catalog = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [registering, setRegistering] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    institution: "",
    country: "",
    participant_type: "",
  });
  // Estado para mostrar el modal con el link
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [classLink, setClassLink] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load approved classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .eq("status", "approved")
        .order("class_date", { ascending: true });

      if (classesError) throw classesError;

      // Load approved teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select("*")
        .eq("status", "approved")
        .order("teacher_name", { ascending: true });

      if (teachersError) throw teachersError;

      setClasses(classesData || []);
      setTeachers(teachersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    const areasMatch = Array.isArray(c.knowledge_area) 
      ? c.knowledge_area.some((area) => area.toLowerCase().includes(searchLower))
      : c.knowledge_area?.toLowerCase().includes(searchLower);
    
    return (
      c.title.toLowerCase().includes(searchLower) ||
      areasMatch ||
      c.profession.toLowerCase().includes(searchLower) ||
      c.allied_professor?.toLowerCase().includes(searchLower) ||
      c.allied_institution?.toLowerCase().includes(searchLower)
    );
  });

  const filteredTeachers = teachers.filter(
    (t) =>
      t.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.campus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.interests.some((i: string) => i.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);

    try {
      const { error } = await supabase.from("class_registrations").insert({
        class_id: selectedClass.id,
        ...registrationForm,
      });

      if (error) throw error;

      toast({
        title: "¡Registro Exitoso! 🎉",
        description: selectedClass.virtual_room_link 
          ? "Se ha registrado correctamente. Aquí está el link de acceso a la clase virtual."
          : "Se ha registrado correctamente.",
      });

      // Mostrar el link en un modal pop-up
      if (selectedClass.virtual_room_link) {
        setClassLink(selectedClass.virtual_room_link);
        setShowLinkModal(true);
      }

      setRegistrationForm({
        full_name: "",
        phone: "",
        email: "",
        institution: "",
        country: "",
        participant_type: "",
      });
      setSelectedClass(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Catálogo Académico</h1>
            <p className="text-white/80">Clases Espejo, MasterClass y Docentes</p>
          </div>
          <div className="flex gap-2">
            <Link to="/lia">
              <Button variant="secondary">
                <MessageSquare className="h-4 w-4 mr-2" />
                Hablar con LIA
              </Button>
            </Link>
            <Link to="/">
              <Button variant="secondary">Inicio</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por título, área de conocimiento, campus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Classes Section */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <h2 className="text-2xl font-bold mb-6">Clases y MasterClasses</h2>
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : filteredClasses.length === 0 ? (
          <p className="text-muted-foreground">No se encontraron clases</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredClasses.map((classItem) => (
              <Card key={classItem.id} className="shadow-card hover:shadow-elegant transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="mb-2">{classItem.title}</CardTitle>
                      <CardDescription>
                        <strong>Profesor Aliado:</strong> {classItem.allied_professor}
                        {classItem.allied_institution && ` - ${classItem.allied_institution}`}
                      </CardDescription>
                    </div>
                    <Badge variant={classItem.class_type === "mirror" ? "default" : "secondary"}>
                      {classItem.class_type === "mirror" ? "Clase Espejo" : "MasterClass"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{classItem.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(classItem.class_date).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {classItem.campus}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Capacidad: {classItem.capacity} estudiantes
                    </div>
                    {classItem.virtual_room_required && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="h-4 w-4" />
                        Sala virtual disponible
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {Array.isArray(classItem.knowledge_area) ? (
                      classItem.knowledge_area.map((area, i) => (
                        <Badge key={i} variant="outline">{area}</Badge>
                      ))
                    ) : (
                      <Badge variant="outline">{classItem.knowledge_area}</Badge>
                    )}
                    <Badge variant="outline">{classItem.profession}</Badge>
                  </div>
                  <Dialog open={selectedClass?.id === classItem.id} onOpenChange={(open) => !open && setSelectedClass(null)}>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-2" onClick={() => setSelectedClass(classItem)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Registrarse
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Registro para: {classItem.title}</DialogTitle>
                        <DialogDescription>Complete el formulario para registrarse en esta clase</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="full_name">Nombre Completo *</Label>
                          <Input
                            id="full_name"
                            value={registrationForm.full_name}
                            onChange={(e) => setRegistrationForm({ ...registrationForm, full_name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Teléfono *</Label>
                          <Input
                            id="phone"
                            value={registrationForm.phone}
                            onChange={(e) => setRegistrationForm({ ...registrationForm, phone: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Correo Electrónico *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={registrationForm.email}
                            onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="institution">Institución de Origen *</Label>
                          <Input
                            id="institution"
                            value={registrationForm.institution}
                            onChange={(e) => setRegistrationForm({ ...registrationForm, institution: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">País *</Label>
                          <Input
                            id="country"
                            value={registrationForm.country}
                            onChange={(e) => setRegistrationForm({ ...registrationForm, country: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="participant_type">Tipo de Participante *</Label>
                          <Select
                            value={registrationForm.participant_type}
                            onValueChange={(value) => setRegistrationForm({ ...registrationForm, participant_type: value })}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Estudiante">Estudiante</SelectItem>
                              <SelectItem value="Docente">Docente</SelectItem>
                              <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full" disabled={registering}>
                          {registering ? "Registrando..." : "Confirmar Registro"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* Modal pop-up para mostrar el link de la clase */}
        <Dialog open={showLinkModal} onOpenChange={(open) => !open && setShowLinkModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Acceso a la clase virtual</DialogTitle>
              <DialogDescription>
                ¡Registro exitoso! Aquí tienes el link de acceso a la clase virtual:
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 items-center py-2">
              <a
                href={classLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline break-all text-center"
              >
                {classLink}
              </a>
              <Button
                onClick={() => window.open(classLink, "_blank", "noopener,noreferrer")}
                className="w-full"
              >
                Abrir clase en nueva ventana
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* Teachers Section */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6">Docentes Investigadores</h2>
        
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : filteredTeachers.length === 0 ? (
          <p className="text-muted-foreground">No se encontraron docentes</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <Card key={teacher.id} className="shadow-card hover:shadow-elegant transition-all">
                <CardHeader>
                  <CardTitle>{teacher.teacher_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    {teacher.campus}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {teacher.profile_description}
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <p className="font-medium">Contacto:</p>
                    <p className="text-muted-foreground">{teacher.email}</p>
                    <p className="text-muted-foreground">{teacher.phone}</p>
                  </div>

                  {teacher.interests && teacher.interests.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-2">Intereses:</p>
                      <div className="flex flex-wrap gap-2">
                        {teacher.interests.map((interest: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {teacher.cvlac_link && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={teacher.cvlac_link} target="_blank" rel="noopener noreferrer">
                          <BookOpen className="h-3 w-3 mr-1" />
                          CVLAC
                        </a>
                      </Button>
                    )}
                    {teacher.orcid_link && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={teacher.orcid_link} target="_blank" rel="noopener noreferrer">
                          ORCID
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <LiaChat />
    </div>
  );
};

export default Catalog;
