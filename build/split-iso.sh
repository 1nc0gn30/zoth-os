#!/usr/bin/env bash
# Split the built ISO into <2 GiB GitHub release parts, write SHA256SUMS,
# and generate a matching zothos-join-iso.sh. Run as your normal user after pack-iso.sh.
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZOTHOS_VERSION="$(tr -d '[:space:]' < "$PROJECT_DIR/VERSION")"
ISO_VER="${ZOTHOS_VERSION%.*}"
ISO_NAME="zothos-${ISO_VER}-amd64.iso"
OUT="$PROJECT_DIR/build/release-v${ZOTHOS_VERSION}"
ISO="$PROJECT_DIR/build/$ISO_NAME"
[[ -f "$ISO" ]] || { echo "Missing $ISO - run build-iso.sh / pack-iso.sh first" >&2; exit 1; }
rm -rf "$OUT"; mkdir -p "$OUT"; cd "$OUT"
SHA=$(nice -n 10 sha256sum "$ISO" | awk '{print $1}')
nice -n 10 split -b 1800M -d -a 2 "$ISO" "${ISO_NAME}.part"
mapfile -t PARTS < <(ls "${ISO_NAME}".part*)
sed -e "s/@ISO_NAME@/$ISO_NAME/g" -e "s/@SHA@/$SHA/g" -e "s/@VER@/$ZOTHOS_VERSION/g" \
    -e "s/@N@/${#PARTS[@]}/g" "$PROJECT_DIR/scripts/zothos-join-iso.sh.in" > zothos-join-iso.sh
chmod +x zothos-join-iso.sh
echo "$SHA  $ISO_NAME" > SHA256SUMS
sha256sum "${PARTS[@]}" zothos-join-iso.sh >> SHA256SUMS
ls -lh "$OUT"
