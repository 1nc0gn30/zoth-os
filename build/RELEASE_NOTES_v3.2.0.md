# ZOTHOS v3.2.0

Debian 13 (Trixie) + KDE Plasma 6.3 live/installable ISO (x86_64, hybrid UEFI/BIOS) with local AI agent tooling and ~75 curated security tools. 94 commits since v3.1.0.

## Security & defaults
- Default-deny `ufw` baked into the image; network services enabled by packages (BeEF, nginx, docker, kismet) now disabled by default.
- Ollama bound to 127.0.0.1:11434; wildcard `OLLAMA_ORIGINS` removed.
- apt signature checks on, with fingerprint-pinned Kali/Parrot keys over https; installers force https + TLS 1.2 + fail-fast.
- zoth-bridge: removed `/api/exec`; token-gated allowlisted launches with Host/Origin checks. Zoth OS desk blocks cross-origin / DNS-rebinding POSTs.
- Electron apps: 14 apps moved to contextIsolation with nodeIntegration off and per-app preload allowlists; renderer input validated before reaching a shell; remote navigation/new windows blocked.
- Honest SECURITY.md (documents boot password reset and NOPASSWD sudo).

## Fixes
- zoth-auth-init no longer recursively chowns established homes at boot (was hitting the 15 s timeout).
- Launchers: agent-tool terminals close cleanly on Ctrl+C (Konsole), TryExec on optional tools, Plymouth Phoenix launcher had empty Exec, pet menu actions validated.
- Fonts pinned (DejaVu, Noto Color Emoji, Symbola) so splash/UI glyphs don't render as tofu.
- Plasma QML TabBar binding loop fixed; cursor daemon polling throttled.
- ShellCheck pass across scripts (CI now fails on ShellCheck errors).

## New / packaged
- Firmware for MT7612U / RTL8812AU USB Wi-Fi adapters (`firmware-mediatek`, `firmware-misc-nonfree`).
- Packaged local services: neuro-memory-daemon, agent-flight-recorder, agent-capsule-jail, agent-policy-auditor, agent-budget-sentinel, MCP Lens, Etsy POD Forge/Connector.
- MCP server catalog (152 entries) shipped, all disabled by default.
- `zothos-join-iso.sh` to reassemble split ISO parts with clear errors.

## Docs & supply chain
- Replaced unverified marketing claims with accurate statements; README tool count corrected to 75+.
- CI/CodeQL/Semgrep/Scorecard/SBOM workflows SHA-pinned; keyless cosign signing of SHA256SUMS via `release-sign.yml`. Reproducible builds: in progress (see REPRODUCIBLE_BUILDS.md).

## Download
The ISO is split into <2 GB parts (GitHub asset limit). Download all `zothos-3.2-amd64.iso.partNN` files plus `zothos-join-iso.sh` and `SHA256SUMS` into one folder, then:
```
bash zothos-join-iso.sh   # reassembles and checks the ISO SHA-256
```
Verify the signature: see docs/VERIFYING.md (cosign verify-blob with the SHA256SUMS.cosign.bundle).

Also: Zoth Studio https://zoth.nullai.tech · CLI `npx @nullaitech/zoth`
