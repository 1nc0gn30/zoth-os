---
title: "VM_VALIDATION"
tags: [os, doc]
---
# VM_VALIDATION

This document details the virtual machine setup, hypervisor domains, network bridging, guest services, automated validation suite, and desktop console integration for ZOTHOS Linux.

- **Host Bridge**: `virbr0` on default libvirt network (`192.168.122.0/24`) - **Guest Interface**: `vnet*` virtio NIC - **IP Assignment**: Static/DHCP via `systemd-networkd` / NetworkManager - **Guest Agent**: `qemu-guest-agent` channel enabled (`org.qemu.guest_agent.0`) - **Automated SSH Access**:

- **Path:** `docs/VM_VALIDATION.md`

## See also

[[Zoth OS]] · [[MOC Docs]]
