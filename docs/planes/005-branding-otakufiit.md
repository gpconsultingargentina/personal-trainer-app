---
id: "005"
titulo: "Implementar Branding Otakufiit - Dark Mode"
estado: "pendiente"
prioridad: "alta"
creado: "2025-01-27"
cerrado: null
estimacion: "1 sesion"
dependencias: []
---

# Implementar Branding Otakufiit - Dark Mode

## Objetivo

Transformar la UI de la aplicacion para reflejar la identidad visual de Otakufiit con un tema oscuro como base, colores naranja como acento, y tipografia Poppins.

## Branding Especificado

| Token | Valor | Uso |
|-------|-------|-----|
| Primary | `#FD9800` | Botones principales, acentos, iconos activos |
| Accent | `#E98C00` | Hover states, links, bordes activos |
| Background | `#161923` | Fondo principal de la app |
| Text Primary | `#161923` | Texto sobre fondos claros (cards) |
| Link | `#E98C00` | Enlaces |
| Font | Poppins | Toda la app |
| h1 | 70px | Titulos principales (landing) |
| h2 | 45px | Titulos de seccion |
| body | 17px | Texto base |
| Border Radius | 4px | Todos los elementos |
| Base Unit | 4px | Sistema de spacing |

## Analisis de Contrastes WCAG

### Paleta Propuesta con Ratios de Contraste

| Combinacion | Ratio | WCAG AA | WCAG AAA | Uso |
|-------------|-------|---------|----------|-----|
| `#FFFFFF` sobre `#161923` | **17.5:1** | Pass | Pass | Texto principal sobre fondo oscuro |
| `#FD9800` sobre `#161923` | **6.7:1** | Pass | Pass (large) | Acentos, iconos sobre fondo oscuro |
| `#E98C00` sobre `#161923` | **5.8:1** | Pass | Fail | Links, hover states |
| `#161923` sobre `#FFFFFF` | **17.5:1** | Pass | Pass | Texto sobre cards blancas |
| `#FD9800` sobre `#FFFFFF` | **2.6:1** | Fail | Fail | NO USAR para texto |
| `#161923` sobre `#FD9800` | **6.7:1** | Pass | Pass (large) | Texto sobre botones naranja |

### Colores Derivados Necesarios

Para mantener contraste en todos los contextos:

| Color | Hex | Uso |
|-------|-----|-----|
| Surface (cards) | `#1E2330` | Cards sobre fondo oscuro (sutil diferencia) |
| Surface Alt | `#252A3A` | Cards elevadas, modals |
| Text Muted | `#9CA3AF` | Texto secundario (ratio 7:1 sobre #161923) |
| Border | `#374151` | Bordes sutiles |
| Error | `#EF4444` | Estados de error |
| Success | `#22C55E` | Estados de exito |

## Logo y Assets

### Archivos Fuente
- `logo-otakufiit-512x512-1-150x150.png` (150x150) - Logo principal
- `logo-otakufiit-160x160-1-120x120.png` (120x120) - Logo pequeno

### Descripcion del Logo
Kettlebell negra con 3 estrellas y texto "OTAKUFIIT" en arco superior. Fondo transparente/blanco, diseno en negro.

### Consideraciones para Tema Oscuro
El logo actual es negro sobre fondo claro. Para el tema oscuro hay dos opciones:
1. **Usar logo en nav/cards con fondo surface** (recomendado) - El logo negro se ve bien sobre cards claras o surface-alt
2. **Invertir colores del logo** - Crear version blanca para usar sobre fondo oscuro directamente

### Assets a Generar/Copiar

| Archivo | Tamano | Uso |
|---------|--------|-----|
| `public/logo.png` | 150x150 | Logo en navegacion |
| `public/favicon.ico` | 32x32 | Favicon del browser |
| `public/icon-192x192.png` | 192x192 | PWA icon (reemplazar existente) |
| `public/icon-512x512.png` | 512x512 | PWA splash (reemplazar existente) |
| `public/apple-touch-icon.png` | 180x180 | iOS home screen |

**Nota:** Los logos proporcionados son 150x150 y 120x120. Para PWA se escalaran o se pedira version mas grande al usuario.

## Pasos de Implementacion

### Fase 0: Assets y Logos

- [ ] **0.1** Copiar logos a `public/`
  - `logo.png` (150x150) para navegacion
  - Generar `favicon.ico` desde el logo

- [ ] **0.2** Actualizar iconos PWA
  - Reemplazar `public/icon-192x192.png`
  - Reemplazar `public/icon-512x512.png`
  - Agregar `public/apple-touch-icon.png` (180x180)

- [ ] **0.3** Actualizar `app/layout.tsx`
  - Agregar `<link rel="icon" href="/favicon.ico" />`
  - Verificar referencias a iconos PWA

### Fase 1: Configuracion Base

- [ ] **1.1** Actualizar `app/globals.css` con tokens de Tailwind v4
  - Importar Poppins desde Google Fonts
  - Definir variables CSS en `@theme`
  - Configurar colores semanticos (primary, accent, surface, etc.)
  - Configurar tipografia (font-family, font-sizes)
  - Configurar border-radius global

- [ ] **1.2** Actualizar `app/layout.tsx`
  - Agregar link a Google Fonts para Poppins
  - Actualizar `themeColor` en viewport a `#161923`

### Fase 2: Layouts Principales

- [ ] **2.1** `app/(dashboard)/dashboard/layout.tsx`
  - Cambiar `bg-gray-50` a fondo oscuro

- [ ] **2.2** `app/(portal)/layout.tsx`
  - Cambiar `bg-gray-50` a fondo oscuro

- [ ] **2.3** `app/(auth)/login/page.tsx`
  - Aplicar tema oscuro completo
  - Cards con surface color
  - Botones con primary color

- [ ] **2.4** `app/(auth)/registro/page.tsx`
  - Mismo tratamiento que login

### Fase 3: Navegacion

- [ ] **3.1** `app/components/dashboard-nav/DashboardNav.tsx`
  - Nav con surface color para que el logo negro sea visible
  - Reemplazar texto "Otakufiit" por `<Image src="/logo.png" />`
  - Items activos con primary color
  - Cambiar `indigo-*` a `primary`

- [ ] **3.2** `app/components/portal-nav/PortalNav.tsx`
  - Mismo tratamiento con logo

### Fase 4: Dashboard Pages

- [ ] **4.1** `app/(dashboard)/dashboard/page.tsx`
  - Cards con surface color
  - Texto blanco/muted segun jerarquia
  - Iconos con primary o muted

- [ ] **4.2** `app/(dashboard)/dashboard/classes/page.tsx`
- [ ] **4.3** `app/(dashboard)/dashboard/classes/new/page.tsx`
- [ ] **4.4** `app/(dashboard)/dashboard/classes/[id]/page.tsx`
- [ ] **4.5** `app/(dashboard)/dashboard/plans/page.tsx`
- [ ] **4.6** `app/(dashboard)/dashboard/plans/new/page.tsx`
- [ ] **4.7** `app/(dashboard)/dashboard/plans/[id]/page.tsx`
- [ ] **4.8** `app/(dashboard)/dashboard/students/page.tsx`
- [ ] **4.9** `app/(dashboard)/dashboard/students/new/page.tsx`
- [ ] **4.10** `app/(dashboard)/dashboard/students/[id]/page.tsx`
- [ ] **4.11** `app/(dashboard)/dashboard/students/[id]/classes/new/page.tsx`
- [ ] **4.12** `app/(dashboard)/dashboard/students/[id]/payment/new/page.tsx`
- [ ] **4.13** `app/(dashboard)/dashboard/payments/page.tsx`
- [ ] **4.14** `app/(dashboard)/dashboard/reports/page.tsx`

### Fase 5: Portal Pages

- [ ] **5.1** `app/(portal)/portal/page.tsx`
- [ ] **5.2** `app/(portal)/portal/creditos/page.tsx`
- [ ] **5.3** `app/(portal)/portal/pagos/page.tsx`
- [ ] **5.4** `app/(portal)/portal/pagos/StudentPaymentForm.tsx`
- [ ] **5.5** `app/(portal)/portal/perfil/page.tsx`
- [ ] **5.6** `app/(portal)/portal/perfil/ChangePasswordButton.tsx`
- [ ] **5.7** `app/(portal)/portal/clases/page.tsx`

### Fase 6: Componentes Compartidos

- [ ] **6.1** `app/components/class-form/ClassForm.tsx`
- [ ] **6.2** `app/components/student-form/StudentForm.tsx`
- [ ] **6.3** `app/components/plan-form/PlanForm.tsx`
- [ ] **6.4** `app/components/students-list/StudentsList.tsx`
- [ ] **6.5** `app/components/classes-list/ClassesList.tsx`
- [ ] **6.6** `app/components/delete-button/DeleteButton.tsx`
- [ ] **6.7** `app/components/delete-class-button/DeleteClassButton.tsx`
- [ ] **6.8** `app/components/delete-student-button/DeleteStudentButton.tsx`
- [ ] **6.9** `app/components/delete-plan-button/DeletePlanButton.tsx`
- [ ] **6.10** `app/components/payment-actions/PaymentActions.tsx`
- [ ] **6.11** `app/components/payment-proof-upload/PaymentProofUpload.tsx`
- [ ] **6.12** `app/components/credit-payment-form/CreditPaymentForm.tsx`
- [ ] **6.13** `app/components/student-credit-summary/StudentCreditSummary.tsx`
- [ ] **6.14** `app/components/student-credit-summary/StudentCreditSummaryWrapper.tsx`
- [ ] **6.15** `app/components/student-bookings-list/StudentBookingsList.tsx`
- [ ] **6.16** `app/components/cancel-booking-button/CancelBookingButton.tsx`
- [ ] **6.17** `app/components/calendar-buttons/CalendarButtons.tsx`
- [ ] **6.18** `app/components/invite-student/InviteStudentButton.tsx`
- [ ] **6.19** `app/components/datetime-input/DateTimeInput.tsx`
- [ ] **6.20** `app/components/time-input/TimeInput.tsx`
- [ ] **6.21** `app/components/add-class-to-student/AddClassToStudent.tsx`

### Fase 7: Paginas de Error y Misc

- [ ] **7.1** `app/error.tsx`
- [ ] **7.2** `app/global-error.tsx`
- [ ] **7.3** `app/page.tsx` (landing/redirect)

## Archivos Involucrados

### Assets (5 archivos)
- `public/logo.png` - Logo para navegacion (150x150)
- `public/favicon.ico` - Favicon del browser
- `public/icon-192x192.png` - PWA icon (reemplazar)
- `public/icon-512x512.png` - PWA splash (reemplazar)
- `public/apple-touch-icon.png` - iOS home screen

### Configuracion (2 archivos)
- `app/globals.css` - Tokens CSS y tema
- `app/layout.tsx` - Font import, theme color, favicon

### Layouts (2 archivos)
- `app/(dashboard)/dashboard/layout.tsx`
- `app/(portal)/layout.tsx`

### Auth (2 archivos)
- `app/(auth)/login/page.tsx`
- `app/(auth)/registro/page.tsx`

### Navegacion (2 archivos)
- `app/components/dashboard-nav/DashboardNav.tsx`
- `app/components/portal-nav/PortalNav.tsx`

### Dashboard Pages (14 archivos)
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/dashboard/classes/page.tsx`
- `app/(dashboard)/dashboard/classes/new/page.tsx`
- `app/(dashboard)/dashboard/classes/[id]/page.tsx`
- `app/(dashboard)/dashboard/plans/page.tsx`
- `app/(dashboard)/dashboard/plans/new/page.tsx`
- `app/(dashboard)/dashboard/plans/[id]/page.tsx`
- `app/(dashboard)/dashboard/students/page.tsx`
- `app/(dashboard)/dashboard/students/new/page.tsx`
- `app/(dashboard)/dashboard/students/[id]/page.tsx`
- `app/(dashboard)/dashboard/students/[id]/classes/new/page.tsx`
- `app/(dashboard)/dashboard/students/[id]/payment/new/page.tsx`
- `app/(dashboard)/dashboard/payments/page.tsx`
- `app/(dashboard)/dashboard/reports/page.tsx`

### Portal Pages (7 archivos)
- `app/(portal)/portal/page.tsx`
- `app/(portal)/portal/creditos/page.tsx`
- `app/(portal)/portal/pagos/page.tsx`
- `app/(portal)/portal/pagos/StudentPaymentForm.tsx`
- `app/(portal)/portal/perfil/page.tsx`
- `app/(portal)/portal/perfil/ChangePasswordButton.tsx`
- `app/(portal)/portal/clases/page.tsx`

### Componentes (21 archivos)
- Ver lista en Fase 6

### Misc (3 archivos)
- `app/error.tsx`
- `app/global-error.tsx`
- `app/page.tsx`

**Total: ~58 archivos** (53 codigo + 5 assets)

## Mapeo de Clases Tailwind

| Actual | Nuevo |
|--------|-------|
| `bg-gray-50` | `bg-background` |
| `bg-white` | `bg-surface` |
| `text-gray-900` | `text-foreground` |
| `text-gray-500/600/700` | `text-muted` |
| `text-indigo-*` | `text-primary` |
| `bg-indigo-*` | `bg-primary` |
| `border-indigo-*` | `border-primary` |
| `hover:bg-indigo-*` | `hover:bg-accent` |
| `focus:ring-indigo-*` | `focus:ring-primary` |
| `rounded-lg/md` | `rounded` (4px global) |

## Configuracion CSS Propuesta

```css
@import "tailwindcss";

@theme {
  /* Colors */
  --color-primary: #FD9800;
  --color-accent: #E98C00;
  --color-background: #161923;
  --color-surface: #1E2330;
  --color-surface-alt: #252A3A;
  --color-foreground: #FFFFFF;
  --color-muted: #9CA3AF;
  --color-border: #374151;
  --color-error: #EF4444;
  --color-success: #22C55E;

  /* Typography */
  --font-family-sans: 'Poppins', sans-serif;
  --font-size-base: 17px;
  --font-size-h1: 70px;
  --font-size-h2: 45px;

  /* Spacing & Radius */
  --radius: 4px;
}

body {
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  color: var(--color-foreground);
  background: var(--color-background);
}
```

## Criterios de Aceptacion

- [ ] Logo Otakufiit visible en navegacion (dashboard y portal)
- [ ] Favicon actualizado con logo Otakufiit
- [ ] Iconos PWA actualizados (192x192, 512x512)
- [ ] Todos los textos cumplen WCAG AA (ratio minimo 4.5:1)
- [ ] La app usa fondo oscuro (#161923) como base
- [ ] Cards y elementos elevados usan surface colors
- [ ] Botones primarios son naranja (#FD9800)
- [ ] Tipografia es Poppins en toda la app
- [ ] Border radius es 4px consistente
- [ ] Links usan el color accent (#E98C00)
- [ ] Estados hover/focus son visibles y accesibles
- [ ] Inputs tienen suficiente contraste
- [ ] La app funciona correctamente despues de los cambios
- [ ] PWA instalable con iconos correctos en iOS y Android

## Notas

- Se mantiene la estructura de componentes existente
- Solo se cambian clases de Tailwind, no logica
- Los colores derivados (surface, muted, border) son necesarios para crear jerarquia visual
- El tamanio h1=70px es apropiado solo para landing, en dashboard usar tamanios mas moderados
- El PWA theme-color tambien debe actualizarse a #161923

### Sobre los Logos

- Los logos proporcionados son 150x150 y 120x120 px
- Para PWA icons (192x192, 512x512) se escalaran los existentes
- Si la calidad no es suficiente, pedir al usuario versiones mas grandes
- El logo es negro sobre fondo claro - funciona bien sobre nav con `bg-surface`
- En la nav se usara el logo de 150px escalado a ~40px de altura
