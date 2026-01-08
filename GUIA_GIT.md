# Guía Paso a Paso: Guardar Cambios en GitHub

## Paso 1: Inicializar Git (si no está inicializado)

Abre la terminal en la raíz de tu proyecto y ejecuta:

```bash
git init
```

## Paso 2: Verificar/Crear archivo .gitignore

Asegúrate de tener un archivo `.gitignore` para no subir archivos innecesarios. Si no existe, créalo con este contenido:

```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/
/build
/dist

# Production
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# PM2
ecosystem.config.js
```

## Paso 3: Ver el estado de los archivos

```bash
git status
```

Esto te mostrará todos los archivos modificados, nuevos o eliminados.

## Paso 4: Agregar archivos al staging (área de preparación)

### Opción A: Agregar todos los archivos
```bash
git add .
```

### Opción B: Agregar archivos específicos
```bash
git add app/components/classes-list/ClassesList.tsx
git add app/actions/classes.ts
```

## Paso 5: Hacer commit (guardar los cambios localmente)

```bash
git commit -m "Descripción clara de los cambios realizados"
```

Ejemplos de mensajes descriptivos:
- `git commit -m "Agregar eliminación masiva de clases con checkboxes"`
- `git commit -m "Corregir formato de horas a 24 horas en toda la aplicación"`
- `git commit -m "Restaurar funcionalidad de agendar clases recurrentes"`
- `git commit -m "Agregar botones de agregar/eliminar clases y subir comprobantes en alumnos"`

## Paso 6: Crear repositorio en GitHub (si no existe)

1. Ve a [GitHub.com](https://github.com) e inicia sesión
2. Haz clic en el botón "+" (arriba a la derecha) → "New repository"
3. Nombre del repositorio: `personal-trainer-app` (o el que prefieras)
4. Descripción: "Sistema de gestión de clases para personal trainer"
5. Elige si será público o privado
6. **NO** marques "Initialize with README" (ya tienes archivos)
7. Haz clic en "Create repository"

## Paso 7: Conectar tu repositorio local con GitHub

GitHub te dará una URL. Ejecuta estos comandos (reemplaza `TU_USUARIO` con tu usuario de GitHub):

```bash
git remote add origin https://github.com/TU_USUARIO/personal-trainer-app.git
```

O si prefieres usar SSH:
```bash
git remote add origin git@github.com:TU_USUARIO/personal-trainer-app.git
```

## Paso 8: Subir los cambios a GitHub

### Primera vez (crear la rama main y subir):
```bash
git branch -M main
git push -u origin main
```

### Siguientes veces (después de hacer commits):
```bash
git push
```

## Flujo de trabajo diario recomendado

Cada vez que hagas cambios importantes:

```bash
# 1. Ver qué cambió
git status

# 2. Agregar los cambios
git add .

# 3. Hacer commit con mensaje descriptivo
git commit -m "Descripción de los cambios"

# 4. Subir a GitHub
git push
```

## Comandos útiles adicionales

### Ver el historial de commits:
```bash
git log --oneline
```

### Ver diferencias antes de hacer commit:
```bash
git diff
```

### Deshacer cambios en un archivo (antes de hacer commit):
```bash
git checkout -- nombre-del-archivo.tsx
```

### Ver qué archivos están en staging:
```bash
git status
```

### Crear una rama nueva (para trabajar en una funcionalidad):
```bash
git checkout -b nombre-de-la-rama
```

### Volver a la rama main:
```bash
git checkout main
```

## Buenas prácticas

1. **Haz commits frecuentes**: No esperes a tener muchos cambios. Haz commits pequeños y frecuentes.

2. **Mensajes descriptivos**: Escribe mensajes claros que expliquen qué cambió y por qué.

3. **Revisa antes de commitear**: Usa `git status` y `git diff` para ver qué estás guardando.

4. **Haz push regularmente**: Sube tus cambios a GitHub frecuentemente para tener respaldo.

5. **No subas archivos sensibles**: Nunca hagas commit de `.env.local` o archivos con contraseñas.

## Si algo se rompe: Restaurar desde GitHub

Si necesitas restaurar un commit anterior:

```bash
# Ver el historial
git log --oneline

# Restaurar a un commit específico (reemplaza HASH con el hash del commit)
git checkout HASH

# O restaurar el último commit
git checkout HEAD~1
```

Para volver al estado más reciente:
```bash
git checkout main
```
