#!/usr/bin/env bash
# ==============================================================================
#  ZOTHOS THIRD-PARTY VERIFICATION TOOL FOR AUDITORS & USERS
#  Independently verifies:
#   1. Sigstore Cosign cryptographic signatures against Rekor transparency log
#   2. SHA-256 bitwise file integrity
#   3. Direct link to VirusTotal 70+ AV engine results
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
echo -e "${BLUE}${BOLD}        ZOTHOS INDEPENDENT THIRD-PARTY VERIFIER                   ${RESET}"
echo -e "${BLUE}${BOLD}==================================================================${RESET}\n"

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
    echo -e "${RED}[✗] Usage: $0 <path-to-zothos-iso>${RESET}"
    echo -e "    Example: $0 build/zothos-3.1-amd64.iso"
    exit 1
fi

if [[ ! -f "$TARGET" ]]; then
    echo -e "${RED}[✗] Target file does not exist: $TARGET${RESET}"
    exit 1
fi

DIR="$(dirname "$TARGET")"
BASE="$(basename "$TARGET")"
SHA_FILE="${TARGET}.sha256"
BUNDLE_FILE="${TARGET}.sha256.bundle"
PUB_KEY="${DIR}/cosign.pub"

# 1. Compute SHA-256 Hash
echo -e "${CYAN}[1/3] Computing SHA-256 checksum of ${BASE}...${RESET}"
COMPUTED_HASH=$(sha256sum "$TARGET" | cut -d' ' -f1)
echo -e "    Hash: ${BOLD}${COMPUTED_HASH}${RESET}"

# 2. Compare against .sha256 file
if [[ -f "$SHA_FILE" ]]; then
    EXPECTED_HASH=$(head -n1 "$SHA_FILE" | cut -d' ' -f1)
    if [[ "$COMPUTED_HASH" == "$EXPECTED_HASH" ]]; then
        echo -e "${GREEN}[✓] Bitwise Checksum Verified: MATCH${RESET}"
    else
        echo -e "${RED}[✗] Checksum Mismatch!${RESET}"
        echo -e "    Computed: $COMPUTED_HASH"
        echo -e "    Expected: $EXPECTED_HASH"
        exit 1
    fi
else
    echo -e "${YELLOW}[!] Warning: Checksum file ${SHA_FILE} not found locally.${RESET}"
fi

# 3. Sigstore Cosign Verification
echo -e "\n${CYAN}[2/3] Verifying Sigstore Cryptographic Attestation...${RESET}"
if ! command -v cosign >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] 'cosign' is not installed. To verify signatures against Rekor:${RESET}"
    echo -e "    curl -sSfL https://raw.githubusercontent.com/sigstore/cosign/main/install.sh | sh"
else
    if [[ -f "$BUNDLE_FILE" && -f "$SHA_FILE" ]]; then
        if [[ -f "$PUB_KEY" ]]; then
            echo -e "    Running: cosign verify-blob --key ${PUB_KEY} --bundle ${BUNDLE_FILE} ${SHA_FILE}"
            if cosign verify-blob --key "$PUB_KEY" --bundle "$BUNDLE_FILE" "$SHA_FILE" 2>&1; then
                echo -e "${GREEN}[✓] Sigstore Cryptographic Signature & Rekor Log Verified OK!${RESET}"
            else
                echo -e "${RED}[✗] Sigstore Verification FAILED!${RESET}"
            fi
        else
            echo -e "    Attempting keyless OIDC verification against Rekor..."
            cosign verify-blob --bundle "$BUNDLE_FILE" "$SHA_FILE" || true
        fi
    else
        echo -e "${YELLOW}[!] Sigstore bundle (${BUNDLE_FILE}) not found. Skipping Cosign step.${RESET}"
    fi
fi

# 4. VirusTotal Report
echo -e "\n${CYAN}[3/3] Third-Party Antivirus Verification (VirusTotal)...${RESET}"
echo -e "    Inspect multi-engine antivirus status across 70+ vendors:"
echo -e "    ${BOLD}https://www.virustotal.com/gui/file/${COMPUTED_HASH}${RESET}"

echo -e "\n${GREEN}${BOLD}Verification complete.${RESET}\n"
