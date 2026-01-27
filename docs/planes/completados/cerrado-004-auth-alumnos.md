---
id: "004"
titulo: "Auth de Alumnos con Roles"
estado: "completado"
prioridad: "alta"
creado: "2025-01-27"
cerrado: "2025-01-27"
estimacion: "2-3 sesiones"
dependencias: ["003"]
---

# Auth de Alumnos con Roles

**Fecha:** 2025-01-27
**Tipo:** Feature / Auth

---

## Objetivo

Implementar autenticación para alumnos con un portal donde puedan:
- Ver su saldo de créditos
- Ver sus próximas clases
- Subir comprobantes de pago
- Ver historial de pagos y asistencias

El entrenador mantiene acceso completo al dashboard de administración.

---

## Problema a Resolver

Actualmente:
- Solo el entrenador puede loguearse
- Los alumnos acceden a páginas públicas sin autenticación
- No hay forma de que un alumno vea su información de manera segura
- Las páginas públicas no validan identidad

---

## Arquitectura Propuesta

### Roles

| Rol | Acceso |
|-----|--------|
| `trainer` | Dashboard completo (`/dashboard/*`) |
| `student` | Portal del alumno (`/portal/*`) |

### Flujo de Registro

```
1. Entrenador crea alumno en /dashboard/students/new
   └─> Se guarda en tabla students (sin auth aún)

2. Entrenador genera link de invitación y lo envía por WhatsApp
   └─> Link: /registro?token=xxx

3. Alumno abre el link y crea su cuenta (contraseña)
   └─> Se crea usuario en auth.users
   └─> Se vincula con su registro en students
   └─> Role = 'student'

4. Alumno accede a /portal con sus credenciales
```

### Vinculación Students ↔ Auth

```
students
├── id (UUID)
├── auth_user_id (UUID, nullable) ──► auth.users.id
├── email
└── ...

Regla: Un student puede existir sin auth_user_id (legacy/no registrado)
       Cuando se registra, se llena auth_user_id
```

---

## Pasos de Implementación

### Fase 1: Base de Datos

- [x] **1.1** Agregar columna `auth_user_id` a tabla `students`
  ```sql
  ALTER TABLE students
  ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

  CREATE UNIQUE INDEX idx_students_auth_user ON students(auth_user_id)
  WHERE auth_user_id IS NOT NULL;
  ```

- [x] **1.2** Agregar columna `role` en metadata de usuarios
  - Usar `raw_user_meta_data` de Supabase Auth
  - Valores: `trainer` | `student`

- [x] **1.3** Crear tabla `registration_tokens` para invitaciones
  ```sql
  CREATE TABLE registration_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```

- [x] **1.4** Actualizar RLS policies
  - Students: alumno solo ve su propio registro
  - Credit balances: alumno solo ve sus créditos
  - Credit transactions: alumno solo ve sus movimientos
  - Bookings: alumno solo ve sus reservas
  - Payment proofs: alumno solo ve sus pagos
  - Frequency prices: alumno puede leer (para ver su precio)
  - Registration tokens: solo trainer puede crear, validación pública por token (para registro)

### Fase 2: Server Actions

- [x] **2.1** `app/actions/auth.ts` - Agregar funciones:
  - `registerStudent(token, password)` - Registro con token
  - `getCurrentUserRole()` - Obtener rol del usuario actual
  - `linkStudentToAuth(studentId, authUserId)` - Vincular después del registro

- [x] **2.2** `app/actions/registration.ts` - Nuevo archivo:
  - `createRegistrationToken(studentId)` - Crear token de invitación
  - `validateRegistrationToken(token)` - Validar token
  - `invalidateToken(token)` - Marcar token como usado

- [x] **2.3** Modificar `app/actions/students.ts`:
  - `getStudentByAuthUserId(authUserId)` - Obtener alumno por auth ID
  - `getStudentForPortal(authUserId)` - Datos para portal (créditos, próximas clases)

- [x] **2.4** Modificar `app/actions/payments.ts`:
  - `getStudentPayments(studentId)` - Historial de pagos del alumno

- [x] **2.5** Modificar `app/actions/bookings.ts`:
  - `getStudentBookings(studentId)` - Historial de clases/asistencias del alumno

### Fase 3: Middleware

- [x] **3.1** Actualizar `middleware.ts`:
  ```typescript
  // Rutas y roles permitidos
  /dashboard/* → solo 'trainer'
  /portal/*    → solo 'student'
  /login       → redirigir según rol si ya autenticado
  /registro    → solo sin autenticar
  ```

- [x] **3.2** Agregar helper para obtener rol en middleware

### Fase 4: Páginas de Auth

- [x] **4.1** Modificar `/login` para soportar ambos roles
  - Después de login, redirigir según rol:
    - trainer → `/dashboard`
    - student → `/portal`

- [x] **4.2** Nueva página `/registro` (registro de alumnos)
  - Validar token de URL
  - Mostrar nombre del alumno
  - Form: email (prellenado), contraseña, confirmar contraseña
  - Al registrar: crear auth user, vincular con student, invalidar token

### Fase 5: Portal del Alumno

- [x] **5.1** Layout `/app/(portal)/layout.tsx`
  - Header con nombre del alumno y logout
  - Navegación: Inicio, Créditos, Clases, Pagos, Perfil

- [x] **5.2** Página `/portal` (dashboard del alumno)
  - Resumen de créditos disponibles
  - Próximas clases (si hay)
  - Acceso rápido a subir comprobante

- [x] **5.3** Página `/portal/creditos`
  - Saldo actual con fecha de vencimiento
  - Historial de movimientos (compras, asistencias, ajustes)

- [x] **5.4** Página `/portal/clases`
  - Lista de próximas clases agendadas
  - Historial de asistencias (paginado, sin límite de tiempo)

- [x] **5.5** Página `/portal/pagos`
  - Formulario para subir comprobante
    - Cantidad de clases a comprar
    - Cálculo automático: cantidad × precio según frecuencia
    - Upload de comprobante
  - Historial de pagos (estado: pendiente/aprobado/rechazado)

- [x] **5.6** Página `/portal/perfil`
  - Datos personales: nombre, email, teléfono (solo lectura)
  - Frecuencia habitual asignada (solo lectura)
  - Precio por clase según frecuencia (solo lectura)
  - Horario habitual (solo lectura)
  - Botón "Cambiar contraseña" (via Supabase Auth)

### Fase 6: Dashboard del Entrenador

- [x] **6.1** Agregar botón "Generar invitación" en página de alumno
  - Genera token y muestra link para copiar
  - El entrenador copia el link y lo envía por WhatsApp

- [x] **6.2** Indicador de estado de registro en lista de alumnos
  - "Registrado" vs "Pendiente de registro"

### Fase 7: Limpieza

- [x] **7.1** Eliminar páginas públicas legacy
  - `/public/book/page.tsx` - Sistema de planes fijos (obsoleto)
  - `/public/payment/upload/page.tsx` - Upload sin auth (obsoleto)
  - `/public/payment/credits/page.tsx` - Reemplazado por portal

- [x] **7.2** Limpiar componentes huérfanos (si los hay)

---

## Archivos Involucrados

### Nuevos archivos

```
supabase/migrations/004_student_auth.sql
app/actions/registration.ts
app/(portal)/layout.tsx
app/(portal)/portal/page.tsx
app/(portal)/portal/creditos/page.tsx
app/(portal)/portal/clases/page.tsx
app/(portal)/portal/pagos/page.tsx
app/(portal)/portal/perfil/page.tsx
app/(auth)/registro/page.tsx
app/components/registration-form/RegistrationForm.tsx
app/components/invite-student/InviteStudentButton.tsx
```

### Archivos a modificar

```
supabase/schema.sql
middleware.ts
app/actions/auth.ts
app/actions/students.ts
app/actions/payments.ts
app/actions/bookings.ts
app/(auth)/login/page.tsx
app/(dashboard)/dashboard/students/[id]/page.tsx
app/(dashboard)/dashboard/students/page.tsx
```

### Archivos a eliminar

```
app/public/book/page.tsx
app/public/payment/upload/page.tsx
app/public/payment/credits/page.tsx
```

---

## Criterios de Aceptación

### Auth y Roles
- [x] Entrenador puede crear token de invitación para un alumno
- [x] Alumno puede registrarse con el token recibido
- [x] Alumno logueado es redirigido a `/portal` (no a `/dashboard`)
- [x] Entrenador logueado es redirigido a `/dashboard` (no a `/portal`)
- [x] RLS impide que alumno vea datos de otros alumnos
- [x] Alumno NO puede acceder a `/dashboard/*`
- [x] Entrenador NO puede acceder a `/portal/*` (o redirige a dashboard)

### Portal del Alumno
- [x] Alumno puede ver su saldo de créditos con fecha de vencimiento
- [x] Alumno puede ver historial de movimientos (compras, asistencias, ajustes con motivo)
- [x] Alumno puede ver sus próximas clases agendadas
- [x] Alumno puede ver historial de asistencias
- [x] Alumno puede subir comprobante de pago con cálculo automático del monto
- [x] Alumno puede ver historial de pagos y su estado
- [x] Alumno puede ver su perfil (datos, frecuencia, horario, precio)
- [x] Alumno puede cambiar su contraseña

### Limpieza
- [x] Páginas `/public/*` eliminadas
- [x] No quedan componentes huérfanos

### Técnico
- [x] Build pasa sin errores
- [x] RLS configurado para todas las tablas relevantes

---

## Consideraciones de Seguridad

1. **Tokens de registro**: Expiran en 7 días, uso único
2. **RLS estricto**: Cada alumno solo accede a sus propios datos
3. **Validación de rol**: En middleware Y en cada server action
4. **Passwords**: Usar Supabase Auth (bcrypt automático)

---

## Decisiones Tomadas

1. **Invitación**: Solo generar link para copiar (el entrenador lo envía por WhatsApp)
2. **Alumno puede cambiar**: Solo contraseña (no email ni teléfono)
3. **Páginas `/public/*`**: Eliminarlas - todos los alumnos deben registrarse
4. **Email de bienvenida**: No (MVP)

---

## Notas

### Compatibilidad
- El sistema debe ser backwards compatible: alumnos sin `auth_user_id` siguen funcionando

### Configuración del Entrenador
- El entrenador actual debe tener `role: 'trainer'` en su `raw_user_meta_data`
- Ejecutar una vez en Supabase SQL Editor:
  ```sql
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role": "trainer"}'
  WHERE email = 'email-del-entrenador@ejemplo.com';
  ```

### Alumnos Existentes
- Los alumnos creados antes de esta feature no tendrán `auth_user_id`
- El entrenador puede generar invitación para cualquier alumno (nuevo o existente)
- Al registrarse, se vincula el auth.user con el student existente

### Futuro (fuera de scope)
- "Impersonate" para que el entrenador vea el portal como un alumno (debug)
- Notificaciones push en el portal
- App móvil nativa (PWA es suficiente para MVP)
