# Funcionalidad de Recalificación de Exámenes

## Descripción

Esta funcionalidad permite a los profesores recalificar automáticamente todos los intentos de examen completados por los estudiantes. Es especialmente útil cuando las respuestas correctas del examen fueron actualizadas después de que los estudiantes ya lo tomaron.

## Problema que Resuelve

**Escenario:** Un profesor crea un examen pero olvida marcar las opciones correctas, o las marca incorrectamente. Los estudiantes toman el examen y obtienen calificaciones de 0 o incorrectas. 

**Solución:** El profesor puede actualizar las respuestas correctas y luego usar la función de recalificación para recalcular automáticamente las notas de todos los estudiantes sin que tengan que volver a hacer el examen.

## Cómo Usar

### 1. Actualizar las Respuestas Correctas

Primero, actualiza las respuestas correctas del examen:

1. Ve a la página de administración del curso como profesor
2. En la sección de "Evaluaciones", selecciona el examen
3. Haz clic en "Gestionar Preguntas"
4. Marca correctamente las opciones que son correctas para cada pregunta
5. Guarda los cambios

### 2. Recalificar el Examen

Una vez actualizadas las respuestas correctas:

1. Ve a **Resultados del Curso** (desde tu panel de profesor)
2. Busca la sección **"Estadísticas por Examen"**
3. Localiza el examen que deseas recalificar
4. Haz clic en el botón **"Recalificar"** junto al examen

### 3. Revisar los Resultados

El sistema mostrará:
- ✅ **Estudiantes que mejoraron** su calificación
- ❌ **Estudiantes que empeoraron** (si las respuestas correctas cambiaron drásticamente)
- ➖ **Estudiantes sin cambios** en su calificación

Verás una tabla detallada con:
- Nombre del estudiante
- Nota anterior
- Nueva nota
- Cambio en el estado (Aprobado/Reprobado)
- Diferencia en puntos

## Características Técnicas

### Función SQL: `regrade_exam`

```sql
public.regrade_exam(p_exam_id bigint)
```

**Parámetros:**
- `p_exam_id`: ID del examen a recalificar

**Retorna:**
Una tabla con los siguientes campos para cada intento:
- `attempt_id`: ID del intento
- `user_id`: ID del estudiante
- `old_score`: Calificación anterior (0-5)
- `new_score`: Nueva calificación (0-5)
- `old_passed`: ¿Aprobó antes?
- `new_passed`: ¿Aprobó ahora?

### Proceso de Recalificación

1. **Identifica intentos**: Busca todos los intentos completados del examen
2. **Guarda valores antiguos**: Registra las notas actuales
3. **Recalcula**: Usa la función `compute_exam_score` existente
4. **Compara**: Muestra las diferencias entre notas antiguas y nuevas

### Seguridad

- Solo usuarios autenticados pueden ejecutar la función
- Se respetan las políticas RLS (Row Level Security) de Supabase
- Los cambios son permanentes y se registran en la base de datos

## Instalación

### Requisito Previo
La función SQL debe estar instalada en tu base de datos Supabase.

### Aplicar la Migración

#### Opción 1: SQL Editor de Supabase (Recomendado)

1. Accede al panel de Supabase: https://ovdeaweddxafslbrflor.supabase.co
2. Ve a **SQL Editor**
3. Copia y pega el contenido del archivo:
   ```
   supabase/migrations/20260114_add_exam_regrade_function.sql
   ```
4. Ejecuta el script
5. Verifica que no haya errores

#### Opción 2: Supabase CLI

Si tienes Supabase CLI instalado:

```bash
supabase db push --include-all
```

#### Opción 3: Script PowerShell

Ejecuta el script incluido:

```powershell
.\apply_regrade_migration.ps1
```

## Casos de Uso

### Caso 1: Respuestas Incorrectas Iniciales

**Problema:** El profesor marcó la opción B como correcta, pero debía ser la opción A.

**Solución:**
1. Cambiar la opción correcta a A
2. Recalificar el examen
3. Los estudiantes que seleccionaron A ahora obtendrán los puntos

### Caso 2: Examen sin Respuestas Correctas

**Problema:** El profesor olvidó marcar cualquier opción como correcta. Todos los estudiantes obtuvieron 0.

**Solución:**
1. Marcar las respuestas correctas para cada pregunta
2. Recalificar el examen
3. Las notas se calcularán correctamente

### Caso 3: Ajuste de Preguntas Múltiples

**Problema:** En preguntas de selección múltiple, faltaba marcar una de las opciones correctas.

**Solución:**
1. Actualizar todas las opciones correctas
2. Recalificar el examen
3. Solo los estudiantes que seleccionaron TODAS las opciones correctas obtendrán los puntos

## Limitaciones

- Solo funciona con intentos ya completados (`submitted_at` no nulo)
- No se puede "deshacer" la recalificación (los cambios son permanentes)
- Las preguntas de texto corto (`short_text`) no se recalifican automáticamente

## Archivos Modificados

### Backend (SQL)
- `supabase/migrations/20260114_add_exam_regrade_function.sql` - Nueva función de recalificación

### Frontend (TypeScript/React)
- `src/pages/professor/CourseResultsPage.tsx` - Página de resultados con botón de recalificación
- `src/pages/professor/components/RegradeExamDialog.tsx` - Diálogo modal para recalificar

### Scripts
- `apply_regrade_migration.ps1` - Script para aplicar la migración

## Preguntas Frecuentes

### ¿Los estudiantes deben volver a tomar el examen?
No. La recalificación usa las respuestas que ya guardaron.

### ¿Se notifica a los estudiantes del cambio?
No automáticamente. El profesor debe comunicar los cambios de calificación.

### ¿Puedo ver qué estudiantes fueron afectados?
Sí. El diálogo de recalificación muestra todos los cambios detalladamente.

### ¿Funciona con todos los tipos de preguntas?
Sí, para preguntas de:
- ✅ Selección única (single_choice)
- ✅ Selección múltiple (multiple_choice)
- ✅ Verdadero/Falso (true_false)
- ⚠️ Texto corto (short_text) - No se recalifica automáticamente

### ¿Puedo recalificar el mismo examen varias veces?
Sí. Cada recalificación usa las respuestas correctas actuales.

## Soporte

Si encuentras problemas:

1. Verifica que la migración SQL se aplicó correctamente
2. Revisa la consola del navegador para errores
3. Confirma que las respuestas correctas están marcadas en el examen
4. Asegúrate de tener permisos de profesor en el curso

## Desarrollo Futuro

Posibles mejoras:
- [ ] Historial de cambios de calificación
- [ ] Notificación automática a estudiantes
- [ ] Previsualización antes de aplicar cambios
- [ ] Recalificación selectiva (solo algunos estudiantes)
- [ ] Exportar reporte de cambios a PDF/Excel
