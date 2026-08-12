#!/usr/bin/env bash
# Ejecutado EN el VPS por GitHub Actions (usuario root).
# Uso: bash remote-deploy.sh <short-sha>
#
# Flujo:
#   1. Backup previo (DB plataforma + tenant DBs + uploads)
#   2. Migraciones multi-tenant (todas las tenant DBs)
#   3. public/uploads -> /var/www/catalogoaw/uploads (directorio estable)
#   4. Swap atómico del symlink app -> releases/<sha>
#   5. Reinicio PM2 + smoke test
#   6. Si el smoke falla: ROLLBACK automático y exit 1
#   7. Limpieza: conservar 3 releases
set -euo pipefail

APP_DIR="/var/www/catalogoaw"
SHA="${1:?falta el SHA del release}"

cd "$APP_DIR"

echo "==> Backup previo al deploy"
if [ -x /usr/local/bin/backup-catalogoaw.sh ]; then
  /usr/local/bin/backup-catalogoaw.sh
fi

echo "==> Aplicando migraciones (prisma migrate deploy)"
set -a
source "$APP_DIR/.env"
set +a
cd "$APP_DIR/tools"

# Baseline: la BD de plataforma se sembró manualmente
npx --no-install prisma migrate resolve --applied 20260803000000_init || true
npx --no-install prisma migrate deploy

# Migrar todas las tenant DBs
echo "==> Migrando tenant DBs"
for tenant_db in "$APP_DIR/data/tenants/"*.db; do
  [ -f "$tenant_db" ] || continue
  tenant_name=$(basename "$tenant_db" .db)
  echo "    Migrando tenant: $tenant_name"
  DATABASE_URL="file:$tenant_db" npx --no-install prisma migrate deploy || {
    echo "    WARN: migración falló para tenant $tenant_name — continuando"
  }
done

cd "$APP_DIR"

echo "==> Preparando release $SHA"
mkdir -p "$APP_DIR/releases/$SHA/public"
ln -sfn "$APP_DIR/uploads" "$APP_DIR/releases/$SHA/public/uploads"

PREV="$(readlink "$APP_DIR/app")"
echo "    prev=$PREV"

echo "==> Swap atómico: app -> releases/$SHA"
ln -sfn "releases/$SHA" "$APP_DIR/app.new"
mv -Tf "$APP_DIR/app.new" "$APP_DIR/app"

echo "==> Reiniciando catalogoaw"
pm2 startOrRestart "$APP_DIR/deploy/ecosystem.config.js" >/dev/null || true
pm2 save >/dev/null 2>&1 || true

smoke() {
  curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1" || echo 000
}

echo "==> Smoke test (reintentos) /"
CODE="000"
for i in $(seq 1 10); do
  CODE="$(smoke http://127.0.0.1:3000/)"
  if [ "$CODE" = "200" ] || [ "$CODE" = "301" ] || [ "$CODE" = "302" ]; then
    break
  fi
  sleep 3
done
echo "smoke test: /=$CODE"

if [ "$CODE" != "200" ] && [ "$CODE" != "301" ] && [ "$CODE" != "302" ]; then
  echo "==> SMOKE FALLÓ ($CODE). Rollback a $PREV"
  ln -sfn "$PREV" "$APP_DIR/app.new"
  mv -Tf "$APP_DIR/app.new" "$APP_DIR/app"
  pm2 startOrRestart "$APP_DIR/deploy/ecosystem.config.js" >/dev/null || true
  pm2 save >/dev/null 2>&1 || true
  exit 1
fi

echo "==> Limpieza: conservar los 3 releases más recientes"
CUR="$(readlink "$APP_DIR/app")"
CUR_SHORT="${CUR#releases/}"
cd "$APP_DIR/releases"
ls -1dt */ 2>/dev/null | sed 's#/$##' | grep -vx "$CUR_SHORT" | tail -n +3 | xargs -r rm -rf

echo "==> Deploy OK ($SHA). app -> $(readlink "$APP_DIR/app")"
