# 🜂 ZOTHOS Linux: ISO Build & Deployment Guide 🜄

> *"As above, so below; as code, so mind."*

This guide details how to build, customize, and verify bootable hybrid UEFI/BIOS ISOs for ZOTHOS Linux.

---

## 1. System Requirements

* **Operating System**: Debian 12 (Bookworm), Debian 13 (Trixie), Ubuntu 24.04+, Parrot OS 6+, or Kali Linux.
* **Architecture**: x86_64 (AMD64).
* **Storage**: Minimum 35 GB free disk space (fast NVMe recommended for squashfs compression).
* **RAM**: 8 GB minimum, 16 GB+ recommended.
* **Privileges**: Root / `sudo` access required for `chroot`, loop mounts, `squashfs-tools`, and `live-build`.

---

## 2. Dependencies & Build Tools

Install the required build packages on the host machine:
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
    rsync \
    qemu-system-x86 \
    libvirt-clients \
    libvirt-daemon-system \
    virt-manager
```

---

## 3. Fast Incremental Build (`pack-iso.sh`)

When iterating on desktop configurations, desktop shortcuts, themes, CLI wrappers (`usr/local/bin/`), or preloaded applications in an existing populated workspace:

```bash
cd /path/to/zothos

# Package live-image hybrid ISO from workspace
sudo bash build/pack-iso.sh
```

### What `pack-iso.sh` Executes:
1. **Overlay Synchronization**: Synchronizes all files from [`config/includes.chroot/`](../config/includes.chroot/) into `build/live_workspace/chroot/` using `rsync -aHAX`. This guarantees that edits to scripts, desktop entries, and skel configs are immediately present in the target filesystem.
2. **Squashfs Compression**: Runs `lb binary_rootfs` to compress the chroot into `live/filesystem.squashfs` using high-ratio XZ compression.
3. **Binary ISO Assembly**: Runs `lb binary_iso` to generate the UEFI and legacy BIOS hybrid ISO using `xorriso`.
4. **Permissions Normalization**: Automatically changes ISO permissions to `0644` so regular users can mount or attach the ISO to QEMU/KVM.
5. **Loopback Sanity Audit**: Temporarily mounts `filesystem.squashfs` on a loopback device to verify that critical binaries (e.g., `zoth-update-studio`, `zoth-studio`, `zoth-pkg`) are present, executable, and free of corruption.

Output image location:
`build/zothos-1.0-amd64.iso` (~12 GB).

---

## 4. Full Clean Build from Scratch (`build-iso.sh`)

To rebuild the entire distribution from pristine upstream sources:

```bash
cd /path/to/zothos

# Run the master automated build pipeline
sudo bash build/build-iso.sh
```

The pipeline executes the following stages:
1. **Bootstrap Stage**: Bootstraps minimal Debian 13 (Trixie) base via `debootstrap`.
2. **Chroot Configuration**: Applies APT pinning rules for Debian Trixie + Kali Rolling + Parrot OS dual repository integration.
3. **Package Installation**: Installs packages defined across `config/package-lists/*.list.chroot`.
4. **Desktop Overlay**: Injects KDE Plasma 6 themes, 24K gold icons (`Zoth-Hermetic`), and Calamares graphical installer configurations.
5. **Security & Tool Nexus Overlay**: Pre-configures `zoth-pkg`, Zoth Studio v2, HexStrike, Hermes Agent, and native CLI utilities.
6. **Binary Assembly**: Uses `xorriso` to create the final UEFI/BIOS hybrid ISO.

---

## 5. Virtual Machine Testing

### Testing with `libvirt` and `virt-manager`:
```bash
# Check status of existing validation VM:
virsh --connect qemu:///system dominfo zothos-iso-live

# Launch or attach to the graphical console:
virt-manager --connect qemu:///system --show-domain-console zothos-iso-live

# Re-create the VM from ISO if needed:
virsh --connect qemu:///system destroy zothos-iso-live 2>/dev/null || true
virsh --connect qemu:///system undefine zothos-iso-live 2>/dev/null || true

virt-install \
    --connect qemu:///system \
    --name zothos-iso-live \
    --memory 8192 \
    --vcpus 4 \
    --disk size=30,format=qcow2 \
    --cdrom /path/to/zothos/build/zothos-1.0-amd64.iso \
    --os-variant debiantesting \
    --graphics spice,listen=127.0.0.1 \
    --noautoconsole
```

### Testing with raw `qemu-system-x86_64`:
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
- [ ] Minimal Celtic gold wallpaper renders without graphical artifacts.
- [ ] 24K gold circular medallion icons render on desktop and in Kickoff menu.
- [ ] Drag-selection box shows translucent gold highlight.
- [ ] Konsole opens with green/cyan Zoth cyber prompt: `( ZOTH OS )-[~]`.
- [ ] Double-click `Zoth Studio v2` to verify local server startup and browser/container display.
- [ ] Double-click `Zoth Update Studio` (or run `zoth-update-studio --check`) to verify Git sync functionality.
- [ ] Launch `zoth-music` to verify Web Audio API spectrum analyzer and preloaded classical focus audio.
- [ ] Run `zoth-pkg verify` to audit installed tools.
- [ ] Launch Calamares installer (`install-zothos`) to verify disk partitioning and offline installation flow.
