#!/usr/bin/env bash
# ==============================================================================
#  ZOTHOS THIRD-PARTY PROVENANCE & RELEASE SIGNING ENGINE
#  Implements Sigstore Cosign + Rekor Transparency + Syft SBOM Generation
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔒 [ZothOS Provenance] Initiating Third-Party Auditable Release Pipeline..."

# 1. Ensure tools are available
for tool in cosign syft sha256sum; do
    if ! command -v "$tool" >/dev/null 2>&1; then
        echo "❌ Error: Required tool '$tool' is not installed."
        exit 1
    fi
done

# 2. Check for ISO artifact
ISO_TARGET="$SCRIPT_DIR/zothos-3.1-amd64.iso"
CHECKSUM_FILE="${ISO_TARGET}.sha256"
BUNDLE_FILE="${CHECKSUM_FILE}.bundle"
KEY_FILE="$SCRIPT_DIR/cosign.key"
PUB_FILE="$SCRIPT_DIR/cosign.pub"

if [ ! -f "$ISO_TARGET" ]; then
    echo "⚠️ Warning: $ISO_TARGET not found. Searching for available ISOs..."
    ISO_TARGET=$(find "$SCRIPT_DIR" -maxdepth 1 -name "zothos-*.iso" | head -n 1)
    if [ -z "$ISO_TARGET" ]; then
        echo "❌ Error: No ZothOS ISO found in $SCRIPT_DIR."
        exit 1
    fi
    CHECKSUM_FILE="${ISO_TARGET}.sha256"
    BUNDLE_FILE="${CHECKSUM_FILE}.bundle"
fi

echo "📦 Target ISO: $(basename "$ISO_TARGET")"

# 3. Generate SHA-256 Checksum
echo "🔑 Generating SHA-256 Checksum..."
cd "$SCRIPT_DIR"
sha256sum "$(basename "$ISO_TARGET")" > "$CHECKSUM_FILE"
cat "$CHECKSUM_FILE"

# 4. Generate or Load Cosign Keypair
if [ ! -f "$KEY_FILE" ] || [ ! -f "$PUB_FILE" ]; then
    echo "🔐 Generating new Sigstore Cosign release keypair..."
    COSIGN_PASSWORD="${COSIGN_PASSWORD:-zothos-release-sigstore-v1}" cosign generate-key-pair
fi

# 5. Cryptographically Sign Checksum & Upload to Rekor Transparency Log
echo "✍️ Signing Checksum with Cosign (Logging to Rekor)..."
COSIGN_PASSWORD="${COSIGN_PASSWORD:-zothos-release-sigstore-v1}" cosign sign-blob \
    --key "$KEY_FILE" \
    --yes \
    --bundle "$BUNDLE_FILE" \
    "$(basename "$CHECKSUM_FILE")"

# 6. Verify Signature against Rekor
echo "🔍 Verifying Signed Blob against Sigstore Rekor..."
cosign verify-blob \
    --key "$PUB_FILE" \
    --bundle "$BUNDLE_FILE" \
    "$(basename "$CHECKSUM_FILE")"

# 7. Generate Syft Software Bill of Materials (SBOM)
echo "📋 Generating SPDX & CycloneDX SBOMs with Syft..."
syft dir:"$ROOT_DIR" -o spdx-json="$SCRIPT_DIR/zothos-repo-sbom.spdx.json" -o cyclonedx-json="$SCRIPT_DIR/zothos-repo-sbom.cyclonedx.json"

echo "✅ [ZothOS Provenance] All cryptographic and transparency checks PASSED!"
echo "   • Checksum: $CHECKSUM_FILE"
echo "   • Sigstore Bundle: $BUNDLE_FILE"
echo "   • Public Key: $PUB_FILE"
echo "   • SPDX SBOM: $SCRIPT_DIR/zothos-repo-sbom.spdx.json"
echo "   • CycloneDX SBOM: $SCRIPT_DIR/zothos-repo-sbom.cyclonedx.json"
