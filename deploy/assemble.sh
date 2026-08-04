#!/usr/bin/env bash
# Ensambla el bundle standalone de Next.js (debe ejecutarse en Linux, después de `npm run build`).
# Uso: bash deploy/assemble.sh
#
# Detalle crítico de better-sqlite3:
#   - El mejor-sqlite3 top-level (node_modules/better-sqlite3) tiene el install script
#     removido en el lockfile (para que `npm ci` funcione en Windows), por lo que
#     en CI `npm ci` NO descarga sus prebuilds.
#   - El binario nativo lo resuelve la app en runtime desde prebuilds/.
#   - Aquí descargamos el prebuild linux-x64 del top-level y copiamos también los
#     prebuilds del nested (node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3),
#     que sí los trae `npm ci` en Linux, para cubrir cualquier resolución en runtime.
set -euo pipefail

cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist/app

cp -r .next/standalone/. dist/app/
cp -r .next/static dist/app/.next/static
cp -r public/. dist/app/public/

TOP="node_modules/better-sqlite3"
if [ ! -d "$TOP/prebuilds" ] || ! ls "$TOP"/prebuilds/*linux-x64* >/dev/null 2>&1; then
  echo "==> Descargando prebuild nativo de better-sqlite3 (top-level)"
  (cd "$TOP" && node ../prebuild-install/bin.js) || echo "WARN: prebuild-install no descargó (se valida abajo)"
fi
mkdir -p "dist/app/$TOP"
cp -r "$TOP/prebuilds" "dist/app/$TOP/prebuilds" 2>/dev/null || true

NESTED="node_modules/@prisma/adapter-better-sqlite3/node_modules/better-sqlite3"
if [ -d "$NESTED/prebuilds" ]; then
  mkdir -p "dist/app/$NESTED"
  cp -r "$NESTED/prebuilds" "dist/app/$NESTED/prebuilds"
fi

if ! ls "dist/app/$TOP"/prebuilds/*linux-x64* >/dev/null 2>&1; then
  echo "ERROR: no se encontró el binario nativo de better-sqlite3 (linux-x64) en dist" >&2
  exit 1
fi

du -sh dist/app
