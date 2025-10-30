import React, { useEffect, useMemo, useState } from "react";
import hljs from 'highlight.js';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, GraduationCap, Users, Briefcase, Plane, Search, Copy, Mail, MessageSquare, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";

type FaqItem = {
  id: string;
  title: string;
  content: string;
  type: "catalogo" | "mooc" | "estudiantes" | "profesores" | "becas_movilidad";
};

type CategoryType = "catalogo" | "mooc" | "estudiantes" | "profesores" | "becas_movilidad";

const CATEGORY_INFO: Record<CategoryType, { label: string; description: string; icon: React.ReactNode }> = {
  catalogo: {
    label: "Catálogo",
    description: "Encuentra respuestas sobre cómo explorar y matricularte en cursos del catálogo de la plataforma.",
    icon: <BookOpen className="w-6 h-6 text-primary" />,
  },
  mooc: {
    label: "MOOC",
    description: "Consulta información sobre cursos abiertos masivos en línea, certificados y modalidades de aprendizaje.",
    icon: <GraduationCap className="w-6 h-6 text-primary" />,
  },
  estudiantes: {
    label: "Estudiantes",
    description: "Preguntas frecuentes sobre tu cuenta, clases, progreso y cómo aprovechar al máximo la plataforma.",
    icon: <Users className="w-6 h-6 text-primary" />,
  },
  profesores: {
    label: "Profesores",
    description: "Información para docentes sobre creación de contenido, gestión de estudiantes y perfiles públicos.",
    icon: <Briefcase className="w-6 h-6 text-primary" />,
  },
  becas_movilidad: {
    label: "Becas de Movilidad",
    description: "Descubre oportunidades de becas, convocatorias de movilidad internacional y cómo postular.",
    icon: <Plane className="w-6 h-6 text-primary" />,
  },
};

const CATEGORIES: CategoryType[] = [
  "catalogo",
  "mooc",
  "estudiantes",
  "profesores",
  "becas_movilidad",
];

const Faq: React.FC = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data, error } = await supabase
          // cast to any to avoid type errors until types are regenerated
          .from('faqs' as any)
          .select('id,title,content,type')
          .eq('status', 'published')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        if (mounted) setFaqs((data || []) as unknown as FaqItem[]);
      } catch (e) {
        console.error('Error loading FAQs', e);
        toast({ title: 'Error cargando FAQs', description: 'No se pudieron cargar las preguntas frecuentes.' });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [toast]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return faqs.filter((f) =>
      (!selectedCategory || f.type === selectedCategory) &&
      (!q || f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q))
    );
  }, [query, selectedCategory, faqs]);

  // Apply syntax highlighting when the filtered list changes
  useEffect(() => {
    hljs.highlightAll();
  }, [filtered]);

  const copyAnswer = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copiado", description: "La respuesta se copió al portapapeles." });
    } catch {
      toast({ title: "No se pudo copiar", description: "Intenta nuevamente.", });
    }
  };

  // Show category view when no category is selected, otherwise show FAQ list
  const showCategoryCards = !selectedCategory && !query;

  return (
    <>
      <Navbar />
      
      {/* Background with radial gradient */}
      <div style={{ 
        backgroundImage: 'radial-gradient(at 90% 10%, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
        minHeight: '100vh'
      }}>
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-7xl">
          
          {/* Header */}
          <header className="text-center mb-12 md:mb-16">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Bienvenido a nuestro <span className="text-primary">Centro de Ayuda</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Encuentra respuestas rápidas sobre el catálogo, profesores, estudiantes y más. Explora por categorías o busca directamente.
            </p>
          </header>

          {/* Search Bar */}
          <div className="relative max-w-xl w-full mx-auto my-10">
            <Input
              type="text"
              placeholder="Buscar respuestas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  setSelectedCategory(null); // Show results when searching
                }
              }}
              className="w-full py-6 pl-6 pr-14 text-gray-700 border-gray-200 rounded-xl shadow-md focus:ring-4 focus:ring-primary/20 focus:border-primary transition duration-150"
            />
            <button
              onClick={() => {
                if (query.trim()) {
                  setSelectedCategory(null);
                }
              }}
              aria-label="Search"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-full text-gray-500 hover:text-primary transition duration-150"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Category Cards Grid */}
          {showCategoryCards && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-12">
              {CATEGORIES.map((cat) => (
                <a
                  key={cat}
                  href={`/faq/category/${cat}`}
                  className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border border-gray-100 text-left"
                >
                  <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                    {CATEGORY_INFO[cat].icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{CATEGORY_INFO[cat].label}</h3>
                  <p className="text-sm text-gray-500 mb-6">{CATEGORY_INFO[cat].description}</p>
                  <div className="flex items-center text-primary font-medium hover:text-primary/80 transition duration-150">
                    Ver preguntas
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </a>
              ))}
            </section>
          )}

          {/* FAQ Results - shown when category selected or search query present */}
          {!showCategoryCards && (
            <div className="mt-12">
              {/* Back button */}
              {selectedCategory && !query && (
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCategory(null)}
                  className="mb-6"
                >
                  <ChevronRight className="w-4 h-4 mr-2 rotate-180" /> Volver a categorías
                </Button>
              )}

              {loading ? (
                <Card className="p-8 text-center">
                  <h3 className="text-lg font-semibold">Cargando FAQs…</h3>
                  <p className="text-muted-foreground mt-1">Un momento por favor.</p>
                </Card>
              ) : filtered.length === 0 ? (
                <Card className="p-8 text-center">
                  <h3 className="text-lg font-semibold">No encontramos resultados</h3>
                  <p className="text-muted-foreground mt-1">
                    Prueba con otras palabras o cambia la categoría.
                  </p>
                  {(selectedCategory || query) && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCategory(null);
                        setQuery("");
                      }}
                      className="mt-4"
                    >
                      Ver todas las categorías
                    </Button>
                  )}
                </Card>
              ) : (
                <>
                  {selectedCategory && (
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {CATEGORY_INFO[selectedCategory].icon}
                        </div>
                        {CATEGORY_INFO[selectedCategory].label}
                      </h2>
                      <p className="text-muted-foreground mt-2">{CATEGORY_INFO[selectedCategory].description}</p>
                    </div>
                  )}
                  <Card className="p-2 sm:p-4">
                    <Accordion type="single" collapsible className="w-full">
                      {filtered.map((item, idx) => (
                        <AccordionItem key={`${item.id}-${idx}`} value={`item-${idx}`}>
                          <AccordionTrigger>
                            <div className="flex items-center justify-between w-full pr-2">
                              <div className="text-left">
                                <div className="text-base sm:text-lg font-semibold">{item.title}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{CATEGORY_INFO[item.type].label}</div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">
                              <div className="prose prose-sm max-w-none flex-1" dangerouslySetInnerHTML={{ __html: item.content }} />
                              <div className="flex items-center gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => copyAnswer(item.content)}>
                                  <Copy className="h-4 w-4 mr-2" /> Copiar
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* CTA de ayuda */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border bg-card p-6 shadow-lg max-w-4xl mx-auto">
            <div>
              <div className="font-semibold text-lg">¿Aún necesitas ayuda?</div>
              <div className="text-sm text-muted-foreground">Escríbenos y te responderemos lo antes posible.</div>
            </div>
            <div className="flex gap-2">
              <a href="mailto:soporte@udes.edu.co">
                <Button variant="secondary"><Mail className="h-4 w-4 mr-2" /> Enviar correo</Button>
              </a>
              <a href="/lia">
                <Button><MessageSquare className="h-4 w-4 mr-2" /> Preguntar a LIA</Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Faq;
