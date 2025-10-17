import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CatalogContext {
  classes: any[];
  teachers: any[];
  offerings: any[];
  coilProposals: any[];
}

export const LiaChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy LIA 🌟, tu asistente del catálogo académico UDES. Puedo ayudarte a encontrar:\n\n📚 Clases Espejo y MasterClass\n👨‍🏫 Docentes Investigadores\n🎓 Ofertas Académicas (intercambio/programadas)\n🌐 Propuestas COIL\n\n¿Qué te gustaría conocer?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [catalogContext, setCatalogContext] = useState<CatalogContext | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar el contexto del catálogo cuando se abre el chat
  useEffect(() => {
    if (isOpen && !catalogContext) {
      loadCatalogContext();
    }
  }, [isOpen]);

  const loadCatalogContext = async () => {
    try {
      console.log("🔄 Cargando contexto del catálogo...");
      
      // Cargar clases aprobadas
      const { data: classesData } = await supabase
        .from("classes")
        .select("*")
        .eq("status", "approved");

      // Cargar docentes aprobados
      const { data: teachersData } = await supabase
        .from("teachers")
        .select("*")
        .eq("status", "approved");

      // Cargar ofertas aprobadas
      const { data: offeringsData } = await supabase
        .from("course_offerings")
        .select("*")
        .eq("status", "approved");

      // Cargar propuestas COIL aprobadas
      const { data: coilData } = await supabase
        .from("coil_proposals")
        .select("*")
        .eq("status", "approved");

      const context = {
        classes: classesData || [],
        teachers: teachersData || [],
        offerings: offeringsData || [],
        coilProposals: coilData || [],
      };
      
      console.log("✅ Contexto cargado:", {
        clases: context.classes.length,
        docentes: context.teachers.length,
        ofertas: context.offerings.length,
        coil: context.coilProposals.length,
      });
      
      setCatalogContext(context);
    } catch (error) {
      console.error("❌ Error loading catalog context:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    // Detectar si se necesita información de la web de UDES
    const needsWebInfo = detectWebInfoNeeded(userMessage);
    const webTopic = needsWebInfo ? getWebTopic(userMessage) : null;

    console.log("📤 Enviando mensaje con contexto:", {
      mensaje: userMessage,
      tieneContexto: !!catalogContext,
      clases: catalogContext?.classes?.length || 0,
      docentes: catalogContext?.teachers?.length || 0,
      ofertas: catalogContext?.offerings?.length || 0,
      coil: catalogContext?.coilProposals?.length || 0,
      needsWebInfo,
      webTopic,
    });

    try {
      const { data, error } = await supabase.functions.invoke("lia-chat", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
          type: "chat",
          catalogContext: catalogContext, // Enviar el contexto del catálogo
          needsWebInfo,
          webTopic,
        },
      });

      if (error) {
        console.error("❌ Error en Edge Function:", error);
        throw error;
      }

      console.log("📥 Respuesta recibida:", data);

      const assistantMessage = data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu mensaje.";
      
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);
    } catch (error: any) {
      console.error("❌ Error calling LIA:", error);
      toast({
        title: "Error",
        description: error.message || "No pude conectar con LIA. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para detectar si se necesita información de la web
  const detectWebInfoNeeded = (message: string): boolean => {
    const webKeywords = [
      'equipo', 'directivo', 'rector', 'vicerrector', 'director',
      'misión', 'visión', 'valores', 'institucional',
      'historia', 'fundación', 'trayectoria',
      'sedes', 'campus', 'ubicación', 'ubicacion',
      'acreditación', 'acreditacion', 'calidad',
      'programas académicos', 'carreras', 'pregrado', 'posgrado',
      'investigación', 'investigacion', 'grupos de investigación',
      'internacional', 'relaciones internacionales', 'drni', 
      'movilidad', 'intercambio'
    ];
    
    const lowerMessage = message.toLowerCase();
    return webKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // Función para determinar qué tema web consultar
  const getWebTopic = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    // Priorizar equipo de relaciones internacionales
    if (lowerMessage.match(/equipo.*internacional|internacional.*equipo|relaciones internacionales|drni|equipo.*drni/)) {
      return 'equipoInternacional';
    }
    if (lowerMessage.match(/equipo|directivo|rector|vicerrector|director/) && !lowerMessage.includes('internacional')) {
      return 'equipo';
    }
    if (lowerMessage.match(/misión|visión|valores|institucional/)) {
      return 'misionVision';
    }
    if (lowerMessage.match(/historia|fundación|trayectoria/)) {
      return 'historia';
    }
    if (lowerMessage.match(/sedes|campus|ubicación|ubicacion/)) {
      return 'campus';
    }
    if (lowerMessage.match(/acreditación|acreditacion|calidad/)) {
      return 'acreditacion';
    }
    if (lowerMessage.match(/programas|carreras|pregrado|posgrado/)) {
      return 'programas';
    }
    if (lowerMessage.match(/investigación|investigacion|grupos/)) {
      return 'investigacion';
    }
    if (lowerMessage.match(/internacional|movilidad|intercambio/)) {
      return 'internacional';
    }
    
    return 'equipo'; // Default
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-elegant hover:scale-110 transition-transform"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] sm:w-96 h-[70vh] sm:h-[500px] shadow-elegant flex flex-col z-50">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle className="text-base sm:text-lg">LIA - Asistente UDES</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap break-words leading-relaxed prose prose-sm max-w-none prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <Link
                            to={props.href || "#"}
                            className="font-medium underline-offset-4 hover:underline"
                          >
                            {props.children}
                          </Link>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">LIA está escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 sm:p-4 border-t bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregúntale a LIA..."
              disabled={isLoading}
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};
