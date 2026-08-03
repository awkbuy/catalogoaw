# Plan de deploy — Wolfie Room en DonWeb (VPS Cloud)

> Documento vivo. Describe la arquitectura de producción y los pasos de instalación, deploy y mantenimiento.

---

## 1. Arquitectura

```
GitHub (repo privado) ──push──▶ GitHub Actions (ubuntu-latest)
                                    ├─ npm ci + prisma generate + next build (standalone)
                                    └─ rsync del bundle → DonWeb VPS

DonWeb VPS Cloud (1 vCPU / 1 GB RAM / 10 GB SSD):
  ├─ Nginx (80/443) ──proxy──▶ Node (Next.js standalone, 127.0.0.1:3000)
  ├─ PM2 (1 instancia, usuario wolfie)
  ├─ SQLite: /var/www/wolfie-room/data/dev.db
  ├─ Uploads: /var/www/wolfie-room/app/public/uploads
  └─ Seguridad: UFW, Fail2ban, SSH endurecido, logrotate, backups diarios
```

**Decisiones clave**

- **No se compila en el VPS** (1 GB RAM). El build se hace en GitHub Actions (Linux) y se sube el bundle `standalone` ya compilado. El VPS solo ejecuta `node server.js`.
- **El build DEBE ser Linux.** `next/image` usa `sharp` y SQLite usa `better-sqlite3`; ambos cargan binarios nativos por plataforma (`@img/sharp-*-x64`, `prebuilds/<plataforma>.node`). Un build hecho en Windows subido a Linux se rompe. Por eso el build se hace en CI (ubuntu-latest).
- **1 sola instancia PM2** (`exec_mode: fork`). SQLite no admite múltiples procesos escribiendo (locks).
- **Ruta absoluta** en `DATABASE_URL` para evitar ambigüedad de rutas relativas.

**Por qué NO PostgreSQL:** el filesystem del VPS es persistente y la app corre como un único proceso. SQLite es 100 % viable, con backups triviales (un solo archivo). Postgres solo se justificaría con múltiples instancias o serverless.

---

## 2. Repositorio

- Carpeta `deploy/` con los archivos de configuración del server.
- `.github/workflows/deploy.yml` con el pipeline de build + deploy.
- `prisma/migrations/` es **una sola migración baseline** generada desde el schema actual (reemplazó las migraciones viejas desincronizadas). `prisma migrate deploy` en un entorno nuevo crea la BD correcta.
- `.gitignore` excluye: `.env`, `*.db`, `data/`, `public/uploads/`, `.next/`, `node_modules/`, logs, `nul`.

> **Datos que NO viven en git:** `dev.db` (raíz) y `public/uploads/*`. Se copian al server manualmente la primera vez.

---

## 3. Provisionar el VPS (una sola vez)

1. Contratar el VPS Cloud de DonWeb con **Ubuntu 24.04** y anotar la IP.
2. Entrar como root por SSH y ejecutar:
   ```bash
   bash /var/www/wolfie-room/deploy/install-server.sh
   ```
   Esto instala: Node 22 LTS, Nginx, Certbot, UFW (22/80/443), Fail2ban, PM2 + pm2-logrotate (usuario `wolfie`), directorios en `/var/www/wolfie-room`, CLI de Prisma aislado en `tools/`, y el cron de backups.
   > El archivo debe copiarse antes; por ejemplo desde tu PC:
   > `scp deploy/install-server.sh root@<IP>:/tmp/ && ssh root@<IP> 'bash /tmp/install-server.sh'`
3. **Endurecer SSH** (tras copiar tu clave pública a `wolfie` y verificar que entrás):
   ```bash
   ssh-copy-id wolfie@<IP>
   # en otra terminal, entrar como wolfie y verificar
   bash /var/www/wolfie-room/deploy/harden-ssh.sh
   ```
4. Crear el entorno de producción:
   ```bash
   cp /var/www/wolfie-room/deploy/.env.production.example /var/www/wolfie-room/.env
   # generar secreto: openssl rand -hex 32 → pegar en SESSION_SECRET
   ```
5. Copiar los datos iniciales desde tu PC:
   ```bash
   scp dev.db wolfie@<IP>:/var/www/wolfie-room/data/dev.db
   scp -r public/uploads/* wolfie@<IP>:/var/www/wolfie-room/app/public/uploads/
   ```

---

## 4. DNS y HTTPS

- Comprar `wolfieroom.com.ar` (DonWeb o NIC Argentina).
- Registro **A** de `wolfieroom.com.ar` y `www` → IP del VPS.
- Habilitar el site de Nginx y emitir el certificado:
  ```bash
  ln -s /etc/nginx/sites-available/wolfie-room /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx
  certbot --nginx -d wolfieroom.com.ar -d www.wolfieroom.com.ar
  ```

---

## 5. Deploy (GitHub Actions)

Cada push a `main` (o dispatch manual) ejecuta `.github/workflows/deploy.yml`:

1. `npm ci` + `prisma generate` + `prisma migrate deploy` (contra `ci.db`, valida la migración).
2. `next build` con `output: standalone`.
3. Ensambla el bundle: `.next/standalone/*` + `.next/static` + `public/` + `prebuilds/` de better-sqlite3.
4. `rsync` al VPS:
   - `app/` con `--delete` (preserva `public/uploads/`).
   - `prisma/` (schema + migraciones) y `deploy/` (config).
5. `pm2 startOrReload` + `pm2 save`.

**Secrets/var necesarios en GitHub (Settings → Secrets and variables → Actions):**

| Nombre | Valor |
|---|---|
| `VPS_HOST` | IP del VPS |
| `VPS_USER` | `wolfie` |
| `VPS_SSH_KEY` | Clave privada SSH (Ed25519) |
| `NEXT_PUBLIC_SITE_URL` (variable) | `https://wolfieroom.com.ar` |

---

## 6. Seguridad

| Capa | Qué hace |
|---|---|
| **UFW** | Deny por defecto; permite solo 22/80/443 |
| **Fail2ban** | Jail `sshd`: 5 intentos / 10 min → ban 1 h |
| **SSH endurecido** | Solo clave pública, `PasswordAuthentication no`, `PermitRootLogin prohibit-password`, `AllowUsers wolfie` |
| **Logrotate** | `pm2-logrotate` (10 MB, retención 7 días, comprimido) + Nginx (default de Ubuntu) |
| **Backups** | Cron diario 02:30: `sqlite3 .backup` (consistente en caliente) + tar de uploads, retención 7 días. El plan DonWeb agrega backup de VM (10 GB) |

---

## 7. Mantenimiento

### Actualizar el código
```bash
git push origin main   # CI compila y despliega solo
```

### Cambios de schema (futuros)
```bash
# 1. Local: crear la migración
npx prisma migrate dev --name nombre_cambio
git add -A && git commit -m "..." && git push

# 2. Server: aplicar la migración (CLI aislado en tools/)
ssh wolfie@<IP> 'cd /var/www/wolfie-room/tools && \
  DATABASE_URL="file:/var/www/wolfie-room/data/dev.db" \
  npx prisma migrate deploy --schema ../prisma/schema.prisma'
```

### Verificación de rutas
```bash
curl -I https://wolfieroom.com.ar/
curl -I https://wolfieroom.com.ar/sitemap.xml
curl -I https://wolfieroom.com.ar/robots.txt
ssh wolfie@<IP> 'pm2 status wolfie-room; pm2 logs wolfie-room --lines 30'
```

---

## 8. Pendientes / notas

- El plan DonWeb (1 vCPU / 1 GB RAM) alcanza holgado para el runtime (~200-400 MB). Si crece el tráfico, el upgrade natural es más RAM/vCPU en el mismo VPS.
- El README y CLAUDE.md describen componentes que ya cambiaron (existen `CartDrawer`, `ProductDetailModal`, `GameDetailView`, rutas de cupones/pagos/SEO). Mantenerlos al día es una tarea menor pendiente.
