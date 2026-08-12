#!/usr/bin/env bash
# install-saas-server.sh — Prepara un VPS Ubuntu/Debian para la plataforma SaaS
# Ejecutar como root: curl -sL <url> | bash   o   bash install-saas-server.sh
set -euo pipefail

APP_DIR="/var/www/catalogoaw"
NODE_VERSION=22
PM2_VERSION="latest"

echo "==> Actualizando sistema"
apt-get update -qq && apt-get upgrade -y -qq

echo "==> Instalando dependencias base"
apt-get install -y -qq curl git build-essential ufw fail2ban

echo "==> Instalando Node.js $NODE_VERSION"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y -qq nodejs

echo "==> Instalando PM2 globalmente"
npm install -g pm2

echo "==> Creando directorio de la app"
mkdir -p "$APP_DIR"
mkdir -p "$APP_DIR/data/tenants"
mkdir -p "$APP_DIR/uploads"
mkdir -p "$APP_DIR/logs"
mkdir -p "$APP_DIR/releases"
mkdir -p "$APP_DIR/tools"

echo "==> Configurando firewall (UFW)"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 80/tcp >/dev/null 2>&1 || true
ufw allow 443/tcp >/dev/null 2>&1 || true
ufw --force enable

echo "==> Configurando fail2ban"
systemctl enable fail2ban
systemctl start fail2ban

echo "==> Configurando PM2 para arrancar con el sistema"
pm2 startup systemd -u root --hp /root | tail -1 | bash

echo ""
echo "========================================="
echo "  VPS listo para deploy"
echo "========================================="
echo ""
echo "Pendiente:"
echo "  1. Crear el repo awkbuy/catalogoaw en GitHub"
echo "  2. Agregar la llave SSH pública a GitHub > Settings > SSH Keys"
echo "  3. Configurar los secrets en GitHub > Settings > Secrets:"
echo "     - VPS_HOST      = IP de este servidor"
echo "     - VPS_USER      = root (o el usuario que crees)"
echo "     - VPS_SSH_KEY   = contenido de ~/.ssh/id_ed25519"
echo "     - VPS_SSH_PORT  = 22"
echo "  4. Configurar variables en GitHub > Settings > Variables:"
echo "     - NEXT_PUBLIC_SITE_URL = https://tudominio.com"
echo "  5. Copiar deploy/.env.production.example a /var/www/catalogoaw/.env"
echo "     y completar las variables (SESSION_SECRET, etc.)"
echo "  6. Push a main para activar el deploy automático"
echo ""
echo "Ruta de la app: $APP_DIR"
