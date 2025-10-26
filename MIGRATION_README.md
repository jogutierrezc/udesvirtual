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
- Los estudiantes se muestran con estado "Activo" por defecto
- El botón "Deshabilitar" funciona correctamente
- No aparece la advertencia "Campo 'active' no disponible"

## Si hay problemas:

1. Verifica que estés logueado como admin
2. Revisa la consola del navegador para errores de permisos
3. Usa el botón "Debug Estudiantes" para ver qué perfiles existen