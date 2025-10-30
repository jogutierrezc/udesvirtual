import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FaqItem = {
  id: string;
  title: string;
  content: string;
  type: "catalogo" | "mooc" | "estudiantes" | "profesores" | "becas_movilidad";
  created_at: string;
  created_by: string | null;
  updated_at: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type FaqWithAuthor = FaqItem & {
  author: Profile | null;
};

type CategoryType = "catalogo" | "mooc" | "estudiantes" | "profesores" | "becas_movilidad";

const CATEGORY_INFO: Record<CategoryType, { label: string; description: string }> = {
  catalogo: {
    label: "Catálogo",
    description: "Encuentra respuestas sobre cómo explorar y matricularte en cursos del catálogo de la plataforma.",
  },
  mooc: {
    label: "MOOC",
    description: "Consulta información sobre cursos abiertos masivos en línea, certificados y modalidades de aprendizaje.",
  },
  estudiantes: {
    label: "Estudiantes",
    description: "Preguntas frecuentes sobre tu cuenta, clases, progreso y cómo aprovechar al máximo la plataforma.",
  },
  profesores: {
    label: "Profesores",
    description: "Información para docentes sobre creación de contenido, gestión de estudiantes y perfiles públicos.",
  },
  becas_movilidad: {
    label: "Becas de Movilidad",
    description: "Descubre oportunidades de becas, convocatorias de movilidad internacional y cómo postular.",
  },
};

const FaqCategory: React.FC = () => {
  const { category } = useParams<{ category: CategoryType }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [faqs, setFaqs] = useState<FaqWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category || !CATEGORY_INFO[category as CategoryType]) {
      navigate("/faq");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const { data: faqData, error: faqError } = await supabase
          .from('faqs' as any)
          .select('id,title,content,type,created_at,created_by,updated_at')
          .eq('type', category)
          .eq('status', 'published')
          .order('sort_order', { ascending: true });

        if (faqError) throw faqError;

        // Get unique author IDs
        const authorIds = [...new Set((faqData || []).map((f: any) => f.created_by).filter(Boolean))];

        // Fetch author profiles
        let profileMap = new Map<string, Profile>();
        if (authorIds.length > 0) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id,full_name')
            .in('id', authorIds);

          if (!profileError && profileData) {
            profileMap = new Map<string, Profile>(
              profileData.map((p: any) => [p.id, { ...p, avatar_url: null }])
            );
          }
        }

        const faqsWithAuthors: FaqWithAuthor[] = (faqData || []).map((faq: any) => ({
          ...faq,
          author: faq.created_by ? profileMap.get(faq.created_by) || null : null,
        }));

        setFaqs(faqsWithAuthors);
      } catch (e) {
        console.error('Error loading FAQs', e);
        toast({ title: 'Error cargando FAQs', description: 'No se pudieron cargar las preguntas frecuentes.' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [category, navigate, toast]);

  const categoryInfo = category ? CATEGORY_INFO[category as CategoryType] : null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Navbar />
      
      <div style={{ fontFamily: 'Inter, sans-serif' }} className="min-h-screen bg-gray-50">
        
        {/* Category Header */}
        <div 
          style={{
            backgroundImage: 'radial-gradient(at 90% 10%, #E0F2FE 0%, transparent 70%)',
            borderRadius: '0 0 40px 40px',
            paddingBottom: '80px',
          }}
          className="relative pt-16 pb-24 bg-white shadow-inner"
        >
          <div className="container mx-auto px-4 max-w-7xl">
            <Button
              variant="ghost"
              onClick={() => navigate("/faq")}
              className="mb-6 animate-in fade-in slide-in-from-left-4 duration-500"
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Volver a categorías
            </Button>
            
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight animate-in fade-in slide-in-from-top-4 duration-700">
                {categoryInfo?.label}
              </h1>
              <p className="text-base text-gray-600 max-w-xl mx-auto animate-in fade-in slide-in-from-top-6 duration-700 delay-150">
                {categoryInfo?.description}
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Cards Grid */}
        <main className="container mx-auto px-4 max-w-7xl -mt-16 relative z-10">
          {loading ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold">Cargando FAQs…</h3>
              <p className="text-muted-foreground mt-1">Un momento por favor.</p>
            </Card>
          ) : faqs.length === 0 ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-semibold">No hay preguntas en esta categoría</h3>
              <p className="text-muted-foreground mt-1">
                Vuelve pronto, estamos agregando más contenido.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/faq")}
                className="mt-4"
              >
                Ver todas las categorías
              </Button>
            </Card>
          ) : (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {faqs.map((faq, index) => (
                <a 
                  key={faq.id}
                  href={`/faq/${category}/${faq.id}`}
                  className="bg-white p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 border border-gray-100 flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.title}</h3>
                    <div 
                      className="text-sm text-gray-500 mb-6 line-clamp-3 text-justify"
                      dangerouslySetInnerHTML={{ 
                        __html: faq.content.replace(/<[^>]*>/g, ' ').substring(0, 150) + '...' 
                      }}
                    />
                  </div>
                  
                  {/* Author Info */}
                  <div className="flex items-center pt-4 border-t border-gray-100">
                    {faq.author?.avatar_url ? (
                      <img 
                        src={faq.author.avatar_url} 
                        alt={faq.author.full_name || 'Autor'} 
                        className="w-8 h-8 rounded-full mr-3 object-cover"
                        onError={(e) => { 
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full mr-3 bg-blue-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900 mr-4">
                      {faq.author?.full_name || 'Equipo UDES'}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(faq.updated_at)}</span>
                  </div>
                </a>
              ))}
            </section>
          )}
        </main>

      </div>
    </>
  );
};

export default FaqCategory;
