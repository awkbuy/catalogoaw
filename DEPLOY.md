# Deploy y operaciones — Wolfie Room en DonWeb (VPS Cloud)

> Documento vivo. Describe cómo se construye, despliega y opera la aplicación en producción, con el nuevo sistema de deploys versionados, rollback automático, migraciones manuales y backups off-site.

---

## 1. Arquitectura

```
GitHub (repo) ──push a main / PR──▶ GitHub Actions (ubuntu-latest)
                                      ├─ ci.yml       : build + validación (PR y push)
                                      └─ deploy.yml   : build + deploy a DonWeb (solo main)
DonWeb VPS Cloud (1 vCPU / 1 GB RAM / 10 GB SSD):
  /var/www/wolfie-room/
  ├─ .env                      ← entorno de producción (NUNCA se toca en deploy)
  ├─ data/dev.db               ← SQLite (fuera de los releases, inmutable en deploy)
  ├─ uploads/                  ← directorio ESTABLE de imágenes (persiste entre versiones)
  ├─ releases/<sha>/           ← un bundle standalone por deploy (se conservan 3)
  ├─ app -> releases/<sha>     ← symlink al release ACTIVO (swap atómico)
  ├─ backups/                  ← backups diarios del server (retención 7 días)
  ├─ tools/                    ← CLI Prisma aislado (solo migraciones)
  ├─ prisma/                   ← schema + migraciones (sincronizado en deploy)
  ├─ deploy/                   ← scripts/config del server (sincronizado en deploy)
  └─ logs/
```

**Decisiones clave**

- **No se compila en el VPS** (1 GB RAM). El build se hace en GitHub Actions (Linux) y se sube el bundle `standalone`. El VPS solo ejecuta `node server.js`.
- **El build DEBE ser Linux.** `sharp` y `better-sqlite3` cargan binarios nativos por plataforma. Un build Windows subido a Linux se rompe.
- **Deploys versionados**: cada push a `main` genera `releases/<short-sha>/`. El symlink `app` se cambia de forma **atómica** (`mv -Tf`), de modo que si el smoke test falla se vuelve al release anterior al instante (rollback automático).
- **`uploads/` estable**: el código escribe en `process.cwd()/public/uploads` (`actions/upload.ts`); en cada release `public/uploads` es un symlink → `/var/www/wolfie-room/uploads`. Las imágenes NO se pierden al actualizar.
- **1 sola instancia PM2** (`exec_mode: fork`). SQLite no admite múltiples procesos escribiendo (locks).
- **Ruta absoluta** en `DATABASE_URL` (`file:/var/www/wolfie-room/data/dev.db`).
- **Migraciones manuales**: el deploy NO migra. Se aplican a demanda con el workflow `migrate.yml` (con backup previo).

**Por qué NO PostgreSQL:** el filesystem del VPS es persistente y la app corre como un único proceso. SQLite es 100 % viable, con backups triviales (un solo archivo).

---

## 2. Repositorio

- `.github/workflows/ci.yml` — **build checks** en PR y push a `main` (`npm ci` → `prisma generate` → `prisma migrate deploy` contra `ci.db` → `next build` → `assemble.sh` → **smoke test del standalone**).
- `.github/workflows/deploy.yml` — **build + deploy** solo en push a `main` (o dispatch manual). Incluye backup previo, release versionado, smoke test y rollback automático.
- `.github/workflows/migrate.yml` — **aplicar migraciones** (disparo manual).
- `deploy/`:
  - `install-server.sh` — provisiona el VPS (una sola vez).
  - `harden-ssh.sh` — endurece SSH (solo clave, sin root, `AllowUsers wolfie`).
  - `assemble.sh` — ensambla el standalone: descarga/copia los `prebuilds/` de `better-sqlite3` (el top-level no los trae en CI) y falla si falta el binario nativo.
  - `remote-deploy.sh` — se ejecuta EN el VPS: backup, swap de symlink, restart, smoke test con reintentos, rollback, limpieza.
  - `ecosystem.config.js` — config de PM2.
  - `nginx-wolfie-room.conf` — proxy reverso.
  - `.env.production.example` — plantilla del entorno.
  - `backup-local.sh` — descarga semanal de backups a la PC local (off-site).
- `prisma/migrations/` es **una sola migración baseline**; `prisma migrate deploy` en un entorno nuevo crea la BD correcta.
- `.gitignore` excluye: `.env*`, `*.db`, `data/`, `public/uploads/`, `.next/`, `node_modules/`, logs, `*Clave root*.txt`, `token git.txt`, `backups-local/`, `deploy/backup-local.env`.

> **Datos que NO viven en git:** `dev.db` (raíz, desarrollo) y `public/uploads/*`. La primera copia a producción es manual (ver §4).

---

## 3. Flujo de trabajo Git

1. Trabajar en ramas (ej. `develop`, `feature/xxx`) y abrir **PR hacia `main`**.
2. En el PR corre `ci.yml` (build). Hasta que esté verde, no se toca `main`.
3. Al **mergear a `main`** corre `deploy.yml`: compila y despliega a producción.
4. `main` tiene **branch protection** recomendada (ver §6): sin push directo, PR obligatorio, checks requeridos.

---

## 4. Provisionar el VPS (una sola vez)

Requisitos: VPS DonWeb con Ubuntu 24.04. Datos de este VPS: IP `149.50.155.111`, **puerto SSH `5293`**.

```bash
# 1) Entrar como root (por ahora con contraseña)
ssh -p5293 root@149.50.155.111

# 2) Subir y ejecutar el provisionamiento
scp -P5293 deploy/install-server.sh root@149.50.155.111:/tmp/
ssh -p5293 root@149.50.155.111 'bash /tmp/install-server.sh'
```
Esto instala: Node 22 LTS, Nginx, Certbot, UFW (abre **5293/tcp** + 80/443), Fail2ban, PM2 + pm2-logrotate (usuario `wolfie`), estructura versionada (`releases/`, symlink `app`, `uploads/` estable), CLI de Prisma en `tools/` (con su `prisma.config.ts`), y el cron de backup diario.

```bash
# 3) Copiar la clave SSH pública a wolfie y VERIFICAR que entrás
ssh-copy-id -p 5293 wolfie@149.50.155.111
ssh -p5293 wolfie@149.50.155.111 'echo ok'
# (en otra terminal también verificar; no cerrar la de root todavía)

# 4) Endurecer SSH (solo después de confirmar el paso 3)
ssh -p5293 root@149.50.155.111 'bash /var/www/wolfie-room/deploy/harden-ssh.sh'

# 5) Crear el entorno de producción
ssh -p5293 wolfie@149.50.155.111 'cp /var/www/wolfie-room/deploy/.env.production.example /var/www/wolfie-room/.env'
#   → editar /var/www/wolfie-room/.env (SESSION_SECRET = openssl rand -hex 32;
#     NEXT_PUBLIC_SITE_URL = URL real del sitio)

# 6) Copiar los datos iniciales desde tu PC
scp -P5293 dev.db wolfie@149.50.155.111:/var/www/wolfie-room/data/dev.db
scp -P5293 -r public/uploads/* wolfie@149.50.155.111:/var/www/wolfie-room/uploads/
```

> **Importante:** el primer deploy requiere que `data/dev.db` exista en el server; si no, el smoke test falla y el CI hace rollback (queda señalado como error). Rotar la contraseña de root de DonWeb al terminar.

---

## 5. Configurar GitHub (una sola vez, manual en la web)

El PAT usado hasta ahora **no tiene permiso** para: pasar el repo a privado, proteger ramas ni crear secrets/vars de Actions (da 403). Hacerlo a mano:

1. **Pasar el repo a privado**: Settings → General → Danger Zone → *Change repository visibility* → **Make private**.
2. **Branch protection en `main`**: Settings → Branches → *Add branch ruleset/rule*:
   - Require a pull request before merging (1 approval).
   - Require status checks to pass → `build` (job de `ci.yml`).
   - Require linear history (opcional).
   - No aplicar a admins (para que un hotfix de emergencia no quede bloqueado).
3. **Secrets de Actions** (Settings → Secrets and variables → Actions → New repository secret):

   | Secret | Valor |
   |---|---|
   | `VPS_HOST` | `149.50.155.111` |
   | `VPS_USER` | `wolfie` |
   | `VPS_SSH_PORT` | `5293` |
   | `VPS_SSH_KEY` | clave privada ed25519 del CI (sin passphrase) |

   **Variables** (Settings → Variables → Actions):
   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://wolfiesroom.com` |

> Generar la clave del CI en tu PC y agregar la **pública** a `/home/wolfie/.ssh/authorized_keys`:
> ```bash
> ssh-keygen -t ed25519 -f ~/.ssh/wolfie_ci_ed25519 -N "" -C "github-actions-wolfie"
> # clave pública:
> cat ~/.ssh/wolfie_ci_ed25519.pub
> # en el server (como wolfie): añadir esa línea a ~/.ssh/authorized_keys
> ```

Mientras no existan los secrets, `deploy.yml` corre pero **omite todos los pasos de deploy** (los `if` los desactivan); `ci.yml` siempre valida el build.

---

## 6. Deploy automático (push a main)

`deploy.yml` ejecuta:

1. Build en Linux (`npm ci` → `prisma generate` → `prisma migrate deploy` contra `ci.db` → `next build standalone`).
2. Ensambla el bundle: `.next/standalone` + `.next/static` + `public/` + `prebuilds/` de better-sqlite3.
3. **Backup previo en el server** (`backup-wolfie.sh`: DB + uploads).
4. Sincroniza `deploy/` (scripts/ecosystem/nginx) y `prisma/` (schema + migraciones).
5. Sube el bundle a **`releases/<sha>/`** (rsync con `--delete`, excluyendo `public/uploads/`).
6. `remote-deploy.sh` (en el server):
   - Crea `releases/<sha>/public/uploads` → `../uploads` estable.
   - Swap atómico `app → releases/<sha>`.
   - `pm2 startOrRestart` + `pm2 save`.
   - **Smoke test**: `GET /` y `GET /login` deben devolver `200`. Si falla → **rollback automático** al release anterior y `exit 1`.
   - Limpieza: conserva los 3 releases más recientes.
7. Estado final: `readlink app`, `pm2 status`, lista de releases.

**Rollback manual** (si algo anda mal después del deploy):

```bash
ssh -p5293 wolfie@149.50.155.111 '
  cd /var/www/wolfie-room
  ls -1dt releases/* | head -3          # elegir un release bueno
  ln -sfn releases/<sha-bueno> app.new && mv -Tf app.new app
  pm2 startOrRestart deploy/ecosystem.config.js && pm2 save
'
```

---

## 7. Migraciones de base de datos (manual)

El deploy **nunca migra**. Para aplicar cambios de schema:

```bash
# 1) Local: crear la migración
npx prisma migrate dev --name nombre_cambio
git add -A && git commit -m "..." && git push

# 2) Merge a main (despliega código nuevo; si el código nuevo usa campos
#    nuevos, la app puede fallar hasta aplicar la migración → hacer 1 y 2 rápido)

# 3) Aplicar en producción:
#    GitHub → Actions → "Apply DB Migrations (manual)" → Run workflow
#    (rama: main). Hace: backup → rsync prisma/ → prisma migrate deploy → verifica → reinicia.
```

Equivalente manual por SSH (si se prefiere):

```bash
ssh -p5293 wolfie@149.50.155.111 '
  cd /var/www/wolfie-room/tools
  DATABASE_URL="file:/var/www/wolfie-room/data/dev.db" npx prisma migrate deploy
'
```

> El CLI de Prisma vive aislado en `tools/` (con `prisma.config.ts` de rutas absolutas); el server no necesita compilar nada.

---

## 8. Backups

| Backup | Frecuencia | Dónde | Retención |
|---|---|---|---|
| Diario automático (`backup-wolfie.sh` vía cron) | 02:30 | `backups/` en el server | 7 días |
| Pre-deploy y pre-migración | cada deploy / migración | `backups/` en el server | 7 días |
| **Off-site** (`backup-local.sh`) | semanal (manual/tarea) | PC local (`backups-local/`) | 4 semanas |

`backup-wolfie.sh`: `sqlite3 .backup` (consistente en caliente) + tar de `uploads/`.

`backup-local.sh`: configuración en `deploy/backup-local.env` (no subir a git):

```
VPS_HOST="149.50.155.111"
VPS_USER="wolfie"
VPS_SSH_PORT="5293"
VPS_KEY="C:/Users/tu-usuario/.ssh/wolfie_ci_ed25519"
LOCAL_DIR="C:/Users/tu-usuario/Documentos/Wolfie Room/backups-local"
```

Ejecutar con Git Bash/WSL: `bash deploy/backup-local.sh`. Para automatizarlo en Windows:
**Programador de tareas** → crear tarea semanal → acción: `C:\Program Files\Git\bin\bash.exe -lc "/ruta/al/repo/deploy/backup-local.sh"`.

---

## 9. DNS y HTTPS

- Dominio `wolfiesroom.com` → registro **A** de `wolfiesroom.com` y `www` → `149.50.155.111`.
- Habilitar el site de Nginx y emitir certificado (una vez, como root):

```bash
ln -s /etc/nginx/sites-available/wolfie-room /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d wolfiesroom.com -d www.wolfiesroom.com
```

- Editar `NEXT_PUBLIC_SITE_URL` en `/var/www/wolfie-room/.env` con la URL definitiva (y en las variables de GitHub).

---

## 10. Seguridad

| Capa | Qué hace |
|---|---|
| **UFW** | Deny por defecto; permite `5293/tcp`, 80 y 443 |
| **Fail2ban** | Jail `sshd`: 5 intentos / 10 min → ban 1 h |
| **SSH endurecido** | Solo clave pública, `PasswordAuthentication no`, `PermitRootLogin prohibit-password`, `AllowUsers wolfie` |
| **CI key** | Clave ed25519 dedicada solo para el deploy (nunca la de DonWeb) |
| **Repo privado** | GitHub (pendiente, manual) |
| **Logrotate** | `pm2-logrotate` (10 MB, retención 7 días, comprimido) + Nginx (default) |
| **Backups** | Diario en server (7 días) + semanal off-site en la PC (4 semanas) |

---

## 11. Verificación

```bash
curl -I https://wolfiesroom.com/
curl -I https://wolfiesroom.com/sitemap.xml
curl -I https://wolfiesroom.com/robots.txt
ssh -p5293 wolfie@149.50.155.111 'pm2 status; pm2 logs wolfie-room --lines 30'
ssh -p5293 wolfie@149.50.155.111 'ls -1 /var/www/wolfie-room/releases; readlink /var/www/wolfie-room/app'
```

---

## 12. Notas / pendientes

- **Repo aún PÚBLICO**: pasarlo a privado y activar branch protection (ver §5).
- **Rotar credenciales expuestas en el chat**: contraseña root de DonWeb y PAT de GitHub (`token git.txt`).
- **Lint local**: hay un error pre-existente en `components/motion-primitives/animated-group.tsx` (`react-hooks/static-components`) que no bloquea el build. Se excluyó lint del CI para no romper el pipeline; se puede arreglar luego y sumar `npm run lint` al CI.
- **Instalación local de dependencias (Windows)**: `npm ci` plano falla porque `better-sqlite3@13` intenta `node-gyp rebuild` (necesita VS Build Tools). Usar:
  `npm ci --ignore-scripts && npx prisma generate` y, si hace falta el binario del nested better-sqlite3, descargarlo con `node node_modules/prebuild-install/bin.js` dentro de `node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3`. En CI (Linux) `npm ci` normal funciona.
- El plan DonWeb (1 vCPU / 1 GB RAM) alcanza holgado para el runtime (~200-400 MB). El upgrade natural es más RAM/vCPU.
