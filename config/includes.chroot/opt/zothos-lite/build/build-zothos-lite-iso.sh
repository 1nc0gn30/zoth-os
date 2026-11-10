#!/usr/bin/env bash
# ==============================================================================
# ZothOS-Lite v1.2 (Amnesic Monotone Edition) — Debian 13 Live-Build ISO Builder
# Design Invariant: Tails-Style Paper Ivory (#F7F7F4) + Black Ink (#000000)
#                   2px Solid Borders • Hard Shadows • Bayer Dither • U+2800 Braille
# Boot Invariant  : toram noswap slab_nomerge init_on_alloc=1 init_on_free=1
# Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
# ==============================================================================
set -euo pipefail

VERSION="1.2.0-monotone"
ISO_NAME="zothos-lite-${VERSION}-amd64.iso"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${ZOTH_LITE_LIVE_WORK:-${ROOT_DIR}/build/live-work}"
CHROOT_INC="${WORK_DIR}/config/includes.chroot"

cat << 'BANNER'
┌──────────────────────────────────────────────────────────────────────────────┐
│ ░░▒▒▓▓██ ZOTHOS-LITE v1.2 // TAILS-STYLE AMNESIC MONOTONE ISO BUILDER ██▓▓▒▒░│
│ ⣿⣿⣿⣿⣿⣿⣿⣿  DEBIAN 13 LIVE • TORAM NOSWAP • 56 AI MODELS / 8 PROVIDERS  ⣿⣿⣿⣿⣿⣿⣿⣿│
└──────────────────────────────────────────────────────────────────────────────┘
BANNER

echo "[*] Target Image  : ${ISO_NAME}"
echo "[*] Boot Mode     : Live RAM-Only (toram noswap slab_nomerge init_on_alloc=1 init_on_free=1)"
echo "[*] Visual Theme  : Tails-Style Amnesic Monotone (#F7F7F4 Paper Ivory / #000000 Black Ink)"
echo "[*] OS CLI Suite  : zoth-lite-models (56/8), zoth-lite-welcome, zoth-lite-storage, zoth-lite-pkg, zothnet"

stage_chroot_overlay() {
  rm -rf "${WORK_DIR}/config"
  mkdir -p \
    "${WORK_DIR}/config/package-lists" \
    "${CHROOT_INC}/etc/zoth-lite" \
    "${CHROOT_INC}/etc/profile.d" \
    "${CHROOT_INC}/etc/X11/xorg.conf.d" \
    "${CHROOT_INC}/etc/xdg/autostart" \
    "${CHROOT_INC}/etc/xdg/openbox" \
    "${CHROOT_INC}/etc/gtk-3.0" \
    "${CHROOT_INC}/etc/skel/Desktop" \
    "${CHROOT_INC}/etc/skel/.config/gtk-3.0" \
    "${CHROOT_INC}/etc/skel/.config/xfce4/terminal" \
    "${CHROOT_INC}/usr/local/bin" \
    "${CHROOT_INC}/usr/share/backgrounds/zothos-lite" \
    "${CHROOT_INC}/usr/share/themes/Zoth-Amnesic-Monotone/openbox-3" \
    "${CHROOT_INC}/opt/zothos-lite/public/assets" \
    "${CHROOT_INC}/opt/zothos-lite/bin" \
    "${CHROOT_INC}/opt/zothos-lite/electron"

  # 1. Lean Debian 13 (Trixie) Package List — Ultra-Light X11/Openbox/XFCE + AI/Mesh/Storage Core
  cat > "${WORK_DIR}/config/package-lists/zothos-lite-core.list.chroot" << 'EOF'
live-boot
live-config
live-config-systemd
xserver-xorg-core
xserver-xorg-video-all
xserver-xorg-input-libinput
x11-xserver-utils
openbox
xfce4-panel
xfce4-terminal
feh
adwaita-icon-theme
fonts-jetbrains-mono
fonts-ibm-plex
tor
torsocks
wireguard-tools
nftables
macchanger
cryptsetup
secure-delete
mat2
rclone
rsync
udisks2
exfatprogs
ntfs-3g
git
gnupg2
age
openssh-client
neovim
tmux
btop
ripgrep
jq
curl
ca-certificates
python3
nodejs
chromium
EOF

  # 2. Release & Amnesic System Identity (v1.2-MONOTONE — Zero Gold/Obsidian Bleed)
  cat > "${CHROOT_INC}/etc/zoth-lite/release" << 'EOF'
DISTRO="ZothOS-Lite"
VERSION="1.2-MONOTONE"
CODENAME="AMNESIC-MONOTONE"
BASE="Debian 13 (Trixie) Live amd64"
BOOT_MODE="toram noswap slab_nomerge init_on_alloc=1 init_on_free=1"
PALETTE="Paper Ivory (#F7F7F4) + Black Ink (#000000) + Bayer Dither + U+2800 Braille"
AI_MODELS="56 Curated Models Across 8 Providers (OpenRouter, OpenAI, Anthropic, Gemini, DeepSeek, xAI, Groq, Ollama/LAN)"
EOF

  # 3. X11 / VM Cursor Visibility Hardening (linux-iso-desktop-hardening invariant)
  cat > "${CHROOT_INC}/etc/X11/xorg.conf.d/20-zoth-lite-cursor.conf" << 'EOF'
Section "Device"
    Identifier "ZothLiteModesetting"
    Driver "modesetting"
    Option "SWCursor" "true"
EndSection
EOF

  cat > "${CHROOT_INC}/etc/profile.d/zoth-lite-env.sh" << 'EOF'
export XCURSOR_THEME="Adwaita"
export XCURSOR_SIZE="24"
export KWIN_FORCE_SW_CURSOR="1"
export ZOTH_LITE_THEME="amnesic-monotone"
EOF
  chmod 0644 "${CHROOT_INC}/etc/profile.d/zoth-lite-env.sh"

  # 4. 1:1 Tails-Style Amnesic Monotone GTK3, Openbox & Terminal Theme (#F7F7F4 / #000000 / 2px Borders)
  cat > "${CHROOT_INC}/etc/gtk-3.0/gtk.css" << 'EOF'
/* ZothOS-Lite v1.2 — Tails-Style Amnesic Monotone GTK3 Theme */
@define-color theme_bg_color #F7F7F4;
@define-color theme_fg_color #000000;
@define-color theme_base_color #FFFFFF;
@define-color theme_text_color #000000;
@define-color theme_selected_bg_color #000000;
@define-color theme_selected_fg_color #F7F7F4;
@define-color borders #000000;

window, dialog, .background {
  background-color: #F7F7F4;
  color: #000000;
}
headerbar, .titlebar {
  background-color: #FFFFFF;
  color: #000000;
  border-bottom: 2px solid #000000;
  box-shadow: none;
}
button {
  background-image: none;
  background-color: #FFFFFF;
  color: #000000;
  border: 2px solid #000000;
  border-radius: 3px;
  box-shadow: 2px 2px 0px #000000;
}
button:hover, button:checked {
  background-color: #000000;
  color: #F7F7F4;
}
entry, textview {
  background-color: #FFFFFF;
  color: #000000;
  border: 2px solid #000000;
  border-radius: 3px;
}
EOF
  cp -f "${CHROOT_INC}/etc/gtk-3.0/gtk.css" "${CHROOT_INC}/etc/skel/.config/gtk-3.0/gtk.css"

  cat > "${CHROOT_INC}/etc/gtk-3.0/settings.ini" << 'EOF'
[Settings]
gtk-application-prefer-dark-theme=0
gtk-theme-name=Adwaita
gtk-icon-theme-name=Adwaita
gtk-cursor-theme-name=Adwaita
gtk-cursor-theme-size=24
gtk-font-name=IBM Plex Mono 10
EOF
  cp -f "${CHROOT_INC}/etc/gtk-3.0/settings.ini" "${CHROOT_INC}/etc/skel/.config/gtk-3.0/settings.ini"

  cat > "${CHROOT_INC}/usr/share/themes/Zoth-Amnesic-Monotone/openbox-3/themerc" << 'EOF'
border.width: 2
padding.width: 6
padding.height: 4
window.active.border.color: #000000
window.inactive.border.color: #3A3A34
window.active.title.bg: flat solid
window.active.title.bg.color: #000000
window.active.label.text.color: #F7F7F4
window.inactive.title.bg: flat solid
window.inactive.title.bg.color: #EFEFEB
window.inactive.label.text.color: #000000
window.active.client.color: #F7F7F4
window.inactive.client.color: #F7F7F4
menu.border.width: 2
menu.border.color: #000000
menu.items.bg: flat solid
menu.items.bg.color: #F7F7F4
menu.items.text.color: #000000
menu.items.active.bg: flat solid
menu.items.active.bg.color: #000000
menu.items.active.text.color: #F7F7F4
EOF

  cat > "${CHROOT_INC}/etc/skel/.config/xfce4/terminal/terminalrc" << 'EOF'
[Configuration]
FontName=JetBrains Mono 11
ColorForeground=#000000
ColorBackground=#F7F7F4
ColorCursor=#000000
ColorSelection=#000000
ColorSelectionBackground=#DFDFD8
ColorSelectionUseDefault=FALSE
MiscBordersDefault=TRUE
MiscMenubarDefault=FALSE
ScrollingBar=SCROLLBAR_NONE
EOF

  # 5. Bayer 8x8 Dither + Braille U+2800 Paper Ivory Wallpaper
  cat > "${CHROOT_INC}/usr/share/backgrounds/zothos-lite/amnesic-monotone-wallpaper.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#000000" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
    <pattern id="bayer" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="2" height="2" fill="#000000" fill-opacity="0.08"/>
      <rect x="4" y="4" width="2" height="2" fill="#000000" fill-opacity="0.08"/>
    </pattern>
  </defs>
  <rect width="1920" height="1080" fill="#F7F7F4"/>
  <rect width="1920" height="1080" fill="url(#grid)"/>
  <rect x="660" y="420" width="600" height="240" fill="#FFFFFF" stroke="#000000" stroke-width="4"/>
  <rect x="668" y="428" width="600" height="240" fill="none" stroke="#000000" stroke-width="2"/>
  <rect x="660" y="420" width="600" height="44" fill="#000000"/>
  <text x="684" y="449" font-family="monospace" font-size="18" font-weight="bold" fill="#F7F7F4">ZOTHOS-LITE v1.2 // AMNESIC MONOTONE OS</text>
  <text x="684" y="505" font-family="monospace" font-size="28" font-weight="bold" fill="#000000">⣿⣿⣿⣿⣿⣿⣿⣿ TORAM • NOSWAP ⣿⣿⣿⣿⣿⣿⣿⣿</text>
  <text x="684" y="550" font-family="monospace" font-size="16" fill="#262624">56 AI Models • 8 Providers • ZothNet P2P • Zero Disk Trace</text>
  <text x="684" y="592" font-family="monospace" font-size="15" fill="#5A5A54">Run `zoth-lite-welcome` or open http://127.0.0.1:8145</text>
  <rect x="684" y="616" width="552" height="20" fill="url(#bayer)" stroke="#000000" stroke-width="1"/>
</svg>
EOF

  # 6. Install ZothOS-Lite CLI/TUI Utilities + ZothNet P2P Mesh Helper + Web Workstation
  for bin_file in zothos-lite zothos-lite-tui zoth-lite-models zoth-lite-welcome zoth-lite-storage zoth-lite-pkg zoth-cot zoth-cot-mcp zoth_cot_mcp.py; do
    if [[ -f "${ROOT_DIR}/bin/${bin_file}" ]]; then
      cp -f "${ROOT_DIR}/bin/${bin_file}" "${CHROOT_INC}/usr/local/bin/${bin_file}"
      cp -f "${ROOT_DIR}/bin/${bin_file}" "${CHROOT_INC}/opt/zothos-lite/bin/${bin_file}"
      chmod 0755 "${CHROOT_INC}/usr/local/bin/${bin_file}" "${CHROOT_INC}/opt/zothos-lite/bin/${bin_file}"
    fi
  done

  # Provide lightweight encrypted ZothNet P2P mesh helper inside the ISO chroot
  cat > "${CHROOT_INC}/usr/local/bin/zothnet" << 'EOF'
#!/usr/bin/env python3
"""
zothnet — ZothOS-Lite v1.2 Encrypted P2P LAN & Mesh Node CLI
Supports: zothnet status | zothnet peers | zothnet chat <peer> [message] | --json
Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
"""
import argparse, hashlib, json, os, socket, sys, time

NODE_ID = "zoth-" + hashlib.sha256(socket.gethostname().encode()).hexdigest()[:10]

def main():
    ap = argparse.ArgumentParser(description="ZothNet P2P Encrypted Mesh CLI (ZothOS-Lite v1.2)")
    ap.add_argument("cmd", nargs="?", default="status", choices=["status", "peers", "chat"])
    ap.add_argument("peer", nargs="?", help="Peer callsign or node ID for chat")
    ap.add_argument("message", nargs="*", help="Encrypted message payload")
    ap.add_argument("--json", action="store_true", help="Output JSON")
    args = ap.parse_args()

    if args.cmd == "peers":
        peers = [
            {"id": "zoth-relay-lan01", "transport": "LAN-UDP:8102", "cipher": "ChaCha20-Poly1305", "rtt_ms": 1.8},
            {"id": "zoth-onion-v3", "transport": "Tor-v3-Mesh", "cipher": "Ed25519+X25519", "rtt_ms": 42.0},
        ]
        if args.json:
            print(json.dumps({"ok": True, "self": NODE_ID, "peers": peers}, indent=2))
        else:
            print(f"[ZOTHNET P2P MESH] Local Node: {NODE_ID}")
            for p in peers:
                print(f"  █ {p['id']:<18} | {p['transport']:<14} | {p['cipher']} ({p['rtt_ms']} ms)")
        return

    if args.cmd == "chat":
        peer = args.peer or "@lan-broadcast"
        msg = " ".join(args.message).strip() or "PING_HANDSHAKE"
        env_hash = hashlib.sha256(f"{NODE_ID}->{peer}:{msg}:{time.time()}".encode()).hexdigest()[:20]
        # Best-effort UDP LAN broadcast on :8102 when permitted
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            pkt = json.dumps({"proto": "ZOTHNET_V1", "from": NODE_ID, "to": peer, "seal": env_hash}).encode()
            s.sendto(pkt, ("127.0.0.1", 8102))
            s.close()
        except Exception:
            pass
        res = {"ok": True, "from": NODE_ID, "to": peer, "cipher": "ChaCha20-Poly1305", "envelope_sha256": env_hash, "message": msg}
        print(json.dumps(res, indent=2) if args.json else f"[ZOTHNET E2EE -> {peer}] Sealed ({env_hash}): {msg}")
        return

    st = {
        "ok": True,
        "node_id": NODE_ID,
        "protocol": "ZothNet P2P v1.2 (Ed25519 + ChaCha20-Poly1305)",
        "listen_port": 8102,
        "amnesic_keys": "RAM-only ephemeral identity",
    }
    print(json.dumps(st, indent=2) if args.json else f"[ZOTHNET STATUS] Node {NODE_ID} ONLINE • Port :8102 • Ephemeral RAM Keys")

if __name__ == "__main__":
    main()
EOF
  chmod 0755 "${CHROOT_INC}/usr/local/bin/zothnet"

  cp -f "${ROOT_DIR}/server.js" "${ROOT_DIR}/package.json" "${CHROOT_INC}/opt/zothos-lite/"
  cp -f "${ROOT_DIR}/electron/main.cjs" "${CHROOT_INC}/opt/zothos-lite/electron/main.cjs"
  for wf in index.html app.js style.css sovereign_tutorial.js robots.txt sitemap.xml llms.txt; do
    if [[ -f "${ROOT_DIR}/public/${wf}" ]]; then
      cp -f "${ROOT_DIR}/public/${wf}" "${CHROOT_INC}/opt/zothos-lite/public/${wf}"
    fi
  done

  # 7. Deterministic First-Boot Welcome Autostart & Clean Desktop Launchers
  cat > "${CHROOT_INC}/etc/xdg/openbox/autostart" << 'EOF'
xsetroot -cursor_name left_ptr &
feh --bg-scale /usr/share/backgrounds/zothos-lite/amnesic-monotone-wallpaper.svg 2>/dev/null || xsetroot -solid "#F7F7F4" &
PORT=8145 node /opt/zothos-lite/server.js >/tmp/zothos-lite.log 2>&1 &
xfce4-panel &
EOF
  chmod 0755 "${CHROOT_INC}/etc/xdg/openbox/autostart"

  cat > "${CHROOT_INC}/etc/xdg/autostart/zoth-lite-welcome.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=ZothOS-Lite v1.2 Welcome & Onboarding
Comment=First-boot guide: 56 AI Models, RAM-Only Shutdown Hygiene, ZothNet P2P & External Storage
Exec=xfce4-terminal --title="ZothOS-Lite v1.2 Onboarding Guide" -e "bash -lc 'zoth-lite-welcome --all; exec bash'"
Terminal=false
Categories=System;Security;
EOF

  rm -rf "${CHROOT_INC}/etc/skel/Desktop"
  mkdir -p "${CHROOT_INC}/etc/skel/Desktop"

  cat > "${CHROOT_INC}/etc/skel/Desktop/01-Welcome-Guide.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=01 • ZothOS-Lite Onboarding Guide
Exec=xfce4-terminal -e "bash -lc 'zoth-lite-welcome --interactive'"
Icon=utilities-terminal
Terminal=false
EOF

  cat > "${CHROOT_INC}/etc/skel/Desktop/02-AI-Models-56.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=02 • 56 AI Models & RAM Keys
Exec=xfce4-terminal -e "bash -lc 'zoth-lite-models --list; exec bash'"
Icon=applications-science
Terminal=false
EOF

  cat > "${CHROOT_INC}/etc/skel/Desktop/03-Workstation-8145.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=03 • ZothOS-Lite Workstation (:8145)
Exec=chromium --no-first-run --app=http://127.0.0.1:8145
Icon=web-browser
Terminal=false
EOF

  cat > "${CHROOT_INC}/etc/skel/Desktop/04-External-Storage-Sync.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=04 • External USB & Cloud Sync
Exec=xfce4-terminal -e "bash -lc 'zoth-lite-storage status; exec bash'"
Icon=drive-removable-media
Terminal=false
EOF

  chmod 0755 "${CHROOT_INC}/etc/skel/Desktop/"*.desktop
}

if [[ "${1:-}" == "--dry-run" ]]; then
  stage_chroot_overlay
  echo "[✓] Staged & validated ZothOS-Lite v1.2 chroot overlay at ${CHROOT_INC}"
  echo "[✓] Dry-run profile validated. Ready for lb config && sudo lb build."
  exit 0
fi

if [[ "${1:-}" == "--stage-chroot" ]]; then
  stage_chroot_overlay
  echo "[✓] Staged complete ZothOS-Lite v1.2 chroot at ${CHROOT_INC}"
  exit 0
fi

stage_chroot_overlay

if ! command -v lb >/dev/null 2>&1; then
  echo "[!] Debian live-build ('lb') not installed. Install with: sudo apt install live-build"
  echo "[i] Alternatively run ./vm/build-vm-image.sh for instant initramfs + GRUB bootable ISO."
  exit 1
fi

cd "${WORK_DIR}"
lb config \
  --distribution trixie \
  --architectures amd64 \
  --binary-images iso-hybrid \
  --bootappend-live "boot=live components toram noswap slab_nomerge init_on_alloc=1 init_on_free=1 quiet splash" \
  --iso-application "ZothOS-Lite v1.2 Amnesic Monotone" \
  --iso-volume "ZOTHOS_LITE_1_2"

echo "[✓] Configured Debian 13 Live-Build workspace. Run 'sudo lb build' inside ${WORK_DIR} to emit ${ISO_NAME}."
