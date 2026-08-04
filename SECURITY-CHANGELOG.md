# Seguridad - Fase 0 - Resumen de Cambios

**Fecha**: Agosto 2026  
**Objetivo**: Endurecer la aplicación para producción sin modificar funcionalidades existentes.

---

## Cambios Aplicados

### 1. `lib/auth.ts` — Session Hardening
- **Eliminado** el fallback hardcodeado `"wolfie-room-dev-secret-key-2024"` como session secret
- Ahora lanza error en producción si `SESSION_SECRET` no está configurado
- **Comparación timing-safe** en `verify()` usando `crypto.timingSafeEqual()` para prevenir timing attacks
- Cookie `secure: true` siempre (no solo en producción)

### 2. `lib/rate-limit.ts` — Rate Limiting (nuevo)
- Rate limiter in-memory con cleanup automático cada 5 minutos
- Función `rateLimit(key, config)` retorna `{ success, remaining, resetIn }`
- Función `getClientIp(request)` extrae IP de `x-forwarded-for`

### 3. `actions/auth.ts` — Login Rate Limited
- **5 intentos por minuto** por IP en el endpoint de login
- Usa `headers()` de `next/headers` para obtener la IP

### 4. `app/api/cupones/validar/route.ts` — Coupon Enumeration Fixed
- **10 intentos por minuto** por IP
- Mensajes de error genéricos: todos dicen `"Cupón no válido"` (antes decía "no encontrado", "no activo", "vencido" por separado)

### 5. `next.config.ts` — Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `Content-Security-Policy` con directivas para scripts, estilos, imágenes, etc.

### 6. `middleware.ts` — Centralized Auth (nuevo)
- Protege todas las rutas `/api/admin/*` con verificación HMAC
- Usa Web Crypto API (compatible con Edge runtime)
- Retorna 401 para API y redirect a `/login` para páginas

### 7. Upload Hardening — 3 archivos
- **`app/api/admin/upload/route.ts`**: Límite 10MB, MIME whitelist, null byte check
- **`actions/upload.ts`**: UUID filenames, WebP conversion, null byte check
- **`app/api/uploads/[name]/route.ts`**: Null byte check agregado

### 8. `lib/errors.ts` — Error Sanitization (nuevo)
- Función `sanitizeError()` que convierte errores de Prisma en mensajes genéricos
- Maneja: Unique constraint, Foreign key, Record not found

### 9. Admin API Routes — 10 archivos actualizados
Todos los routes de admin ahora usan `sanitizeError()`:
- `app/api/admin/juegos/route.ts`
- `app/api/admin/juegos/[id]/route.ts`
- `app/api/admin/cupones/route.ts`
- `app/api/admin/cupones/[id]/route.ts`
- `app/api/admin/pagos/route.ts`
- `app/api/admin/pagos/[id]/route.ts`
- `app/api/admin/pagos/reordenar/route.ts`
- `app/api/admin/categorias/route.ts`
- `app/api/admin/categorias/[id]/route.ts`
- `app/api/admin/settings/route.ts`

### 10. `app/api/admin/settings/route.ts` — Mass Assignment Fixed
- Allowlist de ~30 keys permitidos
- Rechaza actualizaciones con keys no autorizadas

### 11. `actions/settings.ts` — Auth on getSettings
- Agregado `requireAuth()` a `getSettings()` (antes podía leer settings sin auth)

### 12. `lib/seo.ts` — JSON-LD Escaping
- `toJsonLd()` ahora escapa `>`, `&`, `'` además de `<`

### 13. `prisma/seed.ts` — Idempotent
- Ya **no borra** la base de datos en cada seed
- Admin se crea solo si no existe
- Password viene de `ADMIN_PASSWORD` env var (fallback: `admin123`)
- Categories, games, settings y payment methods solo se crean si la tabla está vacía

### 14. `app/(admin)/account/page.tsx` — Mi Cuenta (nuevo)
- Página para cambiar contraseña desde el panel admin
- Valida contraseña actual, nueva contraseña (mín 8 chars), confirmación

### 15. `actions/account.ts` — Change Password (nuevo)
- Server action que valida la contraseña actual contra la base de datos
- Actualiza con bcrypt hash

### 16. `components/admin/AdminSidebar.tsx` — Mi Cuenta Link
- Nuevo link "Mi Cuenta" con icono `User` antes del botón de cerrar sesión

### 17. `scripts/reset-admin-password.ts` — Recovery (nuevo)
- Script CLI: `npm run admin:reset-password <email> <nueva-contraseña>`

### 18. Config
- **`.env`**: Agregado `SESSION_SECRET` placeholder
- **`.gitignore`**: Agregado `dist/`
- **`package.json`**: Agregado script `admin:reset-password`

---

## Antes de subir a producción

### Obligatorio
1. **Cambiar `SESSION_SECRET`** en `.env.production` por un string aleatorio fuerte (32+ chars)
2. **Cambiar la contraseña del admin** después del primer login
3. **Eliminar o proteger** los archivos `Clave root don web*.txt` y `token git.txt` del directorio
4. Configurar `ADMIN_PASSWORD` en el servidor si se quiere un password distinto al default

### Recomendado (Nginx)
Agregar headers adicionales en nginx:
```nginx
add_header X-Permitted-Cross-Domain-Policies "none" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
```

### Opcional
- Ejecutar `npm audit fix` para arreglar dependencias con vulnerabilidades conocidas
- Migrar de `middleware.ts` a `proxy` cuando Next.js lo soporte oficialmente (actualmente deprecated pero funcional)
