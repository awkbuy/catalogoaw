# Analytics — Fase 2, Pasos 1-4 — Resumen de Cambios

**Fecha**: 6 de agosto 2026  
**Objetivo**: Infraestructura base de analytics: modelos de datos, endpoint público de eventos y librerías de tracking propias + wrapper GA4. **Sin cambios en componentes UI ni deploy.**

> Este documento cubre los pasos 1-4 del plan maestro (`.opencode/plans/MASTER-PLAN.md` → Fase 2). Los pasos 5-7 (inyección en componentes, settings GA4) y la Fase 7 (dashboard) quedan pendientes.

---

## Estado de la Fase 2

| Paso | Descripción | Estado |
|------|-------------|--------|
| 1 | Modelos Prisma de analytics | ✅ Hecho |
| 2 | Migración + aplicación a `dev.db` | ✅ Hecho |
| 3 | `lib/analytics/events.ts` (tracking propio) | ✅ Hecho |
| 4 | `app/api/analytics/event/route.ts` (endpoint) | ✅ Hecho |
| 5 | Wrapper GA4 (`lib/analytics/ga4.ts`) | ✅ Hecho |
| 6 | Inyección de eventos en componentes | ⏳ Pendiente |
| 7 | Sección GA4 en `/admin/settings` | ⏳ Pendiente |

---

## Cambios Aplicados

### 1. `prisma/schema.prisma` — 5 modelos nuevos de analytics

- **`AnalyticsEvent`**: evento crudo (view_item, add_to_cart, search, whatsapp_click, page_view, begin_checkout, etc.). Campos: `eventType`, `gameId`, `gameName`, `categoryId`, `categoryName`, `searchTerm`, `source`, `price`, `metadata` (JSON string). Índices en `eventType`, `createdAt`, `gameId` y compuesto `eventType+createdAt`.
- **`DailyMetrics`**: snapshot diario (fecha única). Contadores: `uniqueVisitors`, `sessions`, `pageViews`, `productViews`, `cartAdditions`, `whatsappClicks`, `searches`, `checkouts`, `topDevice`, `topBrowser`.
- **`ProductMetrics`**: contadores acumulados por juego (`gameId` único): `totalViews`, `totalCartAdds`, `totalWhatsapp`, `totalCheckouts`, `lastViewedAt`. Índices DESC en los totales.
- **`CategoryMetrics`**: contadores acumulados por categoría (`categoryId` único): `totalViews`, `totalCartAdds`, `totalWhatsapp`.
- **`GA4DailyMetrics`**: datos agregados sincronizados desde GA4 (se usa en la Fase 3 del dashboard). Por ahora queda vacía; solo está el modelo.

### 2. `prisma/migrations/20260806002142_analytics_infrastructure/` — Migración

- Crea las 5 tablas con sus índices.
- Aplicada localmente a `dev.db` con `prisma migrate dev`.

> ⚠️ **PENDIENTE EN PRODUCCIÓN**: la migración NO está aplicada al VPS. El deploy del código sin migración rompería las queries (tablas no existen). Ver §Deploy más abajo.

### 3. `lib/analytics.ts` — Constantes y tipos compartidos

- `GA_MEASUREMENT_ID` (env `NEXT_PUBLIC_GA_ID`; ~~fallback `G-9HBTQN02YJ`~~ — eliminado el 8 ago 2026: ahora solo sale del env, el sitio carga GA4 únicamente con configuración real).
- `ANALYTICS_EVENT_TYPES`: whitelist de 9 tipos (`page_view`, `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `search`, `filter`, `whatsapp_click`, `begin_checkout`).
- `AnalyticsEventType` + guard `isAnalyticsEventType()`.
- Tipos globales de `window.gtag` y `window.dataLayer`.

### 4. `app/api/analytics/event/route.ts` — Endpoint público de eventos

**`POST /api/analytics/event`** — sin auth (lo usa el browser).

- **Rate limit**: 60 req/min por IP (in-memory, se resetea al reiniciar el server).
- **Validación**: `eventType` contra whitelist; strings sanitizados (trim, truncado 200 chars, `searchTerm` 100, `source` 50); precio numérico ≥ 0 (acepta string numérico); `metadata` filtrado a tipos primitivos.
- **Persistencia**:
  - Inserta en `AnalyticsEvent`.
  - Actualiza `DailyMetrics` (upsert por fecha): `pageViews`, `productViews`, `cartAdditions`, `whatsappClicks`, `searches`, `checkouts`. `uniqueVisitors` y `sessions` se incrementan solo si el `clientId`/`sessionId` (en metadata) es nuevo en el día — la verificación ocurre ANTES del insert para no auto-detectar el evento actual.
  - Actualiza `ProductMetrics` (upsert por `gameId`): incrementa `totalViews`/`totalCartAdds`/`totalWhatsapp`/`totalCheckouts` según el tipo y setea `lastViewedAt`.
  - Actualiza `CategoryMetrics` (upsert por `categoryId`): igual para categorías.
- Respuestas: `200 { ok: true }`, `400 { error }` (genérico, sin stack trace), `429` al exceder el rate limit.

### 5. `lib/analytics/events.ts` — Tracking propio del cliente

Funciones tipadas que envían al endpoint con `navigator.sendBeacon()` (fallback a `fetch` con `keepalive`). **Nunca rompe la UX** (errores silenciosos).

- `trackViewItem`, `trackAddToCart`, `trackRemoveFromCart`, `trackSearch`, `trackFilter`, `trackWhatsApp`, `trackPageView`, `trackBeginCheckout`, `trackViewCart`.
- **Throttle**: máx. 1 evento/segundo por tipo.
- **Metadata automática**: `clientId` + `sessionId` (UUID generados y persistidos en sessionStorage bajo `wr_analytics_meta`), `device` (mobile/desktop/tablet) y `browser` (edge/firefox/chrome/safari/other) detectados por userAgent.

### 6. `lib/analytics/ga4.ts` — Wrapper GA4

Funciones tipadas que empujan eventos a `window.gtag()` (GA4):

- `ga4TrackPageView`, `ga4TrackViewItem`, `ga4TrackAddToCart`, `ga4TrackRemoveFromCart`, `ga4TrackSearch`, `ga4TrackBeginCheckout`, `ga4TrackWhatsApp`, `ga4Init`.

### 7. Tests

- **`tests/analytics-events.spec.ts`** (funcional, 6 tests): evento válido `{ ok: true }`, eventType inválido → 400, faltante → 400, JSON mal formado → 400 sin leak, precio string aceptado, search registrado.
- **`tests/security/11-analytics.spec.ts`** (seguridad, 6 tests): eventType no whitelisted → 400 genérico, payloads XSS/SQLi nunca filtran ni rompen, campos de 50k chars se truncan, JSON mal formado sin filtración, rate limit 60/IP → 61º es 429, bloqueo por IP aislado.

---

## Verificación

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit` | ✅ limpio |
| `npx playwright test` (funcional) | ✅ 29/29 PASS |
| `npx playwright test --config=playwright.security.config.ts` | ✅ 75/75 PASS |
| Persistencia en `dev.db` | ✅ eventos + métricas diarias/producto/categoría |

---

## Deploy (NO hacer todavía)

El código NO está desplegado y NO se debe desplegar sin aplicar la migración. Secuencia correcta cuando se quiera publicar:

1. **Aplicar la migración en el VPS** (obligatorio ANTES o junto con el deploy del código): GitHub → Actions → *Apply DB Migrations (manual)* → rama `main`. Hace backup previo automáticamente.
   - Equivalente manual: `ssh -p5293 wolfie@149.50.155.111 'cd /var/www/wolfie-room/tools && DATABASE_URL="file:/var/www/wolfie-room/data/dev.db" npx prisma migrate deploy'`
2. **Desplegar el código**: merge a `main` (corre `deploy.yml`). El build en CI aplica la migración contra `ci.db` (tablas nuevas OK) y el smoke test valida `/` y `/login`.
3. Verificar con los gates del AGENTS.md: suite funcional y de seguridad verdes antes de commitear/pushear.

> ⚠️ Si se despliega el código sin la migración, cualquier llamada a `/api/analytics/event` fallará con "tabla no encontrada" (las queries a tablas inexistentes rompen el request). El resto del sitio no se ve afectado.

---

## Siguientes pasos (pendientes de Fase 2)

1. **Inyección de eventos en componentes** (paso 6): llamar `trackViewItem`/`trackAddToCart`/`trackSearch`/etc. en `lib/cart-context.tsx`, `components/Catalog/GameCard.tsx`, `components/CartDrawer.tsx`, `components/Hero/Hero.tsx`, `components/InfoModal.tsx`, `components/Navbar/Navbar.tsx`, `components/Catalog/Catalog.tsx`, `app/(public)/HomeClient.tsx`.
2. **Sección GA4 en `/admin/settings`** (paso 7): settings `ga4MeasurementId`, `ga4Enabled`, `ga4PropertyId`, `ga4ServiceAccountEmail`.
3. **Fase 7**: dashboard de marketing (`/admin/marketing`) con Recharts.
