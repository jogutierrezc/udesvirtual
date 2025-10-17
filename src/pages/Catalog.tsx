import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { LiaChat } from "@/components/LiaChat";
import { EmptyState } from "@/components/EmptyState";
import { Search, Calendar, Users, MapPin, Video, BookOpen, UserPlus, MessageSquare, X, GraduationCap, Award, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Catalog = () => {
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [selectedOffering, setSelectedOffering] = useState<any>(null);
  const [registering, setRegistering] = useState(false);
  
  // Vista activa: 'courses' | 'teachers'
  const [activeView, setActiveView] = useState<'courses' | 'teachers'>('courses');
  
  // Filtros
  const [selectedKnowledgeArea, setSelectedKnowledgeArea] = useState<string>("all");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedCampus, setSelectedCampus] = useState<string>("all");
  
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
    
    const matchesSearch = (
      c.title.toLowerCase().includes(searchLower) ||
      areasMatch ||
      c.profession.toLowerCase().includes(searchLower) ||
      c.allied_professor?.toLowerCase().includes(searchLower) ||
      c.allied_institution?.toLowerCase().includes(searchLower)
    );

    // Filtro por área de conocimiento
    const matchesKnowledgeArea = selectedKnowledgeArea === "all" || (
      Array.isArray(c.knowledge_area)
        ? c.knowledge_area.includes(selectedKnowledgeArea)
        : c.knowledge_area === selectedKnowledgeArea
    );

    // Filtro por programa (profession)
    const matchesProgram = selectedProgram === "all" || c.profession === selectedProgram;

    // Filtro por campus
    const matchesCampus = selectedCampus === "all" || c.campus === selectedCampus;

    return matchesSearch && matchesKnowledgeArea && matchesProgram && matchesCampus;
  });

  // Obtener valores únicos para los filtros
  const knowledgeAreas = Array.from(
    new Set(
      classes.flatMap((c) => 
        Array.isArray(c.knowledge_area) ? c.knowledge_area : c.knowledge_area ? [c.knowledge_area] : []
      )
    )
  ).sort();

  const programs = Array.from(new Set(classes.map((c) => c.profession).filter(Boolean))).sort();
  const campuses = Array.from(new Set(classes.map((c) => c.campus).filter(Boolean))).sort();

  const filteredTeachers = teachers.filter(
    (t) =>
      t.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.campus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.interests.some((i: string) => i.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRegister = async (e: React.FormEvent, classId?: string | number) => {
    e.preventDefault();
    setRegistering(true);

    try {
      const targetClassId = classId ?? selectedClass?.id ?? selectedDetails?.id;
      const { error } = await supabase.from("class_registrations").insert({
        class_id: targetClassId,
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
      const classForLink = selectedClass ?? selectedDetails;
      if (classForLink?.virtual_room_link) {
        setClassLink(classForLink.virtual_room_link);
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
      setSelectedDetails(null);
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

  const handleCopyLink = async () => {
    if (!classLink) return;
    try {
      await navigator.clipboard.writeText(classLink);
      toast({
        title: "Enlace copiado",
        description: "El enlace de la clase se ha copiado al portapapeles.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-primary via-primary/90 to-accent text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Title Section */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-6 w-6" />
              <h1 className="text-2xl md:text-3xl font-bold">Catálogo Académico UDES</h1>
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-white/90 text-sm md:text-base">
              Explora nuestras opciones de internacionalización y desarrollo académico
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Catálogo de Cursos */}
            <Card 
              className={`bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer group ${
                activeView === 'courses' ? 'ring-2 ring-white shadow-lg' : ''
              }`}
              onClick={() => setActiveView('courses')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="font-semibold text-base text-white mb-0.5">Catálogo de Cursos</h3>
                    <p className="text-xs text-white/80 mb-1">Clases Espejo y MasterClass</p>
                    <Badge variant="secondary" className="bg-white/90 text-primary text-xs">
                      {classes.length} cursos
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Docentes Investigadores */}
            <Card 
              className={`bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer group ${
                activeView === 'teachers' ? 'ring-2 ring-white shadow-lg' : ''
              }`}
              onClick={() => setActiveView('teachers')}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <h3 className="font-semibold text-base text-white mb-0.5">Docentes Investigadores</h3>
                    <p className="text-xs text-white/80 mb-1">Expertos UDES</p>
                    <Badge variant="secondary" className="bg-white/90 text-primary text-xs">
                      {teachers.length} docentes
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LIA - Asistente Virtual */}
            <Link to="/lia" className="block">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer group h-full">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h3 className="font-semibold text-base text-white mb-0.5">Hablar con LIA</h3>
                      <p className="text-xs text-white/80 mb-1">Asistente Virtual UDES</p>
                      <Badge variant="secondary" className="bg-accent text-white text-xs">
                        IA 24/7
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </header>

      {/* Search and Filters - Only for Courses */}
      {activeView === 'courses' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por título, área de conocimiento, campus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Knowledge Area Filter */}
            <div>
              <Label className="text-xs mb-1.5 block">Área de Conocimiento</Label>
              <Select value={selectedKnowledgeArea} onValueChange={setSelectedKnowledgeArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  {knowledgeAreas.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Program Filter */}
            <div>
              <Label className="text-xs mb-1.5 block">Programa</Label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los programas</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program} value={program}>
                      {program}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campus Filter */}
            <div>
              <Label className="text-xs mb-1.5 block">Campus</Label>
              <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los campus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los campus</SelectItem>
                  {campuses.map((campus) => (
                    <SelectItem key={campus} value={campus}>
                      {campus}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reset Filters Button */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedKnowledgeArea("all");
                  setSelectedProgram("all");
                  setSelectedCampus("all");
                  setSearchTerm("");
                }}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(selectedKnowledgeArea !== "all" || selectedProgram !== "all" || selectedCampus !== "all") && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {selectedKnowledgeArea !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {selectedKnowledgeArea}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedKnowledgeArea("all")}
                  />
                </Badge>
              )}
              {selectedProgram !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {selectedProgram}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedProgram("all")}
                  />
                </Badge>
              )}
              {selectedCampus !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCampus}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSelectedCampus("all")}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Classes Section */}
      {activeView === 'courses' && (
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Clases y MasterClasses</h2>
          <span className="text-sm text-muted-foreground">
            {filteredClasses.length} {filteredClasses.length === 1 ? 'clase encontrada' : 'clases encontradas'}
          </span>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : filteredClasses.length === 0 ? (
          <EmptyState 
            type="catalog" 
            searchTerm={searchTerm || selectedKnowledgeArea !== "all" || selectedProgram !== "all" || selectedCampus !== "all" ? 
              `${searchTerm} ${selectedKnowledgeArea !== "all" ? selectedKnowledgeArea : ''} ${selectedProgram !== "all" ? selectedProgram : ''} ${selectedCampus !== "all" ? selectedCampus : ''}`.trim() : 
              undefined
            } 
          />
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
                    <div className="flex gap-2 w-full">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="flex-1" onClick={() => setSelectedDetails(classItem)}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            Ver más
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-full max-w-5xl mx-4 sm:mx-auto rounded-lg p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalles: {classItem.title}</DialogTitle>
                            <DialogDescription>Información completa del curso y registro</DialogDescription>
                          </DialogHeader>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {/* Left: course info */}
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground text-justify">{classItem.description}</p>
                              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div>
                                  <p className="font-medium">Profesor Aliado</p>
                                  <p>{classItem.allied_professor}</p>
                                  {classItem.allied_institution && <p>{classItem.allied_institution}</p>}
                                </div>
                                <div>
                                  <p className="font-medium">Fecha</p>
                                  <p>{new Date(classItem.class_date).toLocaleString("es-ES")}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Campus</p>
                                  <p>{classItem.campus}</p>
                                </div>
                                <div>
                                  <p className="font-medium">Capacidad</p>
                                  <p>{classItem.capacity}</p>
                                </div>
                              </div>

                              {classItem.knowledge_area && (
                                <div>
                                  <p className="font-medium mb-2">Áreas</p>
                                  <div className="flex flex-wrap gap-2">
                                    {Array.isArray(classItem.knowledge_area)
                                      ? classItem.knowledge_area.map((a: string, i: number) => (
                                          <Badge key={i} variant="outline">{a}</Badge>
                                        ))
                                      : <Badge variant="outline">{classItem.knowledge_area}</Badge>
                                    }
                                  </div>
                                </div>
                              )}

                              {classItem.virtual_room_required && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Video className="h-4 w-4" />
                                  <p className="text-justify">Sala virtual disponible</p>
                                </div>
                              )}
                            </div>

                            {/* Right: registration form */}
                            <div className="bg-muted/5 p-4 rounded-md">
                              {/* Close button top-right (redundant with global close but ensures visibility) */}
                              <DialogClose className="absolute right-4 top-4 rounded-sm opacity-80 bg-transparent hover:opacity-100">
                                <button aria-label="Cerrar" className="flex items-center justify-center">
                                  <X className="h-4 w-4" />
                                </button>
                              </DialogClose>
                              <h3 className="font-semibold mb-3">Formulario de Registro</h3>
                              <form onSubmit={(e) => handleRegister(e, classItem.id)} className="space-y-4">
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
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={selectedClass?.id === classItem.id} onOpenChange={(open) => !open && setSelectedClass(null)}>
                        <DialogTrigger asChild>
                          <Button className="flex-1" onClick={() => setSelectedClass(classItem)}>
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
                    </div>
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
              <div className="flex flex-col gap-4 items-stretch py-2">
                <a
                  href={classLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline break-all text-center"
                >
                  {classLink}
                </a>
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(classLink, "_blank", "noopener,noreferrer")}
                    className="flex-1"
                  >
                    Abrir clase en nueva ventana
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
                    Copiar enlace
                  </Button>
                </div>
              </div>
            </DialogContent>
        </Dialog>
      </section>
      )}

      {/* Teachers Section */}
      {activeView === 'teachers' && (
      <section className="max-w-6xl mx-auto px-4 pb-16 pt-8">
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
      )}

      <LiaChat />
    </div>
  );
};

export default Catalog;
