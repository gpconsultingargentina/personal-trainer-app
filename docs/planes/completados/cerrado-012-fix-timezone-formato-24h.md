---
id: "012"
titulo: "Fix Desfasaje Horario UTC y Formato 24h"
estado: "completado"
prioridad: "critica"
creado: "2026-02-07"
cerrado: "2026-02-07"
estimacion: "1 hora"
dependencias: []
---

# Fix Desfasaje Horario UTC y Formato 24h

**Fecha:** 2026-02-07
**Tipo:** Bug Fix (Crítico)

---

## Objetivo

Corregir el problema de desfasaje horario entre el panel del entrenador y el panel del alumno, donde las clases se mostraban con horas incorrectas y en formatos inconsistentes.

---

## Problema Reportado

### Descripción del Usuario

> "En mi panel de Entrenador, tengo la clase de mi alumna bookeada a las 15:00 hs. Sin embargo ella en su panel de alumna la ve a las 06:00 pm. El horario real es a las 18:00 hs."

### Problema 1: Desfasaje de 3 Horas (UTC)

**Situación:**
- Entrenador crea clase a las **18:00** (hora deseada)
- Sistema guarda como **21:00:00.000Z** (convierte a UTC)
- Entrenador ve en su panel: **15:00** (❌ 3 horas menos)
- Alumna ve en su panel: **18:00** pero en formato 12h (06:00 p.m.)

**Causa Raíz:**
El código usaba `.toISOString()` que convierte la hora local a UTC:
```typescript
classDate.setHours(18, 0, 0, 0)  // Hora local: 18:00 Argentina
classDate.toISOString()          // Convierte a UTC: 21:00Z
// Argentina es UTC-3, entonces 18:00 local = 21:00 UTC
```

### Problema 2: Formato 12h vs 24h

**Situación:**
- Entrenador veía: `18:00` (formato 24h) ✅
- Alumna veía: `06:00 p.m.` (formato 12h) ❌

**Causa Raíz:**
El formateo en el portal del alumno no especificaba `hour12: false`:
```typescript
// app/(portal)/portal/clases/page.tsx
toLocaleDateString('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  // ❌ Faltaba: hour12: false
})
```

---

## Análisis Técnico

### Zona Horaria

- **Ubicación:** Argentina (UTC-3)
- **Todos los usuarios:** Misma zona horaria
- **Expectativa:** Hora ingresada = Hora mostrada (sin conversiones)

### Flujo del Bug

```
1. Entrenador ingresa: 18:00
   ↓
2. JavaScript crea: Date con 18:00 hora local
   ↓
3. .toISOString() convierte a UTC: 21:00Z
   ↓
4. Se guarda en DB: "2026-02-11T21:00:00.000Z"
   ↓
5. Al leer desde DB:
   - new Date("2026-02-11T21:00:00.000Z")
   - Interpreta como UTC y convierte a local
   ↓
6. Según el contexto, muestra diferente:
   - Algunas partes: 18:00 (correcta casualidad)
   - Otras partes: 15:00 (incorrecta)
   - Portal alumno: 06:00 p.m. (formato 12h)
```

### ¿Por Qué Inconsistencia?

JavaScript maneja fechas de forma compleja:
- `new Date()` sin 'Z' → hora local
- `new Date()` con 'Z' → UTC
- `.toISOString()` → siempre UTC con 'Z'
- `.toLocaleDateString()` → interpreta y convierte según locale

---

## Solución Implementada

### Principio de la Solución

**"Timezone-naive approach"**: Guardar la hora exacta sin zona horaria explícita.

Cuando todos los usuarios están en la misma zona horaria, es mejor:
1. Guardar: `2026-02-11T18:00:00` (sin 'Z')
2. Leer: Como está, sin conversiones

### Cambios en el Código

#### 1. `app/actions/bookings.ts` - createRecurringBookings()

**Antes:**
```typescript
const [hours, minutes] = scheduleItem.time.split(':')
classDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

classesToCreate.push({
  scheduled_at: classDate.toISOString(),  // ❌ Conversión UTC
  duration_minutes: durationMinutes,
  max_capacity: maxCapacity,
  current_bookings: 0,
  status: 'scheduled',
})
```

**Después:**
```typescript
const [hours, minutes] = scheduleItem.time.split(':')
classDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

// Construir el datetime string sin conversión UTC
// Esto preserva la hora exacta que el entrenador especifica
const year = classDate.getFullYear()
const month = String(classDate.getMonth() + 1).padStart(2, '0')
const day = String(classDate.getDate()).padStart(2, '0')
const hrs = String(classDate.getHours()).padStart(2, '0')
const mins = String(classDate.getMinutes()).padStart(2, '0')

classesToCreate.push({
  scheduled_at: `${year}-${month}-${day}T${hrs}:${mins}:00`,  // ✅ Hora exacta
  duration_minutes: durationMinutes,
  max_capacity: maxCapacity,
  current_bookings: 0,
  status: 'scheduled',
})
```

**Resultado:**
- Input: `18:00`
- Guardado: `2026-02-11T18:00:00`
- Sin 'Z' al final = sin zona horaria = "naive datetime"

---

#### 2. `app/actions/classes.ts` - createRecurringClassesForStudent()

**Mismo cambio que en bookings.ts:**

```typescript
// Antes:
scheduled_at: classDate.toISOString(),  // ❌

// Después:
const year = classDate.getFullYear()
const month = String(classDate.getMonth() + 1).padStart(2, '0')
const day = String(classDate.getDate()).padStart(2, '0')
const hrs = String(classDate.getHours()).padStart(2, '0')
const mins = String(classDate.getMinutes()).padStart(2, '0')

scheduled_at: `${year}-${month}-${day}T${hrs}:${mins}:00`,  // ✅
```

---

#### 3. `app/(portal)/portal/clases/page.tsx` - formatDateTime()

**Antes:**
```typescript
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    // ❌ Faltaba hour12: false
  })
}
```

**Después:**
```typescript
function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,  // ✅ Formato 24 horas
  })
}
```

**Resultado:**
- Antes: `miércoles, 11 de febrero, 06:00 p. m.`
- Después: `miércoles, 11 de febrero, 18:00`

---

## Archivos Modificados

```
modified:   app/actions/bookings.ts (líneas 324-337)
modified:   app/actions/classes.ts (líneas 293-310)
modified:   app/(portal)/portal/clases/page.tsx (líneas 8-16)
```

### Archivos NO Modificados (Ya estaban bien)

- `app/lib/utils.ts` → `formatDateTime24h()` ya usaba formato 24h correcto
- `app/components/student-bookings-list/StudentBookingsList.tsx` → usa `formatDateTime24h()`
- `app/components/classes-list/ClassesList.tsx` → usa `formatDateTime24h()`
- `app/components/class-form/ClassForm.tsx` → ya enviaba formato correcto al editar

---

## Testing Realizado

### Ambiente Local

**Antes del fix:**
- [x] Reproducido problema: clase 18:00 se veía como 15:00 en panel entrenador
- [x] Reproducido problema: formato 12h en panel alumno

**Después del fix:**
- [x] Verificado código compilado sin errores
- [x] Verificado linter sin errores
- [x] Commit creado exitosamente

### Testing en Producción (Pendiente)

**Pasos a seguir:**
1. [ ] Push a repositorio
2. [ ] Deploy automático en Vercel
3. [ ] Eliminar clases existentes con bug
4. [ ] Crear clases nuevas (usarán nuevo código)
5. [ ] Verificar en panel entrenador: formato 24h correcto
6. [ ] Verificar en panel alumno: formato 24h correcto
7. [ ] Confirmar que ambos ven misma hora

---

## Casos de Borde Considerados

### 1. Clases Existentes (Creadas con Bug)

**Problema:**
Las clases ya creadas tienen el timestamp UTC incorrecto en la DB.

**Solución:**
Dos opciones:
1. **Eliminar y recrear**: Borrar clases viejas y crear nuevas
2. **Editar manualmente**: Entrar a cada clase y ajustar la hora

**Recomendación:** Eliminar y recrear (más rápido y seguro)

### 2. ¿Migrar Timestamps Existentes?

**No es necesario** si:
- Son pocas clases
- El entrenador puede recrearlas fácilmente

**Sería necesario** si:
- Hay cientos de clases programadas
- No se pueden eliminar por políticas del negocio

### 3. Usuarios en Diferentes Zonas Horarias

**Situación actual:** Todos en Argentina (UTC-3)

**Si en el futuro hay usuarios en otras zonas:**
Necesitarás:
1. Guardar zona horaria del usuario en DB
2. Convertir al mostrar según zona del usuario
3. Considerar usar librería como `date-fns-tz` o `luxon`

**Por ahora:** Solución actual es correcta para un solo timezone

---

## Ventajas de la Solución

### ✅ Simplicidad
- No requiere librerías externas
- Fácil de entender y mantener
- Menos superficie de error

### ✅ Consistencia
- Misma hora en todos los paneles
- Formato 24h unificado
- Menos confusión para usuarios

### ✅ Performance
- No hay conversiones complejas
- Queries más simples
- Menos procesamiento en cliente

### ✅ Compatibilidad
- Supabase maneja correctamente timestamps sin 'Z'
- Next.js no tiene problemas con formato naive
- PostgreSQL flexible con timestamps

---

## Desventajas / Trade-offs

### ⚠️ No es "Timezone-aware"

Si en el futuro necesitás:
- Usuarios en múltiples países
- Convertir horarios automáticamente
- Respetar DST (Daylight Saving Time)

Entonces necesitarás refactorizar a una solución timezone-aware.

### ⚠️ Clases Viejas Quedan con Bug

Las clases creadas antes del fix tienen timestamps incorrectos.

**Mitigación:**
- Documentar que deben eliminarse/editarse
- Son temporales (eventualmente pasarán)
- Poco impacto (pocas clases afectadas)

---

## Prevención Futura

### Reglas de Código

**AL CREAR/GUARDAR FECHAS:**
```typescript
// ❌ MAL - Nunca usar:
classDate.toISOString()

// ✅ BIEN - Usar:
const year = classDate.getFullYear()
const month = String(classDate.getMonth() + 1).padStart(2, '0')
const day = String(classDate.getDate()).padStart(2, '0')
const hrs = String(classDate.getHours()).padStart(2, '0')
const mins = String(classDate.getMinutes()).padStart(2, '0')
const datetime = `${year}-${month}-${day}T${hrs}:${mins}:00`
```

**AL FORMATEAR FECHAS:**
```typescript
// ❌ MAL - Sin especificar formato:
date.toLocaleDateString('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
})

// ✅ BIEN - Siempre especificar hour12:
date.toLocaleDateString('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,  // ← IMPORTANTE
})
```

### Crear Helper Function (Opcional)

Para evitar repetir código, podrías crear:

```typescript
// app/lib/datetime.ts
export function formatDateTimeForDB(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hrs = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hrs}:${mins}:00`
}

// Uso:
scheduled_at: formatDateTimeForDB(classDate)
```

---

## Ejemplo Completo: Antes vs Después

### Antes del Fix

```
┌─────────────────────────────────────────────────────────┐
│ ENTRENADOR CREA CLASE                                   │
├─────────────────────────────────────────────────────────┤
│ Input en formulario: 18:00                              │
│                                                         │
│ JavaScript:                                             │
│   classDate.setHours(18, 0, 0, 0)  // 18:00 local      │
│   classDate.toISOString()          // 21:00Z (UTC)     │
│                                                         │
│ Guardado en DB:                                         │
│   "2026-02-11T21:00:00.000Z"       // ❌ UTC           │
│                                                         │
│ Entrenador ve en panel:                                 │
│   15:00                             // ❌ 3h menos      │
│                                                         │
│ Alumna ve en portal:                                    │
│   06:00 p.m.                        // ❌ formato 12h   │
└─────────────────────────────────────────────────────────┘
```

### Después del Fix

```
┌─────────────────────────────────────────────────────────┐
│ ENTRENADOR CREA CLASE                                   │
├─────────────────────────────────────────────────────────┤
│ Input en formulario: 18:00                              │
│                                                         │
│ JavaScript:                                             │
│   classDate.setHours(18, 0, 0, 0)  // 18:00 local      │
│   formatDateTimeForDB(classDate)   // 18:00 naive      │
│                                                         │
│ Guardado en DB:                                         │
│   "2026-02-11T18:00:00"            // ✅ Sin UTC        │
│                                                         │
│ Entrenador ve en panel:                                 │
│   18:00                             // ✅ Correcta      │
│                                                         │
│ Alumna ve en portal:                                    │
│   18:00                             // ✅ formato 24h   │
└─────────────────────────────────────────────────────────┘
```

---

## Commit

```bash
git commit -m "fix: corregir desfasaje horario UTC y formato 12h/24h en clases"
```

**Commit hash:** `7899cac`

---

## Próximos Pasos

### Inmediatos
1. [x] Crear commit con fix
2. [x] Documentar en cerrado-012
3. [x] Push a repositorio
4. [x] Deploy a Vercel
5. [x] Ejecutar migración SQL en Supabase
6. [x] Verificar en ambos paneles
7. [x] Hard refresh en ambos dispositivos

### Completado
- [x] Script de migración ejecutado exitosamente
- [x] Columna `scheduled_at` cambiada de `TIMESTAMPTZ` a `TIMESTAMP`
- [x] Todas las fechas convertidas correctamente
- [x] Formato 24h aplicado en todas las pantallas
- [x] Ambos paneles muestran la misma hora

### Futuro (Si es necesario)
- [ ] Agregar tests unitarios para formateo de fechas
- [ ] Crear helper functions para manejo de fechas
- [ ] Considerar librería timezone si se expande a otros países

---

## Referencias

### Documentación
- MDN: [Date.prototype.toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
- MDN: [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- PostgreSQL: [Date/Time Types](https://www.postgresql.org/docs/current/datatype-datetime.html)

### Artículos Relacionados
- [The problem with JavaScript dates](https://maggiepint.com/2017/04/09/fixing-javascript-date-getting-started/)
- [Storing UTC is not a silver bullet](https://codeblog.jonskeet.uk/2019/03/27/storing-utc-is-not-a-silver-bullet/)

---

## Conclusión

**Fix exitoso** de un bug crítico que afectaba la experiencia de usuario de forma severa.

**Impacto:**
- ✅ Entrenador y alumno ahora ven la misma hora
- ✅ Formato 24h consistente en toda la app
- ✅ Solución simple y mantenible
- ✅ Sin dependencias externas

**Aprendizaje:**
> Cuando todos los usuarios están en la misma zona horaria, guardar timestamps "naive" (sin zona horaria) es más simple y menos propenso a errores que convertir a UTC.

---

## Resultado Final

### ✅ Testing Completado en Producción

**Fecha:** 2026-02-07

**Verificaciones realizadas:**
- [x] Deploy de Vercel completado exitosamente
- [x] Migración SQL ejecutada en Supabase
- [x] Columna `scheduled_at` cambiada a `TIMESTAMP WITHOUT TIME ZONE`
- [x] Todas las fechas existentes convertidas correctamente
- [x] Entrenador ve formato 24h: `18:00` ✅
- [x] Alumna ve formato 24h: `18:00` ✅
- [x] Ambos ven exactamente la misma hora ✅
- [x] Sin desfasaje de 3 horas ✅

**Commits relacionados:**
- `7899cac` - fix: corregir desfasaje horario UTC y formato 12h/24h en clases
- `cdd2c33` - fix: agregar formato correcto en createClass y updateClass + cache v4
- `45c0d8a` - fix: agregar hour12:false en pantalla principal del portal
- `[nuevo]` - feat: migración SQL para cambiar scheduled_at de TIMESTAMPTZ a TIMESTAMP

**Archivos modificados:**
- `app/actions/bookings.ts` - Fix createRecurringBookings
- `app/actions/classes.ts` - Fix createClass y updateClass
- `app/(portal)/portal/clases/page.tsx` - Formato 24h en "Ver todas"
- `app/(portal)/portal/page.tsx` - Formato 24h en pantalla principal
- `public/sw.js` - Cache v4
- `supabase/migrations/20260207_fix_timezone_scheduled_at.sql` - Migración de DB

---

**Estado:** ✅ COMPLETADO Y VERIFICADO
**Última actualización:** 2026-02-07
**Resultado:** ✅ Ambos usuarios ven la misma hora en formato 24h correctamente
