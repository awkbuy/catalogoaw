#!/usr/bin/env bash
# Endurece SSH: deshabilita login por contraseña y login root.
# IMPORTANTE: ejecutar SOLO después de copiar tu clave pública a wolfie
# y de verificar en otra terminal que podés entrar como wolfie.
# Nota: el SSH de DonWeb ya escucha en el puerto 5293; esto NO lo cambia.
# Uso (como root o sudo): bash harden-ssh.sh
set -euo pipefail

cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak.$(date +%Y%m%d-%H%M%S)

sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
grep -q '^AllowUsers' /etc/ssh/sshd_config || echo 'AllowUsers wolfie' >> /etc/ssh/sshd_config

systemctl restart ssh

echo "SSH endurecido. NO cierres esta sesión hasta confirmar que podés entrar con la clave como wolfie."
