#!/usr/bin/env bash
# ==============================================================================
#  ZOTHOS LIVE ISO BUILD SCRIPT
#  Builds a bootable hybrid UEFI/BIOS ISO: zothos-1.0-amd64.iso
#  Based on Debian 13 (Trixie) with Kali & Parrot Security Arsenal + Frontier AI
# ==============================================================================

set -e

GREEN="\e[1;32m"
CYAN="\e[1;36m"
YELLOW="\e[1;33m"
RED="\e[1;31m"
BOLD="\e[1m"
RESET="\e[0m"

echo -e "${GREEN}${BOLD}"
echo "  ╔════════════════════════════════════════════════════════════════════╗"
echo "  ║                  ZOTHOS DISTRIBUTION BUILDER                      ║"
echo "  ║              The Alchemical & Agentic Security OS                  ║"
echo "  ╚════════════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"

if [[ $EUID -ne 0 ]]; then
    echo -e "${RED}[!] This build script requires root privileges to configure chroot and loop devices.${RESET}"
    echo -e "    Please run: sudo bash $0"
    exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$PROJECT_DIR/build/live_workspace"

echo -e "${CYAN}[1/6] Verifying host build prerequisites...${RESET}"
MISSING_PKGS=()
for pkg in live-build debootstrap xorriso squashfs-tools isolinux syslinux-common; do
    if ! dpkg -l "$pkg" >/dev/null 2>&1; then
        MISSING_PKGS+=("$pkg")
    fi
done

if [[ ${#MISSING_PKGS[@]} -gt 0 ]]; then
    echo -e "${YELLOW}[*] Installing missing build tools: ${MISSING_PKGS[*]}...${RESET}"
    apt-get update -y
    apt-get install -y "${MISSING_PKGS[@]}"
fi

echo -e "${CYAN}[2/6] Setting up clean workspace at $WORK_DIR ...${RESET}"
umount -l "$WORK_DIR/chroot/proc" 2>/dev/null || true
umount -l "$WORK_DIR/chroot/sys" 2>/dev/null || true
umount -l "$WORK_DIR/chroot/dev/pts" 2>/dev/null || true
umount -l "$WORK_DIR/chroot/dev" 2>/dev/null || true
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo -e "${CYAN}[3/6] Initializing live-build configuration...${RESET}"
# ZOTHOS-LOCALFIX: LIVE_BUILD must point to a live-build git checkout, not /usr/lib/live;
# setting it breaks binary_grub_cfg/binary_syslinux (cp: cannot stat /usr/lib/live/share/bootloaders/...).
unset LIVE_BUILD
lb config \
    --distribution trixie \
    --architecture amd64 \
    --archive-areas "main contrib non-free non-free-firmware" \
    --bootloaders "syslinux grub-efi" \
    --binary-images iso-hybrid \
    --iso-application "ZOTHOS Linux 1.0 (Azoth)" \
    --iso-publisher "Zoth Studio & NullAI <https://zoth.nullai.tech>" \
    --iso-volume "ZOTHOS_1.0" \
    --initramfs live-boot \
    --linux-flavours amd64 \
    --linux-packages linux-image \
    --bootappend-live "boot=live components username=zoth hostname=zothos quiet splash systemd.unit=graphical.target" \
    --apt-secure false \
    --apt-options "--yes --ignore-missing"

# ZOTHOS-LOCALFIX: live-build reads repos from config/archives/*.list.chroot,
# NOT config/apt/sources.list.d (that dir was silently ignored, so Kali/Parrot
# packages were never available in the previous builds).
mkdir -p "$WORK_DIR/config/archives"
cat > "$WORK_DIR/config/archives/kali.list.chroot" << 'KALEOF'
deb [trusted=yes] http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware
KALEOF
# Vendor apt repos for desktop apps not in Debian/Kali (Google Chrome, Element,
# Signal), installed by build/hooks/normal/0500-zothos-desktop-apps.hook.chroot.
# *.list/*.key are used during the build AND kept in the image for updates;
# *.list.chroot/*.key.chroot are build-only (Chrome ships its own apt source).
if [ -d "$PROJECT_DIR/config/archives" ]; then
    cp -a "$PROJECT_DIR/config/archives/." "$WORK_DIR/config/archives/"
fi
# ZOTHOS-LOCALFIX: apt pinning must be active DURING the build (config/archives/*.pref.chroot).
# Without it, Kali rolling (same priority 500, newer versions) dist-upgrades libc6/perl/python
# of the trixie base and the package install stage collapses into unmet dependencies.
cat > "$WORK_DIR/config/archives/zothos.pref.chroot" << 'PREFEOF'
Package: *
Pin: release o=Debian
Pin-Priority: 700

Package: *
Pin: release o=Kali
Pin-Priority: 100

Package: *
Pin: release o=Parrot
Pin-Priority: 100
PREFEOF
# ZOTHOS-LOCALFIX: deb.parrot.sh is unreachable from this build host (TLS EOF);
# using an official Parrot mirror instead. Set to true to enable.
ENABLE_PARROT="${ENABLE_PARROT:-false}"
if [ "$ENABLE_PARROT" = "true" ]; then
cat > "$WORK_DIR/config/archives/parrot.list.chroot" << 'PAROTEOF'
deb [trusted=yes] https://parrot.mirror.garr.it/mirrors/parrot parrot main contrib non-free
PAROTEOF
fi

echo -e "${CYAN}[4/6] Staging package lists and chroot inclusions...${RESET}"
mkdir -p config/package-lists
cp "$PROJECT_DIR/package-lists/"*.list.chroot config/package-lists/
# Also stage the rich native package lists (00-core .. 90-science, aliases) so
# the full desktop/security/AI/media/web3 arsenal actually gets baked into the ISO.
cp "$PROJECT_DIR"/config/package-lists/*.list.chroot config/package-lists/ 2>/dev/null || true

mkdir -p config/includes.chroot
# Copy ALL chroot overlay files recursively preserving permissions and hierarchy
cp -a "$PROJECT_DIR/config/includes.chroot/." config/includes.chroot/

# Ensure all scripts inside /usr/local/bin have execution bit set
chmod +x config/includes.chroot/usr/local/bin/* 2>/dev/null || true

# Add chroot post-install hook to configure default user and services
mkdir -p config/hooks/normal
cat <<'EOF' > config/hooks/normal/0000-install-initramfs.hook.chroot
#!/bin/sh
set -e
echo "[ZOTHOS HOOK] Guaranteeing desktop, LightDM, initramfs-tools & linux-image..."
apt-get update -y || true
apt-get install -y --no-install-recommends initramfs-tools linux-image-amd64 live-boot xfce4 xfce4-terminal xfce4-goodies lightdm lightdm-gtk-greeter xorg x11-xserver-utils desktop-base dbus-x11 at-spi2-core xfce4-settings || true
EOF
chmod +x config/hooks/normal/0000-install-initramfs.hook.chroot

cat <<'EOF' > config/hooks/normal/099-zothos-setup.hook.chroot
#!/bin/sh
set -e

if ! id "zoth" >/dev/null 2>&1; then
    groupadd -f docker || true
    useradd -m -s /bin/bash -G sudo,audio,video zoth; useradd -m -s /bin/bash -G sudo,audio,video azoth 2>/dev/null || true
    echo "zoth:zoth"; echo "azoth:zoth" | chpasswd
fi

# Enable NetworkManager and LightDM
systemctl enable NetworkManager || true
systemctl enable lightdm || true
systemctl enable tor || true
systemctl set-default graphical.target || true

# Configure Plymouth default boot splash
if command -v plymouth-set-default-theme >/dev/null 2>&1; then
    plymouth-set-default-theme -R zothos-matrix 2>/dev/null || plymouth-set-default-theme -R zoth-matrix 2>/dev/null || true
fi

# Setup Fastfetch / Bash defaults
cp -rf /etc/skel/. ${ZOTH_HOME}/
chown -R zoth:zoth ${ZOTH_HOME}

echo "[ZOTHOS HOOK] Complete."
EOF
chmod +x config/hooks/normal/099-zothos-setup.hook.chroot

# Stage repository chroot hooks (build/hooks/normal/*.hook.chroot)
if compgen -G "$PROJECT_DIR/build/hooks/normal/*.hook.chroot" >/dev/null; then
    cp -a "$PROJECT_DIR"/build/hooks/normal/*.hook.chroot config/hooks/normal/
    chmod +x config/hooks/normal/*.hook.chroot
fi

echo -e "${CYAN}[5/6] Generating 4K wallpapers & 3D visual assets...${RESET}"
# Execute master wallpaper, 3D glassmorphic icon, and Plymouth theme synthesizers
if [ -f "$PROJECT_DIR/tools/generate_plymouth_assets.py" ]; then
    python3 "$PROJECT_DIR/tools/generate_plymouth_assets.py" 2>&1 | tail -5
fi
if [ -f "$PROJECT_DIR/generate_zoth_wallpapers.py" ]; then
    python3 "$PROJECT_DIR/generate_zoth_wallpapers.py" 2>&1 | tail -5
fi
if [ -f "$PROJECT_DIR/generate_zoth_icons.py" ]; then
    python3 "$PROJECT_DIR/generate_zoth_icons.py" 2>&1 | tail -5
fi
cp -a "$PROJECT_DIR/config/includes.chroot/usr/share/backgrounds/zothos" config/includes.chroot/usr/share/backgrounds/ 2>/dev/null || true
cp -a "$PROJECT_DIR/config/includes.chroot/usr/share/icons/." config/includes.chroot/usr/share/icons/ 2>/dev/null || true
cp -a "$PROJECT_DIR/config/includes.chroot/usr/share/plymouth/themes/." config/includes.chroot/usr/share/plymouth/themes/ 2>/dev/null || true

echo -e "${GREEN}[6/6] Starting Live-Build execution (lb build)...${RESET}"
echo -e "${YELLOW}[*] This will bootstrap the Debian base, fetch security & AI packages, and compile the ISO.${RESET}"
# ZOTHOS-LOCALFIX: LIVE_BUILD must point to a live-build git checkout, not /usr/lib/live;
# setting it breaks binary_grub_cfg/binary_syslinux (cp: cannot stat /usr/lib/live/share/bootloaders/...).
unset LIVE_BUILD
lb build 2>&1 | tee /tmp/lb-build.log

if [[ -f live-image-amd64.hybrid.iso ]]; then
    mv live-image-amd64.hybrid.iso "$PROJECT_DIR/build/zothos-1.0-amd64.iso"
    echo -e "\n${GREEN}${BOLD}[✓] SUCCESS: ZOTHOS ISO built at: $PROJECT_DIR/build/zothos-1.0-amd64.iso${RESET}\n"
else
    echo -e "\n${YELLOW}[!] Build finished. Inspect workspace logs in $WORK_DIR${RESET}\n"
fi
