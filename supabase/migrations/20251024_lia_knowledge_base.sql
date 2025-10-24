-- ============================================
-- SISTEMA DE CONOCIMIENTO PARA LIA
-- ============================================
-- Base de conocimiento institucional de la UDES para el asistente LIA

-- ============================================
-- TABLA: udes_knowledge_base
-- ============================================
-- Información general sobre la UDES que LIA puede consultar

CREATE TABLE IF NOT EXISTS public.udes_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- 'institucional', 'academico', 'servicios', 'admisiones', etc.
  title text NOT NULL,
  content text NOT NULL,
  keywords text[], -- Array de palabras clave para búsqueda
  priority integer DEFAULT 0, -- Mayor prioridad = más relevante
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_udes_knowledge_category ON public.udes_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_udes_knowledge_active ON public.udes_knowledge_base(active);
CREATE INDEX IF NOT EXISTS idx_udes_knowledge_priority ON public.udes_knowledge_base(priority DESC);
CREATE INDEX IF NOT EXISTS idx_udes_knowledge_keywords ON public.udes_knowledge_base USING GIN(keywords);

-- ============================================
-- TABLA: udes_faqs
-- ============================================
-- Preguntas frecuentes para respuestas rápidas

CREATE TABLE IF NOT EXISTS public.udes_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  related_urls text[], -- URLs relacionadas
  keywords text[],
  view_count integer DEFAULT 0,
  helpful_count integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_udes_faqs_category ON public.udes_faqs(category);
CREATE INDEX IF NOT EXISTS idx_udes_faqs_active ON public.udes_faqs(active);
CREATE INDEX IF NOT EXISTS idx_udes_faqs_keywords ON public.udes_faqs USING GIN(keywords);

-- ============================================
-- TABLA: udes_programs
-- ============================================
-- Información sobre programas académicos

CREATE TABLE IF NOT EXISTS public.udes_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_type text NOT NULL, -- 'pregrado', 'posgrado', 'especializacion', 'maestria', 'doctorado'
  name text NOT NULL,
  description text,
  faculty text, -- Facultad
  modality text, -- 'presencial', 'virtual', 'hibrida'
  duration text,
  credits integer,
  registration_code text,
  contact_email text,
  contact_phone text,
  requirements text[],
  learning_outcomes text[],
  career_opportunities text[],
  curriculum_url text,
  more_info_url text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_udes_programs_type ON public.udes_programs(program_type);
CREATE INDEX IF NOT EXISTS idx_udes_programs_modality ON public.udes_programs(modality);
CREATE INDEX IF NOT EXISTS idx_udes_programs_active ON public.udes_programs(active);

-- ============================================
-- TABLA: udes_institutional_info
-- ============================================
-- Información institucional general

CREATE TABLE IF NOT EXISTS public.udes_institutional_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  info_type text NOT NULL, -- 'mision', 'vision', 'historia', 'valores', 'contacto', 'sedes', etc.
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb, -- Información adicional estructurada
  order_index integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_udes_info_type ON public.udes_institutional_info(info_type);
CREATE INDEX IF NOT EXISTS idx_udes_info_active ON public.udes_institutional_info(active);

-- ============================================
-- TABLA: lia_conversation_history
-- ============================================
-- Historial de conversaciones para contexto y mejora continua

CREATE TABLE IF NOT EXISTS public.lia_conversation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  message_type text NOT NULL, -- 'user' o 'assistant'
  message text NOT NULL,
  context jsonb, -- Contexto adicional usado en la respuesta
  satisfaction_rating integer, -- 1-5 estrellas (NULL si no evaluado)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lia_history_user ON public.lia_conversation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_lia_history_session ON public.lia_conversation_history(session_id);
CREATE INDEX IF NOT EXISTS idx_lia_history_created ON public.lia_conversation_history(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Knowledge Base: Solo lectura pública
ALTER TABLE public.udes_knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "knowledge_base_public_read" ON public.udes_knowledge_base;
CREATE POLICY "knowledge_base_public_read"
  ON public.udes_knowledge_base FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "knowledge_base_admin_all" ON public.udes_knowledge_base;
CREATE POLICY "knowledge_base_admin_all"
  ON public.udes_knowledge_base FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- FAQs: Lectura pública, escritura admin
ALTER TABLE public.udes_faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "faqs_public_read" ON public.udes_faqs;
CREATE POLICY "faqs_public_read"
  ON public.udes_faqs FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "faqs_admin_all" ON public.udes_faqs;
CREATE POLICY "faqs_admin_all"
  ON public.udes_faqs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Programs: Lectura pública, escritura admin
ALTER TABLE public.udes_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "programs_public_read" ON public.udes_programs;
CREATE POLICY "programs_public_read"
  ON public.udes_programs FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "programs_admin_all" ON public.udes_programs;
CREATE POLICY "programs_admin_all"
  ON public.udes_programs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Institutional Info: Lectura pública, escritura admin
ALTER TABLE public.udes_institutional_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "institutional_info_public_read" ON public.udes_institutional_info;
CREATE POLICY "institutional_info_public_read"
  ON public.udes_institutional_info FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "institutional_info_admin_all" ON public.udes_institutional_info;
CREATE POLICY "institutional_info_admin_all"
  ON public.udes_institutional_info FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Conversation History: Solo el usuario puede ver su historial
ALTER TABLE public.lia_conversation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation_history_user_read" ON public.lia_conversation_history;
CREATE POLICY "conversation_history_user_read"
  ON public.lia_conversation_history FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "conversation_history_user_insert" ON public.lia_conversation_history;
CREATE POLICY "conversation_history_user_insert"
  ON public.lia_conversation_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "conversation_history_admin_all" ON public.lia_conversation_history;
CREATE POLICY "conversation_history_admin_all"
  ON public.lia_conversation_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================
-- FUNCIONES DE BÚSQUEDA
-- ============================================

-- Función para buscar en la base de conocimiento
CREATE OR REPLACE FUNCTION search_udes_knowledge(
  search_query text,
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  relevance real
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    -- Calcular relevancia basada en coincidencias
    (
      CASE 
        WHEN kb.title ILIKE '%' || search_query || '%' THEN 3.0
        ELSE 0.0
      END +
      CASE 
        WHEN kb.content ILIKE '%' || search_query || '%' THEN 2.0
        ELSE 0.0
      END +
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM unnest(kb.keywords) AS kw 
          WHERE kw ILIKE '%' || search_query || '%'
        ) THEN 1.5
        ELSE 0.0
      END +
      (kb.priority::real / 10.0)
    ) AS relevance
  FROM public.udes_knowledge_base kb
  WHERE 
    kb.active = true
    AND (
      kb.title ILIKE '%' || search_query || '%'
      OR kb.content ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(kb.keywords) AS kw 
        WHERE kw ILIKE '%' || search_query || '%'
      )
    )
  ORDER BY relevance DESC, kb.priority DESC
  LIMIT limit_count;
END;
$$;

-- Función para buscar FAQs
CREATE OR REPLACE FUNCTION search_udes_faqs(
  search_query text,
  limit_count integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  category text,
  question text,
  answer text,
  relevance real
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    faq.id,
    faq.category,
    faq.question,
    faq.answer,
    -- Calcular relevancia
    (
      CASE 
        WHEN faq.question ILIKE '%' || search_query || '%' THEN 3.0
        ELSE 0.0
      END +
      CASE 
        WHEN faq.answer ILIKE '%' || search_query || '%' THEN 2.0
        ELSE 0.0
      END +
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM unnest(faq.keywords) AS kw 
          WHERE kw ILIKE '%' || search_query || '%'
        ) THEN 1.5
        ELSE 0.0
      END +
      (faq.view_count::real / 100.0) +
      (faq.helpful_count::real / 50.0)
    ) AS relevance
  FROM public.udes_faqs faq
  WHERE 
    faq.active = true
    AND (
      faq.question ILIKE '%' || search_query || '%'
      OR faq.answer ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(faq.keywords) AS kw 
        WHERE kw ILIKE '%' || search_query || '%'
      )
    )
  ORDER BY relevance DESC
  LIMIT limit_count;
END;
$$;

-- Función para buscar programas académicos
CREATE OR REPLACE FUNCTION search_udes_programs(
  search_query text,
  program_type_filter text DEFAULT NULL,
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  program_type text,
  name text,
  description text,
  faculty text,
  modality text,
  relevance real
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.program_type,
    p.name,
    p.description,
    p.faculty,
    p.modality,
    -- Calcular relevancia
    (
      CASE 
        WHEN p.name ILIKE '%' || search_query || '%' THEN 3.0
        ELSE 0.0
      END +
      CASE 
        WHEN p.description ILIKE '%' || search_query || '%' THEN 2.0
        ELSE 0.0
      END +
      CASE 
        WHEN p.faculty ILIKE '%' || search_query || '%' THEN 1.5
        ELSE 0.0
      END
    ) AS relevance
  FROM public.udes_programs p
  WHERE 
    p.active = true
    AND (
      p.name ILIKE '%' || search_query || '%'
      OR p.description ILIKE '%' || search_query || '%'
      OR p.faculty ILIKE '%' || search_query || '%'
    )
    AND (program_type_filter IS NULL OR p.program_type = program_type_filter)
  ORDER BY relevance DESC
  LIMIT limit_count;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON public.udes_knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON public.udes_knowledge_base
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_faqs_updated_at ON public.udes_faqs;
CREATE TRIGGER update_faqs_updated_at
  BEFORE UPDATE ON public.udes_faqs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_programs_updated_at ON public.udes_programs;
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.udes_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_institutional_info_updated_at ON public.udes_institutional_info;
CREATE TRIGGER update_institutional_info_updated_at
  BEFORE UPDATE ON public.udes_institutional_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATOS INICIALES - INFORMACIÓN INSTITUCIONAL
-- ============================================

INSERT INTO public.udes_institutional_info (info_type, title, content, order_index, metadata) VALUES
  (
    'mision',
    'Misión',
    'La Universidad de Santander UDES es una institución de educación superior que forma profesionales integrales, competentes y comprometidos con el desarrollo sostenible de la región y el país, mediante procesos de docencia, investigación y proyección social de alta calidad.',
    1,
    '{"short_version": "Formar profesionales integrales para el desarrollo sostenible"}'::jsonb
  ),
  (
    'vision',
    'Visión 2025',
    'Para el año 2025, la Universidad de Santander UDES será reconocida como una institución de educación superior de alta calidad, líder en la región en formación integral, investigación aplicada e innovación, comprometida con el desarrollo sostenible y la responsabilidad social.',
    2,
    '{"year": "2025", "focus": ["calidad", "investigación", "innovación", "sostenibilidad"]}'::jsonb
  ),
  (
    'historia',
    'Historia',
    'La Universidad de Santander fue fundada en 1982 en Bucaramanga, Colombia. A lo largo de más de 40 años, la UDES ha crecido hasta convertirse en una institución multicampus con presencia en varias regiones del país, ofreciendo programas de pregrado y posgrado en diversas áreas del conocimiento.',
    3,
    '{"founded": "1982", "location": "Bucaramanga, Colombia", "years_active": "40+"}'::jsonb
  ),
  (
    'acreditacion',
    'Acreditación de Alta Calidad',
    'La Universidad de Santander cuenta con Acreditación Institucional de Alta Calidad otorgada por el Ministerio de Educación Nacional de Colombia, lo que certifica la excelencia en sus procesos académicos, administrativos y de investigación.',
    4,
    '{"status": "Acreditada", "entity": "Ministerio de Educación Nacional"}'::jsonb
  ),
  (
    'contacto_principal',
    'Contacto General',
    'Campus Universitario Lagos del Cacique: Calle 70 No. 55-210, Bucaramanga, Santander, Colombia. Teléfono: +57 (607) 651 6500. Email: info@udes.edu.co. Sitio web: https://udes.edu.co',
    5,
    '{"address": "Calle 70 No. 55-210", "city": "Bucaramanga", "phone": "+57 (607) 651 6500", "email": "info@udes.edu.co", "website": "https://udes.edu.co"}'::jsonb
  ),
  (
    'sede_principal',
    'Sede Principal - Bucaramanga',
    'Campus Universitario Lagos del Cacique, ubicado en Bucaramanga. Modernas instalaciones con laboratorios, bibliotecas, zonas deportivas y espacios de bienestar universitario.',
    6,
    '{"type": "campus", "name": "Lagos del Cacique", "facilities": ["laboratorios", "bibliotecas", "deportes", "bienestar"]}'::jsonb
  );

-- ============================================
-- DATOS INICIALES - CONOCIMIENTO BASE
-- ============================================

INSERT INTO public.udes_knowledge_base (category, title, content, keywords, priority) VALUES
  (
    'institucional',
    '¿Qué es UDES Virtual?',
    'UDES Virtual es la plataforma de educación en línea de la Universidad de Santander que ofrece cursos MOOC (Massive Open Online Courses) gratuitos y de alta calidad. Los estudiantes pueden acceder a contenido educativo, realizar actividades, obtener certificados y contar con el apoyo del asistente virtual LIA.',
    ARRAY['plataforma', 'virtual', 'mooc', 'cursos', 'online', 'educación'],
    10
  ),
  (
    'academico',
    'Modalidades de Estudio',
    'La UDES ofrece tres modalidades de estudio: Presencial (en campus universitario), Virtual (100% en línea) e Híbrida (combinación de presencial y virtual). Los programas MOOC son completamente virtuales y de acceso libre.',
    ARRAY['modalidad', 'presencial', 'virtual', 'híbrida', 'online', 'distancia'],
    8
  ),
  (
    'servicios',
    'Asistente Virtual LIA',
    'LIA (Learning Intelligence Assistant) es el asistente virtual inteligente de UDES Virtual. LIA puede ayudarte con información sobre cursos, responder preguntas sobre la universidad, guiarte en el uso de la plataforma y proporcionar apoyo académico personalizado.',
    ARRAY['lia', 'asistente', 'virtual', 'chatbot', 'ayuda', 'soporte', 'inteligencia artificial'],
    9
  ),
  (
    'admisiones',
    'Cómo Registrarse en UDES Virtual',
    'Para registrarte en UDES Virtual: 1) Visita la página de registro, 2) Completa el formulario con tus datos personales, 3) Verifica tu correo electrónico, 4) Completa tu perfil académico, 5) Explora el catálogo de cursos y matricúlate. El registro es completamente gratuito.',
    ARRAY['registro', 'inscripción', 'crear cuenta', 'matricula', 'admisiones'],
    10
  ),
  (
    'academico',
    'Certificados de Finalización',
    'Al completar exitosamente un curso MOOC en UDES Virtual, recibirás automáticamente un certificado digital verificable. El certificado incluye tu nombre, el nombre del curso, la fecha de finalización y un código QR para verificación de autenticidad.',
    ARRAY['certificado', 'diploma', 'reconocimiento', 'finalización', 'completar curso'],
    9
  ),
  (
    'servicios',
    'Catálogo de Cursos',
    'El catálogo de cursos MOOC incluye programas en diversas áreas: Ingeniería, Ciencias de la Salud, Ciencias Económicas y Administrativas, Ciencias Sociales y Humanidades, y más. Todos los cursos son gratuitos y están diseñados por profesores expertos de la UDES.',
    ARRAY['catálogo', 'cursos', 'programas', 'oferta académica', 'áreas'],
    8
  ),
  (
    'tecnologia',
    'Requisitos Técnicos',
    'Para usar UDES Virtual necesitas: Conexión a Internet (mínimo 2 Mbps), Navegador web actualizado (Chrome, Firefox, Safari o Edge), Dispositivo con pantalla (computadora, tablet o smartphone), y una cuenta de correo electrónico activa.',
    ARRAY['requisitos', 'técnicos', 'sistema', 'navegador', 'internet', 'dispositivo'],
    7
  ),
  (
    'soporte',
    'Soporte Técnico',
    'Si tienes problemas técnicos con la plataforma, puedes: 1) Consultar con LIA para soluciones rápidas, 2) Enviar un correo a soporte@udes.edu.co, 3) Contactar al área de sistemas, 4) Revisar la sección de ayuda y tutoriales.',
    ARRAY['soporte', 'ayuda', 'problemas', 'técnico', 'error', 'bug'],
    8
  );

-- ============================================
-- DATOS INICIALES - FAQs
-- ============================================

INSERT INTO public.udes_faqs (category, question, answer, keywords) VALUES
  (
    'general',
    '¿Los cursos MOOC tienen algún costo?',
    'No, todos los cursos MOOC en UDES Virtual son completamente gratuitos. Solo necesitas registrarte en la plataforma para acceder a todo el contenido educativo.',
    ARRAY['costo', 'gratis', 'precio', 'pago', 'gratuito']
  ),
  (
    'certificados',
    '¿Cómo obtengo mi certificado?',
    'Los certificados se generan automáticamente cuando completas todas las lecciones y apruebas los exámenes de un curso. Puedes descargar tu certificado desde tu perfil en la sección "Mis Certificados".',
    ARRAY['certificado', 'descargar', 'obtener', 'conseguir']
  ),
  (
    'cursos',
    '¿Puedo tomar varios cursos al mismo tiempo?',
    'Sí, puedes inscribirte y estudiar múltiples cursos simultáneamente. Te recomendamos organizar tu tiempo adecuadamente para completar todos los cursos que inicies.',
    ARRAY['varios cursos', 'múltiples', 'simultáneos', 'al mismo tiempo']
  ),
  (
    'acceso',
    '¿Necesito estar inscrito en la UDES para usar la plataforma?',
    'No, UDES Virtual está abierta para cualquier persona interesada en aprender, sin importar si eres estudiante regular de la universidad o no. Solo necesitas crear una cuenta gratuita.',
    ARRAY['inscripción', 'estudiante', 'requisitos', 'acceso']
  ),
  (
    'duracion',
    '¿Cuánto tiempo tengo para completar un curso?',
    'Los cursos MOOC son autodirigidos, lo que significa que puedes avanzar a tu propio ritmo. No hay límite de tiempo para completar un curso una vez que te has inscrito.',
    ARRAY['duración', 'tiempo', 'plazo', 'fecha límite']
  ),
  (
    'lia',
    '¿Qué es LIA y cómo me puede ayudar?',
    'LIA es tu asistente virtual inteligente. Puede responder preguntas sobre la UDES, ayudarte a navegar la plataforma, explicar contenido de cursos y proporcionar información institucional. Simplemente escribe tu pregunta y LIA te responderá.',
    ARRAY['lia', 'asistente', 'chatbot', 'ayuda', 'virtual']
  ),
  (
    'evaluacion',
    '¿Cómo funcionan los exámenes?',
    'Cada curso incluye exámenes de evaluación. Puedes intentar cada examen hasta aprobarlo. Los exámenes están diseñados para reforzar tu aprendizaje y validar tu comprensión del contenido.',
    ARRAY['examen', 'evaluación', 'test', 'prueba', 'calificación']
  ),
  (
    'perfil',
    '¿Puedo actualizar mi información de perfil?',
    'Sí, puedes actualizar tu información en cualquier momento desde la sección "Perfil" en tu cuenta. Allí puedes cambiar tu nombre, biografía, foto de perfil y preferencias de aprendizaje.',
    ARRAY['perfil', 'actualizar', 'editar', 'cambiar', 'información personal']
  );

-- ============================================
-- DATOS INICIALES - PROGRAMAS ACADÉMICOS
-- ============================================

INSERT INTO public.udes_programs (program_type, name, description, faculty, modality, duration, credits) VALUES
  (
    'pregrado',
    'Ingeniería de Sistemas',
    'Programa enfocado en el desarrollo de software, gestión de tecnologías de información y soluciones computacionales innovadoras.',
    'Facultad de Ingenierías',
    'presencial',
    '10 semestres',
    160
  ),
  (
    'pregrado',
    'Medicina',
    'Formación integral de médicos comprometidos con la salud y el bienestar de las comunidades.',
    'Facultad de Ciencias de la Salud',
    'presencial',
    '12 semestres',
    240
  ),
  (
    'pregrado',
    'Administración de Empresas',
    'Programa que forma líderes empresariales capaces de gestionar organizaciones en entornos globalizados.',
    'Facultad de Ciencias Económicas y Administrativas',
    'hibrida',
    '9 semestres',
    144
  ),
  (
    'pregrado',
    'Derecho',
    'Formación de profesionales del derecho con sólidos conocimientos jurídicos y compromiso social.',
    'Facultad de Ciencias Sociales y Humanidades',
    'presencial',
    '10 semestres',
    160
  ),
  (
    'posgrado',
    'Especialización en Gerencia de Proyectos',
    'Programa avanzado para profesionales que buscan liderar proyectos de alta complejidad.',
    'Facultad de Ciencias Económicas y Administrativas',
    'virtual',
    '2 semestres',
    36
  ),
  (
    'maestria',
    'Maestría en Educación',
    'Programa de maestría para educadores que buscan innovar en procesos pedagógicos.',
    'Facultad de Educación',
    'virtual',
    '4 semestres',
    48
  );

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON TABLE public.udes_knowledge_base IS 'Base de conocimiento institucional para el asistente LIA';
COMMENT ON TABLE public.udes_faqs IS 'Preguntas frecuentes con respuestas predefinidas';
COMMENT ON TABLE public.udes_programs IS 'Catálogo de programas académicos de la UDES';
COMMENT ON TABLE public.udes_institutional_info IS 'Información institucional general';
COMMENT ON TABLE public.lia_conversation_history IS 'Historial de conversaciones con LIA para contexto';

COMMENT ON FUNCTION search_udes_knowledge IS 'Busca en la base de conocimiento con ranking de relevancia';
COMMENT ON FUNCTION search_udes_faqs IS 'Busca en FAQs con ranking de relevancia';
COMMENT ON FUNCTION search_udes_programs IS 'Busca programas académicos con filtros';
