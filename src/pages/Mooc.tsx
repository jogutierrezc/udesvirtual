import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  PlayCircle, 
  FileText, 
  CheckCircle, 
  Clock, 
  Users, 
  Star,
  Search,
  Filter,
  TrendingUp,
  Award
} from "lucide-react";

// Datos de ejemplo para cursos MOOC
const mockCourses = [
  {
    id: 1,
    title: "Introducción a la Inteligencia Artificial",
    description: "Aprende los fundamentos de IA y Machine Learning con ejemplos prácticos",
    instructor: "Dr. Carlos Méndez",
    duration: "8 semanas",
    level: "Principiante",
    students: 1234,
    rating: 4.8,
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop",
    videos: 24,
    activities: 12,
    progress: 0,
    category: "Tecnología",
    featured: true
  },
  {
    id: 2,
    title: "Marketing Digital Avanzado",
    description: "Domina las estrategias de marketing digital y redes sociales",
    instructor: "Lic. María González",
    duration: "6 semanas",
    level: "Intermedio",
    students: 892,
    rating: 4.6,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop",
    videos: 18,
    activities: 10,
    progress: 0,
    category: "Negocios",
    featured: true
  },
  {
    id: 3,
    title: "Desarrollo Web Full Stack",
    description: "Conviértete en desarrollador full stack con React, Node.js y MongoDB",
    instructor: "Ing. Juan Rodríguez",
    duration: "12 semanas",
    level: "Intermedio",
    students: 2156,
    rating: 4.9,
    thumbnail: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=400&h=250&fit=crop",
    videos: 36,
    activities: 20,
    progress: 0,
    category: "Tecnología",
    featured: true
  },
  {
    id: 4,
    title: "Gestión de Proyectos Ágiles",
    description: "Aprende Scrum, Kanban y metodologías ágiles para gestionar proyectos",
    instructor: "MBA. Ana Torres",
    duration: "5 semanas",
    level: "Intermedio",
    students: 687,
    rating: 4.7,
    thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop",
    videos: 15,
    activities: 8,
    progress: 0,
    category: "Gestión",
    featured: false
  },
  {
    id: 5,
    title: "Diseño UX/UI Profesional",
    description: "Crea experiencias de usuario excepcionales con herramientas modernas",
    instructor: "Dis. Laura Martínez",
    duration: "7 semanas",
    level: "Principiante",
    students: 1543,
    rating: 4.8,
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop",
    videos: 21,
    activities: 15,
    progress: 0,
    category: "Diseño",
    featured: false
  },
  {
    id: 6,
    title: "Análisis de Datos con Python",
    description: "Domina Python, Pandas y visualización de datos para tomar decisiones",
    instructor: "Dr. Roberto Silva",
    duration: "10 semanas",
    level: "Intermedio",
    students: 978,
    rating: 4.9,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
    videos: 30,
    activities: 18,
    progress: 0,
    category: "Tecnología",
    featured: false
  }
];

export default function Mooc() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");

  const categories = ["Todos", "Tecnología", "Negocios", "Gestión", "Diseño"];
  const levels = ["Todos", "Principiante", "Intermedio", "Avanzado"];

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel;
    return matchesSearch && matchesCategory && matchesLevel;
  });

  const featuredCourses = mockCourses.filter(course => course.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Más de 5,000 estudiantes aprendiendo</span>
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
                <div className="text-3xl font-bold">{mockCourses.length}</div>
                <div className="text-sm text-white/80">Cursos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">5K+</div>
                <div className="text-sm text-white/80">Estudiantes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold">4.8</div>
                <div className="text-sm text-white/80">Rating</div>
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
        {/* Featured Courses */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl md:text-3xl font-bold">Cursos Destacados</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <Card key={course.id} className="group hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-yellow-500 text-white border-0">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Destacado
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="secondary">{course.category}</Badge>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-lg group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{course.instructor}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <PlayCircle className="h-4 w-4 text-indigo-600" />
                      <span>{course.videos}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-purple-600" />
                      <span>{course.activities}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-pink-600" />
                      <span>{course.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold">{course.rating}</span>
                      <span className="text-sm text-muted-foreground">({course.students})</span>
                    </div>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
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
            <div className="flex gap-2">
              {levels.map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === (level === "Todos" ? "all" : level) ? "default" : "outline"}
                  onClick={() => setSelectedLevel(level === "Todos" ? "all" : level)}
                  size="sm"
                >
                  {level}
                </Button>
              ))}
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
                  Intenta con otros términos de búsqueda o filtros
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                    setSelectedLevel("all");
                  }}
                >
                  Limpiar filtros
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary">{course.category}</Badge>
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{course.instructor}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <PlayCircle className="h-4 w-4 text-indigo-600" />
                        <span>{course.videos}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <span>{course.activities}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-pink-600" />
                        <span>{course.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="font-semibold">{course.rating}</span>
                        <span className="text-sm text-muted-foreground">({course.students})</span>
                      </div>
                      <Badge variant="outline">{course.level}</Badge>
                    </div>

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
      </div>
    </div>
  );
}
