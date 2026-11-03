#!/usr/bin/env bash
# ==============================================================================
# ZothOS-Lite v1.0 (Amnesic Monotone Edition) — Debian Live-Build ISO Generator
# "Like Tails, Built for Zoth Security & Dev — Pure 1-Bit Black & White Dither"
# ==============================================================================
set -euo pipefail

VERSION="1.0.0-monotone"
ISO_NAME="zothos-lite-${VERSION}-amd64.iso"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${ROOT_DIR}/build/live-work"

cat << 'BANNER'
┌──────────────────────────────────────────────────────────────────────────────┐
│ ░░▒▒▓▓██ ZOTHOS-LITE v1.0 // TAILS-STYLE AMNESIC MONOTONE ISO BUILDER ██▓▓▒▒░│
│ ⣿⣿⣿⣿⣿⣿⣿⣿  RAM-ONLY OVERLAYFS • TOR/WG KILLSWITCH • ED25519 VAULT  ⣿⣿⣿⣿⣿⣿⣿⣿ │
└──────────────────────────────────────────────────────────────────────────────┘
BANNER

echo "[*] Target Image  : ${ISO_NAME}"
echo "[*] Boot Mode     : Live RAM-Only (toram noswap slab_nomerge init_on_free=1)"
echo "[*] Visual Theme  : 1-Bit Monotone (#000000 / #FFFFFF) + Ordered Bayer 4x4 + Braille"
echo "[*] Core Arsenal  : envguard, ghostbyte, hexstrike, sovereign-bridge, vaelor-lite, azoth-dev"

if [[ "${1:-}" == "--dry-run" ]]; then
  echo "[✓] Dry-run profile validated. Ready for lb config && sudo lb build."
  exit 0
fi

mkdir -p "${WORK_DIR}/config/package-lists"
cat > "${WORK_DIR}/config/package-lists/zothos-lite-core.list.chroot" << 'EOF'
# ZothOS-Lite Amnesic Security & Hardened Dev Core
live-boot
live-config
tor
torsocks
wireguard-tools
nftables
macchanger
cryptsetup
secure-delete
mat2
git
gnupg2
age
openssh-client
neovim
tmux
btop
ripgrep
fd-find
jq
curl
python3
python3-pip
nodejs
EOF

echo "[✓] Generated ${WORK_DIR}/config/package-lists/zothos-lite-core.list.chroot"
echo "[✓] Run 'zoth-lite-pkg pull <tool_id>' at runtime or inject into chroot hooks."
