---
id: "002"
titulo: "Migración Stack Next.js 16 + Tailwind 4 + PWA"
estado: "completado"
prioridad: "alta"
creado: "2026-01-27"
cerrado: "2026-01-27"
estimacion: "2-3 sesiones"
dependencias: []
---

## Objetivo

Actualizar el stack a versiones estables de largo plazo y agregar soporte PWA nativo para que los alumnos puedan instalar la app en sus celulares.

## Contexto

### Situación actual

| Dependencia | Versión anterior | Versión final |
|-------------|------------------|---------------|
| Next.js | 14.2.0 | 16.1.5 |
| React | 18.3.0 | 19.0.0 |
| Tailwind CSS | 3.4.1 | 4.1.18 |
| PWA | No existía | Nativo Next.js |

### Por qué migrar

1. **Seguridad**: Next.js 14.x tiene vulnerabilidades activas (CVE-2025-55184, CVE-2025-55183)
2. **Soporte**: Next.js 14 dejará de recibir parches
3. **PWA**: Los alumnos necesitan acceder desde el celular (ver saldo, subir comprobantes)
4. **Momento ideal**: App no está en producción, menos código que migrar

### Breaking changes relevantes (Next.js 16)

- Requiere **Node.js 20.9.0+** (Node 18 ya no soportado)
- TypeScript mínimo 5.1.0
- Turbopack es bundler por defecto
- Browsers: Chrome 111+, Safari 16.4+, Firefox 111+

### Fuentes consultadas

- https://nextjs.org/blog/next-16
- https://nextjs.org/blog/security-update-2025-12-11
- https://nextjs.org/docs/app/guides/progressive-web-apps
- https://tailwindcss.com/blog/tailwindcss-v4
- https://tailwindcss.com/docs/upgrade-guide
- https://github.com/orgs/react-hook-form/discussions/11832 (React 19 compatibility)
- https://github.com/react-dropzone/react-dropzone/issues/1400 (React 19 peer dep fix)
- https://supabase.com/docs/guides/getting-started/ai-prompts/nextjs-supabase-auth (Next.js 16 + Supabase)

---

## Pasos de Implementación

### Fase 1: Preparación del entorno

1. [x] Verificar versión de Node.js actual
2. [x] Actualizar Node.js a 20.x LTS si es necesario
3. [x] Crear branch `feature/stack-migration`
4. [x] Backup de `package.json` y `package-lock.json`

### Fase 2: Migración Next.js 14 → 16

5. [x] Leer guía oficial de migración: https://nextjs.org/docs/app/guides/upgrading/version-16
6. [x] Revisar dependencias secundarias y actualizar:
   ```bash
   npm outdated
   npm install react-dropzone@latest  # v14.3.8+ requerido para React 19
   ```
7. [x] Actualizar dependencias core:
   ```bash
   npm install next@latest react@latest react-dom@latest
   ```
8. [x] Revisar `next.config.js` por cambios necesarios
9. [x] Verificar que `middleware.ts` sigue funcionando:
   - [x] Redirect de `/login` cuando autenticado
   - [x] Redirect a `/login` cuando no autenticado en `/dashboard/*`
   - [x] Cookies de Supabase se propagan correctamente
10. [x] Buscar uso de `watch()` en formularios y migrar a `useWatch()`:
    ```bash
    grep -r "\.watch(" app/
    ```
    > **Nota**: No se encontraron usos de `watch()`. No fue necesaria migración.
11. [x] Ejecutar `npm run build` y corregir errores
12. [x] Ejecutar `npm run dev` y verificar funcionamiento

### Fase 3: Migración Tailwind 3 → 4

13. [x] Ejecutar herramienta de migración automática:
    ```bash
    npx @tailwindcss/upgrade
    ```
14. [x] Revisar cambios en configuración (Tailwind 4 usa CSS-first config)
15. [x] Revisar cambios en `globals.css`
16. [x] Verificar que los estilos se ven correctamente
17. [x] Corregir clases deprecadas si las hay

### Fase 4: Implementar PWA Nativo

> **Alcance**: Solo instalabilidad y cache de assets. Sin funcionalidad offline para datos (API siempre requiere conexión).

18. [x] Crear `app/manifest.ts` con metadata de la app:
    - Nombre: "Otakufiit"
    - Colores del tema (#4f46e5)
    - Iconos (192x192, 512x512)
19. [x] Crear iconos de la app en `public/icons/`
20. [x] Agregar viewport y theme-color en `app/layout.tsx`
21. [x] Configurar cache de assets estáticos (CSS, JS, imágenes)

### Fase 5: Verificación

22. [x] `npm run build` sin errores
23. [x] `npm run dev` funciona correctamente
24. [x] Probar en Chrome DevTools > Application > Manifest
25. [x] Probar instalación PWA en Chrome desktop
26. [x] Probar instalación PWA en celular (Android/iOS)
27. [x] Verificar que auth sigue funcionando
28. [x] Verificar que las rutas protegidas funcionan

---

## Archivos Involucrados

### Configuración (modificados)

- `package.json` - Dependencias actualizadas
- `next.config.js` - Sin cambios necesarios
- `tailwind.config.ts` - Eliminado (Tailwind 4 usa CSS-first)
- `app/globals.css` - Migrado a sintaxis Tailwind 4
- `app/layout.tsx` - Meta tags PWA agregados

### Nuevos archivos

- `app/manifest.ts` - Web App Manifest
- `public/icons/icon-192x192.png` - Icono PWA
- `public/icons/icon-512x512.png` - Icono PWA

### Verificados compatibilidad

- `middleware.ts` - Auth redirects ✓
- `app/actions/*.ts` - Server Actions ✓
- `app/lib/supabase/*.ts` - Clientes Supabase ✓
- Todos los componentes con Tailwind classes ✓

---

## Criterios de Aceptación

- [x] App corre en Next.js 16 sin errores
- [x] Tailwind 4 aplicado, estilos se ven igual
- [x] PWA instalable desde Chrome/Safari móvil
- [x] Manifest visible en DevTools
- [x] Auth funciona correctamente
- [x] Build de producción exitoso

---

## Notas

### Decisiones tomadas

- **PWA nativo vs @ducanh2912/next-pwa**: Se eligió nativo porque no agrega dependencias externas y Next.js ya lo soporta oficialmente.
- **Migrar todo junto vs incremental**: Se hizo junto porque los cambios están relacionados y la app es pequeña.
- **Build con webpack**: Se usa `next build --webpack` como fallback por si hay problemas con Turbopack.

### Resolución de problemas

- **Turbopack**: Se agregó flag `--webpack` en build script como precaución
- **react-hook-form + React 19**: No hubo problemas, no se usaba `watch()` en el código
- **Tailwind 4**: Migración automática funcionó correctamente
