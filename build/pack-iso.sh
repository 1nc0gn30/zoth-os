PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$PROJECT_DIR/build/live_workspace"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"
export MKSQUASHFS_OPTIONS="-processors 3 -mem 3G"

echo "✦ Cleaning up old assets from chroot..."
sudo rm -rf chroot/chroot chroot/home/neo
sudo rm -rf chroot/usr/share/zothos/assets/avatars chroot/usr/share/zothos/assets/mascot 2>/dev/null || true
[ -d chroot/usr/share/zothos/assets/brand ] && sudo find chroot/usr/share/zothos/assets/brand -type f -size +100k -exec rm -f {} + 2>/dev/null || true
[ -d chroot/usr/share/backgrounds/zothos ] && sudo find chroot/usr/share/backgrounds/zothos -type f ! -name 'zoth-gold-master.jpg' -exec rm -f {} + 2>/dev/null || true
sudo find chroot -name "*matrix-rain*" -exec rm -f {} + 2>/dev/null || true

echo "✦ Synchronizing config/includes.chroot..."
sudo rsync -aHAX --delete ../../config/includes.chroot/ config/includes.chroot/
sudo rsync -aHAX ../../config/includes.chroot/ chroot/

echo "✦ Scrubbing sensitive data, histories, and build caches..."
sudo find chroot -name ".aider*" -exec rm -rf {} + 2>/dev/null || true
sudo find chroot -name ".bash_history" -exec rm -f {} + 2>/dev/null || true
sudo find chroot -name ".zsh_history" -exec rm -f {} + 2>/dev/null || true
sudo find chroot -name ".lesshst" -exec rm -f {} + 2>/dev/null || true
sudo find chroot -name ".viminfo" -exec rm -f {} + 2>/dev/null || true
sudo umount -l chroot/home/*/.cache/doc 2>/dev/null || true
sudo rm -rf chroot/home/*/.cache/* 2>/dev/null || true
sudo rm -rf chroot/root/.cache chroot/root/.local chroot/root/.aider 2>/dev/null || true
# Clean non-bootloader apt archives, preserving grub/bootloader packages for offline installation
sudo find chroot/var/cache/apt/archives -name "*.deb" ! -name "grub*" ! -name "cryptsetup*" ! -name "efibootmgr*" ! -name "shim*" ! -name "console-setup*" ! -name "kbd*" -delete 2>/dev/null || true
sudo rm -rf chroot/tmp/appimage_extracted_* chroot/tmp/testenv chroot/tmp/node-compile-cache chroot/tmp/scoped_dir* chroot/tmp/hsperfdata_* 2>/dev/null || true
sudo find chroot/tmp -mindepth 1 ! -name ".X11-unix" ! -name ".ICE-unix" -delete 2>/dev/null || true
sudo mkdir -p chroot/tmp/.X11-unix chroot/tmp/.ICE-unix
sudo chmod 1777 chroot/tmp chroot/tmp/.X11-unix chroot/tmp/.ICE-unix
sudo find chroot/var/log -type f -exec truncate -s 0 {} + 2>/dev/null || true
sudo rm -rf chroot/var/log/journal/* 2>/dev/null || true

echo "✦ Enforcing strict root:root ownership on all system directories..."
sudo chown root:root chroot
sudo chown -R root:root chroot/etc chroot/usr chroot/var chroot/opt chroot/boot chroot/root
sudo chown -R 997:988 chroot/usr/share/ollama 2>/dev/null || true


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

# Enforce SUID bit on standard system binaries (sudo, su, pkexec, mount, umount, passwd, etc.)
for suid_bin in chroot/usr/bin/sudo chroot/usr/bin/su chroot/usr/bin/pkexec chroot/usr/bin/mount \
                chroot/usr/bin/umount chroot/usr/bin/passwd chroot/usr/bin/chfn chroot/usr/bin/chsh \
                chroot/usr/bin/newgrp chroot/usr/bin/gpasswd chroot/usr/bin/newuidmap chroot/usr/bin/newgidmap \
                chroot/usr/bin/fusermount3 chroot/usr/bin/ntfs-3g \
                chroot/usr/lib/dbus-1.0/dbus-daemon-launch-helper \
                chroot/usr/lib/polkit-1/polkit-agent-helper-1 \
                chroot/usr/libexec/polkit-agent-helper-1; do
    if [ -f "$suid_bin" ]; then
        sudo chown root:root "$suid_bin"
        sudo chmod 4755 "$suid_bin"
    fi
done

# Enforce SGID shadow on unix_chkpwd for PAM unlock and screen locker
for chkpwd_bin in chroot/usr/sbin/unix_chkpwd chroot/sbin/unix_chkpwd; do
    if [ -f "$chkpwd_bin" ]; then
        sudo chown root:shadow "$chkpwd_bin"
        sudo chmod 2755 "$chkpwd_bin"
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

echo "✦ Synchronizing config/binary, config/includes.binary, bootloaders, and hooks..."
sudo cp -f ../../config/binary config/binary
sudo mkdir -p config/includes.binary config/bootloaders config/hooks/binary
sudo rsync -aHAX --delete ../../config/includes.binary/ config/includes.binary/
sudo rsync -aHAX --delete ../../config/bootloaders/ config/bootloaders/
sudo rsync -aHAX ../../config/hooks/ config/hooks/

echo "✦ Building live hybrid ISO..."
sudo rm -rf .build/binary_* binary live-image-amd64.hybrid.iso
yes | sudo lb binary || true
test -f live-image-amd64.hybrid.iso

cp -f live-image-amd64.hybrid.iso "$PROJECT_DIR/build/zothos-3.1-amd64.iso"
cp -f "$PROJECT_DIR/build/zothos-3.1-amd64.iso" "$PROJECT_DIR/build/zothos-3.0-amd64.iso"
cp -f "$PROJECT_DIR/build/zothos-3.1-amd64.iso" "$PROJECT_DIR/build/zothos-1.0-amd64.iso"
chmod 644 "$PROJECT_DIR"/build/zothos-*.iso || true
chown "$SUDO_USER:$SUDO_USER" "$PROJECT_DIR"/build/zothos-*.iso 2>/dev/null || true
cd "$PROJECT_DIR/build"
sha256sum zothos-3.1-amd64.iso > zothos-3.1-amd64.iso.sha256

echo "✦ Verifying ISO filesystem..."
M1=$(mktemp -d)
trap 'sudo umount "$M1" 2>/dev/null || true; rm -rf "$M1"' EXIT
sudo mount -o loop,ro "$PROJECT_DIR/build/zothos-3.1-amd64.iso" "$M1"
test -f "$M1/live/filesystem.squashfs"
unsquashfs -s "$M1/live/filesystem.squashfs"
sudo umount "$M1"
trap - EXIT
rm -rf "$M1"

ls -lh "$PROJECT_DIR/build/zothos-3.1-amd64.iso"
echo "DONE_KDE_PLASMA_ISO"
