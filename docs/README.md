# Documentación del Proyecto

Estructura de documentación orientada a desarrollo con IA (vibe coding).

---

## 📚 Guías de Documentación

| Documento | Propósito | Para quién |
|-----------|-----------|------------|
| **[GUIA_DOCUMENTACION_COMPLETA.md](GUIA_DOCUMENTACION_COMPLETA.md)** | Guía maestra completa con todos los detalles | Desarrolladores y IA (referencia completa) |
| **[PROMPT_DOCUMENTACION.md](PROMPT_DOCUMENTACION.md)** | Prompt conciso listo para usar | IA (referencia rápida) |
| **[ESTRUCTURA_VISUAL.md](ESTRUCTURA_VISUAL.md)** | Mapa visual de toda la estructura | Todos (vista general) |
| **[guias/documentacion.md](guias/documentacion.md)** | Reglas de documentación (legacy) | Referencia histórica |

**Recomendado para empezar:** Lee primero [ESTRUCTURA_VISUAL.md](ESTRUCTURA_VISUAL.md) para tener una vista general.

---

## Estructura

```
docs/
├── 📄 README.md                              # Este archivo
├── 📄 GUIA_DOCUMENTACION_COMPLETA.md         # Guía maestra ⭐
├── 📄 PROMPT_DOCUMENTACION.md                # Prompt para IA ⭐
├── 📄 ESTRUCTURA_VISUAL.md                   # Mapa visual ⭐
│
├── 📁 planes/                                # Planes de implementación
│   ├── 📋 _index.yaml                        # Índice de planes
│   ├── 005-branding-otakufiit.md
│   ├── 006-notificaciones-push.md
│   └── 📁 completados/                       # Planes finalizados
│       ├── cerrado-001-fix-payment-proofs.md
│       ├── cerrado-002-migracion-stack.md
│       ├── cerrado-003-sistema-creditos.md
│       └── cerrado-004-auth-alumnos.md
│
├── 📁 issues/                                # Issues y bugs
│   ├── 📋 _index.yaml                        # Índice de issues
│   └── 📁 completados/                       # Issues cerrados
│
└── 📁 guias/                                 # Guías permanentes
    ├── 📋 _index.yaml                        # Índice de guías
    ├── documentacion.md
    ├── modelo-negocio.md
    └── sistema-creditos.md
```

---

## Tipos de Documentos

### 🎯 Planes (`/docs/planes/`)
Features grandes que requieren múltiples pasos y sesiones.

**Ejemplos:** Sistema de créditos, Auth de alumnos, Migración de stack

### 🐛 Issues (`/docs/issues/`)
Bugs, mejoras pequeñas, tareas puntuales.

**Ejemplos:** Fix login redirect, Validación de email, Loading states

### 📖 Guías (`/docs/guias/`)
Documentación permanente: arquitectura, patrones, reglas del negocio.

**Ejemplos:** Modelo de negocio, Sistema de créditos (conceptual), Arquitectura

---

## ¿Por qué YAML?

Todos los documentos usan YAML frontmatter (el bloque entre `---` al inicio):

```yaml
---
id: "001"
titulo: "Fix login"
estado: "pendiente"
prioridad: "alta"
creado: "2026-01-30"
cerrado: null
---
```

**Beneficios para desarrollo con IA:**

1. **Parseo rápido** - La IA extrae datos sin leer todo el documento
2. **Consistencia** - Cada campo siempre está en el mismo lugar
3. **Automatización** - Actualizar campos específicos sin tocar el contenido
4. **Filtrado** - Buscar por estado, prioridad, tags, etc.

**Archivos `_index.yaml`**: Índices centralizados que permiten conocer el estado de todos los items sin abrir cada archivo.

---

## Inicio Rápido

### Para Desarrolladores Humanos
1. Lee [ESTRUCTURA_VISUAL.md](ESTRUCTURA_VISUAL.md) para entender el sistema
2. Consulta [GUIA_DOCUMENTACION_COMPLETA.md](GUIA_DOCUMENTACION_COMPLETA.md) cuando necesites detalles

### Para IA (Claude, GPT)
1. Lee [PROMPT_DOCUMENTACION.md](PROMPT_DOCUMENTACION.md) para instrucciones concisas
2. Consulta [GUIA_DOCUMENTACION_COMPLETA.md](GUIA_DOCUMENTACION_COMPLETA.md) para casos complejos

### Crear un Plan o Issue
1. Lee el `_index.yaml` correspondiente
2. Obtén el `ultimo_id` y súmale 1
3. Crea el archivo `{id}-{slug}.md` con YAML frontmatter
4. Actualiza `_index.yaml` (incrementa `ultimo_id` y agrega a `activos`)

### Cerrar un Plan o Issue
1. Actualiza YAML: `estado: "completado"`, `cerrado: "YYYY-MM-DD"`
2. Renombra con prefijo `cerrado-`
3. Mueve a carpeta `completados/`
4. Actualiza `_index.yaml` (remueve de `activos`, agrega a `completados`)

---

## Estado Actual

### Planes Activos
Ver [planes/_index.yaml](planes/_index.yaml) para lista completa.

### Issues Activos
Ver [issues/_index.yaml](issues/_index.yaml) para lista completa.

### Guías Disponibles
Ver [guias/_index.yaml](guias/_index.yaml) para lista completa.

---

## Referencias

- **CLAUDE.md** (raíz del proyecto) - Punto de entrada para Claude AI
- **guias/documentacion.md** - Reglas detalladas de documentación
- **guias/modelo-negocio.md** - Explicación del modelo de negocio
- **guias/sistema-creditos.md** - Sistema de créditos flexibles

---

**Sistema diseñado para:** Desarrollo asistido por IA (vibe coding)  
**Última actualización:** 2026-01-30
