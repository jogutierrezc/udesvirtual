# 🔧 Solución: PDF de Certificado en Blanco

## Problemas Identificados y Solucionados

### 1. ❌ Problema: `display: none` en AutoDownloadCertificate
**Causa:** El componente `AutoDownloadCertificate` usaba `display: none`, lo que impedía que el DOM se renderizara. Como resultado, `html2canvas` no tenía contenido que capturar.

**Solución Aplicada:** ✅
```tsx
// ANTES (No funciona)
<div style={{ display: 'none' }}>

// DESPUÉS (Funciona)
<div style={{ position: 'fixed', left: '-9999px', top: '-9999px', visibility: 'hidden' }}>
```

### 2. ❌ Problema: Tabla `certificate_templates` no existe
**Causa:** La migración para crear la tabla de plantillas de certificados no se ha ejecutado en Supabase.

**Solución:** Ejecutar manualmente en Supabase SQL Editor

---

## 📋 Pasos para Resolver Completamente

### Paso 1: Aplicar Migración en Supabase ⚠️ IMPORTANTE

1. Abre tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido del archivo: `APPLY_CERTIFICATE_TEMPLATES_MIGRATION.sql`
5. Ejecuta la query (Run / Ctrl+Enter)
6. Verifica que veas el mensaje: "Tabla certificate_templates creada exitosamente"

### Paso 2: Insertar Plantilla de Ejemplo (Opcional)

1. En el mismo SQL Editor de Supabase
2. Copia y pega el contenido del archivo: `INSERT_SAMPLE_CERTIFICATE_TEMPLATE.sql`
3. Ejecuta la query
4. Verifica que se haya insertado una plantilla global

### Paso 3: Reiniciar el Servidor de Desarrollo

```bash
# Detener el servidor actual (Ctrl+C si está corriendo)
# Luego reiniciar:
npm run dev
```

### Paso 4: Probar la Generación de Certificados

1. Inicia sesión como estudiante
2. Ve a **Dashboard del Estudiante**
3. Haz clic en **"Descargar PDF"** en cualquier certificado
4. El PDF debería descargarse automáticamente con el contenido visible

---

## 🎯 Verificación de que Todo Funciona

### Checklist:
- [ ] La tabla `certificate_templates` existe en Supabase
- [ ] Hay al menos una plantilla global activa insertada
- [ ] El componente `AutoDownloadCertificate` NO usa `display: none`
- [ ] El componente `CertificateModal` carga plantillas correctamente
- [ ] La firma se carga (desde plantilla o por defecto)
- [ ] El QR code se genera antes de exportar el PDF
- [ ] El PDF se descarga con contenido visible

---

## 🔍 Debug en Caso de Problemas

### Ver logs en consola del navegador:
```javascript
// Abre DevTools (F12) y busca estos mensajes:
- "Loading certificates for user: ..."
- "Certificates query result: ..."
- "Error loading certificate data" (si hay errores)
```

### Verificar que la tabla existe en Supabase:
```sql
-- Ejecutar en SQL Editor
SELECT * FROM public.certificate_templates LIMIT 5;
```

### Verificar políticas RLS:
```sql
-- Ver políticas de la tabla
SELECT * FROM pg_policies 
WHERE tablename = 'certificate_templates';
```

---

## 📁 Archivos Modificados

1. ✅ `/src/components/AutoDownloadCertificate.tsx` - Corregido rendering oculto
2. ✅ `/src/components/CertificateModal.tsx` - Ya integra plantillas correctamente
3. ✅ `/APPLY_CERTIFICATE_TEMPLATES_MIGRATION.sql` - **EJECUTAR EN SUPABASE**
4. ✅ `/INSERT_SAMPLE_CERTIFICATE_TEMPLATE.sql` - Plantilla de ejemplo

---

## 🚀 Próximos Pasos (Opcional)

1. **Crear Plantillas Personalizadas:**
   - Ve a `/admin/mooc/templates`
   - Crea plantillas específicas por curso
   - Personaliza el diseño con los campos disponibles

2. **Gestionar Firmas:**
   - Sube diferentes firmas en `/admin/mooc/signatures`
   - Asigna firmas específicas a plantillas

---

## 💡 Notas Técnicas

- **html2canvas** requiere que el contenido esté en el DOM (no con `display: none`)
- Las plantillas se buscan primero por `course_id`, luego como global
- El QR se genera asíncronamente, por eso se espera 1200ms antes de exportar
- Las políticas RLS permiten a cualquiera leer plantillas activas
- Solo admins pueden crear/editar plantillas

---

## ✅ Resultado Esperado

Al hacer clic en "Descargar PDF":
1. Se abre un modal invisible fuera de la pantalla
2. Se carga el certificado con datos reales
3. Se genera el QR code
4. Se renderiza la plantilla (o diseño por defecto)
5. html2canvas captura el contenido
6. jsPDF crea el archivo PDF
7. Se descarga automáticamente el PDF con todo el contenido visible

---

**Creado:** 13 de noviembre de 2025  
**Estado:** Listo para probar después de aplicar la migración en Supabase
