# Wolfie Room — Catálogo Web de Juegos de Mesa

> El lugar para descubrir los mejores juegos de mesa en Mendoza.

[Sitio en vivo](https://wolfiesroom.com)

---

## Índice

1. [Descripción del proyecto](#descripción-del-proyecto)
2. [Stack tecnológico](#stack-tecnológico)
3. [Inicio rápido](#inicio-rápido)
4. [Identidad visual](#identidad-visual)
5. [Estructura del proyecto](#estructura-del-proyecto)
6. [Base de datos](#base-de-datos)
7. [Panel de administración](#panel-de-administración)
8. [Sitio público](#sitio-público)
9. [API Routes](#api-routes)
10. [SEO y rendimiento](#seo-y-rendimiento)
11. [Guía de mantenimiento](#guía-de-mantenimiento)
12. [Despliegue](#despliegue)

---

## Descripción del proyecto

**Wolfie Room** es un negocio ubicado en **Patio Lorenza, Mendoza**, dedicado a tres líneas:

| Línea | Descripción |
|-------|-------------|
| **Jugar** | Espacio físico donde los visitantes pueden reservar una mesa y disfrutar de una ludoteca con juegos de mesa. |
| **Comprar** | Tienda de juegos de mesa disponibles para compra. |
| **Reservar** | Sistema de reservas por WhatsApp para coordinar mesas y disponibilidad. |

La página web funciona como **catálogo dinámico con panel de administración**. Los datos se almacenan en una base de datos SQLite y se gestionan desde el admin.

---

## Stack tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Next.js** | 16.x (App Router) | Framework React con SSG/SSR |
| **React** | 19.x | UI library |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 4.x | Utility-first CSS |
| **Framer Motion** | 12.x | Animaciones y transiciones |
| **Prisma** | 7.x | ORM + migraciones |
| **SQLite** (better-sqlite3) | 13.x | Base de datos |
| **bcryptjs** | 3.x | Hashing de contraseñas admin |
| **Lucide React** | 1.x | Iconografía |

---

## Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar base de datos

```bash
# Ejecutar migraciones
npx prisma migrate dev

# Poblar con datos de ejemplo (20 juegos, 6 categorías, usuario admin)
npx prisma db seed
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
# → http://localhost:3000
```

### Credenciales del admin

| Campo | Valor |
|-------|-------|
| URL | http://localhost:3000/admin/login |
| Email | `admin@wolfieroom.com` |
| Contraseña | `admin123` |

### Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar en producción |
| `npm run lint` | Verificar código con ESLint |
| `npm run db:migrate` | Ejecutar migraciones Prisma |
| `npm run db:seed` | Poblar base de datos |
| `npm run db:reset` | Resetear base de datos |
| `npm run db:studio` | Abrir Prisma Studio (UI de la DB) |

---

## Identidad visual

### Paleta de colores

| Color | HEX | Uso |
|-------|-----|-----|
| Primario | `#31D3A9` | Acentos, botones, links |
| Secundario | `#FF7BAC` | Degradados, badges |
| Fondo | `#FAFAFA` | Background general |
| Cards | `#FFFFFF` | Superficies elevadas |
| Texto principal | `#1F2937` | Headings, contenido |
| Texto secundario | `#6B7280` | Descripciones, labels |
| Bordes | `#E5E7EB` | Separadores, cards |

### Gradiente principal

```css
linear-gradient(135deg, #31D3A9 0%, #FF7BAC 100%)
```

### Tipografía

- **Fuente:** Geist Sans (vía `next/font/google`)
- **Monospace:** Geist Mono

---

## Estructura del proyecto

```
wolfie-room/
├── app/
│   ├── layout.tsx                    # Layout raíz + metadata SEO
│   ├── globals.css                   # Estilos globales + tema Tailwind v4
│   ├── robots.ts                     # Generado via Metadata API
│   ├── sitemap.ts                    # Generado via Metadata API
│   │
│   ├── (public)/                     # Ruta pública (sin auth)
│   │   ├── layout.tsx                # Layout público (passthrough)
│   │   └── page.tsx                  # Página principal
│   │
│   ├── (admin)/                      # Rutas protegidas por auth
│   │   ├── layout.tsx                # Layout admin con sidebar
│   │   ├── login/page.tsx            # Login de administración
│   │   ├── dashboard/page.tsx        # Dashboard con estadísticas
│   │   ├── games/
│   │   │   ├── page.tsx              # Lista de juegos (CRUD)
│   │   │   ├── new/page.tsx          # Crear juego
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Redirect a edit
│   │   │       └── edit/page.tsx     # Editar juego
│   │   ├── categories/page.tsx       # Gestionar categorías
│   │   └── settings/page.tsx         # Configuración del sitio
│   │
│   └── api/admin/                    # API REST (protegidas)
│       ├── juegos/
│       │   ├── route.ts              # GET (listar) / POST (crear)
│       │   └── [id]/
│       │       ├── route.ts          # GET / PUT / DELETE
│       │       └── duplicate/route.ts # POST (duplicar)
│       ├── categorias/
│       │   ├── route.ts              # GET / POST
│       │   └── [id]/route.ts         # PUT / DELETE
│       ├── settings/route.ts         # GET / PUT
│       └── upload/route.ts           # POST (subir imagen)
│
├── components/
│   ├── Navbar/Navbar.tsx             # Navegación fija
│   ├── Hero/Hero.tsx                 # Sección hero
│   ├── Catalog/
│   │   ├── Catalog.tsx               # Grid + buscador + filtros
│   │   └── GameCard.tsx              # Tarjeta de juego
│   ├── Experience/Experience.tsx     # "Viví la experiencia"
│   ├── HowItWorks/HowItWorks.tsx     # Flujo de 4 pasos
│   ├── About/About.tsx               # "¿Qué podés hacer?"
│   ├── CTA/CTA.tsx                   # Call-to-action final
│   ├── Footer/Footer.tsx             # Footer con contacto
│   ├── WhatsAppButton/WhatsAppButton.tsx  # Botón flotante
│   ├── ScrollToTop/ScrollToTop.tsx   # Botón volver arriba
│   └── admin/
│       ├── AdminSidebar.tsx           # Sidebar colapsable
│       └── GameForm.tsx               # Formulario crear/editar juego
│
├── actions/                           # Server Actions
│   ├── auth.ts                        # loginAction, logoutAction
│   ├── games.ts                       # CRUD juegos
│   ├── categories.ts                  # CRUD categorías
│   ├── settings.ts                    # Lectura/escritura settings
│   └── upload.ts                      # Subida de imágenes
│
├── lib/
│   ├── auth.ts                        # Sesiones, cookies, HMAC
│   ├── prisma.ts                      # Singleton de PrismaClient
│   └── whatsapp.ts                    # Helpers WhatsApp URL
│
├── prisma/
│   ├── schema.prisma                  # Schema de la base de datos
│   ├── seed.ts                        # Datos de ejemplo
│   ├── dev.db                         # Base de datos SQLite
│   └── migrations/                    # Migraciones de Prisma
│
├── prisma.config.ts                   # Configuración Prisma (seed)
├── next.config.ts                     # Configuración Next.js
├── tsconfig.json                      # Configuración TypeScript
├── postcss.config.mjs                 # PostCSS + Tailwind
├── eslint.config.mjs                  # ESLint config
└── package.json                       # Dependencias
```

---

## Base de datos

### Modelos (Prisma Schema)

#### User

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | Identificador único |
| `nombre` | String | Nombre del usuario |
| `email` | String (unique) | Email para login |
| `passwordHash` | String | Contraseña hasheada con bcrypt |
| `createdAt` | DateTime | Fecha de creación |
| `updatedAt` | DateTime | Última actualización |

#### Category

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | Identificador único |
| `nombre` | String (unique) | Nombre de la categoría |
| `icono` | String | Emoji representativo (default: 🎲) |
| `color` | String | Color HEX (default: #31D3A9) |
| `orden` | Int | Orden de aparición |
| `games` | Relation | Juegos asociados |

#### Game

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | Identificador único |
| `nombre` | String | Nombre del juego |
| `slug` | String (unique) | URL amigable |
| `descripcion` | String | Descripción corta |
| `categoriaId` | String (FK) | Referencia a Category |
| `jugadoresMin` | Int | Mínimo de jugadores |
| `jugadoresMax` | Int | Máximo de jugadores |
| `duracion` | String | Duración aprox. |
| `edad` | String | Edad recomendada |
| `dificultad` | String | Fácil / Media / Difícil |
| `precioFinalVenta` | String | Precio final de venta (incluye impuestos nacionales) |
| `precioReservaMesa` | String | Precio de reserva |
| `imagen` | String | Ruta de la imagen |
| `estado` | String | Disponible / Consultar |
| `destacado` | Boolean | Juego destacado |
| `nuevo` | Boolean | Marcado como novedad |
| `disponibleVenta` | Boolean | Se puede comprar |
| `disponibleMesa` | Boolean | Se puede jugar en mesa |
| `orden` | Int | Orden de aparición |

#### Setting

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | Identificador único |
| `key` | String (unique) | Clave de configuración |
| `value` | String | Valor de configuración |

#### AnalyticsEvent

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | String (cuid) | Identificador único |
| `eventType` | String | `view_item`, `add_to_cart`, `search`, `whatsapp_click`, `page_view`, `begin_checkout`, etc. |
| `gameId` | String? | Referencia al juego |
| `gameName` | String? | Nombre del juego |
| `categoryId` | String? | Referencia a la categoría |
| `categoryName` | String? | Nombre de la categoría |
| `searchTerm` | String? | Término de búsqueda |
| `source` | String? | Origen del evento (`hero`, `navbar`, `cart`, ...) |
| `price` | Float? | Precio |
| `metadata` | String? | JSON string con datos extra (clientId, sessionId, device, browser) |
| `createdAt` | DateTime | Fecha de creación |

#### DailyMetrics

Snapshot diario de métricas agregadas: `uniqueVisitors`, `sessions`, `pageViews`, `productViews`, `cartAdditions`, `whatsappClicks`, `searches`, `checkouts`, `topDevice`, `topBrowser` (fecha única).

#### ProductMetrics

Contadores acumulados por juego (`gameId` único): `totalViews`, `totalCartAdds`, `totalWhatsapp`, `totalCheckouts`, `lastViewedAt`.

#### CategoryMetrics

Contadores acumulados por categoría (`categoryId` único): `totalViews`, `totalCartAdds`, `totalWhatsapp`.

#### GA4DailyMetrics

Datos agregados sincronizados desde Google Analytics (para la fase de dashboard): usuarios, sesiones, page views, bounce rate, dispositivos, top países/ciudades/browsers/OS/fuentes (fecha única).

### Settings conocidas

| Key | Descripción |
|-----|-------------|
| `nombre` | Nombre del negocio |
| `descripcion` | Descripción del sitio |
| `telefono` | Teléfono de contacto |
| `email` | Email de contacto |
| `direccion` | Dirección física |
| `horario` | Horarios de atención |
| `instagram` | URL de Instagram |
| `facebook` | URL de Facebook |
| `whatsapp` | Número de WhatsApp |
| `logoUrl` | URL del logo |

### Seed de datos de ejemplo

El seed (`npx prisma db seed`) crea:

- **1 usuario admin:** `admin@wolfieroom.com` / `admin123`
- **6 categorías:** Estrategia, Familiar, Party, Cooperativo, Abstracto, Dexterity
- **20 juegos:** Catan, Ticket to Ride, Carcassonne, Dixit, Codenames, Pandemic, Azul, Wingspan, 7 Wonders, Splendor, King of Tokyo, Mysterium, Jenga, Uno, Monopoly, Risk, Uno Flip, Loteria, Bananagrams, Exploding Kittens
- **Settings:** Datos por defecto del negocio

---

## Panel de administración

### Acceso

```
URL:      /admin/login
Email:    admin@wolfieroom.com
Password: admin123
```

### Funcionalidades

| Página | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/admin/dashboard` | Estadísticas: total juegos, categorías, destacados, publicados, última actualización |
| Juegos | `/admin/games` | Lista con búsqueda, filtro por categoría, orden. Acciones: editar, duplicar, eliminar |
| Nuevo juego | `/admin/games/new` | Formulario completo: nombre, slug (auto), descripción, categoría, jugadores, duración, edad, dificultad, estado, precios, imagen, opciones |
| Editar juego | `/admin/games/[id]/edit` | Mismo formulario pre-llenado |
| Categorías | `/admin/categories` | CRUD con modal: nombre, icono (emoji), color, orden |
| Configuración | `/admin/settings` | Datos del negocio + subida de logo |

### Sidebar

- **Desktop:** Sidebar colapsable con navegación
- **Mobile:** Overlay con menú deslizante
- **Links:** Dashboard, Juegos, Categorías, Configuración, Cerrar sesión

### Autenticación

- Sesiones firmadas con HMAC-SHA256
- Cookie `httpOnly` con `sameSite: lax`
- Expiración: 7 días
- Todas las API routes verifican la sesión

---

## Sitio público

### Secciones (Home `/`)

| Sección | Componente | Descripción |
|---------|-----------|-------------|
| Navbar | `Navbar` | Navegación fija, logo, links, botón WhatsApp. Menú hamburguesa en mobile |
| Hero | `Hero` | Full viewport, título con gradiente, 2 CTAs, ubicación |
| Catálogo | `Catalog` | Grid de juegos con búsqueda y filtros por categoría |
| Experiencia | `Experience` | 3 cards: Jugar, Comprar, Reservar |
| Cómo funciona | `HowItWorks` | Timeline de 4 pasos |
| Qué podés hacer | `About` | 3 cards con acciones |
| CTA | `CTA` | Call-to-action con gradiente + WhatsApp |
| Footer | `Footer` | Contacto, ubicación, horarios, copyright |
| WhatsApp flotante | `WhatsAppButton` | Botón fijo bottom-right con pulse ring |
| Scroll to top | `ScrollToTop` | Botón fijo bottom-left, aparece al scrollear |

### GameCard

Cada tarjeta muestra:
- Imagen (o placeholder con emoji de categoría)
- Badge de estado (Disponible / Consultar)
- Badge de categoría
- Nombre y descripción
- Tags: Para jugar / Disponible para compra / Recomendado / Novedad
- Info: Jugadores, duración, edad
- Botón "Consultar por WhatsApp" (mensaje contextualizado)

### Datos del sitio público

El sitio público carga los juegos y settings directamente desde Prisma (server-side) en `app/(public)/page.tsx`. Los números de WhatsApp, Instagram y demás se leen de la tabla `Setting`.

---

## API Routes

Todas las rutas API están bajo `/api/admin/` y requieren autenticación.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/admin/juegos` | Listar todos los juegos |
| `POST` | `/api/admin/juegos` | Crear un juego |
| `GET` | `/api/admin/juegos/[id]` | Obtener un juego |
| `PUT` | `/api/admin/juegos/[id]` | Actualizar un juego |
| `DELETE` | `/api/admin/juegos/[id]` | Eliminar un juego |
| `POST` | `/api/admin/juegos/[id]/duplicate` | Duplicar un juego |
| `GET` | `/api/admin/categorias` | Listar categorías con conteo |
| `POST` | `/api/admin/categorias` | Crear una categoría |
| `PUT` | `/api/admin/categorias/[id]` | Actualizar una categoría |
| `DELETE` | `/api/admin/categorias/[id]` | Eliminar categoría (solo si tiene 0 juegos) |
| `GET` | `/api/admin/settings` | Obtener todas las settings |
| `PUT` | `/api/admin/settings` | Actualizar settings (upsert) |
| `POST` | `/api/admin/upload` | Subir imagen a `/public/uploads/` |

### API pública de analytics

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/analytics/event` | Registra un evento de analytics (sin auth, rate limit 60/min/IP). Cuerpo: `{ eventType, gameId?, gameName?, categoryId?, categoryName?, searchTerm?, source?, price?, metadata? }` |

**Tracking propio**: `lib/analytics/events.ts` expone funciones tipadas (`trackViewItem`, `trackAddToCart`, `trackSearch`, `trackWhatsApp`, `trackPageView`, etc.) que envían con `sendBeacon()` al endpoint. **GA4**: `lib/analytics/ga4.ts` empuja eventos a `gtag()`. Detalle en `ANALYTICS-CHANGELOG.md`.

---

## SEO y rendimiento

### Metadata configurada

- **Título:** "Wolfie Room - Juegos de Mesa en Mendoza"
- **Descripción:** Optimizada para búsquedas locales
- **Keywords:** juegos de mesa, board games, Wolfie Room, Mendoza, Patio Lorenza, ludoteca
- **Open Graph:** Configurado con locale `es_AR`
- **Twitter Card:** `summary_large_image`
- **Robots:** Indexa todo
- **Theme color:** `#31D3A9`

### Archivos SEO generados

| Archivo | Generación |
|---------|-----------|
| `robots.txt` | `app/robots.ts` (Metadata API) |
| `sitemap.xml` | `app/sitemap.ts` (Metadata API) |

### Optimizaciones

- **Static Generation** para la página principal
- **Server Components** donde no hay interactividad
- **next/image** con formatos AVIF/WebP
- **Geist font** vía `next/font/google` (auto self-hosted)
- **Tailwind v4** con tree-shaking automático
- **Scroll pasivo** en event listeners

---

## Guía de mantenimiento

### Agregar un juego desde el admin

1. Ir a `/admin/games/new`
2. Completar nombre (el slug se genera automáticamente)
3. Seleccionar categoría
4. Subir imagen
5. Configurar opciones (destacado, nuevo, venta, mesa)
6. Guardar

### Agregar un juego desde la seed

Editar `prisma/seed.ts` y agregar al array `games`:

```typescript
{
  nombre: "Nuevo Juego",
  slug: "nuevo-juego",
  descripcion: "Descripción del juego.",
  categoriaId: party.id,
  jugadoresMin: 2,
  jugadoresMax: 6,
  duracion: "30 min",
  edad: "8+",
  dificultad: "Fácil",
  precioFinalVenta: "$15.000",
  imagen: "/images/games/nuevo-juego.webp",
  estado: "Disponible",
  destacado: false,
  nuevo: true,
  disponibleVenta: true,
  disponibleMesa: true,
  orden: 21,
}
```

Luego ejecutar: `npx prisma db seed`

### Cambiar datos del negocio

Ir a `/admin/settings` en el panel de administración. Se pueden cambiar:
- Nombre, descripción, teléfono, email
- Dirección, horarios
- Redes sociales (Instagram, Facebook, WhatsApp)
- Logo

### Resetear la base de datos

```bash
npx prisma db reset
npx prisma db seed
```

---

## Despliegue

### Build de producción

```bash
npm run build
npm start
```

### Documentación relacionada

- `DEPLOY.md` — Deploy y operaciones en el VPS DonWeb (releases, migraciones, backups).
- `SECURITY-CHANGELOG.md` — Fase 0: hardening de seguridad para producción.
- `ANALYTICS-CHANGELOG.md` — Fase 2: infraestructura de analytics (modelos, endpoint, tracking).

### Despliegue en Vercel

1. Subir repositorio a GitHub
2. Conectar en [vercel.com/new](https://vercel.com/new)
3. Configurar build command: `npx prisma generate && next build`
4. **Nota:** En producción necesitarás una base de datos externa (PostgreSQL recomendado) ya que SQLite no funciona en serverless. Cambiar el provider en `schema.prisma` y la configuración en `lib/prisma.ts`.

---

## Licencia

© 2026 Wolfie Room. Todos los derechos reservados.
