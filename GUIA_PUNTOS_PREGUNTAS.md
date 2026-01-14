# Guía: Asignación Manual de Puntos a Preguntas de Examen

## Cambios Implementados

Se ha actualizado el editor de preguntas de examen para permitir asignar **puntos personalizados** a cada pregunta de forma manual.

## ¿Qué hay de nuevo?

### Antes
- Los puntos se calculaban automáticamente dividiendo el puntaje máximo del examen entre el número de preguntas
- No había control sobre cuánto vale cada pregunta individual
- Todas las preguntas valían lo mismo

### Ahora
- Puedes asignar **puntos específicos** a cada pregunta
- Cada pregunta puede tener un valor diferente
- Control total sobre la distribución de puntos
- Advertencia visual si la suma de puntos excede el máximo del examen

## Cómo Usar

### 1. Acceder al Editor de Preguntas

1. Ve a la página de administración del curso como profesor
2. En la sección "Evaluaciones", selecciona un examen
3. Haz clic en "Gestionar Preguntas"

### 2. Asignar Puntos al Crear una Pregunta

1. Haz clic en **"Nueva pregunta"**
2. Completa el formulario:
   - **Tipo de pregunta**: Selección única, múltiple, verdadero/falso, etc.
   - **Puntos**: Ingresa el valor de la pregunta (ej: 1.0, 2.5, 0.5)
   - **Orden**: Posición de la pregunta en el examen
   - **Enunciado**: El texto de la pregunta
3. Agrega las opciones de respuesta (si aplica)
4. Marca las opciones correctas
5. Guarda la pregunta

### 3. Editar Puntos de una Pregunta Existente

1. En la lista de preguntas, haz clic en el botón **Editar** (icono de lápiz)
2. Modifica el campo **"Puntos"**
3. Guarda los cambios

### 4. Verificar el Total de Puntos

En la parte superior del editor de preguntas verás un **alerta informativa** que muestra:
- **Puntos totales**: Suma de los puntos de todas las preguntas
- **Puntos máximos**: El puntaje máximo configurado para el examen

**Ejemplo:**
```
Puntos totales: 4.5 de 5 puntos máximos
```

### 5. Advertencia de Exceso de Puntos

Si la suma de los puntos de las preguntas **excede** el máximo del examen, verás una advertencia en rojo:

```
⚠️ Puntos totales: 6.5 de 5 puntos máximos
⚠️ La suma de puntos excede el máximo configurado para el examen
```

**Importante:** Aunque el sistema permite guardar preguntas con puntos que excedan el máximo, esto puede causar problemas en la calificación. Ajusta los puntos de las preguntas para que la suma no exceda el máximo.

## Ejemplos de Uso

### Ejemplo 1: Examen con Preguntas de Igual Valor

**Configuración del examen:** Max Score = 5.0

**Preguntas:**
- Pregunta 1: 1.0 puntos
- Pregunta 2: 1.0 puntos
- Pregunta 3: 1.0 puntos
- Pregunta 4: 1.0 puntos
- Pregunta 5: 1.0 puntos

**Total:** 5.0 puntos ✓

### Ejemplo 2: Examen con Preguntas de Diferente Valor

**Configuración del examen:** Max Score = 5.0

**Preguntas:**
- Pregunta 1 (Fácil): 0.5 puntos
- Pregunta 2 (Fácil): 0.5 puntos
- Pregunta 3 (Media): 1.0 puntos
- Pregunta 4 (Media): 1.0 puntos
- Pregunta 5 (Difícil): 2.0 puntos

**Total:** 5.0 puntos ✓

### Ejemplo 3: Examen con Preguntas Ponderadas

**Configuración del examen:** Max Score = 5.0

**Preguntas:**
- Pregunta 1-5 (Opción múltiple): 0.5 puntos cada una = 2.5 puntos
- Pregunta 6 (Desarrollo): 2.5 puntos

**Total:** 5.0 puntos ✓

## Recomendaciones

### ✅ Buenas Prácticas

1. **Planifica la distribución de puntos** antes de crear las preguntas
2. **Asigna más puntos** a preguntas más complejas o importantes
3. **Verifica siempre** que la suma de puntos coincida con el máximo del examen
4. **Usa decimales** para ajustes finos (ej: 0.5, 1.5, 2.25)
5. **Mantén coherencia** en la dificultad vs. puntos

### ❌ Evitar

1. No dejar preguntas con 0 puntos (a menos que sea intencional)
2. No exceder el máximo de puntos del examen
3. No asignar valores negativos
4. No usar valores muy pequeños (menos de 0.1)

## Casos de Uso Especiales

### Preguntas Bonus

Si quieres agregar preguntas bonus que no cuenten para el total:
1. Crea las preguntas normales hasta sumar el máximo
2. NO agregues preguntas adicionales (el sistema actual suma todos los puntos)
3. **Alternativa:** Aumenta el máximo del examen para incluir el bonus

### Preguntas de Peso Variable

Para exámenes donde algunas secciones valen más:

**Examen de 5.0 puntos:**
- Sección 1 (Conceptos básicos): 5 preguntas × 0.4 = 2.0 puntos
- Sección 2 (Aplicación): 3 preguntas × 0.5 = 1.5 puntos
- Sección 3 (Análisis): 1 pregunta × 1.5 = 1.5 puntos
**Total:** 5.0 puntos ✓

## Cálculo de Calificación

El sistema calcula la nota final basándose en:

```
Puntos obtenidos / Total de puntos posibles × Nota máxima
```

**Ejemplo:**
- Total de puntos posibles: 5.0
- Puntos obtenidos por estudiante: 4.0
- Nota máxima del examen: 5.0
- **Nota final:** (4.0 / 5.0) × 5.0 = 4.0

## Preguntas Frecuentes

### ¿Puedo cambiar los puntos después de que los estudiantes hayan tomado el examen?

Sí, pero ten cuidado. Si cambias los puntos, deberás usar la **función de recalificación** para actualizar las notas de los estudiantes que ya completaron el examen.

### ¿Qué pasa si la suma de puntos no llega al máximo?

El sistema funcionará correctamente. Por ejemplo, si el máximo es 5.0 pero tus preguntas suman 4.5, un estudiante que responda todo correctamente obtendrá 5.0 (el máximo posible).

### ¿Puedo usar puntos decimales?

Sí, el sistema soporta valores como 0.5, 1.25, 2.33, etc. Usa el campo numérico con incrementos de 0.1.

### ¿Qué valor por defecto tienen las preguntas nuevas?

Las preguntas nuevas tienen un valor por defecto de **1.0 punto**. Puedes cambiarlo antes de guardar.

### ¿Todas las preguntas deben tener puntos?

Técnicamente sí, pero puedes asignar valores muy bajos (0.1) para preguntas que quieras que valgan menos. No se recomienda usar 0 puntos.

## Soporte Técnico

Si encuentras problemas:
1. Verifica que la suma de puntos no exceda el máximo
2. Asegúrate de guardar los cambios después de editar
3. Recarga la página si los cambios no se reflejan
4. Usa la función de recalificación si modificaste preguntas ya tomadas

## Archivos Modificados

- `src/pages/professor/components/MoocExamQuestionEditor.tsx` - Editor de preguntas con asignación manual de puntos
