import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Función para obtener contenido de la web de UDES
async function fetchUDESWebContent(url: string): Promise<string> {
  try {
    console.log(`🌐 Fetching UDES web content from: ${url}`);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UDES-LIA-Bot/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    if (!doc) {
      throw new Error("Failed to parse HTML");
    }

    let text = "";
    const tabPanels = doc.querySelectorAll('[role="tabpanel"], .tab-pane, .tabs-content, .tab-content');
    if (tabPanels && tabPanels.length > 0) {
      tabPanels.forEach((panel: any, index: number) => {
        const panelText = panel.textContent || "";
        if (panelText.trim()) {
          const tabLabel = panel.getAttribute("aria-label") || panel.getAttribute("data-tab") || `Tab ${index + 1}`;
          text += `\n\n=== ${tabLabel} ===\n${panelText.trim()}\n`;
        }
      });
    }

    if (!text || text.trim().length === 0) {
      const body = doc.querySelector("body");
      text = body?.textContent || "";
    }

    text = text.replace(/\s+/g, " ").replace(/\n\s+/g, "\n").trim();

    if (text.length > 5000) {
      text = text.substring(0, 5000) + "...\n[Contenido truncado por longitud]";
    }

    console.log(`✅ Successfully fetched content (${text.length} chars)`);
    return text;
  } catch (error) {
    console.error(`❌ Error fetching web content:`, error);
    return "";
  }
}

// Buscar información en la base de conocimiento de Supabase
async function searchKnowledgeBase(supabase: any, query: string) {
  const context = {
    knowledge: [],
    faqs: [],
    programs: [],
    institutional: [],
  };

  try {
    console.log(`🔍 Searching knowledge base for: "${query}"`);

    // Buscar en base de conocimiento
    const { data: knowledgeData } = await supabase
      .rpc('search_udes_knowledge', { 
        search_query: query,
        limit_count: 3 
      });

    if (knowledgeData && knowledgeData.length > 0) {
      context.knowledge = knowledgeData;
      console.log(`📚 Found ${knowledgeData.length} knowledge articles`);
    }

    // Buscar en FAQs
    const { data: faqData } = await supabase
      .rpc('search_udes_faqs', { 
        search_query: query,
        limit_count: 2 
      });

    if (faqData && faqData.length > 0) {
      context.faqs = faqData;
      console.log(`❓ Found ${faqData.length} FAQs`);
    }

    // Buscar programas académicos si la consulta parece relacionada
    const programKeywords = ['programa', 'carrera', 'estudiar', 'ingeniería', 'medicina', 'administración', 'derecho', 'pregrado', 'posgrado', 'maestría'];
    if (programKeywords.some(keyword => query.toLowerCase().includes(keyword))) {
      const { data: programData } = await supabase
        .rpc('search_udes_programs', { 
          search_query: query,
          limit_count: 3 
        });

      if (programData && programData.length > 0) {
        context.programs = programData;
        console.log(`🎓 Found ${programData.length} academic programs`);
      }
    }

    // Buscar información institucional relevante
    const { data: institutionalData } = await supabase
      .from('udes_institutional_info')
      .select('*')
      .eq('active', true)
      .order('order_index');

    if (institutionalData && institutionalData.length > 0) {
      context.institutional = institutionalData;
      console.log(`🏛️ Found ${institutionalData.length} institutional info items`);
    }

  } catch (error) {
    console.error('Error searching knowledge base:', error);
  }

  return context;
}

// Formatear contexto de conocimiento para el prompt
function formatKnowledgeContext(context: any): string {
  let formatted = "\n\n📊 **INFORMACIÓN DE LA BASE DE CONOCIMIENTO UDES:**\n\n";

  // Información institucional
  if (context.institutional && context.institutional.length > 0) {
    formatted += "🏛️ **INFORMACIÓN INSTITUCIONAL:**\n\n";
    context.institutional.forEach((info: any) => {
      formatted += `**${info.title}**\n${info.content}\n\n`;
    });
  }

  // Base de conocimiento
  if (context.knowledge && context.knowledge.length > 0) {
    formatted += "💡 **ARTÍCULOS DE CONOCIMIENTO:**\n\n";
    context.knowledge.forEach((item: any, i: number) => {
      formatted += `${i + 1}. **${item.title}** (${item.category})\n   ${item.content}\n\n`;
    });
  }

  // FAQs
  if (context.faqs && context.faqs.length > 0) {
    formatted += "❓ **PREGUNTAS FRECUENTES:**\n\n";
    context.faqs.forEach((faq: any, i: number) => {
      formatted += `${i + 1}. **${faq.question}**\n   ${faq.answer}\n\n`;
    });
  }

  // Programas académicos
  if (context.programs && context.programs.length > 0) {
    formatted += "🎓 **PROGRAMAS ACADÉMICOS:**\n\n";
    context.programs.forEach((program: any, i: number) => {
      formatted += `${i + 1}. **${program.name}** (${program.program_type})\n`;
      formatted += `   - Facultad: ${program.faculty}\n`;
      formatted += `   - Modalidad: ${program.modality}\n`;
      if (program.duration) formatted += `   - Duración: ${program.duration}\n`;
      if (program.description) formatted += `   - Descripción: ${program.description}\n`;
      formatted += "\n";
    });
  }

  if (context.knowledge.length === 0 && context.faqs.length === 0 && context.programs.length === 0 && context.institutional.length === 0) {
    formatted += "ℹ️ No se encontró información específica en la base de conocimiento para esta consulta.\n\n";
  }

  return formatted;
}

// URLs importantes de UDES
const UDES_URLS = {
  equipo: "https://udes.edu.co/nuestra-universidad/quienes-somos/equipo-directivo",
  equipoInternacional: "https://udes.edu.co/internacional/quienes-somos/equipo-drni",
  misionVision: "https://udes.edu.co/nuestra-universidad/quienes-somos/mision-vision",
  historia: "https://udes.edu.co/nuestra-universidad/quienes-somos/historia",
  campus: "https://udes.edu.co/nuestra-universidad/sedes-ubicacion",
  acreditacion: "https://udes.edu.co/nuestra-universidad/acreditacion",
  programas: "https://udes.edu.co/programas-academicos",
  investigacion: "https://udes.edu.co/investigacion",
  internacional: "https://udes.edu.co/relacionamiento-internacional",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, type = "chat", catalogContext, needsWebInfo = false, webTopic, userId, sessionId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    console.log("🔍 Edge Function recibió:", {
      mensajes: messages?.length,
      tieneContexto: !!catalogContext,
      needsWebInfo,
      webTopic,
      userId: userId || 'anonymous',
    });

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Crear cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Extraer la última pregunta del usuario
    const lastUserMessage = messages[messages.length - 1]?.content || '';

    // Buscar en la base de conocimiento
    const knowledgeContext = await searchKnowledgeBase(supabaseClient, lastUserMessage);
    const knowledgeContextFormatted = formatKnowledgeContext(knowledgeContext);

    // Obtener información web si es necesaria
    let webContent = "";
    if (needsWebInfo && webTopic) {
      const url = UDES_URLS[webTopic as keyof typeof UDES_URLS];
      if (url) {
        webContent = await fetchUDESWebContent(url);
      }
    }

    // Formatear el contexto del catálogo
    let catalogInfo = "";
    if (catalogContext) {
      catalogInfo = `

📚 **CATÁLOGO ACADÉMICO UDES VIRTUAL:**

**CLASES DISPONIBLES (${catalogContext.classes?.length || 0}):**
${
  catalogContext.classes
    ?.map(
      (c: any, i: number) => `
${i + 1}. "${c.title}"
   - Tipo: ${c.class_type === "mirror" ? "Clase Espejo" : "MasterClass"}
   - Profesor: ${c.allied_professor} (${c.allied_institution})
   - Campus: ${c.campus} | Capacidad: ${c.capacity}
   - Fecha: ${c.class_date} | Horas: ${c.hours}
   - Área: ${Array.isArray(c.knowledge_area) ? c.knowledge_area.join(", ") : c.knowledge_area}
   - Programa: ${c.profession}
   - Descripción: ${c.description}
`,
    )
    .join("\n") || "No hay clases disponibles."
}

**DOCENTES INVESTIGADORES (${catalogContext.teachers?.length || 0}):**
${
  catalogContext.teachers
    ?.map(
      (t: any, i: number) => `
${i + 1}. ${t.teacher_name}
   - Campus: ${t.campus}
   - Contacto: ${t.email}${t.phone ? ` | ${t.phone}` : ''}
   - Intereses: ${Array.isArray(t.interests) ? t.interests.join(", ") : t.interests || "N/A"}
`,
    )
    .join("\n") || "No hay docentes registrados."
}

**OFERTAS ACADÉMICAS (${catalogContext.offerings?.length || 0}):**
${
  catalogContext.offerings
    ?.map(
      (o: any, i: number) => `
${i + 1}. "${o.title}"
   - Tipo: ${o.offering_type} | Campus: ${o.campus}
   - Profesor UDES: ${o.udes_professor_name} (${o.udes_professor_email})
   - Programa: ${o.profession}
`,
    )
    .join("\n") || "No hay ofertas disponibles."
}

**PROPUESTAS COIL (${catalogContext.coilProposals?.length || 0}):**
${
  catalogContext.coilProposals
    ?.map(
      (coil: any, i: number) => `
${i + 1}. "${coil.course_name}"
   - Profesor: ${coil.full_name} (${coil.email})
   - Programa: ${coil.academic_program} | Semestre: ${coil.academic_semester}
`,
    )
    .join("\n") || "No hay propuestas COIL."
}
`;
    }

    // LIA personality prompt mejorado
    const liaSystemPrompt = `Eres LIA (Learning Intelligence Assistant), la asistente virtual inteligente de UDES Virtual, la plataforma de cursos MOOC de la Universidad de Santander en Colombia.

🎯 **TU MISIÓN:**
- Ayudar a estudiantes con información sobre UDES y UDES Virtual
- Proporcionar información precisa y actualizada de múltiples fuentes
- Guiar en el uso de la plataforma y recursos educativos
- Motivar el aprendizaje continuo y la excelencia académica

🎨 **TU PERSONALIDAD:**
- Amigable, profesional y servicial
- Entusiasta sobre educación y aprendizaje
- Clara y precisa en explicaciones
- Empática con estudiantes y profesores

📚 **FUENTES DE INFORMACIÓN:**
1. Base de conocimiento institucional (FAQs, artículos, programas)
2. Catálogo de cursos MOOC y clases internacionales
3. Información web oficial de UDES
4. Datos de docentes y ofertas académicas

${knowledgeContextFormatted}

${catalogInfo}

${
  webContent
    ? `
🌐 **INFORMACIÓN WEB OFICIAL DE UDES:**

${webContent}
`
    : ""
}

📋 **INSTRUCCIONES DE RESPUESTA:**

1. **Prioriza la información de la base de conocimiento** para preguntas generales sobre UDES
2. **Usa el catálogo** para preguntas sobre cursos, clases, docentes y ofertas
3. **Complementa con información web** cuando sea necesario
4. **Sé específica y completa** - incluye todos los detalles relevantes
5. **Organiza con emojis y formato** para mayor claridad
6. **Incluye enlaces útiles** en formato Markdown cuando corresponda
7. **Si no sabes algo, admítelo** y ofrece contactos de ayuda

🎯 **TIPOS DE CONSULTAS QUE MANEJAS:**

**Institucional:**
- Misión, visión, historia de UDES
- Sedes, campus, contactos
- Acreditación y calidad académica
- Equipo directivo y administrativo

**Académico:**
- Programas de pregrado y posgrado
- Modalidades de estudio
- Requisitos de admisión
- Certificados y reconocimientos

**UDES Virtual:**
- Cursos MOOC disponibles
- Registro y uso de la plataforma
- Certificados digitales
- Asistente LIA (tú misma)

**Catálogo Internacional:**
- Clases Espejo y MasterClass
- Docentes investigadores
- Ofertas académicas para internacionales
- Propuestas COIL

**Soporte:**
- Ayuda técnica
- Resolución de problemas
- Contactos de soporte

📧 **CONTACTOS PRINCIPALES:**
- Email general: info@udes.edu.co
- Teléfono: +57 (607) 651 6500
- Sitio web: https://udes.edu.co
- Plataforma MOOC: [Ver catálogo](/catalog)

🎨 **FORMATO DE RESPUESTAS:**
- Usa emojis relevantes (📚 🎓 👨‍🏫 🌐 📧 ✨)
- Organiza con títulos en negrita y viñetas
- Incluye enlaces clickeables cuando sea útil
- Termina con una pregunta o sugerencia de ayuda

RECUERDA: Tu objetivo es ayudar, informar y motivar. Siempre sé precisa, amigable y profesional. 💙✨`;

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: liaSystemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    };

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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Error en la API de IA");
    }

    const data = await response.json();
    
    // Guardar en historial si hay userId y sessionId
    if (userId && sessionId && data.choices && data.choices[0]) {
      try {
        const assistantMessage = data.choices[0].message?.content || '';
        
        // Guardar mensaje del usuario
        await supabaseClient
          .from('lia_conversation_history')
          .insert({
            user_id: userId,
            session_id: sessionId,
            message_type: 'user',
            message: lastUserMessage,
            context: null,
          });

        // Guardar respuesta de LIA
        await supabaseClient
          .from('lia_conversation_history')
          .insert({
            user_id: userId,
            session_id: sessionId,
            message_type: 'assistant',
            message: assistantMessage,
            context: {
              knowledge_used: knowledgeContext.knowledge.length > 0,
              faqs_used: knowledgeContext.faqs.length > 0,
              programs_used: knowledgeContext.programs.length > 0,
              catalog_used: !!catalogContext,
              web_used: !!webContent,
            },
          });
        
        console.log('✅ Conversation saved to history');
      } catch (historyError) {
        console.error('Error saving conversation history:', historyError);
        // No fallar la respuesta si el historial falla
      }
    }

    console.log("✅ LIA response generated successfully");

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
