# Documentación del Proyecto

Estructura de documentación orientada a desarrollo con IA (vibe coding).

## Estructura

```
docs/
├── planes/           # Planes de implementación de features
│   ├── completados/  # Planes finalizados
│   └── _index.yaml   # Índice de planes
│
├── guias/            # Guías y reglas del proyecto
│   └── _index.yaml   # Índice de guías
│
├── issues/           # Issues y bugs a resolver
│   ├── completados/  # Issues cerrados
│   └── _index.yaml   # Índice de issues
│
└── README.md         # Este archivo
```

## Convenciones

- **Planes**: Features grandes que requieren múltiples pasos
- **Issues**: Bugs, mejoras pequeñas, tareas puntuales
- **Guías**: Documentación permanente (arquitectura, patrones, reglas)

## ¿Por qué YAML?

Todos los documentos usan YAML frontmatter (el bloque entre `---` al inicio):

```yaml
---
id: "001"
titulo: "Fix login"
estado: "pendiente"
prioridad: "alta"
---
```

**Beneficios para desarrollo con IA:**

1. **Parseo rápido** - La IA extrae datos sin leer todo el documento
2. **Consistencia** - Cada campo siempre está en el mismo lugar
3. **Automatización** - Actualizar campos específicos sin tocar el contenido
4. **Filtrado** - Buscar por estado, prioridad, tags, etc.

**Archivos `_index.yaml`**: Índices que permiten a la IA conocer el estado de todos los items sin abrir cada archivo.

Ver `guias/documentacion.md` para reglas detalladas de formato y procedimientos.
