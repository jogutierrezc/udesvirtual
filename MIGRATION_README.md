# Aplicar Migración para Campo Active

Para que funcione la funcionalidad de deshabilitar estudiantes, necesitas aplicar la migración que agrega el campo `active` a la tabla `profiles`.

## Comando para aplicar la migración:

```bash
cd /Users/jogutierrez/Udesvirtual}/udesvirtual
npx supabase db push
```

## Qué hace la migración:

1. **Agrega campo `active`** (BOOLEAN, default TRUE) a la tabla `profiles`
2. **Actualiza perfiles existentes** para que estén activos por defecto
3. **Agrega política RLS** para que admins puedan actualizar perfiles de estudiantes UDES
4. **Agrega comentario** descriptivo al campo

## Verificación:

Después de aplicar la migración, deberías ver:

## Si hay problemas:

1. Verifica que estés logueado como admin
2. Revisa la consola del navegador para errores de permisos
3. Usa el botón "Debug Estudiantes" para ver qué perfiles existen

## Toggle: Aprobación de puntos MOOC (auto vs. administrador)

Se añadió una migración que permite decidir si los puntos por completar un curso MOOC se otorgan automáticamente o quedan como solicitud pendiente para aprobación de un administrador.

### Qué cambió

- Nueva clave en `passport_settings.config`: `auto_approve_mooc` (por defecto `true`).
- La función `award_passport_points_for_mooc_completion()` ahora:
	- Si `auto_approve_mooc = true`: inserta directo en `passport_points_ledger` (comportamiento actual).
	- Si `auto_approve_mooc = false`: crea una solicitud en `passport_activity_requests` con estado `pending` para ser aprobada desde Admin > Pasaporte > Solicitudes.

### Cómo aplicar la migración

```bash
cd /Users/jogutierrez/Udesvirtual}/udesvirtual
npx supabase db push
```

### Cómo cambiar el modo (auto o aprobación)

Puedes actualizar el flag ejecutando en la consola SQL de Supabase:

```sql
update public.passport_settings
set config = jsonb_set(coalesce(config, '{}'::jsonb), '{auto_approve_mooc}', 'false'::jsonb, true);
```

Pon `true` para auto-otorgar; `false` para que queden como solicitudes.

### Dónde aprobar solicitudes

- Navega a: Admin > Pasaporte > `Solicitudes de Puntos`.
- Ahí verás las solicitudes `pending` de MOOC (y otras actividades si aplica) para aprobar o rechazar.