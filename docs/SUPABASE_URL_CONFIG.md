# 🔧 Configuración CRÍTICA de Supabase para Password Reset

## ⚠️ PROBLEMA ACTUAL

Tu aplicación usa **HashRouter** pero Supabase está enviando enlaces a `/reset-password` en lugar de `/#/reset-password`.

**URL incorrecta que Supabase envía actualmente:**
```
https://exchange.legalify.com.co/reset-password#access_token=xxx
```

**URL correcta que debería enviar:**
```
https://exchange.legalify.com.co/#/reset-password#access_token=xxx
```

## ✅ SOLUCIÓN - Configuración de Supabase

### Paso 1: Ir a la Configuración de URLs en Supabase

1. Ve a: https://app.supabase.com/project/ovdeaweddxafslbrflor/auth/url-configuration
2. O navega manualmente a: **Authentication** → **URL Configuration**

### Paso 2: Configurar Site URL

Establece el **Site URL** como:
```
https://exchange.legalify.com.co
```

### Paso 3: Configurar Redirect URLs

En la sección **Redirect URLs**, agrega TODAS estas URLs (una por línea):

```
https://exchange.legalify.com.co/#/reset-password
https://exchange.legalify.com.co/#/auth
https://exchange.legalify.com.co/#/forgot-password
http://localhost:8080/#/reset-password
http://localhost:8080/#/auth
http://localhost:8080/#/forgot-password
http://localhost:3000/#/reset-password
http://localhost:3000/#/auth
http://localhost:3000/#/forgot-password
```

**IMPORTANTE:** Nota el `/#/` en lugar de solo `/`. Esto es crítico para que funcione con HashRouter.

### Paso 4: Guardar Cambios

Haz clic en **Save** o **Guardar**.

## 🧪 PRUEBA

### Para Desarrollo (localhost):

1. Ve a: http://localhost:8080/#/forgot-password
2. Introduce tu email
3. Revisa tu correo
4. El enlace debería ser: `http://localhost:8080/#/reset-password#access_token=...`
5. Al hacer clic, deberías ver el formulario de cambio de contraseña

### Para Producción:

1. Ve a: https://exchange.legalify.com.co/#/forgot-password
2. Introduce tu email
3. Revisa tu correo
4. El enlace debería ser: `https://exchange.legalify.com.co/#/reset-password#access_token=...`
5. Al hacer clic, deberías ver el formulario de cambio de contraseña

## 🔍 Debugging

Si el enlace aún no funciona, abre la consola del navegador (F12) y busca estos mensajes:

### Mensajes que deberías ver si funciona:
```
🔍 Reset Password - Full URL: https://exchange.legalify.com.co/#/reset-password#access_token=...
🔍 Reset Password - Hash: #/reset-password#access_token=...
🔍 Parsing from nested hash (Method 1)
🔍 Parsed values: {accessToken: "eyJhbGc...", type: "recovery"}
✅ Recovery token found! Setting session...
✅ Session set successfully!
👤 User after setSession: tu@email.com
✅ User ready to reset password!
```

### Mensajes de error comunes:

**❌ "No recovery token found in URL"**
- Significa que el token no se detectó en la URL
- Verifica que la URL contenga `#access_token=` y `type=recovery`

**❌ "El enlace de recuperación es inválido o ha expirado"**
- El token ha expirado (1 hora de validez)
- Solicita un nuevo enlace de recuperación

**⚠️ "No se encontró un enlace de recuperación válido"**
- No hay token en la URL o el usuario no abrió el enlace desde el correo
- Verifica que estés usando el enlace del correo más reciente

## 📧 Verificar el Email Template

Si quieres asegurarte de que el enlace esté correcto en el email:

1. Ve a: https://app.supabase.com/project/ovdeaweddxafslbrflor/auth/templates
2. Selecciona **"Reset Password"** o **"Confirm signup"**
3. Busca la variable `{{ .ConfirmationURL }}`
4. **NO modifiques** esta variable, Supabase la reemplazará automáticamente con la URL correcta si has configurado bien las Redirect URLs

## 🎯 Checklist de Configuración

- [ ] Site URL configurada: `https://exchange.legalify.com.co`
- [ ] Redirect URLs incluyen URLs con `/#/` (no solo `/`)
- [ ] Redirect URLs incluyen tanto producción como desarrollo
- [ ] Cambios guardados en Supabase
- [ ] Probado en desarrollo (localhost)
- [ ] Probado en producción (exchange.legalify.com.co)

## ⚡ Si URGENTE: Workaround Temporal

Si necesitas una solución inmediata mientras configuras Supabase, puedes crear una regla de redirección en tu servidor/hosting:

### Para Vercel (vercel.json):
```json
{
  "redirects": [
    {
      "source": "/reset-password",
      "destination": "/#/reset-password",
      "permanent": false
    },
    {
      "source": "/forgot-password",
      "destination": "/#/forgot-password",
      "permanent": false
    }
  ]
}
```

### Para Nginx:
```nginx
location = /reset-password {
    return 302 /#/reset-password$is_args$args;
}

location = /forgot-password {
    return 302 /#/forgot-password$is_args$args;
}
```

## 📞 Soporte

Si después de seguir todos estos pasos sigue sin funcionar:

1. Abre la consola del navegador (F12)
2. Ve a la página de reset password
3. Copia TODOS los mensajes de la consola
4. Copia la URL completa de la barra de direcciones
5. Comparte esta información para diagnosticar el problema

---

**Última actualización:** 2025-12-04
**Versión de Supabase:** v2
**Router usado:** HashRouter (React Router v6)
