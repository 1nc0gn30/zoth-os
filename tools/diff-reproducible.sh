#!/usr/bin/env bash
# ==============================================================================
#  ZOTHOS REPRODUCIBLE BUILDS AUDIT TOOL (DIFFOSCOPE & STRIP-NONDETERMINISM)
#  Compares two independently built ISOs or SquashFS rootfs images byte-for-byte.
# ==============================================================================
set -euo pipefail

GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
BLUE="\033[1;34m"
RED="\033[1;31m"
BOLD="\033[1m"
RESET="\033[0m"

echo -e "${BLUE}${BOLD}==================================================================${RESET}"
echo -e "${BLUE}${BOLD}       ZOTHOS REPRODUCIBLE BUILD AUDITOR (DIFFOSCOPE)            ${RESET}"
echo -e "${BLUE}${BOLD}==================================================================${RESET}\n"

BUILD1="${1:-}"
BUILD2="${2:-}"

if [[ -z "$BUILD1" || -z "$BUILD2" ]]; then
    echo -e "${RED}[✗] Usage: $0 <build1.iso> <build2.iso>${RESET}"
    echo -e "    Example: $0 build/zothos-3.1-run1.iso build/zothos-3.1-run2.iso"
    exit 1
fi

if [[ ! -f "$BUILD1" || ! -f "$BUILD2" ]]; then
    echo -e "${RED}[✗] Both build files must exist!${RESET}"
    exit 1
fi

HASH1=$(sha256sum "$BUILD1" | cut -d' ' -f1)
HASH2=$(sha256sum "$BUILD2" | cut -d' ' -f1)

echo -e "${CYAN}[*] Build 1:${RESET} $BUILD1 (${HASH1})"
echo -e "${CYAN}[*] Build 2:${RESET} $BUILD2 (${HASH2})"

if [[ "$HASH1" == "$HASH2" ]]; then
    echo -e "\n${GREEN}${BOLD}[✓] 100% BIT-FOR-BIT IDENTICAL! REPRODUCIBILITY VERIFIED!${RESET}"
    echo -e "    The two builds produced identical cryptographic hashes."
    exit 0
fi

echo -e "\n${YELLOW}[!] Hashes diverge. Inspecting differences with diffoscope...${RESET}"

if ! command -v diffoscope >/dev/null 2>&1; then
    echo -e "${RED}[✗] 'diffoscope' is not installed. Please install it:${RESET}"
    echo -e "    sudo apt-get install -y diffoscope"
    exit 1
fi

REPORT_HTML="reproducible-diff-$(date +%s).html"
echo -e "${CYAN}[*] Running diffoscope (generating HTML report: ${REPORT_HTML})...${RESET}"

diffoscope "$BUILD1" "$BUILD2" \
    --html "$REPORT_HTML" \
    --text - \
    --max-report-size 50000000 \
    --max-diff-block-lines 1000 \
    || true

echo -e "\n${GREEN}[✓] Discrepancy analysis complete.${RESET}"
echo -e "    Open ${BOLD}${REPORT_HTML}${RESET} in your browser to inspect exact differences (timestamps, ELF headers, squashfs inodes)."
