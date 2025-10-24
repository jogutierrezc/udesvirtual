# Sistema de Conocimiento LIA para UDES Virtual

## 📚 Descripción

Este sistema potencia a LIA (Learning Intelligence Assistant) con una base de conocimiento institucional completa de la Universidad de Santander (UDES). Permite a LIA proporcionar respuestas precisas sobre la universidad, programas académicos, servicios y mucho más.

## 🗂️ Estructura del Sistema

### Tablas de Base de Datos

1. **`udes_knowledge_base`**: Base de conocimiento general
   - Artículos informativos categorizados
   - Sistema de palabras clave para búsqueda
   - Priorización de contenido

2. **`udes_faqs`**: Preguntas frecuentes
   - Preguntas y respuestas predefinidas
   - Sistema de rating (view_count, helpful_count)
   - URLs relacionadas

3. **`udes_programs`**: Programas académicos
   - Pregrado, posgrado, especializaciones
   - Información completa de contacto
   - Modalidades y requisitos

4. **`udes_institutional_info`**: Información institucional
   - Misión, visión, historia
   - Contactos y sedes
   - Acreditación

5. **`lia_conversation_history`**: Historial de conversaciones
   - Seguimiento de interacciones
   - Contexto para mejora continua
   - Sistema de calificación de satisfacción

### Funciones de Búsqueda

- **`search_udes_knowledge(query, limit)`**: Busca en la base de conocimiento con ranking de relevancia
- **`search_udes_faqs(query, limit)`**: Busca en FAQs con popularidad
- **`search_udes_programs(query, type_filter, limit)`**: Busca programas académicos

## 🚀 Despliegue

### Paso 1: Ejecutar Migración SQL

1. Ve a tu proyecto en Supabase Dashboard
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `20251024_lia_knowledge_base.sql`
4. Haz clic en **Run**
5. Verifica que todas las tablas se crearon correctamente

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'udes_%' OR table_name LIKE 'lia_%';
```

### Paso 2: Actualizar Edge Function

1. **Opción A - Reemplazar archivo actual:**
   ```bash
   cd supabase/functions/lia-chat
   cp index_enhanced.ts index.ts
   ```

2. **Opción B - Desplegar nueva versión:**
   ```bash
   supabase functions deploy lia-chat
   ```

### Paso 3: Verificar Configuración

Asegúrate de que las siguientes variables de entorno estén configuradas en Supabase:

- `LOVABLE_API_KEY`: API key para el servicio de IA
- `SUPABASE_URL`: URL de tu proyecto (auto-configurada)
- `SUPABASE_ANON_KEY`: Key anónima (auto-configurada)

## 📊 Datos Iniciales Incluidos

La migración incluye datos de ejemplo:

### Información Institucional
- ✅ Misión y Visión
- ✅ Historia de UDES
- ✅ Acreditación de Alta Calidad
- ✅ Contacto principal
- ✅ Sede principal Bucaramanga

### Base de Conocimiento
- ✅ ¿Qué es UDES Virtual?
- ✅ Modalidades de estudio
- ✅ Asistente Virtual LIA
- ✅ Registro en la plataforma
- ✅ Certificados de finalización
- ✅ Catálogo de cursos
- ✅ Requisitos técnicos
- ✅ Soporte técnico

### FAQs
- ✅ Costo de cursos MOOC
- ✅ Obtención de certificados
- ✅ Múltiples cursos simultáneos
- ✅ Requisitos de inscripción
- ✅ Duración de cursos
- ✅ Funcionamiento de LIA
- ✅ Sistema de evaluación
- ✅ Actualización de perfil

### Programas Académicos
- ✅ Ingeniería de Sistemas
- ✅ Medicina
- ✅ Administración de Empresas
- ✅ Derecho
- ✅ Especialización en Gerencia de Proyectos
- ✅ Maestría en Educación

## 🎯 Uso desde el Frontend

### Actualizar componente LiaChat.tsx

Añade `userId` y `sessionId` al llamar a la función:

```typescript
const response = await supabase.functions.invoke('lia-chat', {
  body: {
    messages: messages,
    catalogContext: catalogContext,
    userId: user?.id,  // ID del usuario actual
    sessionId: sessionId,  // Genera un UUID para la sesión
    needsWebInfo: false,
    webTopic: null
  }
});
```

### Generar Session ID

```typescript
import { useEffect, useState } from 'react';

const [sessionId, setSessionId] = useState<string>('');

useEffect(() => {
  // Generar session ID único al cargar el componente
  setSessionId(crypto.randomUUID());
}, []);
```

## 📈 Administración de Contenido

### Agregar Artículos de Conocimiento

```sql
INSERT INTO public.udes_knowledge_base (category, title, content, keywords, priority)
VALUES (
  'academico',
  'Título del artículo',
  'Contenido detallado del artículo...',
  ARRAY['palabra1', 'palabra2', 'palabra3'],
  8  -- Prioridad (1-10)
);
```

### Agregar FAQs

```sql
INSERT INTO public.udes_faqs (category, question, answer, keywords)
VALUES (
  'general',
  '¿Pregunta frecuente?',
  'Respuesta detallada...',
  ARRAY['palabra_clave1', 'palabra_clave2']
);
```

### Agregar Programas

```sql
INSERT INTO public.udes_programs (
  program_type, name, description, faculty, modality, duration, credits
)
VALUES (
  'pregrado',
  'Nombre del Programa',
  'Descripción completa...',
  'Facultad de...',
  'presencial',  -- 'presencial', 'virtual', 'hibrida'
  '10 semestres',
  160
);
```

## 🔍 Funciones de Búsqueda

### Buscar en Base de Conocimiento

```sql
SELECT * FROM search_udes_knowledge('inteligencia artificial', 5);
```

### Buscar FAQs

```sql
SELECT * FROM search_udes_faqs('certificado', 3);
```

### Buscar Programas

```sql
SELECT * FROM search_udes_programs('ingeniería', 'pregrado', 10);
```

## 📊 Analíticas

### Ver Conversaciones por Usuario

```sql
SELECT 
  session_id,
  COUNT(*) as message_count,
  MIN(created_at) as session_start,
  MAX(created_at) as session_end
FROM lia_conversation_history
WHERE user_id = 'uuid-del-usuario'
GROUP BY session_id
ORDER BY session_start DESC;
```

### FAQs Más Populares

```sql
SELECT 
  question,
  view_count,
  helpful_count,
  category
FROM udes_faqs
WHERE active = true
ORDER BY view_count DESC, helpful_count DESC
LIMIT 10;
```

### Temas Más Consultados

```sql
SELECT 
  category,
  COUNT(*) as queries
FROM lia_conversation_history
WHERE message_type = 'user'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY category
ORDER BY queries DESC;
```

## 🛠️ Mantenimiento

### Actualizar Estadísticas de FAQs

Incrementar el contador de vistas:

```sql
UPDATE udes_faqs 
SET view_count = view_count + 1 
WHERE id = 'uuid-del-faq';
```

Incrementar contador de utilidad:

```sql
UPDATE udes_faqs 
SET helpful_count = helpful_count + 1 
WHERE id = 'uuid-del-faq';
```

### Guardar Rating de Conversación

```sql
UPDATE lia_conversation_history 
SET satisfaction_rating = 5  -- 1-5 estrellas
WHERE id = 'uuid-del-mensaje'
  AND message_type = 'assistant';
```

### Limpiar Historial Antiguo

```sql
DELETE FROM lia_conversation_history 
WHERE created_at < NOW() - INTERVAL '90 days';
```

## 🔒 Seguridad (RLS)

Todas las tablas tienen Row Level Security (RLS) activado:

- **Lectura pública**: Cualquiera puede leer contenido activo
- **Escritura admin**: Solo administradores pueden crear/modificar contenido
- **Historial privado**: Usuarios solo ven su propio historial
- **Acceso admin completo**: Administradores tienen acceso total

## 🎨 Características de LIA Mejorada

Con esta actualización, LIA puede:

✅ Responder preguntas sobre UDES con información oficial
✅ Proporcionar detalles de programas académicos
✅ Responder FAQs automáticamente
✅ Combinar información de múltiples fuentes
✅ Mantener contexto de conversaciones
✅ Aprender de interacciones (mediante historial)
✅ Priorizar información por relevancia

## 📝 Próximos Pasos

1. **Ampliar la base de conocimiento**: Añadir más artículos y FAQs
2. **Integrar con más sistemas**: Conectar con sistema de matrículas, calificaciones, etc.
3. **Implementar búsqueda semántica**: Usar embeddings para búsquedas más inteligentes
4. **Dashboard de analíticas**: Crear interfaz para visualizar estadísticas
5. **Sistema de feedback**: Permitir a usuarios calificar respuestas de LIA
6. **Multi-idioma**: Añadir soporte para inglés y otros idiomas

## 🐛 Solución de Problemas

### Error: "function search_udes_knowledge does not exist"

Verifica que la migración se ejecutó correctamente:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'search_udes%';
```

### Error: "permission denied for table udes_knowledge_base"

Verifica las políticas RLS:

```sql
SELECT * FROM pg_policies 
WHERE tablename LIKE 'udes_%';
```

### LIA no usa la base de conocimiento

Verifica que la Edge Function tiene acceso a Supabase:

```bash
supabase functions logs lia-chat --tail
```

## 📞 Soporte

Para problemas o preguntas sobre este sistema:

- **Email**: soporte@udes.edu.co
- **Documentación Supabase**: https://supabase.com/docs
- **Repositorio**: [URL del repositorio]

---

Creado con ❤️ para UDES Virtual
