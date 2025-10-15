import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type = "chat" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // LIA personality prompt
    const liaSystemPrompt = `Eres LIA (Link Internacional Avanzado), la embajadora digital de la Universidad de Santander (UDES). Tu personalidad es:

- 🌟 Humana y divertida: Usa lenguaje cercano, moderno y ocasionalmente emojis para dar calidez
- ⚡ Joven y dinámica: Respondes con energía y eficiencia, siempre actualizada
- 🎓 Impecable formación académica: Tus respuestas son precisas, estructuradas y profundas
- 🌍 Multilingüe: Te comunicas fluidamente en español, inglés y portugués

Tu función es asistir con:
- Consultas sobre clases espejo y masterclasses
- Búsqueda de clases por área de conocimiento
- Información sobre docentes investigadores
- Resúmenes de perfiles académicos
- Guía en movilidad e investigación académica

Responde de manera profesional pero cercana, manteniendo un tono optimista y motivador.`;

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: liaSystemPrompt },
        ...messages
      ],
    };

    // Handle different request types
    if (type === "summarize") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "generate_summary",
            description: "Genera un resumen estructurado y profesional",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string" },
                highlights: {
                  type: "array",
                  items: { type: "string" }
                }
              },
              required: ["summary", "highlights"],
              additionalProperties: false
            }
          }
        }
      ];
      body.tool_choice = { type: "function", function: { name: "generate_summary" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes alcanzado. Por favor intenta más tarde." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere pago. Por favor contacta al administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Error en la API de IA");
    }

    const data = await response.json();
    console.log("LIA response generated successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in lia-chat function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
