# Configuración de Supabase

## Instrucciones para configurar la base de datos

1. Crea un proyecto en Supabase (https://supabase.com)

2. Ve a SQL Editor en el dashboard de Supabase

3. Ejecuta el archivo `schema.sql` completo para crear todas las tablas, índices y políticas RLS

4. Ve a Storage y crea un bucket llamado `payment-proofs` con las siguientes configuraciones:
   - **Público**: No
   - **File size limit**: 5MB
   - **Allowed MIME types**: image/jpeg, image/png, application/pdf

5. Configura las políticas de Storage:
   - INSERT: Permitir que cualquiera pueda subir archivos
   - SELECT: Solo el entrenador (autenticado) puede leer archivos
   - DELETE: Solo con service role

6. Copia las credenciales a tu archivo `.env.local`:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

