# ✦ ZOTHOS v3.2 Master Release — Sovereign Perimeter, Tri-Transceiver RF & Cross-Model AI Mesh

ZOTHOS v3.2 delivers a major leap in operational security, physical-layer RF sensing, and multi-agent AI federation. This release introduces the Sovereign Perimeter firewall baseline, localhost-only AI isolation, plug-and-play multi-antenna synthetic aperture radar (SAR), unified cross-model AI skill discovery (Antigravity + Grok), and bare-metal disk passthrough virtualization blueprints.

---

### 🌟 Key Highlights & Major Additions

#### 🛡️ 1. Sovereign Perimeter Hardening & Network Baseline
- **UFW Out-of-the-Box**: Integrated `ufw` directly into core opsec packages with automated firstboot bootstrapping (`zoth-bootstrap`).
- **Strict Default-Deny Ingress**: All inbound connections are dropped by default (`deny incoming`), protecting the workstation from local network exposure and hostile WiFi environments.
- **Encrypted Mesh Access**: Native ingress whitelist for local loopback (`lo`) and Tailscale mesh interfaces (`tailscale0` + `41641/udp`).
- **Sentinel Telemetry Channel**: Dedicated port rule for encrypted high-speed remote monitoring (`7890/tcp`).
- **Localhost Developer Server Guard**: Hardened system-wide shell aliases (`serve` and `pyhttp`) strictly bound to `127.0.0.1` to prevent accidental public data leakage during web testing.

#### 🔒 2. Localhost AI Runtime Isolation
- **Ollama Loopback Confinement**: Hardened `/etc/systemd/system/ollama.service` and drop-in overrides to bind strictly to `127.0.0.1:11434`.
- **Wildcard CORS Elimination**: Stripped permissive `OLLAMA_ORIGINS=*` headers, immunizing local inference endpoints from browser drive-by prompt injection and unauthorized remote access.
- **Unused Daemon Elimination**: Disabled untrusted local network listeners (`nginx`, `kismet`) to minimize host attack surface.

#### 📡 3. Tri-Transceiver Synthetic Aperture Array & RF Sensing
- **MediaTek & Multi-Chipset Firmware**: Added `firmware-mediatek` and `firmware-misc-nonfree` to guarantee immediate plug-and-play capability for MT7612U (Netgear A6210) and RTL8812AU (TP-Link T4U) dual-band USB adapters.
- **Multi-Antenna Array Baseline**: Standardized physical antenna geometry ($X = -0.25\text{m}$, $0\text{m}$, $+0.25\text{m}$) across simultaneous interfaces (`wlan0`, `wlan1`, `wlan2`).
- **Differential Wall Penetration Discriminator**: Real-time physical absorption ratio ($\Delta\text{Loss} = \text{RSSI}_{2.4\text{GHz}} - \text{RSSI}_{5.0\text{GHz}}$) enabling non-line-of-sight barrier identification (`FREE_AIR_LOS`, `DRYWALL_PARTITION`, `HEAVY_MASONRY`).
- **AoA + Optical Ground Truth Fusion**: Differential Angle-of-Arrival computation coupled with real-time camera optical tracking in `anderson-security-sentinel`.

#### 🤖 4. Universal AI Skill & Tool Federation (Antigravity ↔ Grok)
- **Shared Cognitive Directory**: Pre-provisioned `~/.grok/config.toml` in skeleton profiles dynamically linking to `~/.gemini/config/skills`.
- **Master UI/UX & SaaS Skills**: Instant parity across frontier models (Google Antigravity, Claude, and xAI Grok) for:
  - `design-director` — High-end design critique and hierarchy enforcement
  - `ui-verification-loop` — Multi-viewport CDP screenshot verification
  - `avant-garde-ui` — Modern design commodities (conic beams, bento grids, aurora meshes)
  - `sovereign-saas-design` — High-converting paywall blueprints and DePay/Stripe cash registers
  - `motion-choreography` & `claude-motion-graphics` — Kinematics and 60fps canvas animation
  - `zoth-studio-design-system` — Canonical Zoth design tokens and MotionReveal primitives

#### ⚡ 5. Bare-Metal KVM Direct Drive Passthrough Blueprint
- **Parrot OS Passthrough**: Complete production runbook (`docs/PARROT_OS_PASSTHROUGH_ROADMAP.md`) for zero-overhead secondary OS execution directly on physical disk partitions (`${ZOTH_PARROT_DISK}`).
- **Hardware Isolation**: IOMMU group definitions, vfio-pci device assignment, CPU pinning (`host-passthrough`), and low-latency virtio networking.

---

### 📂 Modified Configuration Invariants

| Component | Target Path | Changes Applied |
| :--- | :--- | :--- |
| **Package Lists** | `config/package-lists/20-desktop.list.chroot` | Added `firmware-mediatek` |
| **Opsec Packages** | `config/package-lists/30-opsec.list.chroot` | Added `ufw` |
| **Ollama Service** | `config/includes.chroot/etc/systemd/system/ollama.service` | Bound to `127.0.0.1:11434`, stripped CORS |
| **Ollama Override** | `config/includes.chroot/etc/systemd/system/ollama.service.d/override.conf` | Hardened localhost override |
| **Bootstrap Provisioner** | `config/includes.chroot/usr/local/bin/zoth-bootstrap` | Added automated UFW rules and activation |
| **User Shell Profile** | `config/includes.chroot/etc/skel/.bashrc` | Added localhost server aliases & Grok environment |
| **Grok Configuration** | `config/includes.chroot/etc/skel/.grok/config.toml` | Universal skills path mapped |
| **Hypervisor Docs** | `docs/PARROT_OS_PASSTHROUGH_ROADMAP.md` | Full production passthrough blueprint |

---

### 💿 ISO Build & Deployment

To pack and verify the updated live image:
```bash
cd ${ZOTH_SRC_ROOT}/zoth-os
sudo ./build/pack-iso.sh
./tools/sign-and-attest.sh build/zothos-3.2-amd64.iso
```
