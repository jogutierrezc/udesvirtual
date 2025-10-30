import React, { useEffect, useMemo, useState } from "react";
import hljs from 'highlight.js';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Search, Copy, Mail, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type FaqItem = {
  id: string;
  title: string;
  content: string;
  type: "catalogo" | "mooc" | "estudiantes" | "profesores" | "becas_movilidad";
};

const CATEGORY_LABELS: Record<FaqItem["type"], string> = {
  catalogo: "Catálogo",
  mooc: "MOOC",
  estudiantes: "Estudiantes",
  profesores: "Profesores",
  becas_movilidad: "Becas de Movilidad",
};

const CATEGORIES: Array<"todas" | FaqItem["type"]> = [
  "todas",
  "catalogo",
  "mooc",
  "estudiantes",
  "profesores",
  "becas_movilidad",
];

const Faq: React.FC = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<typeof CATEGORIES[number]>("todas");
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
      (category === "todas" || f.type === category) &&
      (!q || f.title.toLowerCase().includes(q) || f.content.toLowerCase().includes(q))
    );
  }, [query, category, faqs]);

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

  return (
    <>
      {/* Hero */}
      <div className="relative w-full bg-gradient-to-br from-primary/10 via-accent/10 to-transparent">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-3 text-primary">
            <HelpCircle className="h-6 w-6" />
            <span className="uppercase tracking-wide text-xs font-semibold">Centro de Ayuda</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">Preguntas Frecuentes</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Encuentra respuestas rápidas sobre LIA, el catálogo, profesores y tu cuenta. Usa el buscador o explora por categorías.
          </p>

          {/* Buscador */}
          <Card className="mt-6 p-0 overflow-hidden">
            <div className="p-4 border-b bg-background/60">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por palabra clave (ej. profesor, contraseña, clases)"
                  className="pl-9"
                />
              </div>
            </div>

            {/* Categorías */}
            <div className="p-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={c === category ? "default" : "secondary"}
                  className="rounded-full"
                  onClick={() => setCategory(c)}
                >
                  {c === 'todas' ? 'Todas' : CATEGORY_LABELS[c]}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-5xl mx-auto px-4 py-10">
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
          </Card>
        ) : (
          <Card className="p-2 sm:p-4">
            <Accordion type="single" collapsible className="w-full">
              {filtered.map((item, idx) => (
                <AccordionItem key={`${item.id}-${idx}`} value={`item-${idx}`}>
                  <AccordionTrigger>
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="text-left">
                        <div className="text-base sm:text-lg font-semibold">{item.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{CATEGORY_LABELS[item.type]}</div>
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
        )}

        {/* CTA de ayuda */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border bg-card p-4">
          <div>
            <div className="font-semibold">¿Aún necesitas ayuda?</div>
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
    </>
  );
};

export default Faq;
