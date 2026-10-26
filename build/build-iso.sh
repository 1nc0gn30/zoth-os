#!/usr/bin/env bash
# ==============================================================================
#  ZOTHOS LIVE ISO BUILD SCRIPT
#  Builds a bootable hybrid UEFI/BIOS ISO: zothos-<VERSION>-amd64.iso (version from ./VERSION)
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
ZOTHOS_VERSION="$(tr -d '[:space:]' < "$PROJECT_DIR/VERSION")"   # e.g. 3.2.0
ISO_VER="${ZOTHOS_VERSION%.*}"                                   # e.g. 3.2
ISO_NAME="zothos-${ISO_VER}-amd64.iso"
SQUASHFS_PROCS="${ZOTHOS_SQUASHFS_PROCS:-6}"                     # thermal cap; override via env

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
# --- Reproducibility (audit §8) ------------------------------------------------
# Pin every timestamp to the last git commit unless the caller sets it.
export SOURCE_DATE_EPOCH="${SOURCE_DATE_EPOCH:-$(git -C "$PROJECT_DIR" log -1 --format=%ct 2>/dev/null || date +%s)}"
export TZ=UTC LC_ALL=C.UTF-8
# Deterministic squashfs via SOURCE_DATE_EPOCH only. mksquashfs 4.6+ rejects
# combining SOURCE_DATE_EPOCH with -mkfs-time/-all-time/-fstime CLI flags.
export MKSQUASHFS_OPTIONS="-processors $SQUASHFS_PROCS -mem 3G -no-exports"
# Optional: pin the Debian archive to a snapshot.debian.org date (e.g. 20261003T000000Z)
# so package versions are fixed. Unset = live mirror (not reproducible).
ZOTHOS_SNAPSHOT="${ZOTHOS_SNAPSHOT:-}"

lb config \
    --distribution trixie \
    --architecture amd64 \
    --archive-areas "main contrib non-free non-free-firmware" \
    --bootloaders "syslinux grub-efi" \
    --binary-images iso-hybrid \
    --iso-application "ZOTHOS Linux ${ISO_VER}" \
    --iso-publisher "Zoth Studio & NullAI <https://zoth.nullai.tech>" \
    --iso-volume "ZOTHOS_${ISO_VER}" \
    --initramfs live-boot \
    --debootstrap-options "--include=ca-certificates" \
    --linux-flavours amd64 \
    --linux-packages linux-image \
    --bootappend-live "boot=live components username=zoth hostname=zothos quiet splash systemd.unit=graphical.target" \
    --apt-secure true \
    --apt-options "--yes --ignore-missing" \
    ${ZOTHOS_SNAPSHOT:+--mirror-bootstrap "https://snapshot.debian.org/archive/debian/$ZOTHOS_SNAPSHOT/" --mirror-chroot "https://snapshot.debian.org/archive/debian/$ZOTHOS_SNAPSHOT/" --mirror-binary "https://deb.debian.org/debian/"}

# ZOTHOS-FIX (v3.2): the Kali/Chrome/Element/Signal archives are https, and live-build runs
# apt-get update for them right after debootstrap. A minbase chroot has no CA bundle, so every
# third-party InRelease failed with "certificate verify failed" and all Kali-only packages
# (caido, sliver, ghidra, seclists, ...) became "Unable to locate package". v3.1 used
# http + [trusted=yes]; we keep https + pinned signing keys and bootstrap ca-certificates instead.
# ZOTHOS-LOCALFIX: live-build reads repos from config/archives/*.list.chroot,
# NOT config/apt/sources.list.d (that dir was silently ignored, so Kali/Parrot
# packages were never available in the previous builds).
mkdir -p "$WORK_DIR/config/archives"
# Signature checking stays ON (audit P0-4): third-party archives are verified
# against keyrings shipped in this repo, after checking their pinned fingerprints.
KALI_KEY_FPR="827C8569F2518CC677FECA1AED65462EC8D5E4C5"     # kali.org/docs/introduction/download-images-securely
PARROT_KEY_FPR="B711822346552E4D92DA02DF7A8286AF0E81EE4A"   # Parrot Project (2024-2026)
stage_archive_key() {  # <keyring.gpg> <expected fingerprint> <out .key.chroot>
    local fpr
    fpr=$(gpg --show-keys --with-colons "$1" 2>/dev/null | awk -F: '/^fpr/{print $10; exit}')
    if [ "$fpr" != "$2" ]; then
        echo "FATAL: $1 fingerprint '$fpr' != pinned '$2'; refusing to build with an unverified archive key." >&2
        exit 1
    fi
    gpg --no-default-keyring --keyring "$1" --export --armor > "$3"
}
KEYDIR="$PROJECT_DIR/config/includes.chroot/etc/apt/trusted.gpg.d"
stage_archive_key "$KEYDIR/kali-archive-keyring.gpg" "$KALI_KEY_FPR" "$WORK_DIR/config/archives/kali.key.chroot"
cat > "$WORK_DIR/config/archives/kali.list.chroot" << 'KALEOF'
deb https://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware
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
stage_archive_key "$KEYDIR/parrot-archive-keyring.gpg" "$PARROT_KEY_FPR" "$WORK_DIR/config/archives/parrot.key.chroot"
cat > "$WORK_DIR/config/archives/parrot.list.chroot" << 'PAROTEOF'
deb https://parrot.mirror.garr.it/mirrors/parrot parrot main contrib non-free
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
echo "[ZOTHOS HOOK] Guaranteeing kernel, initramfs & bootloader essentials..."
apt-get update -y || true
apt-get install -y --no-install-recommends initramfs-tools linux-image-amd64 live-boot live-config live-config-systemd sddm || true
EOF
chmod +x config/hooks/normal/0000-install-initramfs.hook.chroot

cat <<'EOF' > config/hooks/normal/099-zothos-setup.hook.chroot
#!/bin/sh
set -e

if ! id "zoth" >/dev/null 2>&1; then
    groupadd -f docker || true
    useradd -m -s /bin/bash -G sudo,audio,video,docker zoth || true
    useradd -m -s /bin/bash -G sudo,audio,video,docker azoth || true
    echo "zoth:zoth" | chpasswd
    echo "azoth:zoth" | chpasswd
fi

# Enable NetworkManager and SDDM
systemctl enable NetworkManager || true
systemctl enable sddm || true
systemctl enable tor || true
systemctl set-default graphical.target || true

# Enforce SGID shadow on unix_chkpwd for PAM unlock and screen locker
for chkpwd_bin in /usr/sbin/unix_chkpwd /sbin/unix_chkpwd; do
    if [ -f "$chkpwd_bin" ]; then
        chown root:shadow "$chkpwd_bin"
        chmod 2755 "$chkpwd_bin"
    fi
done

# Enforce SUID bit on Chromium & Electron sandbox helpers
for sb in /opt/google/chrome/chrome-sandbox /opt/Element/chrome-sandbox /opt/Signal/chrome-sandbox /opt/electron/chrome-sandbox; do
    if [ -f "$sb" ]; then
        chown root:root "$sb"
        chmod 4755 "$sb"
    fi
done

# Configure Plymouth default boot splash
if command -v plymouth-set-default-theme >/dev/null 2>&1; then
    plymouth-set-default-theme -R zothos 2>/dev/null || plymouth-set-default-theme -R zoth-matrix 2>/dev/null || true
fi

# Setup Fastfetch / Bash defaults
ZOTH_USER="${ZOTH_USER:-zoth}"
AZOTH_USER="${AZOTH_USER:-azoth}"
ZOTH_HOME="${ZOTH_HOME:-/home/${ZOTH_USER}}"
AZOTH_HOME="${AZOTH_HOME:-/home/${AZOTH_USER}}"
cp -rf /etc/skel/. "${ZOTH_HOME}/" 2>/dev/null || true
cp -rf /etc/skel/. "${AZOTH_HOME}/" 2>/dev/null || true
chown -R "${ZOTH_USER}:${ZOTH_USER}" "${ZOTH_HOME}" 2>/dev/null || true
chown -R "${AZOTH_USER}:${AZOTH_USER}" "${AZOTH_HOME}" 2>/dev/null || true
chmod 750 "${ZOTH_HOME}" "${AZOTH_HOME}" 2>/dev/null || true

echo "[ZOTHOS HOOK] Complete."
EOF
chmod +x config/hooks/normal/099-zothos-setup.hook.chroot

# Stage repository chroot hooks (build/hooks/normal/*.hook.chroot)
if compgen -G "$PROJECT_DIR/build/hooks/normal/*.hook.chroot" >/dev/null; then
    cp -a "$PROJECT_DIR"/build/hooks/normal/*.hook.chroot config/hooks/normal/
    chmod +x config/hooks/normal/*.hook.chroot
fi

echo -e "${CYAN}[5/6] Verifying pre-built wallpapers & visual assets...${RESET}"
cp -a "$PROJECT_DIR/config/includes.chroot/usr/share/backgrounds/zothos" config/includes.chroot/usr/share/backgrounds/ 2>/dev/null || true
cp -a "$PROJECT_DIR/config/includes.chroot/usr/share/icons/." config/includes.chroot/usr/share/icons/ 2>/dev/null || true
cp -a "$PROJECT_DIR/config/includes.chroot/usr/share/plymouth/themes/." config/includes.chroot/usr/share/plymouth/themes/ 2>/dev/null || true

echo -e "${GREEN}[6/6] Starting Live-Build execution (lb build)...${RESET}"
echo -e "${YELLOW}[*] This will bootstrap the Debian base, fetch security & AI packages, and compile the ISO.${RESET}"
# ZOTHOS-LOCALFIX: LIVE_BUILD must point to a live-build git checkout, not /usr/lib/live;
# setting it breaks binary_grub_cfg/binary_syslinux (cp: cannot stat /usr/lib/live/share/bootloaders/...).
unset LIVE_BUILD
# (MKSQUASHFS_OPTIONS + SOURCE_DATE_EPOCH set above; no CLI timestamp flags)
nice -n 10 lb build 2>&1 | tee /tmp/lb-build.log

if [[ -f live-image-amd64.hybrid.iso ]]; then
    mv live-image-amd64.hybrid.iso "$PROJECT_DIR/build/${ISO_NAME}"
    chmod 644 "$PROJECT_DIR"/build/zothos-*.iso || true
    chown "$SUDO_USER:$SUDO_USER" "$PROJECT_DIR"/build/zothos-*.iso 2>/dev/null || true
    cd "$PROJECT_DIR/build"
    sha256sum ${ISO_NAME} > ${ISO_NAME}.sha256
    echo -e "\n${GREEN}${BOLD}[✓] SUCCESS: ZOTHOS ISO built at: $PROJECT_DIR/build/${ISO_NAME}${RESET}\n"
else
    echo -e "\n${RED}[✗] FAILED: no ISO produced. See /tmp/lb-build.log and $WORK_DIR${RESET}"
    grep -E "Failed to fetch|Unable to locate package|no installation candidate" /tmp/lb-build.log | sort -u | head -20 || true
    exit 1
fi
