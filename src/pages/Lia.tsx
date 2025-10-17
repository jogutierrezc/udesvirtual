import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

const Lia = () => {
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

  // Cargar el contexto del catálogo cuando se monta el componente
  useEffect(() => {
    loadCatalogContext();
  }, []);

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

    console.log("📤 Enviando mensaje con contexto:", {
      mensaje: userMessage,
      tieneContexto: !!catalogContext,
      clases: catalogContext?.classes?.length || 0,
      docentes: catalogContext?.teachers?.length || 0,
      ofertas: catalogContext?.offerings?.length || 0,
      coil: catalogContext?.coilProposals?.length || 0,
    });

    try {
      const { data, error } = await supabase.functions.invoke("lia-chat", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
          type: "chat",
          catalogContext: catalogContext, // Enviar el contexto del catálogo
        },
      });

      if (error) throw error;

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-accent text-white py-6 px-4 shadow-elegant">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">LIA - Link Internacional Avanzado</h1>
              <p className="text-white/80 text-sm">Tu asistente académica inteligente</p>
            </div>
          </div>
          <Link to="/catalog">
            <Button variant="secondary">Volver al Catálogo</Button>
          </Link>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 py-6">
        <Card className="flex-1 flex flex-col shadow-card">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground border border-border"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl px-5 py-3 border border-border">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t bg-background">
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
                placeholder="Escribe tu mensaje aquí..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Lia;
