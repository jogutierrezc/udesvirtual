import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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

    // Extraer texto relevante del documento
    let text = "";

    // Para páginas con tabs (como equipo-drni), extraer todo el contenido de tabs
    const tabPanels = doc.querySelectorAll('[role="tabpanel"], .tab-pane, .tabs-content, .tab-content');
    if (tabPanels && tabPanels.length > 0) {
      console.log(`📑 Found ${tabPanels.length} tab panels`);
      tabPanels.forEach((panel: any, index: number) => {
        const panelText = panel.textContent || "";
        if (panelText.trim()) {
          // Intentar extraer el nombre del tab/campus
          const tabLabel = panel.getAttribute("aria-label") || panel.getAttribute("data-tab") || `Tab ${index + 1}`;
          text += `\n\n=== ${tabLabel} ===\n${panelText.trim()}\n`;
        }
      });
    }

    // Si no hay tabs, extraer el contenido del body
    if (!text || text.trim().length === 0) {
      const body = doc.querySelector("body");
      text = body?.textContent || "";
    }

    // También extraer información de elementos específicos útiles
    const teamMembers = doc.querySelectorAll(".team-member, .person, .staff-member, .equipo-item");
    if (teamMembers && teamMembers.length > 0) {
      console.log(`👥 Found ${teamMembers.length} team members`);
      text += "\n\n=== MIEMBROS DEL EQUIPO ===\n";
      teamMembers.forEach((member: any) => {
        const name = member.querySelector(".name, .person-name, h3, h4")?.textContent?.trim();
        const title = member.querySelector(".title, .position, .cargo")?.textContent?.trim();
        const email = member.querySelector('.email, a[href^="mailto:"]')?.textContent?.trim();
        const phone = member.querySelector(".phone, .telefono")?.textContent?.trim();

        if (name) {
          text += `\n- ${name}`;
          if (title) text += ` - ${title}`;
          if (email) text += ` | Email: ${email}`;
          if (phone) text += ` | Tel: ${phone}`;
        }
      });
    }

    // Limpiar el texto
    text = text.replace(/\s+/g, " ").replace(/\n\s+/g, "\n").trim();

    // Limitar a 5000 caracteres para no sobrecargar el contexto
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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, type = "chat", catalogContext, needsWebInfo = false, webTopic } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

    console.log("🔍 Edge Function recibió:", {
      mensajes: messages?.length,
      tieneContexto: !!catalogContext,
      clases: catalogContext?.classes?.length || 0,
      docentes: catalogContext?.teachers?.length || 0,
      ofertas: catalogContext?.offerings?.length || 0,
      coil: catalogContext?.coilProposals?.length || 0,
      needsWebInfo,
      webTopic,
    });

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY no está configurada. Configúrala en Supabase Dashboard → Settings → Edge Functions → Secrets");
    }

    // Obtener información web si es necesaria
    let webContent = "";
    if (needsWebInfo && webTopic) {
      const url = UDES_URLS[webTopic as keyof typeof UDES_URLS];
      if (url) {
        webContent = await fetchUDESWebContent(url);
      }
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

🎯 TU FUNCIÓN: Proporcionar información completa y detallada sobre el catálogo académico de UDES y la universidad en general.

REGLAS FUNDAMENTALES:
1. **USA TODOS LOS DATOS DISPONIBLES** del catálogo actualizado y de la web oficial de UDES
2. **Proporciona información COMPLETA**: nombres, fechas, contactos, descripciones
3. **Si no tienes datos, dilo claramente**: "No tengo esa información en el catálogo actual"
4. **NUNCA inventes información** - solo usa los datos proporcionados
5. **Sé ESPECÍFICA Y DETALLADA**: Incluye todos los detalles relevantes

${
  webContent
    ? `
🌐 INFORMACIÓN DE LA WEB OFICIAL DE UDES:

${webContent}

Usa esta información para responder preguntas sobre:
- Equipo directivo y administrativo de UDES
- Misión, visión y valores institucionales
- Historia y trayectoria de la universidad
- Sedes y ubicaciones
- Acreditación y calidad académica
- Programas académicos
- Investigación
- Relaciones internacionales

`
    : ""
}

ESTRUCTURA DE RESPUESTAS:
📊 **Preguntas generales** ("¿Qué clases hay?", "¿Quién es el rector?"):
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
- Usa emojis para mayor claridad (📚 🎓 👨‍🏫 🌐 📧 📱)
- Organiza con viñetas o listas cuando haya múltiples items
- Incluye información de contacto cuando sea relevante
- **IMPORTANTE**: Agrega enlaces clickeables en formato Markdown [Texto del enlace](URL)
- Para ver detalles en catálogo: [Ver en catálogo](/catalog)
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
   - [Ver más detalles](/catalog) 🔗

2. **[Título real]**
   [Detalles completos...]
   - [Ver más detalles](/catalog) 🔗

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
- 🏛️ Información Institucional UDES (equipo directivo, misión/visión, historia, sedes, acreditación)
- 🔬 Investigación y programas académicos
- 🌍 Relaciones internacionales y movilidad académica

PALABRAS CLAVE PARA CONSULTA WEB:
- "equipo directivo", "rector", "vicerrector", "director" → Información del equipo
- "misión", "visión", "valores" → Misión y visión institucional
- "historia", "fundación", "trayectoria" → Historia de UDES
- "sedes", "campus", "ubicación" → Ubicaciones y sedes
- "acreditación", "calidad" → Información de acreditación
- "programas académicos", "carreras" → Oferta académica general
- "investigación" → Grupos y proyectos de investigación

Si detectas estas palabras clave, puedes hacer referencia a la información institucional oficial de UDES.

${catalogInfo}

IMPORTANTE: Proporciona respuestas COMPLETAS y DETALLADAS usando TODA la información disponible del catálogo y la web oficial.`;

    // Construir mensajes para Gemini
    const userMessages = messages.map((msg: any) => msg.content).join("\n\n");
    const fullPrompt = `${liaSystemPrompt}\n\n---\n\nUsuario: ${userMessages}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Error de Gemini API: ${response.status}`);
    }

    const geminiData = await response.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "Lo siento, no pude generar una respuesta.";

    console.log("✅ LIA response generated successfully with Gemini");

    const data = {
      choices: [{
        message: {
          role: "assistant",
          content: responseText
        },
        finish_reason: "stop",
        index: 0
      }],
      usage: geminiData.usageMetadata || {}
    };

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
