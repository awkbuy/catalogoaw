#!/usr/bin/env bash
# Instala y configura el VPS DonWeb (Ubuntu 24.04) para Wolfie Room.
# Uso (como root): bash install-server.sh
#
# Lo que hace:
#   - Node.js 22 LTS (nodesource) + herramientas base
#   - Nginx, Certbot, UFW, Fail2ban
#   - PM2 (usuario wolfie) + pm2-logrotate
#   - Usuario "wolfie" + estructura de directorios en /var/www/wolfie-room
#   - CLI de Prisma aislado en tools/ (solo para migraciones futuras)
set -euo pipefail

APP_USER="wolfie"
APP_DIR="/var/www/wolfie-room"
VPS_IP="${VPS_IP:-}"

log() { echo -e "\n\033[1;32m==> $*\033[0m"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecutar como root: bash install-server.sh"
  exit 1
fi

log "Actualizando el sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

log "Instalando paquetes base..."
apt-get install -y \
  curl ca-certificates gnupg git \
  build-essential python3 sqlite3 \
  nginx certbot python3-certbot-nginx \
  ufw fail2ban rsync

log "Instalando Node.js 22 LTS (nodesource)..."
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

log "Creando usuario ${APP_USER}..."
if ! id -u "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
fi
usermod -aG sudo "$APP_USER"

log "Creando estructura en ${APP_DIR}..."
install -d -o "$APP_USER" -g "$APP_USER" "$APP_DIR"/{app,data,logs,backups,tools}
install -d -o "$APP_USER" -g "$APP_USER" "$APP_DIR/app/public/uploads"

log "Configurando UFW (22/80/443)..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status verbose

log "Configurando Fail2ban (jail sshd)..."
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

log "Habilitando Nginx..."
systemctl enable nginx
systemctl start nginx

log "Instalando PM2 para el usuario ${APP_USER}..."
su - "$APP_USER" -c "npm i -g pm2 && pm2 install pm2-logrotate && pm2 set pm2-logrotate:max_size 10M && pm2 set pm2-logrotate:retain 7 && pm2 set pm2-logrotate:compress true && pm2 set pm2-logrotate:rotateInterval '0 0 * * *' && pm2 startup systemd -u $APP_USER --hp /home/$APP_USER"

log "Instalando CLI de Prisma (aislado en tools/, solo migraciones)..."
cat > "$APP_DIR/tools/package.json" <<'EOF'
{
  "name": "wolfie-room-tools",
  "private": true,
  "dependencies": {
    "prisma": "^7.9.0"
  }
}
EOF
chown -R "$APP_USER":"$APP_USER" "$APP_DIR/tools"
su - "$APP_USER" -c "cd $APP_DIR/tools && npm i --no-audit --no-fund"

log "Instalando script de backup + cron diario..."
cat > /usr/local/bin/backup-wolfie.sh <<'EOF'
#!/usr/bin/env bash
# Backup diario de la base SQLite y los uploads. Retención: 7 días.
set -euo pipefail

APP_DIR="/var/www/wolfie-room"
BACKUP_DIR="$APP_DIR/backups"
DB="$APP_DIR/data/dev.db"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# Backup seguro en caliente (consistente aunque la app esté escribiendo)
sqlite3 "$DB" ".backup '$BACKUP_DIR/dev-$STAMP.db'"

# Uploads subidos desde el admin
tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$APP_DIR/app/public" uploads

# Rotación: conservar los últimos 7 días
find "$BACKUP_DIR" -type f -mtime +7 \( -name 'dev-*.db' -o -name 'uploads-*.tar.gz' \) -delete

echo "[$(date '+%F %T')] Backup completado: $STAMP"
EOF
chmod +x /usr/local/bin/backup-wolfie.sh
( crontab -l 2>/dev/null | grep -v 'backup-wolfie' ; echo "30 2 * * * /usr/local/bin/backup-wolfie.sh >> $APP_DIR/logs/backup.log 2>&1" ) | crontab -

cat <<'EOF'

==========================================================================
 Provisionamiento completado. Pasos siguientes:
  1) Copiar tu clave SSH pública para el usuario wolfie:
       ssh-copy-id wolfie@<IP_DEL_VPS>
  2) Endurecer SSH (recomendado), tras verificar que entrás con la clave:
       bash /var/www/wolfie-room/deploy/harden-ssh.sh
  3) Crear el archivo de entorno:
       cp /var/www/wolfie-room/deploy/.env.production.example /var/www/wolfie-room/.env
       nano /var/www/wolfie-room/.env   # rellenar SESSION_SECRET
  4) Copiar los datos iniciales:
       data/dev.db      -> /var/www/wolfie-room/data/dev.db
       public/uploads/* -> /var/www/wolfie-room/app/public/uploads/
  5) Lanzar el deploy desde GitHub Actions.
==========================================================================
EOF
