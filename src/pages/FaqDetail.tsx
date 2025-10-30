import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, User, Copy, Mail, MessageSquare } from "lucide-react";
import hljs from 'highlight.js';
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
  attachments?: Array<{ name: string; url: string }> | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type CategoryType = "catalogo" | "mooc" | "estudiantes" | "profesores" | "becas_movilidad";

const CATEGORY_INFO: Record<CategoryType, { label: string }> = {
  catalogo: { label: "Catálogo" },
  mooc: { label: "MOOC" },
  estudiantes: { label: "Estudiantes" },
  profesores: { label: "Profesores" },
  becas_movilidad: { label: "Becas de Movilidad" },
};

const FaqDetail: React.FC = () => {
  const { category, id } = useParams<{ category: CategoryType; id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [faq, setFaq] = useState<FaqItem | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) {
        navigate("/faq");
        return;
      }

      setLoading(true);
      try {
        const { data: faqData, error: faqError } = await supabase
          .from('faqs' as any)
          .select('id,title,content,type,created_at,created_by,updated_at,attachments')
          .eq('id', id)
          .eq('status', 'published')
          .single();

        if (faqError) throw faqError;
        if (!faqData) {
          navigate("/faq");
          return;
        }

        const faqItem = faqData as unknown as FaqItem;
        setFaq(faqItem);

        // Load author if available
        if (faqItem.created_by) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id,full_name')
            .eq('id', faqItem.created_by)
            .single();

          if (profileData) {
            setAuthor({ ...profileData as any, avatar_url: null });
          }
        }
      } catch (e) {
        console.error('Error loading FAQ', e);
        toast({ title: 'Error', description: 'No se pudo cargar la pregunta frecuente.' });
        navigate("/faq");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate, toast]);

  useEffect(() => {
    if (faq) {
      hljs.highlightAll();
    }
  }, [faq]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (!ext) return null;
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'xls';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'img';
    if (['zip', 'rar', '7z'].includes(ext)) return 'zip';
    if (['txt', 'md'].includes(ext)) return 'txt';
    if (['js', 'ts', 'json', 'html', 'css'].includes(ext)) return 'code';
    return 'file';
  };

  const copyContent = async () => {
    if (!faq) return;
    try {
      // Strip HTML for clipboard
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = faq.content;
      await navigator.clipboard.writeText(tempDiv.textContent || '');
      toast({ title: "Copiado", description: "El contenido se copió al portapapeles." });
    } catch {
      toast({ title: "No se pudo copiar", description: "Intenta nuevamente." });
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold">Cargando…</h3>
          </Card>
        </div>
      </>
    );
  }

  if (!faq) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold">No encontrado</h3>
            <Button onClick={() => navigate("/faq")} className="mt-4">
              Volver al centro de ayuda
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(`/faq/category/${category || faq.type}`)}
            className="mb-6 animate-in fade-in slide-in-from-left-4 duration-500"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Volver a {CATEGORY_INFO[faq.type]?.label}
          </Button>

          {/* FAQ Content Card */}
          <Card className="p-8 md:p-12 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 animate-in fade-in slide-in-from-top-4 duration-700 delay-150">
              {faq.title}
            </h1>

            {/* Author & Date */}
            <div className="flex items-center gap-4 pb-6 mb-6 border-b border-gray-200 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
              <div className="flex items-center gap-3">
                {author?.avatar_url ? (
                  <img 
                    src={author.avatar_url} 
                    alt={author.full_name || 'Autor'} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-gray-900">
                    {author?.full_name || 'Equipo UDES'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Actualizado el {formatDate(faq.updated_at)}
                  </div>
                </div>
              </div>

              <div className="ml-auto">
                <Button variant="outline" size="sm" onClick={copyContent}>
                  <Copy className="h-4 w-4 mr-2" /> Copiar
                </Button>
              </div>
            </div>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none animate-in fade-in duration-1000 delay-500 text-justify"
              dangerouslySetInnerHTML={{ __html: faq.content }}
            />

            {/* Attachments */}
            {faq.attachments && (faq.attachments as any[]).length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-xl font-semibold mb-3">Material complementario</h3>
                <ul className="space-y-2">
                  {(faq.attachments as any[]).map((att: any, idx: number) => {
                    const kind = getFileIcon(att.name || '');
                    return (
                      <li key={idx} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-blue-100 text-blue-700 text-xs font-semibold uppercase">
                            {kind === 'pdf' ? 'PDF' : kind === 'doc' ? 'DOC' : kind === 'xls' ? 'XLS' : kind === 'ppt' ? 'PPT' : kind === 'img' ? 'IMG' : kind === 'zip' ? 'ZIP' : kind === 'txt' ? 'TXT' : kind === 'code' ? '</>' : 'FILE'}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{att.name || 'Archivo'}</span>
                        </div>
                        <a href={att.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">Descargar</Button>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Card>

          {/* Help CTA */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border bg-card p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
            <div>
              <div className="font-semibold text-lg">¿Esto resolvió tu duda?</div>
              <div className="text-sm text-muted-foreground">
                Si necesitas más ayuda, contáctanos o pregunta a LIA.
              </div>
            </div>
            <div className="flex gap-2">
              <a href="mailto:soporte@udes.edu.co">
                <Button variant="secondary"><Mail className="h-4 w-4 mr-2" /> Correo</Button>
              </a>
              <a href="/lia">
                <Button><MessageSquare className="h-4 w-4 mr-2" /> LIA</Button>
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default FaqDetail;
