#!/usr/bin/env bash
# Backup de la base SQLite y los uploads. Retención: 7 días.
# - DB: sqlite3 .backup (consistente aunque la app esté escribiendo)
# - Uploads: tar del directorio estable /var/www/wolfie-room/uploads
# Uso: /usr/local/bin/backup-wolfie.sh
set -euo pipefail

APP_DIR="/var/www/wolfie-room"
BACKUP_DIR="$APP_DIR/backups"
DB="$APP_DIR/data/dev.db"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

sqlite3 "$DB" ".backup '$BACKUP_DIR/dev-$STAMP.db'"

tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$APP_DIR" uploads

# Rotación: conservar los últimos 7 días
find "$BACKUP_DIR" -type f -mtime +7 \( -name 'dev-*.db' -o -name 'uploads-*.tar.gz' \) -delete

echo "[$(date '+%F %T')] Backup completado: $STAMP"
