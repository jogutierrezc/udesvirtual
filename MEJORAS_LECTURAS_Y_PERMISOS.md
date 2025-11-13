# ✅ Mejoras Implementadas: Gestión de Lecturas y Permisos de Profesores

## 📋 Problemas Resueltos

### 1. ✅ No aparecía opción para cargar lecturas
**Problema:** En la página de edición de lección no había interfaz para subir archivos PDF de lecturas.

**Solución:**
- Agregada sección completa de "Lecturas (PDF)" en `LessonEditorPage.tsx`
- Incluye:
  - Botón de subida con input file (acepta solo PDF, máx 10MB)
  - Lista de lecturas existentes con vista previa
  - Botones para ver y eliminar cada lectura
  - Indicadores de carga durante upload

### 2. ✅ Las lecturas no subían correctamente
**Problema:** El código usaba nombres incorrectos de bucket y columnas de base de datos.

**Solución:**
- Corregido para usar bucket `mooc-readings` (el correcto según migración)
- Ajustado para usar columnas correctas:
  - `storage_path` en lugar de `file_url`
  - `created_by` (requerido)
  - `type: 'file'` para PDFs
- Generación de nombres únicos con timestamp para evitar colisiones

### 3. ✅ Profesores no tenían acceso a editar cursos/lecciones
**Problema:** Solo los admin podían editar, bloqueando a los profesores.

**Solución:**
- Agregada propiedad `requireAdminOrProfessor` en `ProtectedRoute`
- Actualizado `ProtectedRoute.tsx` para verificar rol de profesor
- Modificadas rutas en `App.tsx`:
  - `/admin/mooc/course/:courseId/edit` → permite admin o profesor
  - `/admin/mooc/course/:courseId/lesson/:lessonId/edit` → permite admin o profesor

---

## 🔧 Archivos Modificados

### 1. `/src/components/ProtectedRoute.tsx`
```typescript
interface ProtectedRouteProps {
  requireAdminOrProfessor?: boolean; // ← NUEVO
}

// Ahora verifica ambos roles:
const hasAdminRole = roles?.some(r => r.role === "admin");
const hasProfessorRole = roles?.some(r => r.role === "professor");
```

### 2. `/src/App.tsx`
```typescript
// ANTES: requireAdmin={true}
// DESPUÉS: requireAdminOrProfessor={true}
<Route path="/admin/mooc/course/:courseId/edit" />
<Route path="/admin/mooc/course/:courseId/lesson/:lessonId/edit" />
```

### 3. `/src/pages/admin/mooc/LessonEditorPage.tsx`
**Nuevas funcionalidades:**
- `loadReadings()` - Carga lecturas existentes
- `handleFileUpload()` - Sube PDF al storage y registra en DB
- `handleDeleteReading()` - Elimina archivo y registro
- Nueva sección UI con:
  - Input file oculto con label personalizado
  - Lista de lecturas con iconos
  - Botones de acción (Ver/Eliminar)

---

## 🎯 Cómo Usar

### Para Profesores:

1. **Acceder a edición de lección:**
   - Ve a tu curso en el panel admin
   - Haz clic en "Editar" en cualquier lección
   - Ahora tienes acceso (antes solo admins)

2. **Subir lecturas:**
   - En la sección "Lecturas (PDF)", haz clic en "Subir PDF"
   - Selecciona un archivo PDF (máx 10MB)
   - Espera a que se complete la subida
   - La lectura aparecerá en la lista

3. **Gestionar lecturas:**
   - **Ver:** Abre el PDF en una nueva pestaña
   - **Eliminar:** Borra el archivo del storage y la DB

### Para Estudiantes:

- Las lecturas subidas aparecerán automáticamente en `/courses/:courseId/learn`
- Podrán descargarlas y marcarlas como completadas
- El progreso de lectura se registra en `student_reading_progress`

---

## 🔒 Seguridad y Permisos

### Storage Bucket: `mooc-readings`
✅ **Políticas RLS configuradas:**
- Lectura pública (cualquiera puede leer)
- Subida solo para autenticados
- Actualización solo para autenticados
- Eliminación solo para autenticados

### Tabla: `mooc_readings`
✅ **Estructura:**
```sql
- id (uuid)
- lesson_id (uuid, FK)
- title (text)
- content (text, opcional)
- storage_path (text) ← Ruta en bucket
- file_name (text)
- type (text) ← 'file' o 'inline'
- sort_order (integer)
- created_by (uuid, FK)
- created_at (timestamptz)
```

---

## ✨ Mejoras Técnicas

1. **Validaciones:**
   - Solo acepta archivos PDF
   - Límite de tamaño: 10MB
   - Nombres de archivo sanitizados (caracteres especiales)

2. **UX:**
   - Indicador de carga durante upload
   - Confirmación antes de eliminar
   - Toast notifications para feedback
   - Preview de fecha de creación

3. **Seguridad:**
   - Verifica autenticación antes de upload
   - Usa `created_by` para auditoría
   - Nombres únicos con timestamp

---

## 🐛 Troubleshooting

### Si las lecturas no suben:

1. **Verificar que la migración esté aplicada:**
```sql
SELECT * FROM mooc_readings LIMIT 1;
```

2. **Verificar bucket en Supabase:**
- Ve a Storage → Buscar bucket `mooc-readings`
- Debe existir y ser público

3. **Verificar rol del usuario:**
```sql
SELECT * FROM user_roles WHERE user_id = 'TU_USER_ID';
```
- Debe tener rol `professor` o `admin`

### Si profesores no pueden acceder:

1. **Asignar rol de profesor:**
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('USER_ID_AQUI', 'professor')
ON CONFLICT DO NOTHING;
```

---

## 📊 Resultado Final

✅ Profesores pueden editar sus cursos y lecciones  
✅ Pueden subir/eliminar lecturas en PDF  
✅ Los archivos se almacenan correctamente en Supabase Storage  
✅ Las lecturas aparecen en la vista del estudiante  
✅ Sistema de progreso de lectura funcional  

---

**Fecha:** 13 de noviembre de 2025  
**Estado:** ✅ Completado y listo para usar
