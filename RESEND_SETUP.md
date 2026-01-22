# Guía de Configuración de Resend para Emails

## ¿Qué es Resend?
Resend es un servicio de envío de emails transaccionales. Es ideal para enviar emails de bienvenida, confirmaciones, recordatorios, etc.

## Paso 1: Crear cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Haz clic en **Sign Up** (o **Iniciar Sesión** si ya tienes cuenta)
3. Crea tu cuenta usando:
   - Email
   - Google
   - GitHub

## Paso 2: Obtener tu API Key

1. Una vez dentro del dashboard de Resend, ve a **API Keys** en el menú lateral
2. Haz clic en **Create API Key**
3. Dale un nombre (ej: "Personal Trainer App")
4. Selecciona los permisos:
   - ✅ **Sending access** (necesario para enviar emails)
5. Haz clic en **Add**
6. **¡IMPORTANTE!** Copia la API Key que aparece. Solo la verás una vez. Se verá algo como:
   ```
   re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
7. Guárdala de forma segura (no la compartas)

## Paso 3: Configurar dominio (OPCIONAL para desarrollo)

Para **producción** necesitas verificar tu dominio, pero para **desarrollo y pruebas** puedes usar el dominio de prueba de Resend.

### Opción A: Usar dominio de prueba (RÁPIDO - Solo para desarrollo)

Resend te permite usar su dominio de prueba: `onboarding@resend.dev`

- No requiere configuración
- Funciona inmediatamente
- ⚠️ Solo para pruebas/desarrollo
- Los emails pueden ir a spam

### Opción B: Verificar tu dominio (RECOMENDADO para producción)

1. En Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa tu dominio (ej: `tudominio.com`)
4. Resend te dará registros DNS para agregar:
   - **DKIM** (para autenticación)
   - **SPF** (para prevención de spam)
   - **DMARC** (opcional pero recomendado)
5. Agrega estos registros en tu proveedor de DNS (donde compraste el dominio)
6. Espera la verificación (puede tardar hasta 24 horas, pero usualmente es más rápido)

## Paso 4: Configurar variables de entorno

Abre tu archivo `.env.local` en la raíz del proyecto y agrega:

```env
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@tudominio.com
```

### Valores recomendados:

**Para desarrollo/pruebas:**
```env
RESEND_API_KEY=re_tu_api_key_aqui
EMAIL_FROM=onboarding@resend.dev
```

**Para producción:**
```env
RESEND_API_KEY=re_tu_api_key_aqui
EMAIL_FROM=noreply@tudominio.com
# O con nombre:
EMAIL_FROM=Gaston Otakufiit <noreply@tudominio.com>
```

## Paso 5: Reiniciar el servidor

Después de agregar las variables de entorno:

1. Detén el servidor si está corriendo (Ctrl/Cmd + C)
2. Reinícialo:
   ```bash
   npm run dev
   ```

## Paso 6: Probar el envío de emails

1. Ve a tu aplicación: `http://localhost:3000/dashboard/students`
2. Haz clic en **Nuevo Alumno**
3. Completa el formulario con:
   - Nombre: Un nombre de prueba
   - Email: **Tu email personal** (para recibir el test)
   - Teléfono: (opcional)
4. Haz clic en **Crear Alumno**
5. Deberías recibir el email de bienvenida en unos segundos

## Verificar logs en Resend

1. Ve a tu dashboard de Resend
2. Click en **Logs** en el menú lateral
3. Ahí verás todos los emails enviados:
   - ✅ **Delivered**: Email enviado exitosamente
   - ⚠️ **Bounced**: Email rebotó (dirección inválida)
   - ❌ **Failed**: Error al enviar

## Plan gratuito de Resend

- ✅ 3,000 emails/mes gratis
- ✅ 100 emails/día gratis
- ✅ API ilimitada
- ✅ Soporte por email

## Troubleshooting (Solución de problemas)

### ❌ Error: "API key is invalid"
- Verifica que copiaste la API key correctamente
- Asegúrate de que no tiene espacios al inicio o final
- Revisa que esté en `.env.local` (no `.env`)

### ❌ Error: "from email is not verified"
- Si usas `onboarding@resend.dev`, debería funcionar automáticamente
- Si usas tu propio dominio, verifica que esté verificado en Resend
- Revisa la sección "Domains" en Resend

### ❌ No recibo los emails
- Revisa la carpeta de spam
- Verifica los logs en Resend dashboard
- Asegúrate de usar un email válido
- Si usas `onboarding@resend.dev`, algunos proveedores pueden bloquearlo

### ⚠️ Los emails van a spam
- Verifica tu dominio (Opción B)
- Agrega los registros DKIM y SPF
- Usa un email profesional en `EMAIL_FROM`

## Próximos pasos

Una vez que Resend esté configurado:
- ✅ Los emails de bienvenida se enviarán automáticamente
- ✅ Los recordatorios de clases también funcionarán
- ✅ Puedes personalizar los templates de email en `app/lib/email.ts`

## Documentación oficial

- [Resend Docs](https://resend.com/docs)
- [Resend Dashboard](https://resend.com/emails)

