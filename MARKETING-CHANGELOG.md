# Marketing — Fase 7 · Dashboard — Resumen de Cambios

**Fecha**: 8 de agosto 2026
**Objetivo**: Dashboard de marketing en el panel admin (7 tabs), Schema.org por producto (7.4 del plan maestro) y fixes de persistencia/estabilidad detectados por los gates de test. **Sin cambios en el sitio público ni en el flow de compra.**

> Este documento cubre la Fase 7 del plan maestro (`.opencode/plans/MASTER-PLAN.md`). Los datos que consume vienen de la Fase 2 (analytics propio) y las Fases 3-6 (marketing core, feeds, landings, UTM).

---

## Estado de la Fase 7

| Paso | Descripción | Estado |
|------|-------------|--------|
| 1 | `npm install recharts` | ✅ Hecho |
| 2-10 | 9 componentes (`MarketingKPICards`, `DateRangeSelector`, `TrendChart`, `ProductsTable`, `CategoriesChart`, `WhatsAppStats`, `SearchStats`, `TrafficStats`, `IntegrationsStatus`) | ✅ Hecho |
| 11 | `MarketingDashboard.tsx` (orquestador de 7 tabs) | ✅ Hecho |
| 12 | `app/(admin)/marketing/page.tsx` + link en sidebar | ✅ Hecho |
| 7.4 | `lib/seo.ts` `productJsonLd()` con gtin/mpn/brand/condition | ✅ Hecho |

---

## Cambios Aplicados

### 1. Data layer — `lib/marketing/dashboard.ts` (nuevo)

- `getMarketingDashboard(days: 7 | 30 | 90)` devuelve todo el payload del dashboard.
- Datasets: `totals` (KPIs agregados), `trend` (serie diaria), `products` (top 10 por vistas), `categories` (top 10 por vistas), `whatsapp` (`topProducts`, `byCategory` con `conversionRate`, `hourly` por hora del día), `search` (`topTerms`, `noResults`), `traffic` (`sources`, `mediums`, `campaigns`, `devices`, `browsers`, `totalPageViews`), `integrations`.
- Límites defensivos: `MAX_EVENT_ROWS = 5000`, `MAX_TRAFFIC_ITEMS = 10`.
- Filtra `products` y `whatsapp.topProducts` por juegos que **siguen existiendo** (los `productMetrics` de juegos eliminados ya no entran en el top).

### 2. API — `app/api/admin/marketing/dashboard/route.ts` (nuevo)

- `GET /api/admin/marketing/dashboard?days=7|30|90` — valida el rango (default 30), requiere sesión admin.
- `dynamic = "force-dynamic"` para datos siempre frescos.

### 3. Página y orquestador

- `app/(admin)/marketing/page.tsx`: server component que hidrata `getMarketingDashboard(30)`.
- `components/admin/marketing/MarketingDashboard.tsx`: 7 tabs — **General** (KPIs + tendencia), **Productos** (tabla), **Categorías** (bar chart), **WhatsApp** (clics, horario, top productos, conversión por categoría), **Búsquedas** (términos + sin resultados), **Tráfico** (fuentes/UTM/dispositivos), **Integraciones** (estado GA4/Meta/CAPI/Clarity).
- `components/admin/AdminSidebar.tsx`: link "Marketing" con icono `Megaphone`.
- Rango configurable con `DateRangeSelector` (7/30/90 días).

### 4. Schema.org por producto (7.4) — `lib/seo.ts`

- `GameSeoSource` extendido con `gtin`, `mpn`, `brand`, `condition`.
- `productJsonLd()` ahora emite:
  - `brand.name = game.brand || settings.orgNombre` (antes siempre el org).
  - `gtin13` y `mpn` desde el juego (fallback `mpn = slug`).
  - `condition` mapeado: `new → NewCondition`, `used → UsedCondition`, `refurbished → RefurbishedCondition` (fallback `NewCondition`), tanto a nivel producto como en `offer.itemCondition` (antes hardcodeado a NewCondition).
- `app/(public)/juegos/[slug]/page.tsx` propaga los 4 campos nuevos en `toSeoSource`.

### 5. Fix de persistencia — `lib/analytics/events.ts`

- `resultsCount` de los eventos `search` ahora viaja en `metadata` y se agrega a `AnalyticsMetadata`, permitiendo detectar búsquedas sin resultados en el dashboard.

### 6. Bugs corregidos (detectados por los gates)

- **BigInt no serializable**: la query raw SQL de clics por hora (`strftime`/`COUNT`) devolvía `hour` y `count` como BigInt; `JSON.stringify` fallaba con 500 en la API (el RSC lo toleraba por cómo React serializa). Fix: `Number()` en `lib/marketing/dashboard.ts`.
- **Top de productos contaminado**: `productMetrics` acumula filas de juegos eliminados (sin cascade); en runs repetidos de la suite esas filas huérfanas llenaban el top-10 y el juego recién creado no aparecía. Fix: filtrar por `gameId IN (juegos existentes)`.

### 7. Tests

- `tests/marketing-dashboard.spec.ts` (5 tests): carga con tabs/KPIs, selector de rango, tabs de productos/integraciones, tabs nuevas (categorías/WhatsApp/búsquedas/tráfico) y verificación de que los eventos de analytics se reflejan en el dashboard.

### 8. Fix post-deploy — consistencia de la configuración de GA4

**Problema reportado**: en producción, Configuración mostraba GA4 como "Configurado" pero Marketing → Integraciones lo mostraba "Sin configurar".

**Causa raíz** (reproducida en BD local, igual que en producción):
- El badge "Activar GA4" de `/admin/settings` usaba `settings.ga4Enabled !== "false"`, así que con clave vacía (`"" !== "false"`) mostraba el badge "Configurado" por defecto. El resto de los toggles (Meta Pixel, Clarity) usan `=== "true"`; GA4 era el único inconsistente.
- La BD no tenía `ga4MeasurementId`, pero el sitio público cargaba GA4 igual por un fallback hardcodeado `G-9HBTQN02YJ` en dos lugares (`GA_MEASUREMENT_ID` en `lib/analytics.ts` y `MARKETING_DEFAULT_GA_ID` en `lib/marketing/settings.ts`, que a su vez usaba `MarketingScripts`).

**Fix aplicado**:
- `app/(admin)/settings/page.tsx`: badge de GA4 ahora usa `settings.ga4Enabled === "true"` (consistente con los otros toggles).
- `lib/analytics.ts` y `lib/marketing/settings.ts`: se eliminó el fallback hardcodeado; el Measurement ID sale solo de `ga4MeasurementId` (BD) o `NEXT_PUBLIC_GA_ID` (env). Sin eso, GA4 **no se carga** en el sitio público.
- `tests/analytics.spec.ts` reescrito (3 tests): el tag se carga y envía `page_view` sin violar la CSP cuando está configurado; la navegación dentro del sitio registra `page_view`; y **GA4 no se carga** en el sitio público cuando no hay Measurement ID.
- Gates tras el fix: suite funcional **80/80** y suite de seguridad **107/107**, `tsc --noEmit` limpio, `eslint` 0 errores.

---

## Deploy y Gates

- Gates verificados antes del commit: suite funcional **79/79** y suite de seguridad **107/107** (Playwright), `tsc --noEmit` sin errores, `eslint` 0 errores.
- En esta máquina (OneDrive/Windows) la suite funcional flakea con errores de red puntuales bajo carga paralela (ECONNRESET/timeouts) que pasan en aislamiento; CI corre con `workers: 1`, que fue el modo estable.
- Desplegado en producción en el commit `c183f09` (push a `main`, deploy por GitHub Actions).

---

## Pendientes (fuera de alcance de esta fase)

- Tab **Integraciones**: botón de sync (el plan lo menciona; hoy muestra solo el estado).
- Tab **Búsquedas**: el plan menciona "juegos más buscados"; hoy se muestran términos y búsquedas sin resultados (el dato de clic al resultado no se trackea todavía).
