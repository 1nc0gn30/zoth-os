#!/usr/bin/env bash
# ==============================================================================
#  ZOTHOS LIVE VM DIRECT SYNC & REFRESH TOOL
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

VM_IP="${VM_IP:-192.168.122.188}"
ZOTHOS_SRC="$ROOT_DIR/config/includes.chroot"
VM_USER="${VM_USER:-zoth}"

echo "[*] Syncing updated ZothOS sovereign components to live VM at $VM_IP ($VM_USER)..."

# 1. Sync icons & pixmaps
rsync -avz -e "ssh -o StrictHostKeyChecking=no" "$ZOTHOS_SRC/usr/share/icons/" "$VM_USER@$VM_IP":/tmp/icons/
rsync -avz -e "ssh -o StrictHostKeyChecking=no" "$ZOTHOS_SRC/usr/share/pixmaps/" "$VM_USER@$VM_IP":/tmp/pixmaps/
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" "echo zoth | sudo -S cp -rf /tmp/icons/* /usr/share/icons/ && echo zoth | sudo -S cp -rf /tmp/pixmaps/* /usr/share/pixmaps/ && echo zoth | sudo -S gtk-update-icon-cache -f -t /usr/share/icons/Zoth-Hermetic 2>/dev/null || true && echo zoth | sudo -S gtk-update-icon-cache -f -t /usr/share/icons/hicolor 2>/dev/null || true"

# 2. Sync applications shortcuts
rsync -avz -e "ssh -o StrictHostKeyChecking=no" "$ZOTHOS_SRC/usr/share/applications/" "$VM_USER@$VM_IP":/tmp/apps/
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" "echo zoth | sudo -S cp -rf /tmp/apps/* /usr/share/applications/"

# 3. Sync themes & GTK config
rsync -avz -e "ssh -o StrictHostKeyChecking=no" "$ZOTHOS_SRC/usr/share/themes/" "$VM_USER@$VM_IP":/tmp/themes/
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" "echo zoth | sudo -S cp -rf /tmp/themes/* /usr/share/themes/"

# 4. Refresh user desktop & autostart configs
rsync -avz -e "ssh -o StrictHostKeyChecking=no" "$ZOTHOS_SRC/etc/skel/.config/" "$VM_USER@$VM_IP":/home/"$VM_USER"/.config/
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" "chown -R $VM_USER:$VM_USER /home/$VM_USER/.config"

# 5. Sync opt apps (pet & hud)
rsync -avz --exclude='public/assets/media' -e "ssh -o StrictHostKeyChecking=no" "$ZOTHOS_SRC/opt/" "$VM_USER@$VM_IP":/tmp/opt/
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" "echo zoth | sudo -S cp -rf /tmp/opt/* /opt/ && echo zoth | sudo -S chmod -R 755 /opt/zoth-desktop-pet /opt/zoth-hud"

# 6. Sync usr/local/bin
rsync -avz -e "ssh -o StrictHostKeyChecking=no" "$ZOTHOS_SRC/usr/local/bin/" "$VM_USER@$VM_IP":/tmp/bin/
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" "echo zoth | sudo -S cp -rf /tmp/bin/* /usr/local/bin/ && echo zoth | sudo -S chmod +x /usr/local/bin/*"

echo "[*] Restarting desktop session & sovereign pet/hud on display :0..."
ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_IP" "DISPLAY=:0 XAUTHORITY=/home/$VM_USER/.Xauthority nohup plasmashell --replace >/dev/null 2>&1 & sleep 2 && DISPLAY=:0 XAUTHORITY=/home/$VM_USER/.Xauthority nohup /usr/local/bin/zoth-desktop-hud >/dev/null 2>&1 & sleep 1 && DISPLAY=:0 XAUTHORITY=/home/$VM_USER/.Xauthority nohup /usr/local/bin/zoth-desktop-pet >/dev/null 2>&1 &"

echo "[✓] Live VM successfully synchronized and desktop refreshed!"
