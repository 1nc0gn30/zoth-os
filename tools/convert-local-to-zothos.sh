#!/usr/bin/env bash
# ==============================================================================
#  ZOTHOS LOCAL SYSTEM CONVERTER / QUICK-DEPLOY (v3.3.0)
#  Transforms your existing Debian/Parrot/Ubuntu system into ZOTHOS instantly!
# ==============================================================================

set -euo pipefail

GREEN="\e[1;32m"
CYAN="\e[1;36m"
GOLD="\e[1;33m"
BOLD="\e[1m"
RESET="\e[0m"

echo -e "${GREEN}${BOLD}"
echo "  ╔════════════════════════════════════════════════════════════════════╗"
echo "  ║         TRANSMUTING HOST SYSTEM INTO ZOTHOS REALITY (v3.3.0)       ║"
echo "  ╚════════════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo -e "${CYAN}[1/6] Installing ZOTHOS 3.3.0 command utilities to /usr/local/bin ...${RESET}"
sudo cp -rf "$ROOT_DIR/config/includes.chroot/usr/local/bin/"* /usr/local/bin/ 2>/dev/null || true
if [ -d "$ROOT_DIR/bin" ]; then
  sudo cp -rf "$ROOT_DIR/bin/"* /usr/local/bin/ 2>/dev/null || true
  mkdir -p "$HOME/.local/bin"
  cp -rf "$ROOT_DIR/bin/"* "$HOME/.local/bin/" 2>/dev/null || true
fi
sudo chmod +x /usr/local/bin/zoth-* /usr/local/bin/agent-* 2>/dev/null || true

echo -e "${CYAN}[2/6] Deploying Wallpapers & Visual Assets ...${RESET}"
sudo mkdir -p /usr/share/backgrounds/zothos
sudo cp -rf "$ROOT_DIR/config/includes.chroot/usr/share/backgrounds/zothos/"* /usr/share/backgrounds/zothos/ 2>/dev/null || true

echo -e "${CYAN}[3/6] Deploying GTK3 & Plasma Themes (Matrix, Ghost, Incognito) ...${RESET}"
sudo mkdir -p /usr/share/themes
sudo cp -rf "$ROOT_DIR/config/includes.chroot/usr/share/themes/"* /usr/share/themes/ 2>/dev/null || true

echo -e "${CYAN}[4/6] Deploying Desktop Applications & Shortcuts ...${RESET}"
sudo mkdir -p /usr/share/applications "$HOME/Desktop"
sudo cp -rf "$ROOT_DIR/config/includes.chroot/usr/share/applications/zoth-"*.desktop /usr/share/applications/ 2>/dev/null || true
cp -rf "$ROOT_DIR/config/includes.chroot/usr/share/applications/zoth-"*.desktop "$HOME/Desktop/" 2>/dev/null || true
chmod +x "$HOME/Desktop/zoth-"*.desktop 2>/dev/null || true

echo -e "${CYAN}[5/6] Deploying 100% /opt Sovereign Applications ...${RESET}"
sudo mkdir -p /opt
sudo cp -rf "$ROOT_DIR/config/includes.chroot/opt/"* /opt/ 2>/dev/null || true
sudo ln -sf /opt/zoth-cockpit-app /opt/zoth-cockpit 2>/dev/null || true
sudo ln -sf /opt/zoth-mcp-app /opt/zoth-mcp 2>/dev/null || true
sudo ln -sf /opt/zoth-ai-stack-app /opt/zoth-ai-stack 2>/dev/null || true
sudo ln -sf /opt/zoth-nexus-app /opt/zoth-tools-installer 2>/dev/null || true

echo -e "${CYAN}[6/6] Upgrading /etc/zothos & System Identity ...${RESET}"
sudo mkdir -p /etc/zothos
if [ -d "$ROOT_DIR/config/includes.chroot/etc" ]; then
  sudo cp -rf "$ROOT_DIR/config/includes.chroot/etc/"* /etc/ 2>/dev/null || true
fi
echo "3.3.0" | sudo tee /etc/zothos/version >/dev/null

echo -e "\n${GREEN}${BOLD}[✓] ZOTHOS TRANSMUTATION COMPLETE!${RESET}"
echo -e "You can now execute:"
echo -e "  - ${CYAN}zoth-node status${RESET}     (Executive Node & Cluster Controller)"
echo -e "  - ${CYAN}zoth-comm peers${RESET}      (P2P Encrypted Messenger & Task Dispatch)"
echo -e "  - ${CYAN}zoth-mode matrix${RESET}     (Switch to Hermetic Matrix Reality)"
echo -e "  - ${CYAN}zoth-mode ghost${RESET}      (Switch to nullai.tech Ghostmode)"
echo -e "  - ${CYAN}zoth-fastfetch${RESET}       (ZOTHOS System Status Display)\n"
