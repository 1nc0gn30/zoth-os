#!/usr/bin/env bash
# ==============================================================================
# ⚡ ZOTHOS 3.0 → 3.3 SOVEREIGN IN-PLACE UPGRADER
# ==============================================================================
# Upgrades any existing ZothOS 3.0 / 3.1 / 3.2 installation straight to
# ZothOS v3.3.0 ("Sovereign Neural & Account-Lattice Edition") without
# needing to re-flash an ISO!
#
# Usage on the 3.0 laptop:
#   git clone https://github.com/NullAITech/zoth-os.git ~/NullAITech/zoth-os 2>/dev/null || git -C ~/NullAITech/zoth-os pull
#   bash ~/NullAITech/zoth-os/tools/upgrade-to-v3.3.sh
# ==============================================================================
set -euo pipefail

GREEN="\e[1;32m"
CYAN="\e[1;36m"
GOLD="\e[1;33m"
BOLD="\e[1m"
RESET="\e[0m"

echo -e "${GOLD}${BOLD}"
echo "  ╔════════════════════════════════════════════════════════════════════╗"
echo "  ║      ⚡ ZOTHOS 3.0 → 3.3.0 SOVEREIGN IN-PLACE UPGRADE ENGINE       ║"
echo "  ╚════════════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"

REPO_DIR="${ZOTH_OS_DIR:-$HOME/NullAITech/zoth-os}"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo -e "${CYAN}[0/6] Cloning latest NullAITech/zoth-os repository to $REPO_DIR ...${RESET}"
  mkdir -p "$(dirname "$REPO_DIR")"
  git clone https://github.com/NullAITech/zoth-os.git "$REPO_DIR"
else
  echo -e "${CYAN}[0/6] Pulling latest ZothOS v3.3.0 commits in $REPO_DIR ...${RESET}"
  git -C "$REPO_DIR" fetch origin main && git -C "$REPO_DIR" checkout main && git -C "$REPO_DIR" pull --ff-only origin main || true
fi

echo -e "${CYAN}[1/6] Upgrading /usr/local/bin ZothOS 3.3 CLI Arsenal ...${RESET}"
sudo cp -f "$REPO_DIR/config/includes.chroot/usr/local/bin/"* /usr/local/bin/ 2>/dev/null || true
if [ -d "$REPO_DIR/bin" ]; then
  sudo cp -f "$REPO_DIR/bin/"* /usr/local/bin/ 2>/dev/null || true
  mkdir -p "$HOME/.local/bin"
  cp -f "$REPO_DIR/bin/"* "$HOME/.local/bin/" 2>/dev/null || true
  chmod +x "$HOME/.local/bin/"* 2>/dev/null || true
fi
sudo chmod +x /usr/local/bin/zoth-* /usr/local/bin/agent-* 2>/dev/null || true

echo -e "${CYAN}[2/6] Upgrading Ring-0 MCP Server Registry (/etc/zothos/mcp-servers.json) ...${RESET}"
sudo mkdir -p /etc/zothos
if [ -f "$REPO_DIR/config/includes.chroot/etc/zothos/mcp-servers.json" ]; then
  sudo cp -f "$REPO_DIR/config/includes.chroot/etc/zothos/mcp-servers.json" /etc/zothos/mcp-servers.json
fi
echo "3.3.0" | sudo tee /etc/zothos/version >/dev/null

echo -e "${CYAN}[3/6] Deploying ZothOS 3.3 Wallpapers, Themes & Plasma/GTK Assets ...${RESET}"
sudo mkdir -p /usr/share/backgrounds/zothos
sudo cp -rf "$REPO_DIR/config/includes.chroot/usr/share/backgrounds/zothos/"* /usr/share/backgrounds/zothos/ 2>/dev/null || true
sudo cp -rf "$REPO_DIR/config/includes.chroot/usr/share/themes/"* /usr/share/themes/ 2>/dev/null || true

echo -e "${CYAN}[4/6] Updating Desktop Launchers & Shortcuts ...${RESET}"
sudo cp -f "$REPO_DIR/config/includes.chroot/usr/share/applications/zoth-"*.desktop /usr/share/applications/ 2>/dev/null || true
mkdir -p "$HOME/Desktop"
cp -f "$REPO_DIR/config/includes.chroot/usr/share/applications/zoth-"*.desktop "$HOME/Desktop/" 2>/dev/null || true
chmod +x "$HOME/Desktop/zoth-"*.desktop 2>/dev/null || true

echo -e "${CYAN}[5/6] Updating /opt/zoth-studio Runtime Assets ...${RESET}"
if [ -d "$REPO_DIR/config/includes.chroot/opt/zoth-studio" ]; then
  sudo mkdir -p /opt/zoth-studio
  sudo cp -rf "$REPO_DIR/config/includes.chroot/opt/zoth-studio/"* /opt/zoth-studio/ 2>/dev/null || true
  sudo chmod +x /opt/zoth-studio/launch.sh 2>/dev/null || true
fi

echo -e "${CYAN}[6/6] Verifying ZothOS v3.3.0 Sovereign Utilities ...${RESET}"
for cmd in zoth-os zoth-mcp zoth-second-brain zoth-comm zoth-dualboot zoth-vault; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${RESET} $cmd ($(command -v "$cmd"))"
  fi
done

echo -e "\n${GREEN}${BOLD}✦ ZOTHOS UPGRADED TO v3.3.0 SUCCESSFULLY! ✦${RESET}"
echo -e "  • Run ${GOLD}zoth-comm register @zoth-rig2 <passphrase> --name \"24/7 AI Laptop\"${RESET} to pair this node."
echo -e "  • Run ${GOLD}zoth-second-brain status${RESET} to inspect your Second Brain & STDP Memory."
echo -e "  • Run ${GOLD}zoth-mcp list${RESET} to inspect the 36-Tool Ring-0 MCP Registry.\n"
