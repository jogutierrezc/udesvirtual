import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Clock, 
  BookOpen, 
  Award, 
  PlayCircle, 
  Target,
  Users,
  CheckCircle,
  ArrowLeft,
  Video
} from "lucide-react";

// Datos de ejemplo expandidos para cursos MOOC
const mockCoursesData = [
  {
    id: 1,
    title: "Introducción a la Inteligencia Artificial",
    description: "Sumérgete en el fascinante mundo de la Inteligencia Artificial y el Machine Learning. Este curso te proporcionará una base sólida en los conceptos fundamentales de IA, incluyendo algoritmos de aprendizaje automático, redes neuronales y aplicaciones prácticas en el mundo real. Aprenderás a desarrollar modelos de IA utilizando Python y bibliotecas populares como TensorFlow y scikit-learn.",
    instructor: {
      name: "Dr. Carlos Méndez",
      title: "Doctor en Ciencias de la Computación",
      bio: "Investigador con más de 15 años de experiencia en Inteligencia Artificial y Machine Learning. Ha publicado más de 50 artículos en revistas especializadas.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
    },
    duration: "8 semanas",
    totalHours: 32,
    lessonsCount: 24,
    level: "Principiante",
    students: 1234,
    rating: 4.8,
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
    videos: 24,
    activities: 12,
    certified: true,
    category: "Tecnología",
    introVideo: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    objectives: [
      "Comprender los fundamentos de la Inteligencia Artificial y Machine Learning",
      "Implementar algoritmos de aprendizaje supervisado y no supervisado",
      "Desarrollar y entrenar redes neuronales básicas",
      "Aplicar técnicas de IA para resolver problemas del mundo real",
      "Utilizar herramientas y bibliotecas populares como TensorFlow y scikit-learn"
    ],
    collaborators: [
      {
        name: "Dra. Ana Martínez",
        role: "Instructora Asociada",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
      },
      {
        name: "Ing. Roberto Silva",
        role: "Tutor Técnico",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
      },
      {
        name: "Lic. María González",
        role: "Coordinadora Académica",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop"
      }
    ],
    syllabus: [
      {
        module: "Módulo 1: Introducción a la IA",
        description: "Fundamentos y conceptos básicos de Inteligencia Artificial",
        learningObjectives: [
          "Definir qué es la Inteligencia Artificial",
          "Identificar las diferentes ramas de la IA",
          "Comprender la historia y evolución de la IA"
        ],
        lessons: [
          { title: "¿Qué es la Inteligencia Artificial?", duration: "15 min", type: "video" },
          { title: "Historia de la IA", duration: "20 min", type: "video" },
          { title: "Aplicaciones actuales de IA", duration: "25 min", type: "video" },
          { title: "Quiz: Conceptos básicos", duration: "10 min", type: "quiz" }
        ]
      },
      {
        module: "Módulo 2: Machine Learning Básico",
        description: "Introducción a los algoritmos de aprendizaje automático",
        learningObjectives: [
          "Diferenciar entre aprendizaje supervisado y no supervisado",
          "Implementar algoritmos de regresión y clasificación",
          "Evaluar modelos de machine learning"
        ],
        lessons: [
          { title: "Tipos de Machine Learning", duration: "18 min", type: "video" },
          { title: "Regresión Lineal", duration: "22 min", type: "video" },
          { title: "Clasificación con KNN", duration: "25 min", type: "video" },
          { title: "Práctica: Primer modelo ML", duration: "30 min", type: "lab" },
          { title: "Quiz: Machine Learning", duration: "15 min", type: "quiz" }
        ]
      },
      {
        module: "Módulo 3: Redes Neuronales",
        description: "Fundamentos de redes neuronales artificiales",
        learningObjectives: [
          "Comprender la estructura de una red neuronal",
          "Implementar redes neuronales con TensorFlow",
          "Entrenar y optimizar modelos neuronales"
        ],
        lessons: [
          { title: "Anatomía de una neurona artificial", duration: "20 min", type: "video" },
          { title: "Propagación hacia adelante", duration: "25 min", type: "video" },
          { title: "Backpropagation", duration: "28 min", type: "video" },
          { title: "Práctica: Red Neuronal Simple", duration: "35 min", type: "lab" },
          { title: "Proyecto: Clasificación de imágenes", duration: "45 min", type: "project" }
        ]
      },
      {
        module: "Módulo 4: Proyecto Final",
        description: "Aplicación práctica de todos los conceptos aprendidos",
        learningObjectives: [
          "Desarrollar un proyecto completo de IA",
          "Presentar y documentar soluciones de IA",
          "Aplicar mejores prácticas en desarrollo de IA"
        ],
        lessons: [
          { title: "Planificación del proyecto", duration: "20 min", type: "video" },
          { title: "Desarrollo del proyecto", duration: "120 min", type: "project" },
          { title: "Presentación y evaluación", duration: "30 min", type: "assignment" }
        ]
      }
    ]
  }
];

export default function MoocDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  // Buscar el curso por ID
  const course = mockCoursesData.find(c => c.id === Number(id));

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Curso no encontrado</h2>
          <Button onClick={() => navigate("/mooc")}>Volver a cursos</Button>
        </div>
      </div>
    );
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-4 w-4" />;
      case "quiz": return <CheckCircle className="h-4 w-4" />;
      case "lab": return <BookOpen className="h-4 w-4" />;
      case "project": return <Target className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section con imagen de fondo */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        {/* Imagen de fondo */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${course.thumbnail})` }}
        />
        
        {/* Degradado blanco desde abajo */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
        
        {/* Contenido sobre la imagen */}
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8 md:pb-12">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/mooc")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a cursos
            </Button>
            
            {/* Badges de información */}
            <div className="flex flex-wrap gap-3 mb-4">
              <Badge variant="secondary" className="bg-white backdrop-blur-sm text-blue-600 text-sm py-1.5 px-3">
                <Clock className="h-4 w-4 mr-1.5 text-blue-600" />
                {course.totalHours} horas
              </Badge>
              <Badge variant="secondary" className="bg-white backdrop-blur-sm text-blue-600 text-sm py-1.5 px-3">
                <BookOpen className="h-4 w-4 mr-1.5 text-blue-600" />
                {course.lessonsCount} lecciones
              </Badge>
              {course.certified && (
                <Badge variant="secondary" className="bg-yellow-500 backdrop-blur-sm text-white text-sm py-1.5 px-3">
                  <Award className="h-4 w-4 mr-1.5 text-white" />
                  Certificado
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal (izquierda) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Título y descripción */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => setShowIntroVideo(true)}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <PlayCircle className="h-5 w-5 mr-2" />
                Ver Introducción
              </Button>
              <Button 
                size="lg"
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <BookOpen className="h-5 w-5 mr-2" />
                Tomar Curso
              </Button>
            </div>

            {/* Perfil del instructor */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={course.instructor.avatar} alt={course.instructor.name} />
                    <AvatarFallback>{course.instructor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{course.instructor.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{course.instructor.title}</p>
                    <p className="text-sm">{course.instructor.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contenido programático */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Contenido del Curso</CardTitle>
                <CardDescription>
                  {course.syllabus.length} módulos • {course.lessonsCount} lecciones • {course.totalHours} horas totales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {course.syllabus.map((module, index) => (
                    <AccordionItem key={index} value={`module-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex-1">
                          <div className="font-semibold">{module.module}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {module.description}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {/* Objetivos de aprendizaje */}
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-semibold text-sm text-blue-900 mb-2 flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              Objetivos de Aprendizaje
                            </h4>
                            <ul className="space-y-1">
                              {module.learningObjectives.map((objective, idx) => (
                                <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  <span>{objective}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Lista de lecciones */}
                          <div className="space-y-2">
                            {module.lessons.map((lesson, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="text-indigo-600">
                                    {getLessonIcon(lesson.type)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">{lesson.title}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{lesson.type}</div>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {lesson.duration}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Columna lateral (derecha) */}
          <div className="space-y-6">
            {/* Objetivos del curso */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600" />
                  Objetivos del Curso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {course.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Colaboradores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Colaboradores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.collaborators.map((collaborator, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                        <AvatarFallback>{collaborator.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">{collaborator.name}</div>
                        <div className="text-xs text-muted-foreground">{collaborator.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nivel</span>
                  <Badge variant="outline">{course.level}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Duración</span>
                  <span className="font-medium">{course.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estudiantes</span>
                  <span className="font-medium">{course.students.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Categoría</span>
                  <span className="font-medium">{course.category}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-medium">⭐ {course.rating}/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de video de introducción */}
      <Dialog open={showIntroVideo} onOpenChange={setShowIntroVideo}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Video de Introducción</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
            <iframe
              className="w-full h-full"
              src={course.introVideo}
              title="Video de introducción"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
