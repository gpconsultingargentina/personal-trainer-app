# Configuración de Supabase Storage

## Verificar/Crear el bucket `payment-proofs`

Si recibes el error "Bucket not found", necesitas crear el bucket en Supabase:

### Paso 1: Crear el bucket

1. Ve a tu Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Storage**
4. Haz clic en **"New bucket"** o **"Create a new bucket"**
5. Configura el bucket:
   - **Name**: `payment-proofs` (debe ser exactamente este nombre)
   - **Public bucket**: ❌ **NO marques esta opción** (bucket privado)
6. Haz clic en **"Create bucket"**

### Paso 2: Configurar políticas de Storage

Después de crear el bucket, configura las políticas:

1. Con el bucket `payment-proofs` seleccionado, ve a la pestaña **"Policies"**
2. Crea las siguientes políticas:

#### Política 1: Permitir subida de archivos (INSERT)
- **Policy name**: `Allow uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `public` (o `authenticated` si solo quieres usuarios autenticados)
- **Policy definition**:
```sql
true
```

#### Política 2: Permitir lectura de archivos (SELECT)
- **Policy name**: `Allow authenticated read`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
true
```

**Nota**: Como estamos usando URLs firmadas generadas por el service client, estas políticas son principalmente para la subida. El acceso a los archivos se maneja a través de URLs firmadas que expiran.

### Paso 3: Verificar la configuración

Después de crear el bucket y las políticas, el sistema debería funcionar correctamente:

- ✅ Los archivos se pueden subir
- ✅ Los archivos se pueden ver a través de URLs firmadas
- ✅ El bucket es privado y seguro

## Solución alternativa: Bucket público (NO recomendado para producción)

Si prefieres usar un bucket público (solo para desarrollo):

1. Al crear el bucket, marca **"Public bucket"**
2. No necesitarás políticas de SELECT
3. Las URLs públicas funcionarán directamente

⚠️ **Advertencia**: Los buckets públicos exponen los archivos a cualquiera que tenga la URL. Solo úsalo para desarrollo.

