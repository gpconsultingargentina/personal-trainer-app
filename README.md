# Personal Trainer App

Aplicación web full-stack para gestionar clases de personal trainer con sistema de pagos bancarios, cupones de descuento y recordatorios automáticos.

## Características Implementadas

### ✅ Completado

- ✅ Setup de proyecto Next.js 14 con TypeScript
- ✅ Configuración de Supabase (cliente, servidor, schema SQL)
- ✅ Autenticación del entrenador (login, middleware, logout)
- ✅ CRUD completo de planes de clases
- ✅ CRUD completo de cupones de descuento
- ✅ Validación de cupones en tiempo real
- ✅ Componentes de UI (formularios, inputs, displays)
- ✅ Estructura de base de datos completa

### 🚧 Pendiente de Implementar

Los siguientes componentes y páginas necesitan ser creados siguiendo los patrones ya establecidos:

1. **CRUD de Clases** (parcialmente implementado)
   - Componente ClassForm
   - Páginas de listado, creación y edición

2. **Sistema de Subida de Comprobantes**
   - Componente PaymentProofUpload con react-dropzone
   - Páginas públicas de selección de plan y upload
   - Integración con Supabase Storage

3. **Panel de Aprobación de Pagos**
   - Listado de comprobantes pendientes
   - Vista previa y acciones de aprobar/rechazar

4. **Vista de Calendario**
   - Integración con react-big-calendar
   - Vista mensual/semanal en dashboard

5. **Reservas Públicas**
   - Calendario público
   - Formulario de reserva
   - Validación de pagos aprobados

6. **Sistema de Recordatorios**
   - Endpoint API /api/cron/send-reminders
   - Integración con Resend (email) y Twilio (SMS)
   - Lógica de verificación de clases próximas

7. **Historial de Alumnos**
   - Vista de historial por alumno
   - Filtros y estadísticas

8. **Dashboard con Estadísticas**
   - Métricas agregadas
   - Visualizaciones

9. **Configuración de Hostinger**
   - Archivos de configuración para deployment

## Configuración

1. Instala las dependencias:
```bash
npm install
```

2. Configura las variables de entorno en `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
RESEND_API_KEY=tu_resend_key
EMAIL_FROM=noreply@tudominio.com
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_PHONE_NUMBER=tu_numero
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=tu_secret_seguro
```

3. Ejecuta el schema SQL en Supabase (ver `supabase/schema.sql`)

4. Crea el bucket de Storage `payment-proofs` en Supabase

5. Ejecuta la aplicación:
```bash
npm run dev
```

## Estructura del Proyecto

- `/app` - Aplicación Next.js
  - `/actions` - Server Actions
  - `/components` - Componentes React
  - `/(dashboard)` - Rutas del dashboard (protegidas)
  - `/(auth)` - Rutas de autenticación
  - `/public` - Rutas públicas
  - `/api` - API Routes
  - `/lib` - Utilidades y clientes

