#!/usr/bin/env bash
# Descarga semanal de backups del VPS a la PC local (off-site).
# Requiere Git Bash o WSL en Windows (o bash en Linux/macOS).
#
# Config: copiar este bloque a deploy/backup-local.env (NO subir a git):
#   VPS_HOST="149.50.155.111"
#   VPS_USER="wolfie"
#   VPS_SSH_PORT="5293"
#   VPS_KEY="C:/Users/tu-usuario/.ssh/wolfie_ci_ed25519"
#   LOCAL_DIR="C:/Users/tu-usuario/Documentos/Wolfie Room/backups-local"
#
# Uso: bash deploy/backup-local.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/backup-local.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$SCRIPT_DIR/backup-local.env"
  set +a
fi

: "${VPS_HOST:?define VPS_HOST en backup-local.env}"
: "${VPS_USER:?define VPS_USER en backup-local.env}"
: "${VPS_SSH_PORT:=5293}"
: "${VPS_KEY:?define VPS_KEY (ruta a la clave privada de wolfie) en backup-local.env}"
: "${LOCAL_DIR:?define LOCAL_DIR (carpeta local de backups) en backup-local.env}"

STAMP="$(date +%Y%m%d)"
DEST="$LOCAL_DIR/$STAMP"
mkdir -p "$DEST"

SSH_OPTS="-i $VPS_KEY -o StrictHostKeyChecking=accept-new"

echo "==> Listando últimos backups en el server"
ssh -p "$VPS_SSH_PORT" $SSH_OPTS "$VPS_USER@$VPS_HOST" \
  'ls -t /var/www/wolfie-room/backups/dev-*.db | head -1; ls -t /var/www/wolfie-room/backups/uploads-*.tar.gz | head -1' \
  > "$DEST/manifiesto.txt"

DB_FILE="$(sed -n '1p' "$DEST/manifiesto.txt")"
UP_FILE="$(sed -n '2p' "$DEST/manifiesto.txt")"
[ -n "$DB_FILE" ] && [ -n "$UP_FILE" ] || { echo "No hay backups en el server."; exit 1; }

echo "==> Descargando $DB_FILE"
scp -P "$VPS_SSH_PORT" $SSH_OPTS "$VPS_USER@$VPS_HOST:$DB_FILE" "$DEST/dev.db"
echo "==> Descargando $UP_FILE"
scp -P "$VPS_SSH_PORT" $SSH_OPTS "$VPS_USER@$VPS_HOST:$UP_FILE" "$DEST/uploads.tar.gz"

# Retención local: 4 semanas
find "$LOCAL_DIR" -maxdepth 1 -type d -name '20*' -mtime +28 -exec rm -rf {} +

echo "Backup local completado en $DEST"
