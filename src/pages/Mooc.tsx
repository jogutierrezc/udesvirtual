import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  PlayCircle, 
  Clock, 
  Users, 
  Search,
  Loader2
} from "lucide-react";

type Course = {
  id: string;
  title: string;
  description: string;
  profession: string;
  tags: string[];
  objective: string;
  course_image_url: string | null;
  intro_video_url: string | null;
  created_at: string;
  creator?: {
    full_name: string;
  };
  total_duration?: number;
  lesson_count?: number;
};

export default function Mooc() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Categorías predefinidas
  const predefinedCategories = [
    "Negocios y Finanzas",
    "Ciencia y Tecnología",
    "Salud y Bienestar",
    "Ciencias Sociales y Humanidades",
    "Educación y Desarrollo Profesional",
    "Arte, Cultura e Idiomas",
    "Sostenibilidad y Gestión de Riesgos"
  ];

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      console.log("Cargando cursos MOOC aprobados...");

      // Obtener solo cursos aprobados
      const { data: coursesData, error: coursesError } = await supabase
        .from("mooc_courses")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (coursesError) {
        console.error("Error loading courses:", coursesError);
        throw coursesError;
      }

      console.log("Cursos aprobados cargados:", coursesData);

      // Recolectar creator ids y hacer un solo fetch al endpoint serverless (usa service role)
      const creatorIds = Array.from(new Set((coursesData || []).map((c: any) => c.created_by).filter(Boolean)));
      let profileMap = new Map();
      if (creatorIds.length > 0) {
        try {
          const resp = await fetch('/api/get-creators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: creatorIds }),
          });
          if (resp.ok) {
            const json = await resp.json();
            const profiles = json.profiles || {};
            Object.keys(profiles).forEach((id) => profileMap.set(id, profiles[id]));
          } else {
            console.warn('get-creators API failed', await resp.text());
          }
        } catch (err) {
          console.warn('Call to /api/get-creators failed:', err);
        }
      }

      const coursesWithDetails = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Obtener lecciones para calcular duración y cantidad
          const { data: lessonsData } = await supabase
            .from("mooc_lessons")
            .select("duration_hours")
            .eq("course_id", course.id);

          const totalDuration = lessonsData?.reduce((sum, lesson) => sum + (lesson.duration_hours || 0), 0) || 0;
          const lessonCount = lessonsData?.length || 0;

          const profile = profileMap.get(course.created_by);
          const derivedName = profile?.full_name || course.created_by || 'Instructor';

          return {
            ...course,
            creator: { full_name: derivedName },
            total_duration: totalDuration,
            lesson_count: lessonCount,
          };
        })
      );

      console.log("Cursos con detalles:", coursesWithDetails);
      coursesWithDetails.forEach((c, i) => {
        console.log(`Curso[${i}]: id=${c.id}, title=${c.title}, status=${c.status}, tags=${JSON.stringify(c.tags)}, profession=${c.profession}`);
      });
      setCourses(coursesWithDetails);
    } catch (error: any) {
      console.error("Error loading courses:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los cursos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Obtener categorías predefinidas que realmente tienen cursos asociados
  const availablePredefinedCategories = predefinedCategories.filter((cat) =>
    courses.some((course) => course.tags?.includes(cat))
  );

  // Mostrar 'all' más las categorías disponibles
  const categories = ["all", ...availablePredefinedCategories];

  const filteredCourses = courses.filter(course => {
    const matchesCategory = selectedCategory === "all" || course.tags?.includes(selectedCategory);
    return matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* Header con título */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm mb-4">
                <BookOpen className="h-4 w-4" />
                EXPLORA LOS CURSOS
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Selecciona la categoría de tu interés, explora los contenidos de los MOOC e inscríbete:
              </h2>
            </div>

            {/* Título de categorías */}
            <div className="text-center mb-8">
              <h3 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent">
                {selectedCategory === "all" ? "Selecciona una categoría" : selectedCategory}
              </h3>
              <div className="mt-4">
                <Button
                  variant="ghost"
                  onClick={() => window.location.assign('/mooc/categories')}
                  className="text-sm text-indigo-600 underline"
                >
                  Explorar todas las categorías →
                </Button>
              </div>
            </div>

            {/* Explorador de cursos - pequeño carousel horizontal */}
            <section className="mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row items-stretch gap-6">
                  <div className="lg:w-1/3 min-w-[220px] flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-sm mb-4">
                      <BookOpen className="h-4 w-4" />
                      EXPLORAR CURSOS
                    </div>
                    <h3 className="text-2xl font-bold">Explorar Cursos</h3>
                    <p className="text-gray-600 mt-2">Descubre cursos destacados y por roles. Desliza para ver más.</p>
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => setSelectedCategory('all')}>Ver todo</Button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="overflow-x-auto">
                      <div className="flex gap-4 py-2">
                        {courses.slice(0, 8).map((course) => (
                          <div key={course.id} className="w-80 flex-shrink-0">
                            <div className="bg-white rounded-lg shadow group overflow-hidden h-full">
                              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                                {course.course_image_url ? (
                                  <img src={course.course_image_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="h-10 w-10 text-indigo-300" />
                                  </div>
                                )}
                              </div>
                              <div className="p-4">
                                <h4 className="text-sm font-semibold line-clamp-2">{course.title}</h4>
                                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{course.description}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Botones de categorías */}
            <section className="mb-12">
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {availablePredefinedCategories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category)}
                    size="lg"
                    className={`rounded-full px-6 ${
                      selectedCategory === category 
                        ? "bg-gray-800 hover:bg-gray-900 text-white" 
                        : "border-2 border-gray-800 text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Botón "Ver todos los cursos" */}
              <div className="text-center">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  size="lg"
                  className={`rounded-full px-8 ${
                    selectedCategory === "all" 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "border-2 border-green-600 text-green-600 hover:bg-green-50"
                  }`}
                >
                  Ver todos los cursos
                </Button>
              </div>
            </section>

            {/* All Courses */}
            <section>
              {selectedCategory !== "all" && filteredCourses.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-gray-800">
                    {selectedCategory} 
                    <span className="text-gray-500 text-lg ml-2">({filteredCourses.length} {filteredCourses.length === 1 ? 'curso' : 'cursos'})</span>
                  </h4>
                </div>
              )}
              
              {selectedCategory === "all" && courses.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-gray-800">
                    Todos los cursos disponibles
                    <span className="text-gray-500 text-lg ml-2">({courses.length} {courses.length === 1 ? 'curso' : 'cursos'})</span>
                  </h4>
                </div>
              )}

              {filteredCourses.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100">
                      <Search className="h-8 w-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold">No se encontraron cursos</h3>
                    <p className="text-muted-foreground">
                      {courses.length === 0 
                        ? "Aún no hay cursos disponibles. ¡Vuelve pronto!"
                        : "Intenta con otra categoría"}
                    </p>
                    {courses.length > 0 && (
                      <Button 
                        onClick={() => setSelectedCategory("all")}
                      >
                        Ver todos los cursos
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                        {course.course_image_url ? (
                          <img 
                            src={course.course_image_url} 
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-indigo-300" />
                          </div>
                        )}
                        {course.tags && course.tags.length > 0 && (
                          <div className="absolute bottom-3 left-3">
                            <Badge variant="secondary">{course.tags[0]}</Badge>
                          </div>
                        )}
                      </div>
                      <CardHeader>
                        <CardTitle className="line-clamp-2 group-hover:text-indigo-600 transition-colors">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {course.creator && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{course.creator.full_name}</span>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <PlayCircle className="h-4 w-4 text-indigo-600" />
                            <span>{course.lesson_count || 0} lecciones</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-pink-600" />
                            <span>{course.total_duration || 0}h</span>
                          </div>
                        </div>

                        {course.profession && (
                          <div className="pt-2 border-t">
                            <Badge variant="outline" className="text-xs">
                              {course.profession}
                            </Badge>
                          </div>
                        )}

                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => navigate(`/mooc/${course.id}`)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Ver Curso
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
