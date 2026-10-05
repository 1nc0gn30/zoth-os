# Reproducible Builds & Deterministic ISO Verification

ZothOS is committed to **Reproducible Builds**—the principle that anyone building the operating system from source code should produce a byte-for-byte identical ISO image. 

Reproducibility is the single most convincing technical proof an operating system distribution can offer: it proves that the distributed binary was built strictly from the public source code without backdoors, hidden build-server state, or uncommitted modifications.

---

## 1. Deterministic Build Architecture

Building an ISO deterministically requires eliminating all sources of build variance:

1. **Timestamp Normalization (`SOURCE_DATE_EPOCH`)**:
   All filesystem timestamps, SquashFS metadata, tar archives, and file modification times are clamped to a deterministic epoch defined by the release commit date:
   ```bash
   export SOURCE_DATE_EPOCH=$(git log -1 --pretty=%ct)
   ```

2. **File Ordering & Inode Sorting**:
   Files added to the live filesystem and SquashFS image are sorted strictly alphabetically using `LC_ALL=C` rather than filesystem readdir/inode order.

3. **Archive Normalization (`strip-nondeterminism`)**:
   Timestamps, file ordering, and gzip/xz compression headers in `.deb` packages, manpages, and zip archives are normalized using the free, open-source `strip-nondeterminism` tool.

4. **Deterministic Compression Flags**:
   `mksquashfs` is executed with `-no-recovery -always-use-fragments -b 1048576 -comp zstd -Xcompression-level 19` to produce deterministic compression blocks across runs.

5. **ISO 9660 Metadata Clamping (`xorriso`)**:
   The bootable hybrid ISO creation via `xorriso` enforces fixed volume creation dates, volume modification dates, and boot catalog timestamps matching `SOURCE_DATE_EPOCH`.

---

## 2. Step-by-Step Source Build Reproduction

To independently build ZothOS v3.1 and compare its SHA-256 against our official release:

### Prerequisites (Debian 12+ / Ubuntu 24.04+ Host)
```bash
sudo apt-get update
sudo apt-get install -y \
  debootstrap \
  squashfs-tools \
  xorriso \
  isolinux \
  syslinux-efi \
  grub-pc-bin \
  grub-efi-amd64-bin \
  mtools \
  dosfstools \
  strip-nondeterminism \
  diffoscope
```

### Reproduce Build
```bash
# 1. Clone repository
git clone https://github.com/NullAITech/zoth-os.git
cd zoth-os

# 2. Check out the release tag
git checkout v3.1.0

# 3. Export deterministic epoch from release commit
export SOURCE_DATE_EPOCH=$(git log -1 --pretty=%ct)

# 4. Run the isolated build pipeline
sudo ./build/pack-iso.sh

# 5. Verify the generated SHA-256 hash
sha256sum build/zothos-3.1-amd64.iso
```

---

## 3. Comparing Discrepancies with `diffoscope`

If you encounter a bitwise divergence between your build and the published ISO, run Debian's **`diffoscope`** tool to pinpoint the exact differing bytes down to the specific file, header, or timestamp:

```bash
diffoscope build/zothos-3.1-amd64.iso published-zothos-3.1-amd64.iso \
  --html diffoscope-report.html
```

`diffoscope` unpacks SquashFS, reads file metadata, extracts ELF binaries, and highlights whether the difference is a non-deterministic timestamp, build path string, or genuine code difference.

---

## 4. Current Official Release Hashes

| Image | Format | SHA-256 Checksum | Sigstore Transparency Bundle |
| :--- | :--- | :--- | :--- |
| **`zothos-3.1-amd64.iso`** | UEFI/BIOS Hybrid | `44ab8e7bf2e50e1096ebea16b258133ed57aecd910a6b2178c3f3f65736ba1fc` | `zothos-3.1-amd64.iso.sha256.bundle` |

### Public Verification Command
```bash
cosign verify-blob \
  --key https://raw.githubusercontent.com/NullAITech/zoth-os/main/build/cosign.pub \
  --bundle build/zothos-3.1-amd64.iso.sha256.bundle \
  build/zothos-3.1-amd64.iso.sha256
```
