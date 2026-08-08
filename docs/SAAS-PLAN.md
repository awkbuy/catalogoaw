# Plan — Plataforma SaaS multi-tenant de catálogos online

> Proyecto nuevo. Documento consolidado del producto SaaS: vende catálogos online a cualquier rubro (productos, no un rubro específico).
>
> **Placeholders a definir:**
> - `[NOMBRE_PLATAFORMA]`: marca del producto.
> - `[DOMINIO_PLATAFORMA]`: dominio base de la plataforma.
> - `[VPS_PROD_ACTUAL]`: servidor donde hoy corre la web original.

---

## Índice

1. [Decisiones de arquitectura](#1-decisiones-de-arquitectura)
2. [Dominio de la plataforma](#2-dominio-de-la-plataforma)
3. [Fase 0 — Base multi-tenant](#3-fase-0--base-multi-tenant)
4. [Fase 1 — Catálogo genérico (productos)](#4-fase-1--catálogo-genérico-productos)
5. [Fase 2 — Branding + Ubicación + Redes](#5-fase-2--branding--ubicación--redes)
6. [Fase 3 — Notificaciones + Changelog con YouTube](#6-fase-3--notificaciones--changelog-con-youtube)
7. [Fase 4 — Panel SaaS de administración](#7-fase-4--panel-saas-de-administración)
8. [Fase 5 — Cobro con Mercado Pago + ciclo de vida](#8-fase-5--cobro-con-mercado-pago--ciclo-de-vida)
9. [Fase 6 — Dominios propios y temporales](#9-fase-6--dominios-propios-y-temporales)
10. [Fase 7 — Infraestructura y monitoreo](#10-fase-7--infraestructura-y-monitoreo)
11. [Anexo A — Historial de pagos y deudas (superadmin)](#anexo-a--historial-de-pagos-y-deudas-superadmin)
12. [Anexo B — Descuentos de retención](#anexo-b--descuentos-de-retención)
13. [Anexo C — Modelo de negocio y rentabilidad](#anexo-c--modelo-de-negocio-y-rentabilidad)
14. [Anexo D — Inspección de seguridad actual + mejoras](#anexo-d--inspección-de-seguridad-actual--mejoras)
15. [Anexo E — Recomendaciones técnicas](#anexo-e--recomendaciones-técnicas)
16. [Otras recomendaciones para Argentina](#16-otras-recomendaciones-para-argentina)
17. [Orden de ejecución sugerido](#17-orden-de-ejecución-sugerido)
18. [Decisiones abiertas](#18-decisiones-abiertas)

---

## 1. Decisiones de arquitectura

| Decisión | Elección | Fundamento |
|---|---|---|
| Modelo de tenancy | **Multi-tenant, un solo deployment** (modelo Tiendanube) | 1 proceso PM2, 1 build para todos, onboarding sin SSH. Único modelo que escala en un VPS de 4–8 GB |
| Aislamiento de datos | **1 archivo SQLite por tenant** (`data/tenants/<id>.db`) + 1 DB global de plataforma | Encaja con el stack actual (better-sqlite3). El aislamiento lo da el filesystem: es estructuralmente imposible que un tenant vea datos de otro (no depende de `WHERE tenant_id`). Los queries de la app no se refactorizan: solo cambia a qué archivo apunta el PrismaClient |
| Escala v1 | 5–15 clientes | Cómodo en 1 VPS KVM 2 |
| Pagos de los clientes finales | **Solo WhatsApp en v1** (carrito → consulta) | Cero integración de pagos por tenant, cero compliance de intermediación |
| Cobro de la suscripción SaaS | **Mercado Pago (suscripciones)** + ciclo de vida tipo Tiendanube (gracia → suspensión → baja) | Estándar en Argentina |

**Por qué encaja con el código base actual** (verificado contra el repo):
- `lib/prisma.ts` ya crea el `PrismaBetterSqlite3` con una URL → solo cambia la URL por tenant.
- `app/globals.css` ya usa Tailwind v4 con **CSS variables** (`--color-primary`, `--color-background`, etc.) → el branding por tenant se implementa sobrescribiendo esas variables en runtime, sin reescribir componentes.
- El modelo de producto actual es casi genérico (nombre, slug, descripción, precios, imágenes, SEO) → la generalización es principalmente relabeling + campos opcionales.

---

## 2. Dominio de la plataforma

- **Dominio temporal de cada cliente = subdominio de la plataforma**, ej. `marca.[DOMINIO_PLATAFORMA]`.
- **NO subcarpeta del VPS.** El modelo "carpeta" implica una instancia por cliente (1 instancia Next.js standalone ≈ 1–1.5 GB RAM → en un VPS de 4 GB entran 2–3 clientes). Con multi-tenant es innecesario y no escala.
- Cada cliente elige su slug (verificación de disponibilidad en el alta).
- TLD sugerido: `.com.ar` si el mercado es argentino, `.com` si es internacional.

---

## 3. Fase 0 — Base multi-tenant

**DB de plataforma** (`platform.db`): `Tenant` (slug, nombre, estado, plan, fechas), `TenantUser` (usuarios admin por tenant, roles owner/admin/editor), `Domain` (subdominio o dominio propio → tenantId), `Subscription`, `Invoice`, `Changelog`, `ChangelogReceipt`, `Notification`.

**DB por tenant** (`data/tenants/<id>.db`): el esquema actual del catálogo tal cual (Category, Product, Setting, Coupon, PaymentMethod, analytics).

**Routing** (middleware Next.js):
- `<slug>.[DOMINIO_PLATAFORMA]` → `Tenant`
- dominio propio → `Domain` → `Tenant`
- Resolver en middleware, setear `x-tenant-id`; en server code usar un PrismaClient por tenant (patrón `getTenantPrisma(tenantId)` con cache de request). Migraciones: aplicar a todas las tenant DBs en deploy + lazy on-open.

**Auth**: cada panel admin de tenant usa los `TenantUser` de SU base. Plataforma tiene superadmin (vos). Cookie con `{tenantId, userId}`.

**Migración del proyecto actual → tenant interno**: los datos de la web original se copian a `data/tenants/<slug>.db` y pasa a ser un tenant de la plataforma con su dominio propio. Consolida: 1 servidor, 1 deploy, 1 código.

**Tests (gate obligatorio)**: `tests/multitenant.spec.ts` — aislamiento entre tenants (un tenant no puede leer datos de otro vía API ni admin), resolución de subdominios, alta de tenant.

---

## 4. Fase 1 — Catálogo genérico (productos)

- El modelo de producto se mantiene en schema pero se **relabela a "producto"** en UI y código. Los campos específicos de juegos (`jugadoresMin/Max`, `duracion`, `edad`, `dificultad`) pasan a **opcionales** y se muestran solo si tienen valor.
- Setting nueva: `tipo_catalogo` = `juegos` | `productos` → cambia labels ("Categorías de productos", "Ficha técnica", etc.).
- Nueva: `attributes` opcional (JSON) para campos custom del rubro de cada cliente (talle, color, material, etc.). Sin esto, el catálogo genérico queda corto para "productos".
- Limpiar todas las strings hardcodeadas del front relacionadas con el negocio original en componentes, SEO y metadata.
- **Tests**: edición de producto genérico sin campos de juego; render correcto en modo `productos`.

---

## 5. Fase 2 — Branding + Ubicación + Redes

**Branding** (sección nueva en el panel admin):
- Campos: colores `primary`, `secondary`, `background`, `card`, `text`, `text-secondary`, `border`; logo; favicon; tipografía.
- Implementación: las variables `@theme inline` se declaran con fallback y cada tenant inyecta un `<style>` con sus valores (CSS custom properties) en el `<head>`. Los componentes ya usan `text-primary`, `bg-card`, etc. → no hay que tocar componentes.
- Persistir en la `Setting` del tenant (ej. `brand_*`). Vista previa en vivo en la misma página.

**Ubicación y redes**:
- Settings a agregar: `tiktok`, `x`, `youtube`, `googleMapsUrl` (ya existen `direccion`, `horarios`, `instagram`, `facebook`, `whatsapp`).
- Front: bloque "Visitanos" en footer + navbar; link a Google Maps con la URL del tenant; widgets de redes con iconos de Lucide.

**Tests**: cambio de branding → CSS variable aplicada en el DOM; redes/ubicación visibles en front y editables en admin.

---

## 6. Fase 3 — Notificaciones + Changelog con YouTube

- Modelo global `Changelog`: versión, título, descripción, `youtubeUrl?`, fecha, tipo (novedad/mejora/fix).
- Modelo `ChangelogReceipt`: `tenantId + changelogId + leídoAt` → contador de no-leídos por tenant.
- Panel admin del cliente: **campanita** con badge de no-leídos + página "Novedades" con la lista y reproductor embebido de YouTube (`iframe youtube-nocookie`, ya permitido en la CSP actual).
- Notificación por email opcional (Resend o nodemailer). Requiere SPF/DKIM; en v1 puede ser solo in-app.
- La plataforma publica el changelog desde el panel SaaS.

**Tests**: publicación de changelog → aparece como no-leído → al abrirlo se marca leído; video embebido renderiza.

---

## 7. Fase 4 — Panel SaaS de administración

Ruta protegida de superadmin (separada de los paneles de clientes):
- **Clientes**: listar, crear (wizard de alta → crea tenant DB + slug + usuario admin + welcome), suspender, reactivar, eliminar, exportar datos.
- **Usuarios por tenant**: alta/edición de cuentas admin del cliente (roles).
- **Suscripciones/Facturas**: estado de pago por cliente, historial, próxima fecha de vencimiento. Ver Anexo A.
- **Dashboard global**: total de clientes activos, MRR, estado de cada tenant, uso (tamaño DB, últimos accesos).

**Tests**: CRUD de tenant vía superadmin; un admin de un tenant NO puede acceder al panel de plataforma ni a otro tenant (suite de seguridad).

---

## 8. Fase 5 — Cobro con Mercado Pago + ciclo de vida

**Integración**: suscripción recurrente vía API de Mercado Pago (preferencia de suscripción). Comisión ~2.99%+IVA. Alternativas a documentar: MODO (1.49–1.89%), Ualá Bis (desde 1.4%).

**Ciclo de vida** (basado en cómo lo maneja Tiendanube):

| Etapa | Qué pasa |
|---|---|
| **Activo** | Tienda y admin funcionando. Días de crédito visibles en el panel del cliente |
| **Vencido + 10 días** | Admin activo + tienda activa. Avisos automáticos (in-app + WhatsApp/email) desde el día 1 del vencimiento |
| **Vencido + 20 días** | Admin **bloqueado**, tienda pública **sigue visible** (no pierde ventas de golpe). Avisos "pagá tu plan" |
| **Día 20+ sin pago** | Tienda **se cierra automáticamente** con aviso "fuera de servicio", sin generar deuda |
| **Reactivar** | El pago se acredita desde la fecha de vencimiento (crédito retroactivo). Todo queda como estaba |
| **Baja definitiva** | **Retención de datos 60–90 días** desde el cierre con opción de exportar desde el panel. Pasado eso, se elimina la tenant DB + uploads. Debe quedar escrito en los Términos y Condiciones |

**Webhooks de MP** (payment.created / subscription_updated) para actualizar estados automáticamente + cron diario que revisa vencimientos y envía avisos. En v1 los avisos pueden ser por WhatsApp + email.

**Facturación AFIP/ARCA**: v1 = manual (facturas desde contador con CAE; el pago entra por MP). A futuro integrable. Nota legal para Argentina: desde julio 2025 la **Factura de Crédito Electrónica (A2B)** es obligatoria en B2B entre monotributistas; y MP retiene IIBB — validarlo con contador y prever el margen.

---

## 9. Fase 6 — Dominios propios y temporales

- **Temporal**: `<slug>.[DOMINIO_PLATAFORMA]` (subdominio). Se crea solo en el wizard de alta.
- **Dominio propio** (sección en el panel del cliente):
  1. El cliente ingresa su dominio.
  2. El sistema valida propiedad (TXT o CNAME/A).
  3. Al verificarse, se registra el mapeo `Domain → tenant` y se emite el certificado TLS automáticamente.
- **Recomendación: usar Caddy como reverse proxy** para la plataforma (genera y renueva Let's Encrypt para cualquier dominio automáticamente; con nginx+certbot habría que hacerlo a mano por cliente). El VPS de producción actual puede seguir con nginx mientras la plataforma nueva arranca con Caddy.

**Tests**: verificación de dominio con TXT inválido falla; mapeo correcto sirve el catálogo del tenant correcto; TLS funcional en staging.

---

## 10. Fase 7 — Infraestructura y monitoreo

### VPS recomendado (Hostinger)

| Plan | Promo/mes | Renovación | Para qué |
|---|---|---|---|
| KVM 1 (1 vCPU / 4 GB / 50 GB) | ARS 12.099 | ARS 24.199 | Solo MVP con 2–3 tenants + monitoreo. Queda justo |
| **KVM 2 (recomendado, 2 vCPU / 8 GB / 100 GB NVMe)** | **ARS 17.299** | ARS 31.399 | 5–15 tenants + plataforma + monitoreo + backups. Cómodo |
| KVM 4 (4 vCPU / 16 GB / 200 GB) | ARS 24.199 | ARS 60.299 | Solo si saltás a >30 tenants |

Con 5–15 tenants, SQLite por archivo, 1 proceso PM2 y Caddy, el KVM 2 va sobrado (la arquitectura por-archivo es 6–12x más rápida para queries scoped porque cada DB es chica y queda en cache).

### Topología

```
VPS nuevo (Hostinger, KVM 2) — plataforma SaaS multi-tenant (5-15 clientes)
VPS de producción actual — el sitio original sigue estable mientras se construye el SaaS.
                           Cuando el SaaS esté estable: migrar el sitio original → tenant interno
                           (opcional, 1 solo servidor)
```

### Monitoreo

1. **Uptime Kuma** (self-hosted, gratis, en el propio VPS): check de cada tenant (`http(s)://slug.[DOMINIO_PLATAFORMA]`, login admin, y dominios propios). Alertas a WhatsApp, Telegram y email. Página pública de status opcional.
2. **Netdata** (gratis): métricas del servidor (CPU/RAM/disk) con alertas.
3. **PM2**: `pm2 monit` + `pm2-logrotate` + restart automático en crash.
4. **Health endpoint propio** (`/api/health`) que chequea conexión a la DB de cada tenant y responde JSON → lo consume Uptime Kuma.
5. **Panel SaaS integrado**: sección "Salud" que consulta la API de Uptime Kuma y muestra estado de todos los tenants en una grilla (verde/rojo). Asistencia proactiva antes de que el cliente avise.
6. **Backups**: copia de `data/tenants/` + `uploads/` + `platform.db` diario + off-site cifrado + **restore drill mensual**.

### Onboarding "tipo Tiendanube"

Con multi-tenant **no hay deploy por cliente**. Desplegar = push a main → CI build → rsync → restart → **todos los tenants se actualizan a la vez**. Dar de alta un cliente = click en el wizard del panel SaaS → se crea la tenant DB desde una plantilla, corre migraciones, crea el subdominio y el admin, manda el welcome. Sin SSH.

---

## Anexo A — Historial de pagos y deudas (superadmin)

### Modelos nuevos (DB de plataforma)

| Modelo | Campos clave | Función |
|---|---|---|
| `BillingAccount` | tenantId, balance (suma de deuda), nextDueDate, graceUntil, state | Estado financiero resumido por cliente |
| `Invoice` | tenantId, periodStart/End, amount, **discountedAmount**, status (`paid`/`pending`/`overdue`), dueDate, paidAt, mpPaymentId, mpStatus, concept, discountRuleId? | Cada período facturado |
| `PaymentEvent` | invoiceId, amount, method, paidAt, mpPaymentId, mpStatus, rawWebhook (JSON), createdAt | Trazabilidad cruda de cada cobro |
| `DiscountRule` | tenantId?, scope (`global`/`tenant`), type (`percent`/`fixed`/`freeMonths`), value, durationMonths, activeFrom/To, reason, createdBy | Descuentos configurables |
| `Adjustment` | invoiceId?, tenantId, amount (+/-), reason, createdBy, createdAt | Notas de crédito / ajustes manuales |

### Vista "Cliente" (superadmin)

Timeline único del cliente que muestre, en orden cronológico:
- Alta de cuenta y fecha de inicio.
- Cada **pago**: monto, fecha, método (MP/transferencia/manual), ID de MP, estado del webhook.
- Cada **período impago**: deuda acumulada por mes (envejecimiento: 0-10 / 11-20 / >20 días), con el estado del ciclo en ese momento (activo → gracia → suspendido → cerrado).
- **Descuentos/ajustes** aplicados y su motivo (para auditoría de retención).
- Saldo calculado en vivo: `balance = Σ facturas − Σ pagos + Σ ajustes` (deuda abierta).
- Notas manuales del equipo.

### Alertas

Dashboard superadmin: tarjeta "Clientes con deuda" ordenada por antigüedad; alertas automáticas a los 1/5/10/20 días de vencido (reusar el cron de avisos de la Fase 5). Cada acción de cobro/descuento queda en el historial (trazabilidad completa).

---

## Anexo B — Descuentos de retención

### Dos tipos de descuento

1. **Por plazo** (fomentar pago adelantado, reduce churn y trabajo administrativo):
   - 3 meses → 10%, 6 meses → 15%, 12 meses → 20% (configurables por regla).
   - Se ofrecen al cliente desde su panel de suscripción ("pagá 6 meses y ahorrá 15%").
2. **Promocionales / reactivación** (para retener a un cliente que quiere darse de baja, o reenganchar uno vencido):
   - Ej.: "2 meses al 50%", "primer mes gratis", "3 meses al precio de 1".
   - El superadmin los otorga a un cliente puntual desde el panel, con motivo obligatorio (queda en el historial).

### Implementación con Mercado Pago

- Las suscripciones de MP no cambian el precio por ciclo fácilmente. Dos caminos:
  - **v1 (recomendado):** MP es solo el riel de cobro. El descuento se aplica a la `Invoice` (se emite con `discountedAmount`), el superadmin ajusta el precio de la suscripción para el/los próximos meses vía API, o simplemente se cobra por link y se registra como pago manual. Simple y auditable.
  - **v2:** crear una preferencia nueva con precio descontado al entrar en período promocional y volver al precio normal al terminar.
- Todo descuento queda referenciado en la invoice (`discountRuleId`) y en el timeline → el "porqué" nunca se pierde.

### Señales para ofrecer retención

El sistema marca clientes en riesgo: 2+ pagos tardíos en 6 meses, o intento de baja → el superadmin ve el botón "ofrecer descuento de retención" con la regla ya armada.

---

## Anexo C — Modelo de negocio y rentabilidad

### Unidades económicas (marco, valores a ajustar)

**Costos fijos por mes** (referencial Argentina, 2026):
- VPS KVM 2 renovación: ~ARS 31.400 (o ~USD 15 con plan internacional).
- Dominios: ~USD 15-20/año cada uno (base + clientes con dominio propio, si les vendés el dominio con markup).
- Comisiones MP: 2.99% + IVA sobre lo que cobrás.
- Herramientas: email transaccional, monitoreo, contador. Bajo.
- **Publicidad: es el costo de crecimiento. Regla sana: 20-30% del MRR, o un monto fijo mensual que decidas y midas** (detalle abajo).

**Pricing propuesto** (validar contra competencia local: Tiendanube arranca ~USD 30-60/mes):
- **Setup fee** único: cubre alta, carga inicial de productos y configuración (ej. 1 mes de suscripción). Protege el CAC inicial.
- **Plan Básico** (1 usuario admin, catálogo, WhatsApp, branding): ARS 30-40k/mes.
- **Plan Pro** (múltiples usuarios, dominio propio incluido, analytics profundos, changelog prioritario): ARS 60-80k/mes.
- Pago adelantado con descuento (ver Anexo B): 3/6/12 meses.

**Métricas de salud (trackear desde el panel SaaS):**
- **MRR** = ARPU × clientes activos. **CAC** = (gasto ads + horas de venta) ÷ nuevos clientes. **Churn** mensual de clientes y de MRR.
- **LTV** ≈ (ARPU × margen bruto) ÷ churn. Regla de oro: **LTV ≥ 3 × CAC** y recuperar CAC en < 6 meses.
- **Break-even**: número de clientes que cubre costos fijos. Con ARPU 35k: 3-4 clientes cubren el VPS + herramientas; la publicidad y el tiempo propio se pagan con el 7º-8º cliente.

### Publicidad (necesaria y sostenible)

En Argentina el canal más efectivo para "crear tu catálogo/tienda online" es **búsqueda + redes locales**:
- **Google Ads (Search)**: captura intención ("crear catálogo online para mi negocio", "tienda online Mendoza"…). Comprás demanda ya caliente.
- **Meta Ads (IG/FB)**: alcance a dueños de pymes; **remarketing** con la infra ya integrada (Meta CAPI + Pixel). Retargeting de quien visitó la landing del SaaS.
- **TikTok**: público emprendedor más joven; barato de producir.
- **Canal orgánico/local**: partnerships con capacitadores de emprendedores, ferias/comercios locales, programa de referidos (cliente que trae cliente → 1 mes gratis), comunidad WhatsApp.
- **Tracking del gasto**: con GA4 + Meta CAPI + Clarity se mide CAC **por canal** (UTM en cada campaña) y se corta lo que no rinde. Regla: empezar con un presupuesto mensual fijo chico (ej. el equivalente a 2-3 suscripciones), medir 60 días, y escalar solo el canal que da CAC < LTV/3.

### Regla de oro operativa

Cada cliente nuevo debe pagar su CAC en ≤ 6 meses y quedarse ≥ 12 (descuentos por plazo + changelog + soporte + monitoreo proactivo son las herramientas de retención).

---

## Anexo D — Inspección de seguridad actual + mejoras

### Lo que ya está bien (verificado contra el repo)

- **Headers/CSP** sólidos: `frame-ancestors 'none'`, `script-src` con allowlist, HSTS, nosniff, X-Frame-Options, Permissions-Policy.
- **Sesiones**: cookies httpOnly + firmadas HMAC-SHA256, expiración 7 días, `sameSite=lax`, `secure`.
- **Passwords**: bcrypt (bcryptjs).
- **Login con rate limit** 5/min por IP.
- **API pública de analytics** con rate limit 60/min por IP + sanitización de inputs (strings, precios, metadata acotada).
- **Uploads**: 10MB máx, MIME allowlist, **re-encode con sharp** (valida contenido real), nombre UUID. Servido con bloqueo de path traversal (`/`, `\`, `..`, `%`, NUL).
- **SQLi**: Prisma (queries parametrizadas). **XSS**: escape de React + CSP + sanitización.
- **Errores sanitizados**, sin leak de stack internos.
- **Deploy con gates**: suite funcional + 69 tests de seguridad antes de tocar producción.
- **SSH endurecido** (solo clave, AllowUsers, UFW, fail2ban) y backups diarios + off-site.
- **Git limpio**: no hay archivos sensibles trackeados (verificado: solo `.env.production.example` como plantilla).

### Gaps y mejoras (orden de prioridad para el SaaS)

1. **MFA/2FA para superadmin** (y opcional para admins de tenant). Hoy no existe ningún 2FA. Con plataforma que maneja plata (billing), es obligatorio para el superadmin. TOTP con `otplib` o Passkeys.
2. **Lockout por cuenta + rate limit por tenant**: hoy el límite es solo por IP (5/min). Un atacante puede probar contra muchas cuentas desde muchas IPs. Agregar intentos fallidos por cuenta (ventana deslizante) + notificación al admin.
3. **Rate limit en memoria** (Map en `lib/rate-limit.ts`): correcto para 1 instancia PM2, pero **se resetea en cada restart** y `getClientIp` confía en `x-forwarded-for` (spoofeable si la app se expone directa). Endurecer: solo confiar en el proxy (Caddy/nginx) y normalizar IP. Si algún día se pasa a 2 procesos, mover a store compartido (Redis/SQLite).
4. **CSRF**: `sameSite=lax` mitiga la mayoría, pero las APIs admin de PUT/DELETE dependen de eso. Endurecer con chequeo de Origin/Referer en middleware para rutas admin + cookies scoped por dominio en multi-tenant (cada tenant en su subdominio, cookie del panel de plataforma en dominio separado → evita que una cookie de tenant sirva en otro).
5. **Audit log**: hoy no hay registro de quién cambió qué (productos, settings, usuarios, y en el futuro billing). Agregar modelo `AuditLog` en platform DB (actor, acción, entidad, tenantId, diff, timestamp). Clave para un producto que factura a clientes.
6. **Reset de contraseña seguro**: no existe. Con clientes del SaaS: flujo con token firmado + expiración (15-30 min) + invalidación tras uso + envío por email transaccional.
7. **Uploads por tenant**: hoy un único directorio. En multi-tenant, namespacing `uploads/<tenantId>/` obligatorio (para que un tenant no pueda referenciar imágenes de otro) + decidir acceso privado/público por tenant.
8. **Dependencias**: no hay dependabot/npm audit en CI. Agregar `npm audit` + dependabot (o renovate) para no acumular CVEs.
9. **WAF/CDN**: producción hoy sin CDN. Para la plataforma multi-tenant (varios dominios) recomendar **Cloudflare** delante: DDoS, WAF (rate limit a nivel edge), bot management y TLS gestionado. Es el mayor salto de robustez por cero infra.
10. **Backups cifrados**: los backups off-site contienen datos de clientes → cifrar (age/gpg) en el destino y **hacer un restore drill mensual** (recuperar una tenant DB desde backup y verificar).
11. **Logging de seguridad centralizado**: fallos de login, rate-limit hits, 4xx/5xx anómalos → volcarlos a un log estructurado (JSON) rotado, y alertar sobre patrones (N intentos fallidos).
12. **Manejo de secretos**: el `SESSION_SECRET` del `.env` local es un placeholder; producción usa el `.env` del VPS (ok). En la plataforma: generar secretos fuertes por entorno, rotación documentada, permisos 600 en el VPS, y **jamás** logs de tokens/pagos (webhooks de MP loguear solo IDs, nunca credenciales).

---

## Anexo E — Recomendaciones técnicas

1. **Migraciones multi-tenant seguras**: aplicar migraciones a TODAS las tenant DBs (loop) + probar siempre contra una DB plantilla antes del deploy masivo. Migración atómica: si falla una tenant, el resto sigue (aislamiento por archivo).
2. **Observabilidad**: logs estructurados (JSON) + `next/instrumentation` (OpenTelemetry opcional) + health endpoint `/api/health` por tenant. Integrar con Uptime Kuma y Netdata (Fase 7).
3. **Email transaccional**: SPF + DKIM + DMARC configurados para el dominio de la plataforma (welcome, changelog, recordatorios de pago). Sin esto, los mails caen en spam.
4. **Secrets por entorno**: `.env.local` dev, `.env` VPS prod; nunca commitear; rotar `SESSION_SECRET` documentadamente.
5. **CI/CD**: mantener los gates (ya existen), agregar `npm audit` y dependabot, fijar Node 22 en runtime y CI (consistencia).
6. **Staging real**: un tenant de prueba en el propio VPS (o una réplica) para validar cambios antes de tocar clientes.
7. **Performance multi-tenant**: queries con clave de cache por `tenantId` (nunca cache global de un tenant para otro), `next/image` ya optimiza, CDN de Cloudflare para uploads/estáticos cuando crezca el tráfico.
8. **Exportación de datos del cliente** (ley local / portabilidad): export por tenant (SQLite + uploads → ZIP) desde el panel, tanto para bajas como para portabilidad. Con DB por archivo es trivial (copiar archivo).
9. **Documentación operativa**: runbook de incidentes (quién, qué, cómo), checklist de alta de cliente, y registro de decisiones (ADR). Con equipo chico, esto evita que el conocimiento quede en una sola cabeza.
10. **Backup completo + restore drill**: `data/tenants/` + `uploads/` + `platform.db` diario, off-site cifrado, y **prueba mensual de restauración** (la única forma de saber que el backup sirve).

---

## 16. Otras recomendaciones para Argentina

- **Pagos de tus clientes a futuro** (cuando se habilite pago online): Mercado Pago checkout (cuotas = conversión, ~50% del ecommerce) + MODO/Ualá Bis como respaldo (comisiones 1.4–1.9% vs 2.99% de MP). En la arquitectura per-tenant cada cliente conecta SU cuenta → el dinero nunca pasa por la plataforma (evita ser intermediario de pagos, que suma compliance).
- **Ley de Protección de Datos** (nueva ley 2023/2024): al manejar datos de clientes de terceros hay obligaciones (política de privacidad, notificación de incidentes). Definir T&C con el modelo de retención/eliminación de datos desde el día 1.
- **Asistencia remota**: el monitoreo cubre "sabemos que se cayó". Para soporte proactivo, en v2: agendamiento por WhatsApp + el changelog con video (Fase 3) como canal educativo.
- **Pricing**: 1 plan simple + costo de setup (alta + dominio). Base para packs Básico/Pro cuando maduren changelog y analytics.

---

## 17. Orden de ejecución sugerido

1. **Fase 0** (multi-tenant + auth + routing + migración del sitio original → tenant interno) — ~40% del esfuerzo; todo lo demás depende de esto.
2. **Fase 1** (productos genéricos) + **Fase 2** (branding, ubicación, redes) — habilitan vender a cualquier rubro.
3. **Fase 4** (panel SaaS) — uso interno para los primeros clientes.
4. **Fase 5** (billing MP + ciclo de vida + historial de pagos) — se cobra.
5. **Fase 7** (infra + monitoreo + onboarding) — en paralelo desde el inicio; onboarding automatizado al cerrar Fase 0.
6. **Fase 3** (changelog/notificaciones) y **Fase 6** (dominios) — entrelazables; dominios antes de vender a clientes serios.

---

## 18. Decisiones abiertas

1. **Nombre y dominio de la plataforma** (`[NOMBRE_PLATAFORMA]`, `[DOMINIO_PLATAFORMA]`).
2. **Upgrade del VPS**: KVM 2 (recomendado) vs. KVM 1 para arrancar el MVP.
3. **¿Migrar el sitio original a la plataforma como tenant interno** cuando el SaaS esté estable, o dejarlo en su VPS actual indefinidamente?
4. **Precio/plan** del SaaS (Básico/Pro y setup fee) para el modelo del Anexo C.
5. **Presupuesto mensual de publicidad** inicial y canal primario (Google vs Meta) para medir CAC desde el día 1.
6. **2FA obligatorio** para superadmin (recomendado: sí, en la Fase 4).
