# Roadmap: Running Physical Parrot OS SSD Inside ZothOS via KVM Passthrough

## Executive Summary
This document provides the complete technical blueprint and operational runbook to boot your secondary physical SSD containing **Parrot OS** directly inside **ZothOS** as a high-performance virtual machine. 

This eliminates the need to reboot or shut down your host system to do work in Parrot OS. All changes, installed packages, and files created in the VM are committed directly to the physical drive.

---

## 1. Hardware Profile

Resolve the host disk and the Parrot disk on the machine you are using. Do not commit serial numbers, filesystem UUIDs, or `/dev/disk/by-id` paths.

| Component | Host (ZothOS) | Work Drive (Parrot OS) |
| :--- | :--- | :--- |
| **Drive** | `ZOTH_HOST_DISK`, or discover with `lsblk` | `ZOTH_PARROT_DISK` — a `/dev/disk/by-id/...` path |
| **Model / serial** | `lsblk -d -o NAME,MODEL,TRAN,SERIAL` | Same command. Keep the model and serial out of git. |
| **Partition table** | Confirm with `lsblk -o NAME,FSTYPE,PTTYPE` | Confirm before passthrough. A DOS/MBR disk needs BIOS boot in the VM. |
| **CPU & RAM** | `nproc` and `free -h` | Size the VM with `ZOTH_PARROT_RAM` (default `12G`) and `ZOTH_PARROT_CPUS` (default `8`). |
| **Acceleration** | KVM via `/dev/kvm` | `qemu-system-x86_64` |

---

## 2. Implementation Roadmap

```mermaid
flowchart TD
    A["Phase 1: Hardware Safety & Permissions"] --> B["Phase 2: One-Click Launcher Script"]
    B --> C["Phase 3: Desktop Menu Integration"]
    C --> D["Phase 4: Optional Virt-Manager GUI"]
    D --> E["Phase 5: First Boot & Verification"]
```

---

### Phase 1: Hardware Safety & Drive Access Configuration

> [!CAUTION]
> **Data Integrity Rule**: Never mount the Parrot disk on ZothOS while the Parrot VM is running. Simultaneous write access by two independent kernels will corrupt the filesystem.

#### Step 1.1: Automatic Unmount Safety
Ensure ZothOS's desktop file manager (Nautilus/Thunar/Dolphin) does not auto-mount the Parrot disk. The launcher script checks that the resolved disk is not mounted before booting.

#### Step 1.2: Grant Non-Root Disk Access to User `zoth`
To launch Parrot OS without needing `sudo` every time (which preserves native Wayland display, audio, and clipboard integration), create a persistent udev rule:

```bash
# File: /etc/udev/rules.d/99-parrot-disk.rules
KERNEL=="sd*", SUBSYSTEM=="block", ENV{ID_SERIAL_SHORT}=="<ID_SERIAL_SHORT from udevadm info>", GROUP="kvm", MODE="0660"
```

Apply the rule:
```bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```
Since `zoth` is already a member of the `kvm` group, this gives your user direct read/write permission to the physical drive.

---

### Phase 2: QEMU Raw Disk Launcher Script

Create the launcher script at `~/bin/launch-parrot.sh` or `~/.local/bin/launch-parrot.sh`.

```bash
#!/usr/bin/env bash
set -euo pipefail

DISK_ID="${ZOTH_PARROT_DISK:-}"
RAM_SIZE="${ZOTH_PARROT_RAM:-12G}"
CPU_CORES="${ZOTH_PARROT_CPUS:-8}"
if [[ -z "$DISK_ID" ]]; then
    echo "Set ZOTH_PARROT_DISK to the /dev/disk/by-id path of the Parrot SSD."
    echo "List candidates with: ls -l /dev/disk/by-id/"
    exit 1
fi

echo "🔍 Checking safety invariants for Parrot OS physical SSD..."

# 1. Verify disk is present
if [ ! -b "$DISK_ID" ]; then
    echo "❌ Error: Parrot OS physical disk not found at $DISK_ID"
    exit 1
fi

# 2. Invariant Check: the resolved disk (or its parent) must not be mounted
DISK_REAL="$(readlink -f "$DISK_ID")"
DISK_BASE="$(lsblk -no PKNAME "$DISK_REAL" 2>/dev/null | head -1 || true)"
DISK_BASE="${DISK_BASE:-$(basename "$DISK_REAL")}"
if findmnt -rn -S "/dev/${DISK_BASE}" >/dev/null 2>&1 || mount | grep -q "^/dev/${DISK_BASE}"; then
    echo "❌ SAFETY HALT: /dev/${DISK_BASE} is currently mounted in ZothOS!"
    echo "Unmount it before proceeding."
    sudo umount "/dev/${DISK_BASE}"* 2>/dev/null || { echo "Failed to unmount. Aborting."; exit 1; }
fi

echo "🚀 Booting Parrot OS physical drive in KVM accelerated window..."

exec qemu-system-x86_64 \
    -name "Parrot OS (Work Drive)",process="parrot-vm" \
    -enable-kvm \
    -m "$RAM_SIZE" \
    -smp "$CPU_CORES" \
    -cpu host \
    -drive file="$DISK_ID",format=raw,if=ide,cache=none,aio=native \
    -vga virtio \
    -display gtk,gl=on \
    -device virtio-net-pci,netdev=net0 \
    -netdev user,id=net0 \
    -audiodev pipewire,id=snd0 \
    -device intel-hda \
    -device hda-duplex,audiodev=snd0 \
    -usb \
    -device usb-tablet \
    -boot order=c
```

Make it executable:
```bash
chmod +x ~/.local/bin/launch-parrot.sh
```

#### Key Flags Explained:
- `if=ide`: Emulates a native IDE/SATA controller matching Parrot OS's bare-metal install so GRUB and the initial ramdisk boot without missing driver issues.
- `cache=none,aio=native`: Bypasses the host OS page cache so disk writes go straight to the physical SSD safely and quickly.
- `display gtk,gl=on`: Uses hardware OpenGL acceleration inside your Wayland desktop session.
- `usb-tablet`: Prevents mouse cursor trapping, enabling seamless mouse movement between ZothOS and Parrot OS.
- `audiodev pipewire`: Feeds sound directly into ZothOS's running PipeWire server.

---

### Phase 3: Desktop Menu Integration (Application Shortcut)

Create a standard desktop launcher so you can launch Parrot OS directly from your app drawer, docks, or rofi/wofi:

```ini
# File: ~/.local/share/applications/parrot-os.desktop
[Desktop Entry]
Name=Parrot OS (Physical Work Drive)
Comment=Boot Parrot OS physical SSD inside KVM
Exec=sh -c 'exec "${HOME}/.local/bin/launch-parrot.sh"'
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=System;Utility;Virtualization;
```

---

### Phase 4: Alternative Management via Virt-Manager (GUI)

If you prefer a full graphical hypervisor interface to adjust settings:

1. Install virt-manager & libvirt:
   ```bash
   sudo apt install -y virt-manager libvirt-daemon-system
   ```
2. In `virt-manager`:
   - Click **Create New Virtual Machine** -> **Import existing disk image**.
   - Browse to the `$ZOTH_PARROT_DISK` by-id path from `ls /dev/disk/by-id/`. Do not commit that path.
   - Set OS Type: **Debian 12** or **Linux**.
   - Configure CPU: 8 cores, Memory: 12288 MB.
   - Check **Customize configuration before install**:
     - Ensure Boot Mode matches the disk partition table (**BIOS** for DOS/MBR, **UEFI** for GPT).
     - Set Disk bus to **SATA** or **VirtIO** (if virtio drivers are in Parrot's initramfs).
   - Click **Begin Installation**.

---

### Phase 5: Operational Guidelines & Best Practices

| Action | Recommended Practice |
| :--- | :--- |
| **Shutting Down** | Always shut down Parrot OS cleanly from inside Parrot (`Power Off` menu or `sudo shutdown -h now`). Avoid force-killing the QEMU window to protect the physical filesystem. |
| **Bare-Metal Boot** | If you ever choose to restart your machine and boot directly into Parrot OS from your BIOS/UEFI boot menu, you can still do so at any time. |
| **Filesystem Snapshots** | If the Parrot root is Btrfs, take a native subvolume snapshot inside Parrot OS before running updates. |
| **Shared Folders** | For transferring files between ZothOS and Parrot OS, use standard local SSH (`ssh zoth@localhost -p ...`) or setup a 9p virtfs shared folder. |

---

## 3. Quick Reference Command Card

| Task | Command |
| :--- | :--- |
| **Launch Parrot VM** | `launch-parrot.sh` (or click app icon) |
| **Check Disk Status** | `lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT` |
| **Verify Acceleration** | `kvm-ok` or `cat /sys/module/kvm_intel/parameters/nested` |
| **Kill Process (Emergency Only)** | `pkill -f "parrot-vm"` |
