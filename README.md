# Campus de cursos online — Mentora Consciente

Campus full-stack con estética editorial premium, registro e inicio de sesión, membresías, cursos, progreso, PDFs protegidos, administración, ventas y preparación para PayPal.

## Persistencia en Render Free

El sitio puede ejecutarse como Web Service Free sin disco persistente. Cuando se define `DATABASE_URL`, la app usa PostgreSQL como respaldo persistente del estado del campus (alumnos, sesiones, ventas, membresías, cursos, progreso y configuración). Los PDFs privados también se replican en PostgreSQL y se restauran automáticamente después de un reinicio o redeploy.

Las tablas remotas usan prefijo `mc_` para no mezclarse con otras aplicaciones de la misma base:

- `mc_runtime_state`
- `mc_asset_blobs`

Para producción, una base dedicada y credenciales separadas siguen siendo preferibles a compartir una misma conexión entre aplicaciones.

## Variables de entorno

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
ADMIN_EMAIL=tu-email@dominio.com
ADMIN_PASSWORD=UNA_CLAVE_LARGA_Y_UNICA
PAYPAL_MODE=sandbox
```

Cuando se conecte PayPal:

```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
```

## Ejecutar localmente

Requiere Node.js 22 o superior.

```bash
npm install
cp .env.example .env
npm start
```

## Render

El repositorio incluye `render.yaml` configurado como Web Service Docker Free con health check `/api/health`. Para persistencia se debe conectar `DATABASE_URL` a PostgreSQL.

## Seguridad

- Contraseñas con `scrypt` y salt individual.
- Cookies de sesión `HttpOnly`, `SameSite` y `Secure` en producción.
- Protección CSRF en operaciones de escritura.
- Rate limiting de API, login y pagos.
- Precio y moneda validados en servidor.
- PDFs fuera de `/public` y descarga controlada por permisos.
- Límite real de 6 MB y validación PDF.
- CSP, `X-Frame-Options`, `nosniff`, referrer policy y HSTS en producción.
- PayPal preparado para captura en servidor y verificación de webhook.
