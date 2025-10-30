# Guía: ¿Cómo crear y publicar tu perfil público de profesor UDES?

Esta guía explica, paso a paso, cómo un profesor crea y publica su perfil público dentro de la plataforma. Incluye los requisitos, el flujo de edición, y cómo compartir tu URL pública.

## 1) Requisitos previos

- Tener una cuenta activa en la plataforma y poder iniciar sesión.
- Registrar tu relación con la UDES como Profesor (vínculo institucional). Esto activa tu rol y habilita tu perfil para el directorio de profesores.
- Nota de privacidad: El perfil público muestra datos básicos (nombre, email institucional, ciudad/país), biografía, vínculos de investigación (ORCID/CvLAC) y tu foto si la has subido.

## 2) Completa tu perfil (área privada)

1. Inicia sesión y abre tu perfil en: `/profile`.
2. Completa los campos principales:
   - Nombre completo, teléfono, país, ciudad, universidad.
   - Biografía (recomendado para profesores), ORCID y CvLAC si aplica.
3. Foto de perfil:
   - Usa el selector de avatares o sube una imagen al bucket público `avatars` desde el mismo formulario.
4. Guarda tus cambios con el botón "Guardar cambios".

## 3) Declara tu relación con la UDES (una sola vez)

En la sección "Relación con la UDES" del perfil encontrarás un botón "Agregar" si aún no hay datos:

- Selecciona tu Programa, Campus y establece tu Vínculo como "Profesor".
- Esta información es de sólo escritura inicial (no editable luego desde el perfil). Si requieres cambios, comunícate con el área de administración.
- Al marcar vínculo de profesor, el sistema te asigna automáticamente el rol "professor".

    ## 4) Enriquece tu perfil académico (opcional pero recomendado)

En la parte inferior del perfil encontrarás dos botones para enriquecer tu perfil público:

- "Agregar Formación" (abre un modal para tu formación académica)
- "Agregar Publicación" (abre un modal para publicaciones científicas)

Ambas secciones se muestran en tu perfil público si tu perfil está visible y tu vínculo es Profesor.

## 5) Habilita la visibilidad pública de tu perfil

Para aparecer en el directorio de profesores y que tu perfil sea accesible públicamente:

- Tu vínculo institucional debe ser Profesor UDES.
- Tu perfil debe estar marcado como público.

En esta versión, el indicador de visibilidad pública (campo `public_profile`) puede ser activado por el equipo administrador. Si ya cumplías los criterios, es posible que esté activo por migración.

Si completaste tu perfil y no apareces aún en el directorio de profesores (`/profesores`), solicita la activación a soporte/administración.

## 6) Cómo encontrar y compartir tu enlace público

- Directorio: visita `/profesores`, busca tu nombre y haz clic en "Ver Perfil Completo".
- URL directa: la ruta pública tiene el formato `/profile/{tu_id}`. En la página de tu perfil público verás botones de compartir (Facebook, X, WhatsApp) y un botón para "Copiar" el enlace.

Sugerencias para un perfil más atractivo:
- Usa una biografía clara y breve (3–5 líneas).
- Incluye tu ORCID y CvLAC cuando corresponda.
- Sube una foto de buena calidad y rostro centrado.

---

## Preguntas frecuentes

- No veo el botón para editar mi relación UDES.
  - Si ya se registró tu relación, el bloque muestra los datos como no editables. Pide cambios a un administrador.

- Ya completé mi perfil, pero no aparezco en `/profesores`.
  - Verifica que tu vínculo sea Profesor UDES y solicita que marquen tu perfil como público (`public_profile = true`).

- ¿Puedo ocultar mi perfil público después?
  - Sí. Solicita al equipo administrador desactivar el indicador de visibilidad pública.

---

## Apéndice técnico (para administradores)

- Criterios de visibilidad en el directorio de profesores (`/profesores`):
  - `profiles.udes_vinculo = 'udes_profesor'` y `profiles.public_profile = true`.
- El perfil público se sirve en `/profile/:id` respetando RLS; si el perfil no es público, el visitante verá "Perfil no encontrado o no público".
- La relación UDES se almacena en `public.udes_relationships` y el rol se asigna automáticamente vía trigger al establecer vínculo Profesor.
- Las secciones de formación (`academic_qualifications`) y publicaciones (`publications`) se muestran cuando el perfil es público.
