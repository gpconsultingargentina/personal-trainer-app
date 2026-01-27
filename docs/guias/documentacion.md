---
id: "documentacion"
titulo: "Reglas de Documentación"
descripcion: "Cómo estructurar planes, issues y guías para desarrollo con IA"
---

# Reglas de Documentación

## Estructura YAML - Issues

```yaml
---
id: "001"                    # Número consecutivo (3 dígitos)
titulo: "Título descriptivo"
estado: "pendiente"          # pendiente | en-progreso | completado
prioridad: "alta"            # alta | media | baja
creado: "2025-01-27"
cerrado: null                # Fecha de cierre o null
tags: ["bug", "ui"]          # Opcional
---
```

**Nombre de archivo**: `{id}-{slug}.md`
- Ejemplo: `001-fix-login-redirect.md`

## Estructura YAML - Planes

```yaml
---
id: "001"                    # Número consecutivo (3 dígitos)
titulo: "Título del plan"
estado: "pendiente"          # pendiente | en-progreso | completado
prioridad: "alta"            # alta | media | baja
creado: "2025-01-27"
cerrado: null
estimacion: "2-3 sesiones"   # Opcional
dependencias: []             # IDs de otros planes que bloquean este
---
```

**Nombre de archivo**: `{id}-{slug}.md`
- Ejemplo: `001-sistema-pagos.md`

## Estructura YAML - Guías

```yaml
---
id: "slug-unico"
titulo: "Título de la guía"
descripcion: "Descripción breve"
---
```

**Nombre de archivo**: `{slug}.md`
- Ejemplo: `arquitectura.md`

## Numeración Consecutiva

Los issues y planes usan numeración consecutiva de 3 dígitos:
- `001`, `002`, `003`...

**Para obtener el próximo número:**
1. Revisar `_index.yaml` de la carpeta correspondiente
2. Usar `ultimo_id + 1`

## Procedimiento para Cerrar Issue/Plan

### Paso 1: Actualizar el YAML del archivo

```yaml
# Antes
estado: "en-progreso"
cerrado: null

# Después
estado: "completado"
cerrado: "2025-01-27"
```

### Paso 2: Renombrar el archivo

Agregar prefijo `cerrado-`:
```
001-fix-login.md → cerrado-001-fix-login.md
```

### Paso 3: Mover a /completados

```
docs/issues/001-fix-login.md → docs/issues/completados/cerrado-001-fix-login.md
```

### Paso 4: Actualizar _index.yaml

Mover la entrada del item de `activos` a `completados`.

## Estructura de _index.yaml

```yaml
# docs/issues/_index.yaml
ultimo_id: 3
activos:
  - id: "003"
    archivo: "003-implementar-calendario.md"
    titulo: "Implementar calendario"
    estado: "pendiente"
completados:
  - id: "001"
    archivo: "completados/cerrado-001-fix-login.md"
    titulo: "Fix login redirect"
    cerrado: "2025-01-27"
  - id: "002"
    archivo: "completados/cerrado-002-suspense-boundary.md"
    titulo: "Fix Suspense boundary"
    cerrado: "2025-01-27"
```

## Contenido del Documento

### Issues

```markdown
---
(yaml frontmatter)
---

## Descripción
Explicación clara del problema o mejora.

## Contexto
Archivos relevantes, comportamiento actual vs esperado.

## Criterios de Aceptación
- [ ] Criterio 1
- [ ] Criterio 2

## Notas
Información adicional para la IA.
```

### Planes

```markdown
---
(yaml frontmatter)
---

## Objetivo
Qué se quiere lograr.

## Contexto
Por qué es necesario, qué problema resuelve.

## Pasos de Implementación
1. [ ] Paso 1
2. [ ] Paso 2
3. [ ] Paso 3

## Archivos Involucrados
- `ruta/archivo.ts` - Descripción

## Criterios de Aceptación
- [ ] Criterio 1
- [ ] Criterio 2

## Notas
Decisiones tomadas, consideraciones.
```
