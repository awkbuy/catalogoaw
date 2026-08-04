# Wolfie Room - Catálogo Online

Catálogo online de juegos de mesa para **Wolfie Room**, un local de juegos en Patio Lorenza, Mendoza, Argentina.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Runtime:** React 19, TypeScript 5
- **Estilos:** Tailwind CSS 4
- **Base de datos:** SQLite via Prisma 7 + BetterSQLite3
- **Animaciones:** Framer Motion 12
- **Iconos:** Lucide React
- **Auth:** Cookie-based HMAC sessions (bcryptjs)

## Comandos

```bash
npm run dev          # Desarrollo (Turbopack)
npm run build        # Build de producción
npm run start        # Iniciar producción
npm run lint         # ESLint

# Base de datos
npm run db:migrate   # Prisma migrate
npm run db:seed      # Seed con datos de ejemplo
npm run db:reset     # Reset completo de DB
npm run db:studio    # Prisma Studio (UI)
```

## Credenciales Admin

- **URL:** `/login`
- **Email:** `admin@wolfieroom.com`
- **Contraseña:** `admin123`

> Las credenciales se generan en `prisma/seed.ts`. Ejecutar `npm run db:seed` para recrear.

## Estructura del Proyecto

```
app/
  (public)/           # Rutas públicas (landing)
    page.tsx          # Página principal
    layout.tsx        # Layout público (passthrough)
  (admin)/            # Rutas admin (requieren auth)
    layout.tsx        # Layout admin con sidebar + requireAuth()
    dashboard/page.tsx
    games/
      page.tsx        # Listar juegos
      new/page.tsx    # Crear juego
      [id]/
        page.tsx      # Redirect a /games/:id/edit
        edit/page.tsx # Editar juego
    categories/page.tsx
    settings/page.tsx
  (auth)/             # Rutas de autenticación (sin auth check)
    layout.tsx        # Layout auth (sin sidebar)
    login/page.tsx    # Formulario de login
  api/admin/          # API routes CRUD
    juegos/route.ts
    juegos/[id]/route.ts
    juegos/[id]/duplicate/route.ts
    categorias/route.ts
    categorias/[id]/route.ts
    settings/route.ts
    upload/route.ts
  layout.tsx          # Root layout (metadata, fonts)
  globals.css         # Theme Tailwind + custom animations
  sitemap.ts          # Sitemap XML dinámico
  robots.ts           # Robots.txt

components/
  Navbar/             # Nav sticky con links y CTA WhatsApp
  Hero/               # Hero full-screen con animaciones
  Catalog/            # Grid de juegos con filtros por categoría
    Catalog.tsx       # Componente catálogo
    GameCard.tsx      # Card individual de juego
  Experience/         # Sección "experiencia"
  HowItWorks/         # Sección "cómo funciona"
  About/              # Sección "sobre nosotros"
  CTA/                # Call to action
  Footer/             # Footer con info del negocio
  WhatsAppButton/     # Botón flotante de WhatsApp
  ScrollToTop/        # Botón scroll to top
  admin/
    AdminSidebar/     # Sidebar del admin con navegación
    GameForm.tsx      # Formulario crear/editar juego

actions/              # Server actions
  auth.ts             # login/logout
  games.ts            # CRUD juegos (create/update/delete/duplicate)
  categories.ts       # CRUD categorías
  settings.ts         # Settings CRUD
  upload.ts           # Upload de imágenes

lib/
  prisma.ts           # PrismaClient singleton (SQLite)
  auth.ts             # Sessions HMAC + cookie management
  whatsapp.ts         # Helpers WhatsApp

prisma/
  schema.prisma       # Schema de la DB
  seed.ts             # Seed con 20 juegos y 6 categorías
```

## Base de datos (SQLite)

### Modelos

**User** — Usuarios admin
- `id`, `nombre`, `email` (unique), `passwordHash`, `createdAt`, `updatedAt`

**Category** — Categorías de juegos
- `id`, `nombre` (unique), `icono` (emoji), `color` (hex), `orden`
- Relación: `games[]`

**Game** — Juegos de mesa
- `id`, `nombre`, `slug` (unique), `descripcion`
- `categoriaId` → Category
- `jugadoresMin`, `jugadoresMax`, `duracion`, `edad`, `dificultad`
- `precioFinalVenta`, `precioReservaMesa`
- `imagen`, `estado` (Disponible | Consultar)
- `destacado`, `nuevo`, `disponibleVenta`, `disponibleMesa`
- `orden`, `createdAt`, `updatedAt`
- Índices: `slug`, `categoriaId`, `orden`

**Setting** — Configuración key-value
- `id`, `key` (unique), `value`, `createdAt`, `updatedAt`
- Keys seed: `nombreNegocio`, `telefono`, `instagram`, `facebook`, `direccion`, `ciudad`, `horarios`, `descripcionHero`, `tituloHero`, `textoCTA`, `urlMaps`, `logo`, `favicon`, `iva`, `otrosImpuestosNacionales`, `activoCalculoAutomatico`, `mostrarPrecioSinImpuestos`

### Datos seed (20 juegos, 6 categorías)

| Categoría | Icono | Color | Juegos |
|-----------|-------|-------|--------|
| Estrategia | 🧠 | #31D3A9 | Catan, Carcassonne, Wingspan, 7 Wonders, Splendor, Risk |
| Familiar | 👨‍👩‍👧‍👦 | #FF7BAC | Ticket to Ride, King of Tokyo, Monopoly, Loteria |
| Party | 🎉 | #FBBF24 | Dixit, Codenames, Uno, Uno Flip, Exploding Kittens |
| Cooperativo | 🤝 | #60A5FA | Pandemic, Mysterium |
| Abstracto | ♟️ | #A78BFA | Azul, Bananagrams |
| Dexterity | 🎯 | #F97316 | Jenga |

## Autenticación

- **Sesiones:** Cookies HTTP-only firmadas con HMAC-SHA256
- **Token:** `{userId}.{signature}`
- **Cookie:** `session_token`, max 7 días, sameSite lax
- **Secret:** hardcoded en desarrollo (`wolfie-room-dev-secret-key-2024`)
- `requireAuth()` en `lib/auth.ts` — redirige a `/login` si no hay sesión
- El layout `(admin)/layout.tsx` llama `requireAuth()` para todas las rutas admin

## Rutas importantes

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page pública |
| `/login` | Login admin (fuera del layout auth) |
| `/dashboard` | Dashboard admin (requiere auth) |
| `/games` | CRUD juegos |
| `/games/new` | Crear juego |
| `/games/:id/edit` | Editar juego |
| `/categories` | CRUD categorías |
| `/settings` | Configuración del sitio |
| `/api/admin/juegos` | API CRUD juegos |
| `/api/admin/categorias` | API CRUD categorías |
| `/api/admin/settings` | API settings |
| `/api/admin/upload` | Upload imágenes |

## SEO

- Metadata dinámica con template `%s | Wolfie Room`
- OpenGraph y Twitter cards
- Sitemap XML dinámico (`app/sitemap.ts`)
- Robots.txt (`app/robots.ts`)
- Canonical URL: `https://wolfiesroom.com`
- Idioma: `es_AR`

## Variables de entorno

```env
DATABASE_URL="file:./dev.db"
```

## Notas de desarrollo

- Las rutas admin usan route groups `(admin)` y `(auth)` — estos no afectan la URL
- El login está en `(auth)` para no ser envuelto por el layout admin que requiere auth
- Las imágenes se suben vía `/api/admin/upload` a `/public/uploads/`
- La DB SQLite está en `dev.db` (gitignored)
- El Prisma adapter usa `PrismaBetterSqlite3` con path absoluto a `dev.db`
