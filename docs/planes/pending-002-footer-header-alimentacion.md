---
id: "002"
titulo: "Footer, Header y Integración Gem Nutrición"
estado: "pendiente"
prioridad: "media"
creado: "2025-01-30"
estimacion: "2-3 sesiones"
dependencias: []
tipo: "feature + integration"
draft: true
---

# Footer, Header y Integración Gem Nutrición

**Fecha:** 2025-01-30
**Tipo:** Feature + Integration
**Estado:** 🚧 BORRADOR - Pendiente de revisión detallada

---

## ⚠️ NOTA IMPORTANTE

Este documento es un **DRAFT PROVISIONAL** para organizar ideas iniciales.

**Requiere revisión conjunta para:**
- ✅ Definir alcance exacto de cambios en footer/header
- ✅ Entender arquitectura del gem de nutrición
- ✅ Determinar puntos de integración
- ✅ Establecer prioridades entre las 3 tareas
- ✅ Definir diseño visual específico

---

## Objetivo General

Mejorar la experiencia de usuario en tres áreas clave:

1. **Footer**: Actualizar/rediseñar el pie de página de la aplicación
2. **Header**: Modificar/mejorar la cabecera/navegación
3. **Gem Nutrición**: Integrar el sistema de alimentación/nutrición creado

---

## Contexto

### Situación Actual

**Header:**
- *(Pendiente de definir: ¿Qué tiene actualmente?)*
- *(Pendiente de definir: ¿Qué necesita cambiar?)*

**Footer:**
- *(Pendiente de definir: ¿Qué tiene actualmente?)*
- *(Pendiente de definir: ¿Qué necesita cambiar?)*

**Gem de Nutrición:**
- *(Pendiente de definir: ¿Qué es exactamente el "gem"?)*
- *(Pendiente de definir: ¿Está en otro repositorio?)*
- *(Pendiente de definir: ¿Es un módulo, API, componente?)*
- *(Pendiente de definir: ¿Qué funcionalidad ofrece?)*

---

## Plan Provisional

### FASE 1: Análisis y Diseño

#### 1.1 Auditoría Actual
- [ ] Revisar header actual en dashboard y portal
- [ ] Revisar footer actual en dashboard y portal
- [ ] Identificar componentes existentes
- [ ] Documentar estructura de navegación actual
- [ ] Screenshot del estado actual

#### 1.2 Entendimiento del Gem
- [ ] Ubicación del código del gem de nutrición
- [ ] Funcionalidades que ofrece
- [ ] Dependencias técnicas
- [ ] API/interfaz que expone
- [ ] Formato de datos que maneja

#### 1.3 Definición de Requisitos
- [ ] **Header:** ¿Qué elementos agregar/quitar/modificar?
- [ ] **Footer:** ¿Qué información debe contener?
- [ ] **Nutrición:** ¿Dónde se integra? (dashboard, portal, ambos)
- [ ] **Navegación:** ¿Agregar nuevas rutas/secciones?
- [ ] **Diseño:** ¿Mockups o referencias visuales?

---

### FASE 2: Modificación del Header

#### Posibles Cambios (A CONFIRMAR)

**Opciones comunes de header:**
- [ ] Agregar logo/branding de Otakufiit
- [ ] Nuevo menú de navegación
- [ ] Agregar acceso a sección de nutrición
- [ ] Mejora de menú responsive (móvil)
- [ ] Indicador de notificaciones
- [ ] Mejora de menú de usuario/perfil

#### Archivos Probables a Modificar
```
app/components/header/ (?)
app/(dashboard)/layout.tsx
app/(portal)/layout.tsx
```

#### Consideraciones
- ¿El header es diferente en dashboard vs portal?
- ¿Necesita ser sticky/fixed?
- ¿Qué información debe mostrar según el rol (entrenador/alumno)?

---

### FASE 3: Modificación del Footer

#### Posibles Cambios (A CONFIRMAR)

**Opciones comunes de footer:**
- [ ] Links de navegación secundaria
- [ ] Información de contacto
- [ ] Links a redes sociales
- [ ] Política de privacidad / Términos
- [ ] Copyright / Branding
- [ ] Version de la app
- [ ] Links útiles (ayuda, FAQ, soporte)

#### Archivos Probables a Modificar
```
app/components/footer/ (?)
app/(dashboard)/layout.tsx
app/(portal)/layout.tsx
```

#### Consideraciones
- ¿Footer visible en todas las páginas o solo algunas?
- ¿Diferente en desktop vs móvil?
- ¿Información de contacto del entrenador?

---

### FASE 4: Integración Gem de Nutrición

#### Preguntas Clave (A RESPONDER)

**Naturaleza del Gem:**
- ¿Es un módulo npm/package?
- ¿Es código Ruby/Rails (gem real)?
- ¿Es una API externa?
- ¿Es un conjunto de componentes React?
- ¿Está en un repositorio separado?

**Funcionalidad:**
- ¿Qué hace? (planes alimenticios, recetas, tracking, etc)
- ¿Para quién? (entrenador, alumnos, ambos)
- ¿Cómo se usa? (formularios, visualización, etc)

**Integración:**
- ¿Dónde se integra en la app?
- ¿Necesita nuevas rutas/páginas?
- ¿Necesita base de datos adicional?
- ¿Tiene autenticación propia?

#### Escenarios Posibles

**Escenario A: Gem = Módulo npm**
```typescript
// Instalación
npm install @otakufiit/nutrition-gem

// Uso en componente
import { NutritionPlan } from '@otakufiit/nutrition-gem'

<NutritionPlan studentId={studentId} />
```

**Escenario B: Gem = Código en otro repo**
```bash
# Copiar código al proyecto
cp -r ../nutrition-gem/components app/components/nutrition/

# Integrar en rutas
app/(portal)/portal/alimentacion/page.tsx (nuevo)
```

**Escenario C: Gem = API externa**
```typescript
// Configurar endpoint
NEXT_PUBLIC_NUTRITION_API=https://api.nutrition.otakufiit.com

// Llamar desde actions
export async function getNutritionPlan(studentId: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_NUTRITION_API}/plans/${studentId}`)
  return res.json()
}
```

**Escenario D: Gem = Base de datos + lógica**
```sql
-- Crear tablas nuevas
CREATE TABLE nutrition_plans (...)
CREATE TABLE meals (...)
CREATE TABLE food_items (...)

-- Integrar en Supabase
```

#### Pasos de Integración Provisionales

1. **Preparación**
   - [ ] Ubicar código del gem
   - [ ] Entender dependencias
   - [ ] Revisar documentación (si existe)
   - [ ] Identificar datos que maneja

2. **Base de Datos** (si aplica)
   - [ ] Diseñar schema de tablas
   - [ ] Crear migraciones en Supabase
   - [ ] Establecer relaciones con `students`
   - [ ] Definir políticas RLS

3. **Backend/Actions**
   - [ ] Crear Server Actions para nutrición
   - [ ] Implementar CRUD de planes alimenticios
   - [ ] Validaciones de datos
   - [ ] Permisos (quién puede ver/editar)

4. **Frontend**
   - [ ] Crear rutas nuevas
   - [ ] Diseñar componentes de UI
   - [ ] Formularios para ingresar datos
   - [ ] Visualización de planes
   - [ ] Integrar en navegación (header/sidebar)

5. **Testing**
   - [ ] Probar flujo completo
   - [ ] Verificar permisos
   - [ ] Testing en móvil/PWA
   - [ ] Validación de datos

---

## Estructura Propuesta (Provisional)

### Nuevas Rutas Posibles

```
Dashboard (Entrenador):
/dashboard/alimentacion         → Vista general
/dashboard/alimentacion/planes  → Listado de planes
/dashboard/alimentacion/nuevo   → Crear plan
/dashboard/students/[id]/alimentacion → Plan del alumno

Portal (Alumno):
/portal/alimentacion            → Mi plan alimenticio
/portal/alimentacion/recetas    → Recetas disponibles
/portal/alimentacion/progreso   → Tracking/progreso
```

### Nuevos Componentes Posibles

```
app/components/nutrition/
├── NutritionPlanCard.tsx
├── MealList.tsx
├── FoodItemSelector.tsx
├── MacrosSummary.tsx
├── RecipeCard.tsx
└── NutritionProgress.tsx
```

### Nuevas Acciones Posibles

```typescript
app/actions/nutrition.ts
- getNutritionPlan(studentId)
- createNutritionPlan(data)
- updateNutritionPlan(id, data)
- deleteMeal(id)
- addFoodItem(mealId, foodId)
```

---

## Consideraciones Técnicas

### Header/Footer

**Responsive Design:**
- Mobile-first approach
- Hamburger menu en móvil
- Collapse footer en pantallas pequeñas

**Performance:**
- Componentes livianos
- Lazy loading si tiene muchos elementos
- Optimización de imágenes (logos)

**Accesibilidad:**
- Navegación por teclado
- ARIA labels
- Contraste de colores

### Gem de Nutrición

**Escalabilidad:**
- ¿Cuántos alumnos tendrán planes?
- ¿Frecuencia de actualización?
- ¿Tamaño de datos (imágenes de comida)?

**Seguridad:**
- RLS policies estrictas
- Validación de inputs
- Solo entrenador puede asignar planes
- Alumnos solo ven su propio plan

**UX:**
- Interfaz intuitiva
- Fácil de actualizar
- Visualización clara (macros, calorías)
- Opción de imprimir/exportar

---

## Preguntas para Sesión de Revisión

### Header
1. ¿Qué elementos actuales del header no te gustan?
2. ¿Qué elementos nuevos quieres agregar?
3. ¿Tienes un diseño/mockup de referencia?
4. ¿Debe ser diferente para entrenador vs alumno?
5. ¿Quieres agregar logo/branding específico?

### Footer
1. ¿Qué información debe tener el footer?
2. ¿Links a redes sociales? ¿Cuáles?
3. ¿Información de contacto visible?
4. ¿Políticas legales (privacidad, términos)?
5. ¿Debe estar en todas las páginas?

### Gem de Nutrición
1. ¿Dónde está el código del gem?
2. ¿Qué funcionalidad específica tiene?
3. ¿Es para que el entrenador asigne planes a alumnos?
4. ¿O para que alumnos registren lo que comen?
5. ¿Maneja recetas, macros, calorías?
6. ¿Tiene tracking de progreso?
7. ¿Integración con otras apps (MyFitnessPal, etc)?
8. ¿Ya está funcional o hay que desarrollarlo?
9. ¿Tiene base de datos propia o usa Supabase?
10. ¿Documentación disponible?

### Prioridades
1. ¿Qué se hace primero: Header, Footer o Nutrición?
2. ¿Alguna de estas es bloqueante para las otras?
3. ¿Deadline o urgencia específica?
4. ¿Necesitas algo funcional mínimo primero?

---

## Estimaciones Preliminares

### Header
- **Simple** (cambios menores): 1 hora
- **Medio** (rediseño + nuevos links): 2-3 horas
- **Complejo** (nueva navegación + responsive): 4-5 horas

### Footer
- **Simple** (texto + links básicos): 30 minutos
- **Medio** (diseño + múltiples secciones): 1-2 horas
- **Complejo** (diseño custom + animaciones): 3-4 horas

### Gem de Nutrición
- **Integración Simple** (ya existe, solo importar): 2-3 horas
- **Integración Media** (adaptar código existente): 5-8 horas
- **Desarrollo Completo** (desde cero): 15-20 horas

**Total estimado:** 3-32 horas dependiendo del alcance real

---

## Riesgos y Consideraciones

### Riesgos Técnicos
- 🔴 **Alto:** Si el gem usa tecnología incompatible (Ruby en app Next.js)
- 🟡 **Medio:** Si requiere migración compleja de base de datos
- 🟢 **Bajo:** Si son cambios solo de UI (header/footer)

### Riesgos de UX
- Cambios en navegación pueden confundir usuarios actuales
- Agregar demasiada información en header/footer puede saturar
- Integración de nutrición debe ser intuitiva

### Riesgos de Alcance
- "Gem de nutrición" podría ser proyecto grande sin definir bien
- Creep de features durante implementación
- Integración puede revelar necesidad de refactors

---

## Próximos Pasos

### Antes de Empezar Implementación

1. **Sesión de Revisión:**
   - Responder todas las preguntas de este documento
   - Mostrar código del gem de nutrición
   - Definir mockups/diseños para header/footer
   - Establecer prioridad de las 3 tareas

2. **Refinamiento del Plan:**
   - Actualizar este documento con información concreta
   - Crear subtareas específicas
   - Definir orden de implementación
   - Estimar tiempo real

3. **Preparación Técnica:**
   - Revisar código del gem
   - Identificar dependencias a instalar
   - Preparar migraciones de DB (si aplica)
   - Crear branch de desarrollo

---

## Notas Adicionales

### Posible Relación con Branding

Este plan podría relacionarse con el plan **005-branding-otakufiit.md**.

Si se está rediseñando header/footer, es buen momento para:
- Aplicar colores de marca consistentes
- Agregar logo oficial
- Definir tipografía estándar
- Establecer estilos reutilizables

### Posible Extensión a Portal PWA

Si se agrega sección de nutrición:
- ¿Se puede acceder offline?
- ¿Necesita caché especial en Service Worker?
- ¿Notificaciones para recordar comidas?

---

## Referencias

### Archivos del Proyecto Relevantes

```
app/(dashboard)/layout.tsx          → Layout con posible header/footer
app/(portal)/layout.tsx             → Layout del portal
app/components/                     → Componentes reutilizables
public/sw.js                        → Service Worker (si necesita cache)
tailwind.config.ts                  → Estilos (para header/footer)
```

### Documentación a Consultar

- Next.js Layouts: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
- Tailwind Components: https://tailwindui.com/components
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security

---

## Conclusión Provisional

Este es un **plan draft** que necesita:

✅ **Revisión conjunta** para llenar los espacios en blanco
✅ **Información concreta** sobre el gem de nutrición  
✅ **Decisiones de diseño** para header y footer
✅ **Priorización clara** de las 3 tareas

Una vez tengamos esa información, podemos:
1. Actualizar este documento
2. Crear plan de implementación detallado
3. Comenzar desarrollo por fases
4. Iterar con feedback

---

**Estado:** 🚧 BORRADOR - No ejecutar hasta revisión
**Última actualización:** 2025-01-30
**Próxima acción:** Sesión de revisión para definir alcance exacto
