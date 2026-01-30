---
id: "008"
titulo: "Selección Masiva de Alumnos"
estado: "completado"
prioridad: "media"
creado: "2025-01-30"
cerrado: "2025-01-30"
estimacion: "1 sesión"
dependencias: []
---

# Selección Masiva de Alumnos

**Fecha:** 2025-01-30
**Tipo:** Feature / UX Improvement

---

## Objetivo

Implementar funcionalidad de selección múltiple con checkboxes en la lista de alumnos para permitir la eliminación masiva de registros de prueba.

---

## Problema

El panel de alumnos solo permitía:
- ✅ Agregar nuevos alumnos
- ✅ Ver la lista de alumnos
- ✅ Eliminar alumnos uno por uno (desde el detalle individual)

**Faltaba:**
- ❌ Seleccionar múltiples alumnos
- ❌ Eliminar varios alumnos a la vez

Esto hacía tedioso el proceso de limpiar datos de prueba, ya que había que entrar a cada alumno individualmente y eliminarlo.

---

## Solución Implementada

### 1. Componente StudentsList con Selección Masiva

Ya existía un componente `StudentsList.tsx` con esta funcionalidad implementada, pero no se estaba utilizando en la página principal.

### 2. Actualización de la Página de Alumnos

Modificada `/app/(dashboard)/dashboard/students/page.tsx` para usar el componente `StudentsList` en lugar de renderizar la lista directamente.

### 3. Mejoras al Componente

Agregados badges de estado (Registrado/Pendiente) al componente de lista:

```tsx
{student.auth_user_id ? (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success">
    Registrado
  </span>
) : (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
    Pendiente
  </span>
)}
```

---

## Archivos Modificados

```
modified:   app/(dashboard)/dashboard/students/page.tsx
modified:   app/components/students-list/StudentsList.tsx
```

---

## Cambios en Código

### page.tsx

**Antes:**

```tsx
export default async function StudentsPage() {
  const students = await getStudents()

  return (
    <div>
      {/* ... header ... */}
      <div className="bg-surface shadow overflow-hidden rounded">
        <ul className="divide-y divide-border">
          {students.map((student) => (
            <li key={student.id}>
              <Link href={`/dashboard/students/${student.id}`}>
                {/* ... student card ... */}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
```

**Después:**

```tsx
import StudentsList from '@/app/components/students-list/StudentsList'

export default async function StudentsPage() {
  const students = await getStudents()

  return (
    <div>
      {/* ... header ... */}
      <StudentsList students={students} />
    </div>
  )
}
```

### StudentsList.tsx

Agregados badges de estado a la visualización de cada alumno para mantener paridad con el diseño original.

---

## Funcionalidades Implementadas

### ✅ Checkbox Individual

Cada alumno tiene un checkbox a la izquierda para selección individual.

### ✅ Seleccionar Todos

Checkbox en el encabezado de la lista que permite:
- Seleccionar todos los alumnos de una vez
- Deseleccionar todos si ya están seleccionados

### ✅ Barra de Acción

Cuando hay alumnos seleccionados, aparece una barra naranja mostrando:
- Cantidad de alumnos seleccionados
- Botón de eliminación masiva

### ✅ Confirmación de Seguridad

Antes de eliminar, se muestra un diálogo de confirmación con:
- Cantidad de alumnos a eliminar
- Lista de nombres de los alumnos seleccionados
- Advertencia de que la acción es irreversible

### ✅ Badges de Estado

Cada alumno muestra su estado:
- **Registrado** (verde): Alumno con cuenta activa
- **Pendiente** (naranja): Alumno sin registro completado

### ✅ Manejo de Errores

Si ocurre un error durante la eliminación, se muestra un mensaje de error en rojo.

### ✅ Loading State

Mientras se procesan las eliminaciones, el botón muestra "Eliminando..." y está deshabilitado.

---

## Flujo de Uso

1. Usuario entra a `/dashboard/students`
2. Ve la lista de alumnos con checkboxes
3. Selecciona los alumnos que desea eliminar:
   - Marcando individualmente
   - O usando "Seleccionar todos"
4. Aparece barra naranja con contador
5. Hace clic en "Eliminar X seleccionado(s)"
6. Confirma en el diálogo
7. Los alumnos son eliminados
8. La página se recarga automáticamente

---

## Tecnologías Utilizadas

- **React Hooks**: `useState` para manejar estado de selección
- **Next.js Router**: `useRouter()` para refrescar la página
- **Server Actions**: `deleteStudents()` para eliminación masiva
- **Client Component**: Marcado con `'use client'` para interactividad

---

## Seguridad

La eliminación masiva utiliza la misma action `deleteStudents()` que ya existe en el sistema:

```typescript
export async function deleteStudents(ids: string[]) {
  const supabase = await createClient()

  if (ids.length === 0) {
    throw new Error('No se seleccionaron estudiantes para eliminar')
  }

  const { error } = await supabase
    .from('students')
    .delete()
    .in('id', ids)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/students')
  return { success: true, deletedCount: ids.length }
}
```

- ✅ Valida que haya IDs seleccionados
- ✅ Usa RLS de Supabase para permisos
- ✅ Revalida el cache de Next.js
- ✅ Maneja errores apropiadamente

---

## Resultado

### Antes
- Solo se podía eliminar alumnos uno por uno
- Proceso tedioso para limpiar datos de prueba
- Sin forma visual de seleccionar múltiples registros

### Después
- ✅ Selección múltiple con checkboxes
- ✅ Eliminación en batch de varios alumnos
- ✅ UI clara con confirmación de seguridad
- ✅ Badges de estado preservados
- ✅ Manejo de errores y loading states

---

## UX Mejoradas

1. **Visual Feedback**: Barra naranja muestra claramente cuántos alumnos están seleccionados
2. **Seguridad**: Confirmación con nombres antes de eliminar
3. **Eficiencia**: Eliminar 10 alumnos toma el mismo tiempo que eliminar 1
4. **Reversibilidad**: Fácil deseleccionar con el checkbox "Seleccionar todos"
5. **Estados claros**: Loading y error states bien definidos

---

## Testing Manual Realizado

✅ Seleccionar alumno individual
✅ Deseleccionar alumno individual
✅ Seleccionar todos los alumnos
✅ Deseleccionar todos los alumnos
✅ Eliminar múltiples alumnos a la vez
✅ Cancelar eliminación en el diálogo
✅ Verificar que badges de estado se muestran correctamente
✅ Links a detalle de alumno funcionan correctamente
✅ Verificar recarga automática después de eliminar

---

## Casos de Uso

### Caso 1: Limpiar Datos de Prueba
El usuario puede seleccionar todos los alumnos de prueba y eliminarlos en una sola acción.

### Caso 2: Eliminar Alumnos Inactivos
Seleccionar múltiples alumnos que ya no toman clases y eliminarlos juntos.

### Caso 3: Gestión por Lotes
Eliminar grupos específicos de alumnos según criterios personales del entrenador.

---

## Notas Adicionales

- El componente `StudentsList` **ya existía** en el proyecto pero no se estaba usando
- La función `deleteStudents()` también **ya estaba implementada**
- Esta tarea consistió principalmente en **conectar las piezas existentes**
- Se agregaron mejoras visuales (badges) para mantener paridad con el diseño original

---

## Posibles Mejoras Futuras

- [ ] Filtros (por estado, por fecha de registro)
- [ ] Búsqueda por nombre/email
- [ ] Exportar selección a CSV
- [ ] Acciones masivas adicionales (cambiar frecuencia, enviar email)
- [ ] Deshacer eliminación (soft delete con papelera)
