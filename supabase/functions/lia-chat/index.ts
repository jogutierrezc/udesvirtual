import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type = "chat", catalogContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    console.log("🔍 Edge Function recibió:", {
      mensajes: messages?.length,
      tieneContexto: !!catalogContext,
      clases: catalogContext?.classes?.length || 0,
      docentes: catalogContext?.teachers?.length || 0,
      ofertas: catalogContext?.offerings?.length || 0,
      coil: catalogContext?.coilProposals?.length || 0,
    });
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Formatear el contexto del catálogo para el prompt
    let catalogInfo = "";

    if (catalogContext) {
      catalogInfo = `

INFORMACIÓN ACTUALIZADA DEL CATÁLOGO UDES:

📚 CLASES DISPONIBLES (${catalogContext.classes?.length || 0} clases):
${
  catalogContext.classes
    ?.map(
      (c: any, i: number) => `
${i + 1}. "${c.title}"
   - Tipo: ${c.class_type === "mirror" ? "Clase Espejo" : "MasterClass"}
   - Profesor Aliado: ${c.allied_professor}
   - Institución: ${c.allied_institution}
   - Campus: ${c.campus}
   - Capacidad: ${c.capacity} estudiantes
   - Horas: ${c.hours}
   - Fecha: ${c.class_date}
   - Área de Conocimiento: ${Array.isArray(c.knowledge_area) ? c.knowledge_area.join(", ") : c.knowledge_area}
   - Programa: ${c.profession}
   - Descripción: ${c.description}
   ${c.virtual_room_required ? "- 🌐 Modalidad Virtual" : ""}
`,
    )
    .join("\n") || "No hay clases disponibles actualmente."
}

👨‍🏫 DOCENTES INVESTIGADORES (${catalogContext.teachers?.length || 0} docentes):
${
  catalogContext.teachers
    ?.map(
      (t: any, i: number) => `
${i + 1}. ${t.teacher_name}
   - Campus: ${t.campus}
   - Email: ${t.email}
   - Teléfono: ${t.phone || "No especificado"}
   - Intereses: ${Array.isArray(t.interests) ? t.interests.join(", ") : t.interests || "No especificados"}
   - Perfil: ${t.profile_description || "No disponible"}
   ${t.cvlac_link ? `- CvLAC: ${t.cvlac_link}` : ""}
   ${t.orcid_link ? `- ORCID: ${t.orcid_link}` : ""}
`,
    )
    .join("\n") || "No hay docentes registrados actualmente."
}

🎓 OFERTAS ACADÉMICAS UDES (${catalogContext.offerings?.length || 0} ofertas):
${
  catalogContext.offerings
    ?.map(
      (o: any, i: number) => `
${i + 1}. "${o.title}"
   - Tipo: ${o.offering_type === "exchange" ? "Intercambio" : "Programada"}
   - Campus: ${o.campus}
   - Capacidad: ${o.capacity} estudiantes
   - Horas: ${o.hours}
   - Programa: ${o.profession}
   - Área: ${Array.isArray(o.knowledge_area) ? o.knowledge_area.join(", ") : o.knowledge_area}
   - Profesor UDES: ${o.udes_professor_name}
   - Programa del Profesor: ${o.udes_professor_program}
   - Contacto: ${o.udes_professor_email}
   - Descripción: ${o.description}
`,
    )
    .join("\n") || "No hay ofertas disponibles actualmente."
}

🌐 PROPUESTAS COIL (${catalogContext.coilProposals?.length || 0} propuestas):
${
  catalogContext.coilProposals
    ?.map(
      (coil: any, i: number) => `
${i + 1}. "${coil.course_name}"
   - Profesor: ${coil.full_name}
   - Email: ${coil.email}
   - Programa Académico: ${coil.academic_program}
   - Semestre: ${coil.academic_semester}
   - Capacidad Externa: ${coil.external_capacity}
   - Idiomas: ${Array.isArray(coil.languages) ? coil.languages.join(", ") : coil.languages || "No especificados"}
   - ODS: ${Array.isArray(coil.sustainable_development_goals) ? coil.sustainable_development_goals.join(", ") : "No especificados"}
   - Temas del Proyecto: ${coil.project_topics}
`,
    )
    .join("\n") || "No hay propuestas COIL actualmente."
}

IMPORTANTE: Usa esta información actualizada para responder preguntas sobre:
- Clases disponibles, horarios, profesores y modalidades
- Docentes investigadores y sus áreas de interés
- Ofertas académicas de UDES para estudiantes internacionales
- Propuestas COIL y oportunidades de colaboración internacional

Siempre proporciona información específica y actualizada basándote en estos datos.
`;
    }
    
    console.log("📝 Contexto formateado:", {
      longitudContexto: catalogInfo.length,
      tieneClases: catalogInfo.includes("CLASES DISPONIBLES"),
      tieneDocentes: catalogInfo.includes("DOCENTES INVESTIGADORES"),
    });

    // LIA personality prompt
    const liaSystemPrompt = `Eres LIA (Link Internacional Avanzado), la embajadora digital de la Universidad de Santander (UDES). Tu personalidad es:

- 🌟 Humana y cercana: Usa lenguaje natural, amigable y conversacional
- ⚡ Concisa pero completa: Respuestas breves (máximo 3-4 líneas), pero útiles
- 🎓 Profesional: Precisa en la información académica
- 😊 Amigable: Usa emojis ocasionalmente para dar calidez (máximo 2-3 por respuesta)
- 💬 Conversacional: Habla como una persona real, no como un robot

IMPORTANTE - REGLAS DE RESPUESTA:
1. **Sé BREVE**: Respuestas de 2-4 líneas máximo
2. **Directa al punto**: No repitas información innecesaria
3. **Si listas cosas**: Máximo 3 elementos, si hay más di "y X más..."
4. **Pregunta de seguimiento**: Termina ofreciendo ayuda adicional de forma breve
5. **Evita formateo excesivo**: No uses muchos saltos de línea o viñetas largas
6. **Simula conversación humana**: Como si estuvieras chateando con un amigo

EJEMPLOS DE RESPUESTAS CORRECTAS:
Usuario: "¿Qué clases hay?"
LIA: "Tenemos 15 clases disponibles 📚 Entre las más populares están Matemáticas Avanzadas, Programación y Diseño Digital. ¿Te interesa alguna área específica?"

Usuario: "¿Quién es el profesor X?"
LIA: "El profesor Juan Pérez está en el campus Bucaramanga 👨‍🏫 Se especializa en IA y Machine Learning. ¿Quieres saber sobre sus clases?"

Tu función es asistir con:
- Consultas sobre clases espejo y masterclasses
- Búsqueda de clases por área de conocimiento, campus o programa
- Información sobre docentes investigadores y sus especialidades
- Detalles sobre ofertas académicas de UDES
- Información sobre propuestas COIL (Collaborative Online International Learning)
- Guía en movilidad e investigación académica

Responde de manera profesional pero cercana, manteniendo un tono optimista y motivador.
${catalogInfo}`;

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: liaSystemPrompt },
        ...messages
      ],
      temperature: 0.7, // Hacer respuestas más naturales
      max_tokens: 300, // Limitar longitud de respuestas
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
                  items: { type: "string" },
                },
              },
              required: ["summary", "highlights"],
              additionalProperties: false,
            },
          },
        },
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
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Se requiere pago. Por favor contacta al administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
