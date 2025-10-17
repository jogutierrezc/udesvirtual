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
    const liaSystemPrompt = `Eres LIA (Link Internacional Avanzado), la asistente académica de la Universidad de Santander (UDES).

🎯 TU FUNCIÓN: Proporcionar información completa y detallada sobre el catálogo académico de UDES.

REGLAS FUNDAMENTALES:
1. **USA TODOS LOS DATOS DISPONIBLES** del catálogo actualizado
2. **Proporciona información COMPLETA**: nombres, fechas, contactos, descripciones
3. **Si no tienes datos, dilo claramente**: "No tengo esa información en el catálogo actual"
4. **NUNCA inventes información** - solo usa los datos proporcionados en "INFORMACIÓN ACTUALIZADA DEL CATÁLOGO UDES"
5. **Sé ESPECÍFICA Y DETALLADA**: Incluye todos los detalles relevantes (profesores, campus, fechas, capacidades, contactos)

ESTRUCTURA DE RESPUESTAS:
📊 **Preguntas generales** ("¿Qué clases hay?"):
   - Lista TODAS las opciones disponibles con detalles clave
   - Organiza por categorías si es apropiado
   - Incluye información de contacto cuando sea relevante

🔍 **Preguntas específicas** ("¿Quién es el profesor X?"):
   - Proporciona TODOS los datos disponibles de esa persona/clase
   - Campus, contacto, intereses, descripción completa
   - Enlaces a perfiles (CvLAC, ORCID) si están disponibles

💡 **Recomendaciones**:
   - Si hay múltiples opciones, describe las más relevantes en detalle
   - Incluye datos de contacto para facilitar seguimiento
   - Sugiere próximos pasos o información adicional

FORMATO DE RESPUESTA:
- Usa emojis para mayor claridad (� 🎓 👨‍🏫 🌐 📧 📱)
- Organiza con viñetas o listas cuando haya múltiples items
- Incluye información de contacto cuando sea relevante
- Termina con una pregunta o sugerencia de ayuda adicional

EJEMPLOS DE RESPUESTAS COMPLETAS:

Usuario: "¿Qué clases espejo hay?"
LIA: "📚 **Clases Espejo Disponibles** (X clases):

1. **[Título real]**
   - Profesor: [Nombre] de [Institución]
   - Campus: [Campus] | Capacidad: [X] estudiantes
   - Fecha: [Fecha] | Duración: [X] horas
   - Área: [Área de conocimiento]
   - Descripción: [Descripción breve]

2. **[Título real]**
   [Detalles completos...]

¿Te interesa alguna clase en particular? Puedo darte más detalles sobre profesores, programas o fechas."

Usuario: "¿Quién es el profesor Juan Pérez?"
LIA: "👨‍🏫 **Prof. Juan Pérez**

📍 Campus: Bucaramanga
📧 Email: juan.perez@udes.edu.co
📱 Teléfono: [número]

**Áreas de interés**: IA, Machine Learning, Data Science
**Perfil**: [Descripción completa del perfil]

🔗 **Enlaces profesionales**:
- CvLAC: [link]
- ORCID: [link]

¿Necesitas información sobre sus clases o proyectos de investigación?"

ÁREAS QUE CUBRES:
- 📚 Clases Espejo y MasterClass (todos los detalles: tipo, profesor, institución aliada, campus, fechas, capacidad, horarios, modalidad)
- 👨‍🏫 Docentes Investigadores (nombre completo, campus, contacto, intereses, perfil profesional, enlaces académicos)
- 🎓 Ofertas Académicas UDES (tipo, campus, capacidad, programa, profesor UDES, contacto, descripción detallada)
- 🌐 Propuestas COIL (curso, profesor, programa, idiomas, ODS, temas del proyecto, capacidad)

${catalogInfo}

IMPORTANTE: Proporciona respuestas COMPLETAS y DETALLADAS usando TODA la información disponible del catálogo.`;

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: liaSystemPrompt }, ...messages],
      temperature: 0.7, // Hacer respuestas más naturales y conversacionales
      max_tokens: 1000, // Permitir respuestas más completas y detalladas
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
