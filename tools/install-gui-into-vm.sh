#!/usr/bin/env bash
# ==============================================================================
#  INSTALL XFCE4 GUI & LIGHTDM AUTOLOGIN INTO ZOTHOS VM
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

VM_DISK="${VM_DISK:-$ROOT_DIR/build/vms/zothos.qcow2}"
VM_USER="${VM_USER:-zoth}"

echo "[*] Installing XFCE4 Desktop Environment & LightDM into ZOTHOS VM ($VM_DISK)..."

virt-customize -a "$VM_DISK" \
    --network \
    --run-command "apt-get update" \
    --install xserver-xorg,xinit,xfce4,xfce4-terminal,xfce4-whiskermenu-plugin,lightdm,lightdm-gtk-greeter,picom \
    --run-command "mkdir -p /etc/lightdm/lightdm.conf.d" \
    --run-command "printf '[Seat:*]\nautologin-user=$VM_USER\nautologin-user-timeout=0\nuser-session=xfce\n' > /etc/lightdm/lightdm.conf.d/01_autologin.conf" \
    --run-command "groupadd -r autologin 2>/dev/null || true" \
    --run-command "gpasswd -a $VM_USER autologin 2>/dev/null || true" \
    --run-command "gpasswd -a $VM_USER video 2>/dev/null || true" \
    --run-command "systemctl set-default graphical.target" \
    --run-command "systemctl enable lightdm 2>/dev/null || true" \
    --run-command "mkdir -p /home/$VM_USER/.config/xfce4/xfconf/xfce-perchannel-xml" \
    --run-command "chown -R $VM_USER:$VM_USER /home/$VM_USER/.config"

echo "[✓] GUI installation and LightDM autologin configured."
