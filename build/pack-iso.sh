#!/bin/bash
set -euo pipefail
cd ${ZOTH_HOME}/zothos/build/live_workspace

echo "✦ Cleaning up old assets from chroot..."
sudo rm -rf chroot/chroot chroot/home/neo
sudo rm -rf chroot/usr/share/zothos/assets/avatars chroot/usr/share/zothos/assets/mascot 2>/dev/null || true
[ -d chroot/usr/share/zothos/assets/brand ] && sudo find chroot/usr/share/zothos/assets/brand -type f -size +100k -exec rm -f {} + 2>/dev/null || true
[ -d chroot/usr/share/backgrounds/zothos ] && sudo find chroot/usr/share/backgrounds/zothos -type f ! -name 'zoth-gold-master.jpg' -exec rm -f {} + 2>/dev/null || true
sudo find chroot -name "*matrix-rain*" -exec rm -f {} + 2>/dev/null || true

echo "✦ Synchronizing config/includes.chroot..."
sudo rsync -aHAX --delete ../../config/includes.chroot/ config/includes.chroot/
sudo rsync -aHAX ../../config/includes.chroot/ chroot/

echo "✦ Enforcing strict root security permissions (sudoers, SUID sandboxes)..."
sudo chown -R root:root chroot/etc/sudoers.d chroot/etc/sudoers
sudo chmod 0755 chroot/etc/sudoers.d
sudo chmod 0440 chroot/etc/sudoers.d/* chroot/etc/sudoers 2>/dev/null || true

# Enforce SUID bit on Chromium & Electron sandbox helpers
for sb in chroot/opt/google/chrome/chrome-sandbox chroot/opt/Element/chrome-sandbox chroot/opt/Signal/chrome-sandbox chroot/opt/electron/chrome-sandbox; do
    if [ -f "$sb" ]; then
        sudo chown root:root "$sb"
        sudo chmod 4755 "$sb"
    fi
done

# Ensure tor-browser and simplex binaries are user-executable
sudo chmod -R u+rwX,go+rX chroot/opt/tor-browser 2>/dev/null || true
sudo chmod -R u+rwX,go+rX chroot/opt/simplex-desktop 2>/dev/null || true

echo "✦ Enforcing default user accounts (zoth & azoth)..."
sudo rm -rf chroot/home/neo 2>/dev/null || true
sudo mkdir -p chroot${ZOTH_HOME} chroot/home/azoth
sudo cp -a chroot/etc/skel/. chroot${ZOTH_HOME}/ 2>/dev/null || true
sudo cp -a chroot/etc/skel/. chroot/home/azoth/ 2>/dev/null || true
sudo chmod +x chroot/home/*/Desktop/*.desktop chroot/etc/skel/Desktop/*.desktop 2>/dev/null || true
sudo chroot chroot chown -R zoth:zoth ${ZOTH_HOME} 2>/dev/null || sudo chown -R 1000:1000 chroot${ZOTH_HOME}
sudo chroot chroot chown -R azoth:azoth /home/azoth 2>/dev/null || sudo chown -R 1001:1005 chroot/home/azoth
sudo chmod 750 chroot${ZOTH_HOME} chroot/home/azoth

echo "✦ Removing stray Debian installer desktop icons & stray images..."
sudo rm -f chroot/home/*/Desktop/calamares-install-debian.desktop 2>/dev/null || true
sudo rm -f chroot/etc/skel/Desktop/calamares-install-debian.desktop 2>/dev/null || true
sudo rm -f chroot/home/*/Desktop/burpsuite.png chroot/etc/skel/Desktop/burpsuite.png 2>/dev/null || true
sudo rm -f chroot/home/*/Desktop/zoth-matrix-rain.desktop chroot/etc/skel/Desktop/zoth-matrix-rain.desktop chroot/usr/share/applications/zoth-matrix-rain.desktop chroot/usr/local/bin/zoth-matrix-rain 2>/dev/null || true
sudo rm -rf chroot/opt/zoth-live-wallpaper chroot/usr/local/bin/zoth-animated-bg chroot/usr/share/applications/zoth-animated-bg.desktop 2>/dev/null || true

echo "✦ Enforcing systemd targets and canonical usr-merge symlinks..."
if [ ! -L chroot/lib ]; then
    sudo cp -a chroot/lib/. chroot/usr/lib/ 2>/dev/null || true
    sudo rm -rf chroot/lib
    sudo ln -sfn usr/lib chroot/lib
fi
sudo ln -sfn /usr/lib/systemd/system/graphical.target chroot/etc/systemd/system/default.target
sudo ln -sfn /usr/lib/systemd/system/sddm.service chroot/etc/systemd/system/display-manager.service

echo "✦ Synchronizing config/includes.binary, bootloaders, and hooks..."
sudo mkdir -p config/includes.binary config/bootloaders config/hooks/binary
sudo rsync -aHAX --delete ../../config/includes.binary/ config/includes.binary/
sudo rsync -aHAX --delete ../../config/bootloaders/ config/bootloaders/
sudo rsync -aHAX ../../config/hooks/ config/hooks/

echo "✦ Building live hybrid ISO..."
sudo rm -rf .build/binary_* binary live-image-amd64.hybrid.iso
yes | sudo lb binary || true
test -f live-image-amd64.hybrid.iso

cp -f live-image-amd64.hybrid.iso ${ZOTH_HOME}/zothos/build/zothos-1.0-amd64.iso
cp -f live-image-amd64.hybrid.iso ${ZOTH_HOME}/zothos/build/zothos-3.0-amd64.iso
chmod 644 ${ZOTH_HOME}/zothos/build/zothos-1.0-amd64.iso ${ZOTH_HOME}/zothos/build/zothos-3.0-amd64.iso || true
chown libvirt-qemu:libvirt-qemu ${ZOTH_HOME}/zothos/build/zothos-1.0-amd64.iso ${ZOTH_HOME}/zothos/build/zothos-3.0-amd64.iso 2>/dev/null || true

echo "✦ Verifying ISO filesystem..."
M1=$(mktemp -d)
trap 'sudo umount "$M1" 2>/dev/null || true; rm -rf "$M1"' EXIT
sudo mount -o loop,ro ${ZOTH_HOME}/zothos/build/zothos-1.0-amd64.iso "$M1"
test -f "$M1/live/filesystem.squashfs"
unsquashfs -s "$M1/live/filesystem.squashfs"
sudo umount "$M1"
trap - EXIT
rm -rf "$M1"

ls -lh ${ZOTH_HOME}/zothos/build/zothos-1.0-amd64.iso
echo "DONE_KDE_PLASMA_ISO"
