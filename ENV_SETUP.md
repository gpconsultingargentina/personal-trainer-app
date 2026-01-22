# Guía de Configuración de Variables de Entorno

## Paso 1: Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que el proyecto se configure (tarda unos minutos)

## Paso 2: Obtener las credenciales de Supabase

1. En el dashboard de Supabase, ve a **Settings** (Configuración)
2. Click en **API** en el menú lateral
3. Encontrarás:
   - **Project URL**: Copia el valor de "Project URL"
   - **Project API keys**: 
     - `anon` `public`: Copia esta clave (es la ANON KEY)
     - `service_role` `secret`: Copia esta clave (es la SERVICE ROLE KEY) - ⚠️ MANTÉNLA SECRETA

## Paso 3: Configurar el archivo .env.local

1. En la raíz del proyecto, crea un archivo llamado `.env.local`
2. Copia y pega el siguiente contenido, reemplazando los valores:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Email (Resend) - Ver guía completa en RESEND_SETUP.md
RESEND_API_KEY=tu_resend_api_key_aqui
EMAIL_FROM=onboarding@resend.dev

# SMS (Twilio) - OPCIONAL por ahora
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Cron Secret (para proteger el endpoint de recordatorios)
CRON_SECRET=dev-secret-key-change-in-production

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

## Paso 4: Configurar la Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase/schema.sql` de este proyecto
3. Copia TODO el contenido del archivo
4. Pégalo en el SQL Editor de Supabase
5. Ejecuta el script (botón "Run" o Ctrl/Cmd + Enter)

## Paso 5: Configurar Storage

1. En Supabase, ve a **Storage** en el menú lateral
2. Click en **Create a new bucket**
3. Nombre: `payment-proofs`
4. **NO marques** "Public bucket"
5. Click en **Create bucket**

## Paso 6: Configurar políticas de Storage

1. Con el bucket `payment-proofs` creado, click en **Policies**
2. Crea las siguientes políticas:

**Política 1: Permitir subida de archivos**
- Policy name: `Allow public uploads`
- Allowed operation: `INSERT`
- Target roles: `public`
- Policy definition:
```sql
true
```

**Política 2: Permitir lectura solo autenticados**
- Policy name: `Allow authenticated read`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- Policy definition:
```sql
true
```

## Paso 7: Reiniciar el servidor

Después de configurar las variables de entorno:

1. Detén el servidor (Ctrl/Cmd + C)
2. Reinícialo: `npm run dev`
3. La aplicación debería funcionar sin errores

## Notas importantes

- ⚠️ **NUNCA** compartas tu `SUPABASE_SERVICE_ROLE_KEY` públicamente
- ⚠️ El archivo `.env.local` está en `.gitignore` y no se subirá al repositorio
- ✅ Las variables que empiezan con `NEXT_PUBLIC_` son públicas y se pueden ver en el navegador
- ✅ Las demás variables solo están disponibles en el servidor

