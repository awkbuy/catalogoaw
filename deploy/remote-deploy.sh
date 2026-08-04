#!/usr/bin/env bash
# Ejecutado EN el VPS por GitHub Actions (usuario wolfie).
# Uso: bash remote-deploy.sh <short-sha>
#
# Flujo:
#   1. Backup previo (DB + uploads)
#   2. public/uploads -> /var/www/wolfie-room/uploads (directorio estable)
#   3. Swap atómico del symlink app -> releases/<sha>
#   4. Reinicio PM2 + smoke test (/ y /login)
#   5. Si el smoke falla: ROLLBACK automático al release anterior y exit 1
#   6. Limpieza: conservar 3 releases
set -euo pipefail

APP_DIR="/var/www/wolfie-room"
SHA="${1:?falta el SHA del release}"

cd "$APP_DIR"

echo "==> Backup previo al deploy"
/usr/local/bin/backup-wolfie.sh

echo "==> Preparando release $SHA"
mkdir -p "$APP_DIR/releases/$SHA/public"
ln -sfn "$APP_DIR/uploads" "$APP_DIR/releases/$SHA/public/uploads"

PREV="$(readlink "$APP_DIR/app")"
echo "    prev=$PREV"

echo "==> Swap atómico: app -> releases/$SHA"
ln -sfn "releases/$SHA" "$APP_DIR/app.new"
mv -Tf "$APP_DIR/app.new" "$APP_DIR/app"

echo "==> Reiniciando wolfie-room"
pm2 startOrRestart "$APP_DIR/deploy/ecosystem.config.js" >/dev/null || true
pm2 save >/dev/null 2>&1 || true

smoke() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1" || echo 000
}

# El VPS puede tardar en arrancar el server (1 GB, standalone): reintenta hasta ~30s.
echo "==> Smoke test (reintentos) /, /login"
HOME_CODE="000"
LOGIN_CODE="000"
for i in $(seq 1 10); do
  HOME_CODE="$(smoke http://127.0.0.1:3000/)"
  LOGIN_CODE="$(smoke http://127.0.0.1:3000/login)"
  if [ "$HOME_CODE" = "200" ] && [ "$LOGIN_CODE" = "200" ]; then
    break
  fi
  sleep 3
done
echo "smoke test: /=$HOME_CODE /login=$LOGIN_CODE"

if [ "$HOME_CODE" != "200" ] || [ "$LOGIN_CODE" != "200" ]; then
  echo "==> SMOKE FALLÓ ($HOME_CODE/$LOGIN_CODE). Rollback a $PREV"
  ln -sfn "$PREV" "$APP_DIR/app.new"
  mv -Tf "$APP_DIR/app.new" "$APP_DIR/app"
  pm2 startOrRestart "$APP_DIR/deploy/ecosystem.config.js" >/dev/null || true
  pm2 save >/dev/null 2>&1 || true
  exit 1
fi

echo "==> Limpieza: conservar los 3 releases más recientes"
CUR="$(readlink "$APP_DIR/app")"          # p.ej. releases/abc1234
CUR_SHORT="${CUR#releases/}"
cd "$APP_DIR/releases"
ls -1dt */ 2>/dev/null | sed 's#/$##' | grep -vx "$CUR_SHORT" | tail -n +3 | xargs -r rm -rf

echo "==> Deploy OK ($SHA). app -> $(readlink "$APP_DIR/app")"
