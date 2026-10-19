#!/usr/bin/env bash
# ZOTHOS 3.2.0 ISO reassembly - combine split GitHub release parts + verify SHA-256
# Usage: put this script next to zothos-3.2-amd64.iso.part00.. and run: bash zothos-join-iso.sh
set -euo pipefail
TARGET="zothos-3.2-amd64.iso"
EXPECTED_SHA="7f43ba58f12e799259d008a8e6e8250cc7163b5a34ef08177bbd96f0fc0d7663"
EXPECTED_PARTS=5
shopt -s nullglob
PARTS=("$TARGET".part[0-9][0-9])
if [[ ${#PARTS[@]} -ne $EXPECTED_PARTS ]]; then
  echo "✗ Found ${#PARTS[@]} of $EXPECTED_PARTS parts. Download all parts from https://github.com/NullAITech/zoth-os/releases/tag/v3.2.0 into this folder." >&2
  exit 1
fi
echo "✦ Reassembling $TARGET from ${#PARTS[@]} parts..."
cat "${PARTS[@]}" > "$TARGET"
echo "✦ Verifying SHA-256..."
CALCULATED_SHA=$(sha256sum "$TARGET" | awk '{print $1}')
if [[ "$CALCULATED_SHA" == "$EXPECTED_SHA" ]]; then
  echo "✓ SHA-256 OK: $CALCULATED_SHA"
  echo "✓ $TARGET is ready to flash or boot."
else
  echo "✗ Checksum mismatch! Expected $EXPECTED_SHA, got $CALCULATED_SHA" >&2
  echo "Re-download any incomplete part, delete $TARGET, and re-run." >&2
  exit 1
fi
