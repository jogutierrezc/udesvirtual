import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LiaChat } from "@/components/LiaChat";
import { Search, Calendar, Users, MapPin, Video, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const Catalog = () => {
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

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

  const filteredClasses = classes.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.knowledge_area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.profession.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeachers = teachers.filter(
    (t) =>
      t.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.campus.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.interests.some((i: string) => i.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Catálogo Académico</h1>
            <p className="text-white/80">Clases Espejo, MasterClass y Docentes</p>
          </div>
          <Link to="/">
            <Button variant="secondary">Inicio</Button>
          </Link>
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
                      <CardDescription>{classItem.allied_professor}</CardDescription>
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
                    <Badge variant="outline">{classItem.knowledge_area}</Badge>
                    <Badge variant="outline">{classItem.profession}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
