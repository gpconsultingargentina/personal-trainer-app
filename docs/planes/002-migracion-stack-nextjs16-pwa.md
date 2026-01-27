---
id: "002"
titulo: "Migración Stack Next.js 16 + Tailwind 4 + PWA"
estado: "pendiente"
prioridad: "alta"
creado: "2026-01-27"
cerrado: null
estimacion: "2-3 sesiones"
dependencias: []
---

## Objetivo

Actualizar el stack a versiones estables de largo plazo y agregar soporte PWA nativo para que los alumnos puedan instalar la app en sus celulares.

## Contexto

### Situación actual

| Dependencia | Versión actual | Versión objetivo |
|-------------|----------------|------------------|
| Next.js | 14.2.0 | 16.1.5 |
| React | 18.3.0 | 19.2.x (incluido en Next.js 16) |
| Tailwind CSS | 3.4.1 | 4.x |
| PWA | No existe | Nativo Next.js |

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

1. [ ] Verificar versión de Node.js actual
2. [ ] Actualizar Node.js a 20.x LTS si es necesario
3. [ ] Crear branch `feature/stack-migration`
4. [ ] Backup de `package.json` y `package-lock.json`

### Fase 2: Migración Next.js 14 → 16

5. [ ] Leer guía oficial de migración: https://nextjs.org/docs/app/guides/upgrading/version-16
6. [ ] Revisar dependencias secundarias y actualizar:
   ```bash
   npm outdated
   npm install react-dropzone@latest  # v14.3.8+ requerido para React 19
   ```
7. [ ] Actualizar dependencias core:
   ```bash
   npm install next@latest react@latest react-dom@latest
   ```
8. [ ] Revisar `next.config.js` por cambios necesarios
9. [ ] Verificar que `middleware.ts` sigue funcionando:
   - [ ] Redirect de `/login` cuando autenticado
   - [ ] Redirect a `/login` cuando no autenticado en `/dashboard/*`
   - [ ] Cookies de Supabase se propagan correctamente
10. [ ] Buscar uso de `watch()` en formularios y migrar a `useWatch()`:
    ```bash
    grep -r "\.watch(" app/
    ```
    > **Nota**: `watch()` de react-hook-form no funciona bien con React 19. Usar `useWatch()` en su lugar.
11. [ ] Ejecutar `npm run build` y corregir errores
12. [ ] Ejecutar `npm run dev` y verificar funcionamiento

### Fase 3: Migración Tailwind 3 → 4

13. [ ] Ejecutar herramienta de migración automática:
    ```bash
    npx @tailwindcss/upgrade
    ```
14. [ ] Revisar cambios en `tailwind.config.ts`
15. [ ] Revisar cambios en `globals.css`
16. [ ] Verificar que los estilos se ven correctamente
17. [ ] Corregir clases deprecadas si las hay

### Fase 4: Implementar PWA Nativo

> **Alcance**: Solo instalabilidad y cache de assets. Sin funcionalidad offline para datos (API siempre requiere conexión).

18. [ ] Crear `app/manifest.ts` con metadata de la app:
    - Nombre: "Otakufiit"
    - Colores del tema
    - Iconos (192x192, 512x512)
19. [ ] Crear iconos de la app (pueden ser placeholder por ahora)
20. [ ] Agregar viewport y theme-color en `app/layout.tsx`
21. [ ] Configurar cache de assets estáticos (CSS, JS, imágenes)

### Fase 5: Verificación

22. [ ] `npm run build` sin errores
23. [ ] `npm run dev` funciona correctamente
24. [ ] Probar en Chrome DevTools > Application > Manifest
25. [ ] Probar instalación PWA en Chrome desktop
26. [ ] Probar instalación PWA en celular (Android/iOS)
27. [ ] Verificar que auth sigue funcionando
28. [ ] Verificar que las rutas protegidas funcionan

---

## Archivos Involucrados

### Configuración (modificar)

- `package.json` - Actualizar dependencias
- `next.config.js` - Ajustar para Next.js 16
- `tailwind.config.ts` - Migración Tailwind 4
- `app/globals.css` - Cambios de Tailwind
- `app/layout.tsx` - Agregar meta tags PWA

### Nuevos archivos

- `app/manifest.ts` - Web App Manifest
- `public/icons/icon-192x192.png` - Icono PWA
- `public/icons/icon-512x512.png` - Icono PWA

### Verificar compatibilidad

- `middleware.ts` - Auth redirects
- `app/actions/*.ts` - Server Actions
- `app/lib/supabase/*.ts` - Clientes Supabase
- Todos los componentes con Tailwind classes

---

## Criterios de Aceptación

- [ ] App corre en Next.js 16 sin errores
- [ ] Tailwind 4 aplicado, estilos se ven igual
- [ ] PWA instalable desde Chrome/Safari móvil
- [ ] Manifest visible en DevTools
- [ ] Auth funciona correctamente
- [ ] Build de producción exitoso

---

## Notas

### Decisiones tomadas

- **PWA nativo vs @ducanh2912/next-pwa**: Se eligió nativo porque no agrega dependencias externas y Next.js ya lo soporta oficialmente.
- **Migrar todo junto vs incremental**: Se hace junto porque los cambios están relacionados y la app es pequeña.

### Riesgos

- Tailwind 4 requiere Safari 16.4+ - verificar que los usuarios target tengan browsers modernos
- **Turbopack**: Si hay problemas, desactivar en `next.config.js`:
  ```js
  module.exports = {
    experimental: {
      turbo: false
    }
  }
  ```
- **react-hook-form + React 19**: El método `watch()` no funciona bien. Migrar a `useWatch()` si se usa. Ver: https://github.com/orgs/react-hook-form/discussions/11832

### Rollback

Si algo falla crítico:
```bash
git checkout main
npm install
```
