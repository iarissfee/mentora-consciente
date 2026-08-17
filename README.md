# Campus de cursos online — versión full-stack

Proyecto funcional de campus/membresías con estética editorial premium basada en la referencia entregada: crema, verde bosque, terracota, tipografía Bodoni + Manrope y layout minimalista.

## Qué incluye

- Sitio público con catálogo de cursos y membresías.
- Registro e inicio de sesión de alumnos.
- Sesiones privadas persistentes.
- Campus personal: cada usuario ve sólo lo que tiene habilitado.
- Progreso por clase.
- Cursos por nivel de membresía + compra individual.
- Descargables PDF protegidos por permisos de membresía.
- Subida de PDF desde administración, con máximo real de 6 MB.
- Validación de extensión, MIME y cabecera `%PDF-` antes de almacenar el archivo.
- Los PDFs viven fuera de `/public`: no se pueden abrir por URL directa sin sesión/permisos.
- Panel de administración con alumnos, ventas, ingresos, membresías activas, cursos, clases y PDFs.
- Alta y baja de cursos, clases y PDFs.
- Asignación manual de curso o membresía a un alumno.
- Edición de precios/duración/nivel de las membresías.
- Vista previa por nivel: sin membresía / Esencial / Premium.
- Integración PayPal preparada para Sandbox o Live.
- Modo de pago demo mientras todavía no se cargaron credenciales de PayPal.
- Webhook PayPal firmado como respaldo si el navegador se cierra luego del pago.

## Ejecutar ahora

Requiere Node.js 22 o superior. No usa paquetes externos: no hace falta `npm install`.

```bash
cp .env.example .env
node server.js
```

Abrir `http://localhost:3000`.

### Acceso administrador local de prueba

Mientras `NODE_ENV` no sea `production`, si no configuraste otro usuario:

- Email: `admin@example.com`
- Contraseña: `CHANGE-ME-NOW-123!`

**No usar esta contraseña en producción.** El servidor se niega a iniciar en producción si no definís una contraseña administrativa propia.

## Render

El repositorio incluye `render.yaml` para desplegarlo como Web Service Node. En producción se usa `PERSIST_DIR=/opt/render/project/src/storage` y un disco persistente montado en esa ruta para conservar la base SQLite y los PDFs privados.

Las variables `APP_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y las credenciales PayPal se cargan como secretos desde Render, nunca dentro de GitHub.

## Conectar PayPal

```env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
```

Para salir a producción cambiá `PAYPAL_MODE=live`. El `CLIENT_SECRET` nunca se envía al navegador. El servidor crea la orden, valida el importe usando su propia base de datos, captura el pago y recién entonces habilita el curso o membresía.

Webhook:

```text
https://tu-dominio.com/api/paypal/webhook
```

## Accesos

Un alumno accede a un curso cuando lo compró individualmente o cuando su membresía activa tiene nivel suficiente. Cada PDF puede exigir rango `0` (curso), `1` (Esencial/Premium) o `2` (Premium).

## Seguridad incluida

- Contraseñas con `scrypt` + salt individual.
- Cookies de sesión `HttpOnly`, `SameSite` y `Secure` en producción.
- Tokens CSRF para operaciones que modifican datos.
- Rate limiting de API, login y pagos.
- Precio y moneda validados en servidor.
- Captura PayPal en servidor y verificación de firma del webhook.
- PDFs privados fuera de `/public`.
- CSP, `X-Frame-Options`, `nosniff`, referrer policy y HSTS en producción.
- Nombres de archivo aleatorios para uploads.
- Validación real de PDFs y límite de 6 MB.

Antes de ventas reales conviene completar PayPal Sandbox, términos y privacidad, backups y pruebas del checkout.
