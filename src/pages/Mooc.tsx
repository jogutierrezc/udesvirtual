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
  Star,
  Search,
  Filter,
  TrendingUp,
  Award,
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

      // Obtener información adicional de cada curso
      const coursesWithDetails = await Promise.all(
        (coursesData || []).map(async (course) => {
          // Obtener información del creador
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", course.created_by)
            .single();

          // Obtener lecciones para calcular duración y cantidad
          const { data: lessonsData } = await supabase
            .from("mooc_lessons")
            .select("duration_hours")
            .eq("course_id", course.id);

          const totalDuration = lessonsData?.reduce((sum, lesson) => sum + (lesson.duration_hours || 0), 0) || 0;
          const lessonCount = lessonsData?.length || 0;

          return {
            ...course,
            creator: profileData ? { full_name: profileData.full_name } : undefined,
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

  // Obtener categorías únicas de los tags
  const categories = ["Todos", ...Array.from(new Set(courses.flatMap(c => c.tags || [])))];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.profession.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.tags?.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Los primeros 3 cursos son destacados
  const featuredCourses = courses.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Plataforma de Aprendizaje UDES</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold">
              Aprende a tu ritmo
            </h1>
            <p className="text-xl md:text-2xl text-white/90">
              Cursos virtuales de calidad con videos, contenido interactivo y certificados
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Buscar cursos por título, tema o instructor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-6 text-lg bg-white/95 backdrop-blur-sm border-0 shadow-xl"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">{loading ? "..." : courses.length}</div>
                <div className="text-sm text-white/80">Cursos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">{loading ? "..." : courses.reduce((sum, c) => sum + (c.lesson_count || 0), 0)}</div>
                <div className="text-sm text-white/80">Lecciones</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">{loading ? "..." : courses.reduce((sum, c) => sum + (c.total_duration || 0), 0)}h</div>
                <div className="text-sm text-white/80">Contenido</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">100%</div>
                <div className="text-sm text-white/80">Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          </div>
        ) : (
          <>
            {/* Featured Courses */}
            {featuredCourses.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="h-6 w-6 text-yellow-500" />
                  <h2 className="text-2xl md:text-3xl font-bold">Cursos Destacados</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredCourses.map((course) => (
                    <Card key={course.id} className="group hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
                        {course.course_image_url ? (
                          <img 
                            src={course.course_image_url} 
                            alt={course.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-indigo-300" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-yellow-500 text-white border-0">
                            <Star className="h-3 w-3 mr-1" />
                            Destacado
                          </Badge>
                        </div>
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

                        {course.tags && course.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {course.tags.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <Button 
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700" 
                          onClick={() => navigate(`/mooc/${course.id}`)}
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Ver Curso
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Filters */}
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Filter className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl md:text-3xl font-bold">Todos los Cursos</h2>
                <span className="text-muted-foreground">({filteredCourses.length})</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === (category === "Todos" ? "all" : category) ? "default" : "outline"}
                        onClick={() => setSelectedCategory(category === "Todos" ? "all" : category)}
                        size="sm"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* All Courses */}
            <section>
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
                        : "Intenta con otros términos de búsqueda o filtros"}
                    </p>
                    {courses.length > 0 && (
                      <Button 
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCategory("all");
                        }}
                      >
                        Limpiar filtros
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
