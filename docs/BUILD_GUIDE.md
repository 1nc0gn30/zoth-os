# 🜂 ZOTHOS Linux: ISO Build & Deployment Guide 🜄

This guide details how to build, customize, and verify bootable hybrid UEFI/BIOS ISOs for ZothOS.

---

## 1. System Requirements

* **Operating System**: Debian 12 (Bookworm), Debian 13 (Trixie), Ubuntu 24.04+, Parrot OS 6+, or Kali Linux.
* **Architecture**: x86_64 (AMD64).
* **Storage**: Minimum 35 GB free disk space (fast NVMe recommended for squashfs compression).
* **RAM**: 8 GB minimum, 16 GB+ recommended.
* **Privileges**: Root / `sudo` access required for `chroot`, loop mounts, and `live-build`.

---

## 2. Dependencies & Build Tools

Install the required build packages:
```bash
sudo apt-get update
sudo apt-get install -y \
    live-build \
    debootstrap \
    squashfs-tools \
    xorriso \
    isolinux \
    syslinux-utils \
    mtools \
    dosfstools \
    qemu-system-x86 \
    libvirt-clients \
    libvirt-daemon-system
```

---

## 3. Fast Incremental Build

If you are iterating on configurations, desktop shortcuts, themes, or package overlays in an existing workspace:

```bash
cd /path/to/zothos

# Package live-image hybrid ISO from workspace
sudo bash build/pack-iso.sh
```

This workflow:
1. Purges previous binary build cache.
2. Runs `lb binary` against the populated `build/live_workspace/chroot` filesystem.
3. Packages the hybrid ISO: `build/zothos-1.0-amd64.iso`.
4. Performs a loop-mount sanity check on `filesystem.squashfs` to verify filesystem integrity.

---

## 4. Clean Build from Scratch

To rebuild the entire distribution from pristine upstream sources:

```bash
cd /path/to/zothos

# Run the master automated build pipeline
sudo bash build/build-iso.sh
```

The pipeline executes the following stages:
1. **Bootstrap Stage**: Bootstraps minimal Debian 13 (Trixie) base via `debootstrap`.
2. **Chroot Configuration**: Applies APT pinning rules for Debian Trixie + Kali Rolling + Parrot OS.
3. **Package Installation**: Installs packages defined across `config/package-lists/*.list.chroot`.
4. **Desktop Overlay**: Injects KDE Plasma 6 themes, 24K gold icons (`Zoth-Hermetic`), and Calamares graphical installer configurations.
5. **Security & Tool Nexus Overlay**: Pre-configures `zoth-pkg`, HexStrike, Hermes Agent, and native CLI utilities.
6. **Binary Assembly**: Uses `xorriso` to create the final UEFI/BIOS hybrid ISO.

---

## 5. Virtual Machine Testing

### Using `libvirt` / `virsh`:
```bash
# Start or restart test VM with the freshly built ISO
virsh --connect qemu:///system destroy zothos-iso-live 2>/dev/null || true
virsh --connect qemu:///system undefine zothos-iso-live 2>/dev/null || true

# Run test VM definition
virt-install \
    --connect qemu:///system \
    --name zothos-iso-live \
    --memory 8192 \
    --vcpus 4 \
    --disk size=25,format=qcow2 \
    --cdrom /path/to/zothos/build/zothos-1.0-amd64.iso \
    --os-variant debiantesting \
    --graphics vnc,listen=0.0.0.0 \
    --noautoconsole
```

### Using raw `qemu-system-x86_64`:
```bash
qemu-system-x86_64 \
    -enable-kvm \
    -m 8192 \
    -smp 4 \
    -cpu host \
    -cdrom build/zothos-1.0-amd64.iso \
    -boot d \
    -vga virtio \
    -display gtk,gl=on
```

---

## 6. Live Session Verification Checklist

Once booted into the live environment:
- [ ] User logs into KDE Plasma 6 desktop automatically as `neo`.
- [ ] Minimal Celtic gold wallpaper renders without artifacts.
- [ ] 24K gold circular medallion icons render on desktop and in Kickoff menu.
- [ ] Drag-selection box shows translucent gold highlight.
- [ ] Konsole opens with green/cyan Zoth cyber prompt: `( ZOTH OS )-[~]`.
- [ ] Launch `zoth-music` to verify Web Audio API spectrum analyzer and classical focus audio.
- [ ] Test `zoth-mode ghost` and `zoth-mode incognito` to verify reality switching.
- [ ] Run `zoth-pkg verify` to audit installed tools.
- [ ] Launch Calamares installer (`install-zothos`) to verify disk partitioning and offline installation flow.
