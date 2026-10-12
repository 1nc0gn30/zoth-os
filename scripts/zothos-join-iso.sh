#!/usr/bin/env bash
# ZOTHOS 3.1 ISO reassembly — combine split GitHub release parts + verify SHA-256
# Usage: put this script next to zothos-3.1-amd64.iso.part00..part04 and run: bash zothos-join-iso.sh
set -euo pipefail

TARGET="zothos-3.1-amd64.iso"
EXPECTED_SHA="44ab8e7bf2e50e1096ebea16b258133ed57aecd910a6b2178c3f3f65736ba1fc"
PARTS=(
  zothos-3.1-amd64.iso.part00
  zothos-3.1-amd64.iso.part01
  zothos-3.1-amd64.iso.part02
  zothos-3.1-amd64.iso.part03
  zothos-3.1-amd64.iso.part04
)

echo "✦ Reassembling ZOTHOS 3.1 Live ISO from 5 parts..."
missing=0
for p in "${PARTS[@]}"; do
  if [[ ! -f "$p" ]]; then
    echo "✗ Missing: $p" >&2
    missing=1
  fi
done
if [[ "$missing" -ne 0 ]]; then
  echo "Download all five parts from https://github.com/NullAITech/zoth-os/releases/tag/v3.1.0 into this folder." >&2
  exit 1
fi

cat "${PARTS[@]}" > "$TARGET"

echo "✦ Verifying SHA-256..."
CALCULATED_SHA=$(sha256sum "$TARGET" | awk '{print $1}')
if [[ "$CALCULATED_SHA" == "$EXPECTED_SHA" ]]; then
  echo "✓ SHA-256 OK: $CALCULATED_SHA"
  echo "✓ $TARGET is ready to flash or boot."
else
  echo "✗ Checksum mismatch!" >&2
  echo "  Expected:   $EXPECTED_SHA" >&2
  echo "  Calculated: $CALCULATED_SHA" >&2
  echo "Re-download any incomplete part, delete $TARGET, and re-run." >&2
  exit 1
fi
