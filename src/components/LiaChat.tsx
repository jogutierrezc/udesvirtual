import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
      content: "¡Hola! Soy LIA 🌟, tu asistente académica de UDES. Puedo ayudarte con información sobre nuestro catálogo de clases, docentes investigadores, ofertas académicas y propuestas COIL. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [catalogContext, setCatalogContext] = useState<CatalogContext | null>(null);
  const { toast } = useToast();

  // Cargar el contexto del catálogo cuando se abre el chat
  useEffect(() => {
    if (isOpen && !catalogContext) {
      loadCatalogContext();
    }
  }, [isOpen]);

  const loadCatalogContext = async () => {
    try {
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

      setCatalogContext({
        classes: classesData || [],
        teachers: teachersData || [],
        offerings: offeringsData || [],
        coilProposals: coilData || [],
      });
    } catch (error) {
      console.error("Error loading catalog context:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("lia-chat", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
          type: "chat",
          catalogContext: catalogContext, // Enviar el contexto del catálogo
        },
      });

      if (error) throw error;

      const assistantMessage = data.choices?.[0]?.message?.content || "Lo siento, no pude procesar tu mensaje.";
      
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);
    } catch (error: any) {
      console.error("Error calling LIA:", error);
      toast({
        title: "Error",
        description: error.message || "No pude conectar con LIA. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-elegant flex flex-col">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <CardTitle className="text-lg">LIA - Asistente UDES</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
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
