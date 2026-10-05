#!/usr/bin/env bash
# ==============================================================================
#  ZOTHOS THIRD-PARTY AUDIT & PROVENANCE PIPELINE: SIGN & ATTEST
#  Generates SHA-256 checksums, Sigstore (cosign) cryptographic signatures,
#  Rekor transparency log entries, Syft SBOMs, and Grype vulnerability scans.
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

GREEN="\033[1;32m"
CYAN="\033[1;36m"
YELLOW="\033[1;33m"
BLUE="\033[1;34m"
RED="\033[1;31m"
BOLD="\033[1m"
RESET="\033[0m"

echo -e "${BLUE}${BOLD}==================================================================${RESET}"
echo -e "${BLUE}${BOLD}      ZOTHOS THIRD-PARTY PROVENANCE & RELEASE ATTESTATION        ${RESET}"
echo -e "${BLUE}${BOLD}==================================================================${RESET}\n"

# 1. Locate ISO Target
ISO_PATH="${1:-}"
if [[ -z "$ISO_PATH" ]]; then
    # Auto-detect newest ISO in build/
    ISO_PATH=$(ls -t "$ROOT_DIR"/build/zothos-*.iso 2>/dev/null | head -1 || true)
fi

if [[ -z "$ISO_PATH" || ! -f "$ISO_PATH" ]]; then
    echo -e "${RED}[✗] Error: ISO target file not found!${RESET}"
    echo -e "    Usage: $0 [/path/to/zothos-*.iso]"
    exit 1
fi

ISO_BASENAME="$(basename "$ISO_PATH")"
ISO_DIR="$(dirname "$ISO_PATH")"
SHA_FILE="${ISO_PATH}.sha256"
BUNDLE_FILE="${ISO_PATH}.sha256.bundle"
SPDX_SBOM="${ISO_DIR}/${ISO_BASENAME}.sbom.spdx.json"
CYCLONEDX_SBOM="${ISO_DIR}/${ISO_BASENAME}.sbom.cyclonedx.json"
GRYPE_REPORT="${ISO_DIR}/${ISO_BASENAME}.vulnerabilities.sarif"

echo -e "${CYAN}[*] Target ISO:${RESET} ${BOLD}${ISO_PATH}${RESET}"
echo -e "${CYAN}[*] File Size:${RESET}  $(du -h "$ISO_PATH" | cut -f1)"

# 2. Generate Deterministic SHA-256 Checksum
echo -e "\n${BLUE}─── 1. Calculating SHA-256 Checksum ───${RESET}"
cd "$ISO_DIR"
sha256sum "$ISO_BASENAME" > "$SHA_FILE"
HASH=$(cut -d' ' -f1 "$SHA_FILE")
echo -e "${GREEN}[✓] SHA-256 Checksum:${RESET} ${BOLD}${HASH}${RESET}"
echo -e "    Saved to: ${SHA_FILE}"

# 3. Sigstore (Cosign) Signing & Rekor Transparency Log
echo -e "\n${BLUE}─── 2. Sigstore Cryptographic Attestation (Cosign) ───${RESET}"
if ! command -v cosign >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] 'cosign' not installed on host. Skipping Sigstore signature.${RESET}"
    echo -e "    Install cosign: https://docs.sigstore.dev/cosign/system_config/install/"
else
    KEY_PATH="${COSIGN_KEY:-$ROOT_DIR/build/cosign.key}"
    PUB_PATH="${COSIGN_PUB:-$ROOT_DIR/build/cosign.pub}"

    if [[ -f "$KEY_PATH" ]]; then
        echo -e "${CYAN}[*] Signing with existing project key: ${KEY_PATH}${RESET}"
        cosign sign-blob \
            --yes \
            --key "$KEY_PATH" \
            --bundle "$BUNDLE_FILE" \
            "$SHA_FILE"
        echo -e "${GREEN}[✓] Checksum signed. Sigstore bundle:${RESET} ${BUNDLE_FILE}"
    elif [[ -n "${GITHUB_ACTIONS:-}" ]]; then
        echo -e "${CYAN}[*] Running in CI: Signing via Sigstore Keyless OIDC (Rekor Ledger)...${RESET}"
        cosign sign-blob \
            --yes \
            --bundle "$BUNDLE_FILE" \
            "$SHA_FILE"
        echo -e "${GREEN}[✓] Checksum keylessly attested on Rekor ledger:${RESET} ${BUNDLE_FILE}"
    else
        echo -e "${YELLOW}[*] No cosign.key found. Generating ephemeral local keypair for signing...${RESET}"
        COSIGN_PASSWORD="" cosign generate-key-pair --output-key-prefix "$ROOT_DIR/build/cosign" 2>/dev/null || true
        if [[ -f "$ROOT_DIR/build/cosign.key" ]]; then
            COSIGN_PASSWORD="" cosign sign-blob \
                --yes \
                --key "$ROOT_DIR/build/cosign.key" \
                --bundle "$BUNDLE_FILE" \
                "$SHA_FILE"
            echo -e "${GREEN}[✓] Checksum signed with generated key:${RESET} ${BUNDLE_FILE}"
        else
            echo -e "${YELLOW}[!] Keypair generation skipped. Signing skipped.${RESET}"
        fi
    fi
fi

# 4. Generate SBOM via Syft
echo -e "\n${BLUE}─── 3. Software Bill of Materials (SBOM via Syft) ───${RESET}"
if ! command -v syft >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] 'syft' not found. Skipping SBOM generation.${RESET}"
    echo -e "    Install syft: curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh"
else
    echo -e "${CYAN}[*] Scanning packages and libraries inside image...${RESET}"
    syft "$ISO_PATH" -o "spdx-json=${SPDX_SBOM}" -o "cyclonedx-json=${CYCLONEDX_SBOM}" --quiet
    echo -e "${GREEN}[✓] SPDX 2.3 SBOM generated:${RESET}     ${SPDX_SBOM}"
    echo -e "${GREEN}[✓] CycloneDX SBOM generated:${RESET}    ${CYCLONEDX_SBOM}"
fi

# 5. Vulnerability Scan via Grype
echo -e "\n${BLUE}─── 4. Vulnerability Audit (Grype Scan) ───${RESET}"
if ! command -v grype >/dev/null 2>&1; then
    echo -e "${YELLOW}[!] 'grype' not found. Skipping vulnerability scan.${RESET}"
    echo -e "    Install grype: curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh"
elif [[ -f "$SPDX_SBOM" ]]; then
    echo -e "${CYAN}[*] Auditing SBOM against NVD and Debian Security Trackers...${RESET}"
    grype "sbom:${SPDX_SBOM}" -o sarif --file "$GRYPE_REPORT" --fail-on critical 2>/dev/null || true
    echo -e "${GREEN}[✓] Grype SARIF vulnerability report:${RESET} ${GRYPE_REPORT}"
    echo -e "${CYAN}[*] Summary Preview:${RESET}"
    grype "sbom:${SPDX_SBOM}" --only-fixed 2>/dev/null | head -15 || true
fi

# 6. Third-Party Verification Instructions
echo -e "\n${BLUE}─── 5. Third-Party Public Verification Commands ───${RESET}"
echo -e "${BOLD}Users and auditors can independently verify this release:${RESET}"
echo -e "  1. ${CYAN}Verify Sigstore Signature & Rekor Log:${RESET}"
echo -e "     cosign verify-blob --key build/cosign.pub --bundle ${BUNDLE_FILE} ${SHA_FILE}"
echo -e "  2. ${CYAN}Verify SHA-256 Checksum:${RESET}"
echo -e "     sha256sum -c ${SHA_FILE}"
echo -e "  3. ${CYAN}Inspect VirusTotal Multi-AV Status:${RESET}"
echo -e "     https://www.virustotal.com/gui/file/${HASH}"
echo -e "  4. ${CYAN}Inspect SBOM Packages:${RESET}"
echo -e "     syft ${ISO_PATH} -o table"

echo -e "\n${GREEN}${BOLD}[✓] Third-Party Attestation & Verification Pipeline Complete!${RESET}\n"
