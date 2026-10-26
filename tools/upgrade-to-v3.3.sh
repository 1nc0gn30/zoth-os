#!/usr/bin/env bash
# ==============================================================================
# ⚡ ZOTHOS 3.0 → 3.3.0 SOVEREIGN IN-PLACE UPGRADER
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
PURPLE="\e[1;35m"
BOLD="\e[1m"
RESET="\e[0m"

echo -e "${GOLD}${BOLD}"
echo "  ╔════════════════════════════════════════════════════════════════════╗"
echo "  ║      ⚡ ZOTHOS 3.0 → 3.3.0 SOVEREIGN IN-PLACE UPGRADE ENGINE       ║"
echo "  ╚════════════════════════════════════════════════════════════════════╝"
echo -e "${RESET}"

REPO_DIR="${ZOTH_OS_DIR:-$HOME/NullAITech/zoth-os}"
NULLAI_DIR="$HOME/NullAITech"
mkdir -p "$NULLAI_DIR" "$HOME/.local/bin"

# ------------------------------------------------------------------------------
# STEP 1: Pull latest ZothOS 3.3.0 commits
# ------------------------------------------------------------------------------
if [ ! -d "$REPO_DIR/.git" ]; then
  echo -e "${CYAN}[1/6] Cloning latest NullAITech/zoth-os repository to $REPO_DIR ...${RESET}"
  mkdir -p "$(dirname "$REPO_DIR")"
  git clone https://github.com/NullAITech/zoth-os.git "$REPO_DIR"
else
  echo -e "${CYAN}[1/6] Pulling latest ZothOS v3.3.0 commits in $REPO_DIR ...${RESET}"
  git -C "$REPO_DIR" fetch origin main && git -C "$REPO_DIR" checkout main && git -C "$REPO_DIR" pull --ff-only origin main || true
fi

# ------------------------------------------------------------------------------
# STEP 2: Upgrade CLI Arsenal in /usr/local/bin and ~/.local/bin
# ------------------------------------------------------------------------------
echo -e "${CYAN}[2/6] Upgrading /usr/local/bin & ~/.local/bin ZothOS 3.3 CLI Arsenal ...${RESET}"
if [ -d "$REPO_DIR/config/includes.chroot/usr/local/bin" ]; then
  sudo cp -rf "$REPO_DIR/config/includes.chroot/usr/local/bin/"* /usr/local/bin/ 2>/dev/null || true
  cp -rf "$REPO_DIR/config/includes.chroot/usr/local/bin/"* "$HOME/.local/bin/" 2>/dev/null || true
fi
if [ -d "$REPO_DIR/bin" ]; then
  sudo cp -rf "$REPO_DIR/bin/"* /usr/local/bin/ 2>/dev/null || true
  cp -rf "$REPO_DIR/bin/"* "$HOME/.local/bin/" 2>/dev/null || true
fi

sudo chmod +x /usr/local/bin/zoth-* /usr/local/bin/agent-* /usr/local/bin/vaelor-* 2>/dev/null || true
chmod +x "$HOME/.local/bin/"* 2>/dev/null || true

# ------------------------------------------------------------------------------
# STEP 3: Deploy Full /opt Applications, Symlinks & Sovereign Repos
# ------------------------------------------------------------------------------
echo -e "${CYAN}[3/6] Deploying 100% /opt Sovereign Applications & Symlinks ...${RESET}"
sudo mkdir -p /opt
if [ -d "$REPO_DIR/config/includes.chroot/opt" ]; then
  sudo cp -rf "$REPO_DIR/config/includes.chroot/opt/"* /opt/ 2>/dev/null || true
fi

# Recreate canonical /opt symlinks
sudo ln -sf /opt/zoth-cockpit-app /opt/zoth-cockpit 2>/dev/null || true
sudo ln -sf /opt/zoth-mcp-app /opt/zoth-mcp 2>/dev/null || true
sudo ln -sf /opt/zoth-ai-stack-app /opt/zoth-ai-stack 2>/dev/null || true
sudo ln -sf /opt/zoth-nexus-app /opt/zoth-tools-installer 2>/dev/null || true

# Synchronize Vaelor L1 to ~/NullAITech/vaelor-network and symlink vaelor-cli
if [ -d "/opt/vaelor-network" ]; then
  mkdir -p "$NULLAI_DIR/vaelor-network"
  rsync -a --exclude='.git' /opt/vaelor-network/ "$NULLAI_DIR/vaelor-network/" 2>/dev/null || true
  sudo ln -sf "$NULLAI_DIR/vaelor-network/bin/vaelor-cli" /usr/local/bin/vaelor-cli 2>/dev/null || true
  ln -sf "$NULLAI_DIR/vaelor-network/bin/vaelor-cli" "$HOME/.local/bin/vaelor-cli" 2>/dev/null || true
  chmod +x "$NULLAI_DIR/vaelor-network/bin/vaelor-cli" 2>/dev/null || true
fi

# Synchronize Neuro-Memory Daemon to ~/NullAITech/neuro-memory-daemon and symlink zoth-memory
if [ -d "/opt/neuro-memory-daemon" ]; then
  mkdir -p "$NULLAI_DIR/neuro-memory-daemon"
  rsync -a --exclude='.git' /opt/neuro-memory-daemon/ "$NULLAI_DIR/neuro-memory-daemon/" 2>/dev/null || true
  sudo ln -sf "$NULLAI_DIR/neuro-memory-daemon/bin/zoth-memory" /usr/local/bin/zoth-memory 2>/dev/null || true
  ln -sf "$NULLAI_DIR/neuro-memory-daemon/bin/zoth-memory" "$HOME/.local/bin/zoth-memory" 2>/dev/null || true
  chmod +x "$NULLAI_DIR/neuro-memory-daemon/bin/zoth-memory" 2>/dev/null || true
fi

# Clone or pull Zoth Studio v2
if [ ! -d "$NULLAI_DIR/zoth-studio-v2/.git" ]; then
  echo -e "${PURPLE}  ↳ Cloning Zoth Studio v2 into $NULLAI_DIR/zoth-studio-v2 ...${RESET}"
  git clone https://github.com/NullAITech/zoth-studio-v2.git "$NULLAI_DIR/zoth-studio-v2" 2>/dev/null || true
else
  git -C "$NULLAI_DIR/zoth-studio-v2" pull origin main 2>/dev/null || true
fi

# ------------------------------------------------------------------------------
# STEP 4: Upgrade /etc Configuration, OS Branding & Desktop Profiles
# ------------------------------------------------------------------------------
echo -e "${CYAN}[4/6] Upgrading /etc Configuration, OS Release & Desktop Profiles ...${RESET}"
sudo mkdir -p /etc/zothos
if [ -d "$REPO_DIR/config/includes.chroot/etc" ]; then
  sudo cp -rf "$REPO_DIR/config/includes.chroot/etc/"* /etc/ 2>/dev/null || true
fi

# Ensure 3.3.0 release version
echo "3.3.0" | sudo tee /etc/zothos/version >/dev/null
sudo sed -i 's/VERSION_ID=.*/VERSION_ID="3.3.0"/' /etc/os-release 2>/dev/null || true
sudo sed -i 's/PRETTY_NAME=.*/PRETTY_NAME="ZothOS 3.3.0 Sovereign Neural & Account-Lattice Edition"/' /etc/os-release 2>/dev/null || true

# Deploy skel configurations to user home
if [ -d "$REPO_DIR/config/includes.chroot/etc/skel/.config" ]; then
  mkdir -p "$HOME/.config"
  cp -rf "$REPO_DIR/config/includes.chroot/etc/skel/.config/"* "$HOME/.config/" 2>/dev/null || true
fi

# ------------------------------------------------------------------------------
# STEP 5: Deploy Wallpapers, GTK Themes & Application Launchers
# ------------------------------------------------------------------------------
echo -e "${CYAN}[5/6] Deploying Wallpapers, Plasma/GTK Themes & Desktop Launchers ...${RESET}"
sudo mkdir -p /usr/share/backgrounds/zothos /usr/share/themes /usr/share/applications "$HOME/Desktop"
if [ -d "$REPO_DIR/config/includes.chroot/usr/share/backgrounds/zothos" ]; then
  sudo cp -rf "$REPO_DIR/config/includes.chroot/usr/share/backgrounds/zothos/"* /usr/share/backgrounds/zothos/ 2>/dev/null || true
fi
if [ -d "$REPO_DIR/config/includes.chroot/usr/share/themes" ]; then
  sudo cp -rf "$REPO_DIR/config/includes.chroot/usr/share/themes/"* /usr/share/themes/ 2>/dev/null || true
fi
if [ -d "$REPO_DIR/config/includes.chroot/usr/share/applications" ]; then
  sudo cp -rf "$REPO_DIR/config/includes.chroot/usr/share/applications/zoth-"*.desktop /usr/share/applications/ 2>/dev/null || true
  cp -rf "$REPO_DIR/config/includes.chroot/usr/share/applications/zoth-"*.desktop "$HOME/Desktop/" 2>/dev/null || true
  chmod +x "$HOME/Desktop/zoth-"*.desktop 2>/dev/null || true
fi

# ------------------------------------------------------------------------------
# STEP 6: Verification of ZothOS v3.3.0 Sovereign Arsenal
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}[6/6] Verifying ZothOS v3.3.0 Sovereign Utilities ...${RESET}"
CORE_CMDS=(
  "zoth-os"
  "zoth-node"
  "zoth-comm"
  "zoth-second-brain"
  "zoth-dualboot"
  "zoth-vault"
  "zoth-mcp"
  "vaelor-cli"
  "zoth-memory"
)

ALL_PRESENT=true
for cmd in "${CORE_CMDS[@]}"; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${RESET} ${BOLD}$cmd${RESET} ($(command -v "$cmd"))"
  else
    echo -e "  ${GOLD}⚠${RESET} $cmd (not found in current PATH)"
    ALL_PRESENT=false
  fi
done

echo -e "\n${GREEN}${BOLD}✦ ZOTHOS UPGRADED TO v3.3.0 SUCCESSFULLY! ✦${RESET}"
echo -e "  • Run ${GOLD}zoth-node status${RESET} to inspect your node, Merkle state root, and BFT quorum."
echo -e "  • Run ${GOLD}zoth-comm peers${RESET} to discover lattice nodes across your local and mesh fleet."
echo -e "  • Run ${GOLD}zoth-second-brain status${RESET} to inspect your Second Brain & STDP Memory."
echo -e "  • Run ${GOLD}zoth-mcp list${RESET} to inspect the 36-Tool Ring-0 MCP Registry.\n"
