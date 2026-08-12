#!/usr/bin/env bash
# Backup multi-tenant: DB de plataforma + todas las tenant DBs + uploads
# Retención: 7 días
# Uso: /usr/local/bin/backup-catalogoaw.sh
set -euo pipefail

APP_DIR="/var/www/catalogoaw"
BACKUP_DIR="$APP_DIR/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%F %T')] Iniciando backup $STAMP"

# DB de plataforma
if [ -f "$APP_DIR/data/platform.db" ]; then
  sqlite3 "$APP_DIR/data/platform.db" ".backup '$BACKUP_DIR/platform-$STAMP.db'"
  echo "  platform.db respaldada"
fi

# Tenant DBs
for tenant_db in "$APP_DIR/data/tenants/"*.db; do
  [ -f "$tenant_db" ] || continue
  tenant_name=$(basename "$tenant_db" .db)
  sqlite3 "$tenant_db" ".backup '$BACKUP_DIR/tenant-${tenant_name}-$STAMP.db'"
  echo "  tenant $tenant_name respaldada"
done

# Uploads
if [ -d "$APP_DIR/uploads" ]; then
  tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$APP_DIR" uploads
  echo "  uploads respaldados"
fi

# Rotación: conservar los últimos 7 días
find "$BACKUP_DIR" -type f -mtime +7 \( -name 'platform-*.db' -o -name 'tenant-*.db' -o -name 'uploads-*.tar.gz' \) -delete

echo "[$(date '+%F %T')] Backup completado: $STAMP"
