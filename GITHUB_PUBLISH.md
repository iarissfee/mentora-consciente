# Publicación en GitHub

Este proyecto está preparado para vivir en un repositorio **privado** de GitHub.

## No subir nunca

- `.env`
- `data/*.db*`
- `private_uploads/*` salvo `.gitkeep`
- credenciales de PayPal
- contraseñas reales de administración

La `.gitignore` ya excluye esos archivos.

## Variables privadas necesarias en producción

Copiar `.env.example` como referencia y cargar los valores desde el panel del hosting, nunca dentro del repositorio.

## PayPal

Para activar pagos reales hacen falta `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` y `PAYPAL_WEBHOOK_ID`. El secreto queda sólo en el servidor.
