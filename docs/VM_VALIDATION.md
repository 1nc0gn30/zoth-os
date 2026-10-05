# ZOTHOS VM & System Validation Architecture

## Overview
This document details the virtual machine setup, hypervisor domains, network bridging, guest services, automated validation suite, and desktop console integration for ZOTHOS Linux.

---

## 1. Virtual Machine Domain Topology

### Installed Disk Domain (`zothos`)
- **Hypervisor**: KVM / QEMU via Libvirt (`qemu:///system`)
- **Domain Name**: `zothos`
- **Virtual Disk**: `${VM_DISK:-build/vms/zothos.qcow2}` (QCOW2 with virtio bus)
- **vCPU Allocation**: 4 vCPUs (`host-passthrough` / `host-model`)
- **Memory Allocation**: 8192 MiB RAM
- **Display Server**: KDE Plasma 6 + SDDM + KWin compositor (SPICE / VirtIO-GPU)

### Live ISO Verification Domain (`zothos-iso-live`)
- **Hypervisor**: KVM / QEMU via Libvirt (`qemu:///system`)
- **Domain Name**: `zothos-iso-live`
- **Boot Media**: `build/zothos-*.iso`
- **vCPU Allocation**: 4 vCPUs
- **Memory Allocation**: 8192 MiB RAM
- **Display Server**: KDE Plasma 6 Live Session (`user: zoth`)

---

## 2. Network Bridge & Guest Communications

- **Host Bridge**: `virbr0` on default libvirt network (`192.168.122.0/24`)
- **Guest Interface**: `vnet*` virtio NIC
- **IP Assignment**: Static/DHCP via `systemd-networkd` / NetworkManager
- **Guest Agent**: `qemu-guest-agent` channel enabled (`org.qemu.guest_agent.0`)
- **Automated SSH Access**:
  - OpenSSH Server active on port 22 (`ssh.service` & `ssh.socket`)
  - Key-based authentication configured from host (`~/.ssh/id_ed25519.pub`)
  - Passwordless sudo for live user `zoth`

---

## 3. Automated Validation Suite (`tools/test-zothos.sh`)

The validation suite provides 4 verification phases:

1. **Static & Chroot Integrity Audit**:
   - Validates all `/usr/local/bin/zoth*` and HexStrike scripts for executable bits and Bash/Python syntax.
   - Verifies systemd unit files, udev rules, KDE Plasma 6 configs, and wallpapers.
2. **Desktop & Launcher Integrity**:
   - Validates desktop entries in `config/includes.chroot/etc/skel/Desktop/` and `/usr/share/applications/`.
   - Confirms clean 24K gold medallion icons and absence of broken or pruned launchers.
3. **Libvirt Domain & Network Validation**:
   - Queries `virsh` domain state, memory, vCPUs, MAC, and leases.
   - Verifies host-to-guest ICMP ping with zero packet loss.
4. **Live VM Runtime Smoke Testing (SSH & Console)**:
   - Authenticates directly into the running guest.
   - Confirms kernel version and core ZOTHOS commands (`zoth-studio`, `zoth-update-studio`, `zoth-cockpit`, `zoth-pkg`, `zoth-music`, `zoth-ghost`).
   - Checks active GUI processes (`sddm`, `kwin_wayland` or `kwin_x11`, `plasmashell`).
   - Verifies Zoth Studio installation in `/opt/zoth-studio` and local service on port 3000.

### Usage:
```bash
# Run full automated validation suite:
./tools/test-zothos.sh --all

# Run live VM tests only:
./tools/test-zothos.sh --vm

# Run chroot/static file audit only:
./tools/test-zothos.sh --chroot

# Boot ISO or QCOW2 directly in QEMU:
./tools/test-zothos.sh --iso build/zothos-3.1-amd64.iso
./tools/test-zothos.sh --qcow2 "${VM_DISK:-build/vms/zothos.qcow2}"
```

---

## 4. Desktop Integration & Console Access

- **Desktop Entry**: `~/.local/share/applications/zothos-vm.desktop`
- **Action**: Opens the graphical VM console in Virtual Machine Manager:
  ```desktop
  [Desktop Entry]
  Name=ZOTHOS Linux (Virtual Machine)
  Comment=Open ZOTHOS VM console in Virtual Machine Manager
  Exec=virt-manager --connect qemu:///system --show-domain-console zothos-iso-live
  Icon=zoth-cockpit
  Terminal=false
  Type=Application
  Categories=System;
  ```
- **Live ISO Console Command**:
  ```bash
  virt-manager --connect qemu:///system --show-domain-console zothos-iso-live
  ```
