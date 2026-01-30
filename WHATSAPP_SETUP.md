# Configuración de WhatsApp para Cancelaciones

## Variables de Entorno Requeridas

Para que la funcionalidad de notificación al entrenador funcione correctamente, necesitas configurar la siguiente variable de entorno:

### Desarrollo Local

Agrega en tu archivo `.env.local`:

```env
NEXT_PUBLIC_TRAINER_WHATSAPP=5491112345678
```

**Nota:** Reemplaza `5491112345678` con tu número de WhatsApp real en formato internacional (código país + número sin espacios ni símbolos).

### Formato del Número

El número debe estar en formato internacional:
- **Argentina:** `549` + código de área (sin 0) + número
  - Ejemplo: `5491112345678` para un número de Buenos Aires
  - Ejemplo: `5493515123456` para un número de Córdoba

- **Otros países:**
  - México: `52` + número
  - Chile: `56` + número
  - España: `34` + número

**Sin espacios, guiones, ni paréntesis.**

### Producción (Vercel)

1. Ve a tu proyecto en Vercel Dashboard
2. Settings → Environment Variables
3. Agrega la variable:
   - **Name:** `NEXT_PUBLIC_TRAINER_WHATSAPP`
   - **Value:** Tu número en formato internacional
   - **Environment:** Production, Preview, Development (todas)
4. Redeploy tu aplicación

## Cómo Funciona

Cuando un alumno cancela una clase:

1. La clase se cancela en el sistema
2. Se abre automáticamente WhatsApp con un mensaje pre-rellenado
3. El mensaje incluye:
   - Nombre del alumno
   - Fecha y hora de la clase cancelada
4. El alumno solo debe presionar "Enviar"
5. Recibes la notificación inmediatamente en tu WhatsApp

## Mensaje Pre-rellenado

El mensaje que verá el alumno será:

```
Hola profe, soy [Nombre del Alumno]. Quiero cancelar mi clase del [día, fecha y hora].
```

Por ejemplo:
```
Hola profe, soy Juan Pérez. Quiero cancelar mi clase del viernes, 2 de febrero, 09:00.
```

## Ventajas de Esta Solución

- ✅ **Simple y confiable** - No requiere APIs complejas
- ✅ **Sin costo** - No usa servicios de terceros
- ✅ **Comunicación directa** - Abre canal para reprogramar
- ✅ **Contexto preservado** - El alumno puede editar el mensaje
- ✅ **Inmediato** - El entrenador recibe notificación al instante

## Testing

Para verificar que funciona:

1. Configura la variable de entorno
2. Reinicia el servidor de desarrollo
3. Como alumno, cancela una clase
4. Verifica que se abra WhatsApp automáticamente
5. Verifica que el mensaje tenga la información correcta

## Troubleshooting

### WhatsApp no se abre

**Causa:** Variable de entorno no configurada o servidor no reiniciado
**Solución:** 
1. Verifica que la variable esté en `.env.local`
2. Reinicia el servidor con `npm run dev`

### Mensaje sin información de la clase

**Causa:** Props no pasadas correctamente al componente
**Solución:** Verifica que se pasen `classDate` y `studentName`

### Número de WhatsApp inválido

**Causa:** Formato incorrecto del número
**Solución:** Usa formato internacional sin espacios: `5491112345678`

## Seguridad

La variable `NEXT_PUBLIC_*` es accesible en el frontend, lo cual es correcto para este caso ya que:
- Es solo un número de teléfono (información pública)
- No es una credencial o API key
- Se necesita en el cliente para construir el link

## Próximos Pasos

Si en el futuro necesitas notificaciones automáticas adicionales (sin intervención del alumno), considera:
- Notificaciones por email automáticas
- SMS/WhatsApp automáticos vía Twilio
- Sistema de push notifications

Ver documentación en `docs/planes/pending-001-notificaciones-al-entrenador.md`
