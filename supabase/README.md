# Configuración de Supabase

## Instrucciones para configurar la base de datos

1. Crea un proyecto en Supabase (https://supabase.com)

2. Ve a SQL Editor en el dashboard de Supabase

3. Ejecuta el archivo `schema.sql` completo para crear todas las tablas, índices y políticas RLS

4. Ve a Storage y crea un bucket llamado `payment-proofs` con las siguientes configuraciones:
   - **Público**: Sí (recomendado) o No (si es privado, se usará una ruta API para servir los archivos)
   - **File size limit**: 5MB
   - **Allowed MIME types**: image/jpeg, image/png, application/pdf

5. Configura las políticas de Storage (en la pestaña "Policies" del bucket):
   - **INSERT**: Crear política que permita a cualquiera subir archivos:
     ```sql
     CREATE POLICY "Anyone can upload payment proofs"
     ON storage.objects FOR INSERT
     TO public
     WITH CHECK (bucket_id = 'payment-proofs');
     ```
   - **SELECT**: Si el bucket es privado, crear política para que solo usuarios autenticados puedan leer:
     ```sql
     CREATE POLICY "Authenticated users can view payment proofs"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (bucket_id = 'payment-proofs');
     ```
     Si el bucket es público, no necesitas esta política.
   - **DELETE**: Solo con service role (no crear política pública)

6. Copia las credenciales a tu archivo `.env.local`:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

