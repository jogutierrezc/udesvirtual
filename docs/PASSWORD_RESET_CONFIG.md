# Configuración de Restablecimiento de Contraseña - Supabase

## Cambios Realizados

### 1. Actualización de `ForgotPassword.tsx`
- ✅ Cambiado `redirectTo` de `/reset-password` a `/#/reset-password` para trabajar correctamente con HashRouter

### 2. Mejoras en `ResetPassword.tsx`
- ✅ Implementado manejo correcto del token de recuperación desde la URL
- ✅ Validación del token usando `supabase.auth.setSession()`
- ✅ Mensajes de error mejorados para usuarios

## Configuración Necesaria en Supabase

Para que todo funcione correctamente, necesitas configurar las URLs permitidas en Supabase:

### Pasos:

1. **Ve a tu proyecto de Supabase**:
   - URL: https://app.supabase.com/project/ovdeaweddxafslbrflor

2. **Navega a Authentication → URL Configuration**

3. **Configura las siguientes URLs**:

   **Site URL** (tu URL principal):
   ```
   https://tudominio.com
   ```
   O si estás usando Vercel:
   ```
   https://tu-app.vercel.app
   ```

   **Redirect URLs** (agrega TODAS estas):
   ```
   http://localhost:3000/#/reset-password
   http://localhost:3000/#/auth
   https://tudominio.com/#/reset-password
   https://tudominio.com/#/auth
   https://*.vercel.app/#/reset-password
   https://*.vercel.app/#/auth
   ```

4. **Guarda los cambios**

## Cómo Funciona Ahora

1. **Usuario solicita restablecer contraseña**:
   - Va a `/forgot-password`
   - Introduce su email
   - Recibe un correo con un enlace mágico

2. **Usuario hace click en el enlace del correo**:
   - El enlace apunta a: `https://tudominio.com/#/reset-password?access_token=xxx&type=recovery&...`
   - La página `ResetPassword.tsx` extrae el token de la URL
   - Establece una sesión temporal usando `supabase.auth.setSession()`
   - Muestra el formulario para cambiar la contraseña

3. **Usuario cambia su contraseña**:
   - Introduce nueva contraseña
   - Se actualiza usando `supabase.auth.updateUser({ password })`
   - Redirige a `/auth` para iniciar sesión

## Pruebas Recomendadas

### En Desarrollo (localhost:3000):
1. Ve a `http://localhost:3000/#/forgot-password`
2. Introduce un email válido registrado
3. Revisa tu bandeja de entrada
4. Haz click en el enlace del correo
5. Deberías ver el formulario para cambiar contraseña

### En Producción:
1. Asegúrate de haber configurado las URLs en Supabase
2. Realiza las mismas pruebas desde tu dominio de producción

## Problemas Comunes y Soluciones

### ❌ "El enlace sigue apuntando a localhost en producción"
**Solución**: Verifica que hayas configurado correctamente el "Site URL" en Supabase con tu dominio de producción.

### ❌ "Error: Invalid redirect URL"
**Solución**: Asegúrate de agregar todas las URLs de redirección (incluyendo el `#`) en la sección "Redirect URLs" de Supabase.

### ❌ "El token ha expirado"
**Solución**: Los tokens de recuperación expiran después de 1 hora por defecto. El usuario debe solicitar un nuevo enlace.

### ❌ "La página muestra 'debes abrir el enlace desde tu correo'"
**Solución**: Esto significa que el token no se encontró en la URL o es inválido. Verifica:
- Que la URL incluya `access_token` y `type=recovery`
- Que el usuario esté usando el enlace más reciente
- Que no hayan pasado más de 1 hora desde que se envió el correo

## URLs de Configuración Rápida

- **Supabase Dashboard**: https://app.supabase.com/project/ovdeaweddxafslbrflor
- **Authentication Settings**: https://app.supabase.com/project/ovdeaweddxafslbrflor/auth/url-configuration
- **Email Templates**: https://app.supabase.com/project/ovdeaweddxafslbrflor/auth/templates

## Personalización Adicional (Opcional)

Si deseas personalizar el correo de recuperación:

1. Ve a **Authentication → Email Templates**
2. Selecciona "Reset Password"
3. Personaliza el contenido del correo (mantén la variable `{{ .ConfirmationURL }}`)

## Notas Importantes

- ⚠️ El enlace de recuperación solo es válido por **1 hora** por defecto
- ⚠️ Cada enlace solo puede usarse **una vez**
- ⚠️ Si el usuario solicita múltiples veces el restablecimiento, solo el enlace más reciente funcionará
- ✅ HashRouter requiere el símbolo `#` en las URLs de redirección
