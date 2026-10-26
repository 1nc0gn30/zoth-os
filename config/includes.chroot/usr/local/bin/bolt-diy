#!/usr/bin/env bash
# ==============================================================================
#  Zoth Bolt — flagship full-stack AI web & motion architect
# ==============================================================================
#  Platform: ZothOS • NullAI
#  Author: Neal Frazier Tech (@1nc0gn30)
#  Repository: https://github.com/1nc0gn30/zoth-webgen
# ==============================================================================
set -euo pipefail

if [ -f /etc/zothos/paths.sh ]; then
  # shellcheck disable=SC1091
  . /etc/zothos/paths.sh
fi
: "${ZOTH_USER:=zoth}"
: "${AZOTH_USER:=azoth}"
: "${ZOTH_HOME:=/home/${ZOTH_USER}}"
: "${AZOTH_HOME:=/home/${AZOTH_USER}}"
: "${ZOTH_ACTIVE_HOME:=${HOME:-${ZOTH_HOME}}}"
: "${ZOTH_SRC_ROOT:=${ZOTH_ACTIVE_HOME}/NullAITech}"

GOLD='\033[38;2;212;175;55m'
CYAN='\033[38;2;56;189;248m'
GREEN='\033[38;2;34;197;94m'
RED='\033[38;2;239;68;68m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

CANDIDATES=(
  "${ZOTH_SRC_ROOT}/bolt.diy"
  "${HOME}/NullAITech/bolt.diy"
  "/opt/bolt.diy"
  "${HOME}/bolt.diy"
)

REPO_DIR=""
for c in "${CANDIDATES[@]}"; do
  if [[ -d "$c" && -f "$c/package.json" ]]; then
    REPO_DIR="$c"
    break
  fi
done

ensure_repo() {
  if [[ -z "$REPO_DIR" || ! -d "$REPO_DIR" ]]; then
    echo -e "${GOLD}${BOLD}[*] Zoth WebGen not found locally. Cloning...${NC}"
    TARGET_DIR="${HOME}/NullAITech/bolt.diy"
    mkdir -p "$(dirname "$TARGET_DIR")"
    git clone https://github.com/1nc0gn30/zoth-webgen.git "$TARGET_DIR"
    REPO_DIR="$TARGET_DIR"
    echo -e "${GREEN}✓ Provisioned to ${REPO_DIR}${NC}"
  fi
}

get_pkg_runner() {
  if command -v pnpm >/dev/null 2>&1; then
    echo "pnpm"
  elif command -v npm >/dev/null 2>&1; then
    echo "npm"
  else
    echo -e "${RED}[!] Neither pnpm nor npm found in PATH.${NC}"
    exit 1
  fi
}

launch_dev() {
  ensure_repo
  local runner
  runner=$(get_pkg_runner)
  echo -e "${GOLD}${BOLD}Launching Zoth WebGen on http://127.0.0.1:5173 ...${NC}"
  if command -v xdg-open >/dev/null 2>&1; then
    (sleep 2.5 && xdg-open "http://127.0.0.1:5173") &
  fi
  cd "$REPO_DIR"
  exec "$runner" run dev
}

launch_ollama() {
  ensure_repo
  local runner
  runner=$(get_pkg_runner)
  echo -e "${CYAN}${BOLD}Launching Zoth WebGen with local Ollama (:11434)...${NC}"
  if curl -s http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Local Ollama daemon detected on :11434${NC}"
  else
    echo -e "${GOLD}[*] Starting Ollama daemon...${NC}"
    ollama serve >/dev/null 2>&1 &
    sleep 2
  fi
  if command -v xdg-open >/dev/null 2>&1; then
    (sleep 2.5 && xdg-open "http://127.0.0.1:5173") &
  fi
  cd "$REPO_DIR"
  exec "$runner" run dev
}

launch_desktop() {
  ensure_repo
  local runner
  runner=$(get_pkg_runner)
  echo -e "${GOLD}${BOLD}Launching Zoth WebGen Electron app...${NC}"
  cd "$REPO_DIR"
  exec "$runner" run electron:dev
}

if [[ $# -gt 0 ]]; then
  case "$1" in
    dev|run|start)
      launch_dev
      ;;
    ollama|local|offline)
      launch_ollama
      ;;
    desktop|electron|app)
      launch_desktop
      ;;
    --help|-h)
      echo "Usage: bolt-diy [dev|ollama|desktop|--help]"
      echo "  dev      Start Zoth WebGen on port 5173 (default)"
      echo "  ollama   Start with local Ollama on port 11434"
      echo "  desktop  Launch the Electron app"
      exit 0
      ;;
    *)
      ensure_repo
      cd "$REPO_DIR"
      runner=$(get_pkg_runner)
      exec "$runner" run "$@"
      ;;
  esac
fi

clear
echo -e "${GOLD}${BOLD}★═════════════════════════════════════════════════════════════════════★${NC}"
echo -e "          ${GOLD}${BOLD}Z O T H   W E B G E N${NC}"
echo -e "     ${CYAN}Local full-stack site foundry${NC}"
echo -e "${GOLD}${BOLD}★═════════════════════════════════════════════════════════════════════★${NC}"
echo -e "  ${DIM}Creator:${NC} Neal Frazier Tech (@1nc0gn30) • NullAI Platform"
echo -e "  ${DIM}Repository:${NC} https://github.com/1nc0gn30/zoth-webgen"
if [[ -n "$REPO_DIR" ]]; then
  echo -e "  ${DIM}Local Path:${NC} ${GREEN}${REPO_DIR}${NC}"
else
  echo -e "  ${DIM}Local Path:${NC} ${RED}Not cloned yet (auto-provision on launch)${NC}"
fi
echo ""
echo -e "  ${BOLD}${GOLD}AVAILABLE OPERATIONS:${NC}"
echo -e "    ${CYAN}[1]${NC}  ${BOLD}Launch Zoth WebGen (:5173)${NC}          ${DIM}(Dev server and browser UI)${NC}"
echo -e "    ${CYAN}[2]${NC}  ${BOLD}Launch with local Ollama (:11434)${NC}   ${DIM}(Offline inference)${NC}"
echo -e "    ${CYAN}[3]${NC}  ${BOLD}Launch Electron desktop app${NC}         ${DIM}(Desktop window)${NC}"
echo -e "    ${CYAN}[4]${NC}  ${BOLD}Configure model and API keys${NC}        ${DIM}(Edit .env.local)${NC}"
echo -e "    ${CYAN}[5]${NC}  ${BOLD}Git sync / update engine${NC}            ${DIM}(Pull latest from origin)${NC}"
echo -e "    ${RED}[0]${NC}  ${BOLD}Exit${NC}"
echo ""

read -rp "  Select operation [0-5]: " choice
case "$choice" in
  1)
    launch_dev
    ;;
  2)
    launch_ollama
    ;;
  3)
    launch_desktop
    ;;
  4)
    ensure_repo
    cd "$REPO_DIR"
    if [[ ! -f .env.local && -f .env.example ]]; then
      cp .env.example .env.local
    fi
    ${EDITOR:-nano} .env.local
    ;;
  5)
    ensure_repo
    cd "$REPO_DIR"
    git pull --rebase origin main || true
    echo -e "${GREEN}✓ Engine up to date.${NC}"
    ;;
  0|q|Q|exit)
    exit 0
    ;;
  *)
    echo -e "${RED}Invalid selection.${NC}"
    exit 1
    ;;
esac
