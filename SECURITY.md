# Security Policy

ZOTHOS is a one-maintainer Debian-based distribution. This page says plainly what
is and is not in place today, so you can decide how much to trust it.

## Supported versions

| Version | Status |
|---|---|
| 3.2.x | Current. Fixes land on `main` and in the next release. |
| 3.1.x | Previous public ISO. Checksums only; not signed. |
| < 3.1 | Not supported. |

## Reporting a vulnerability

- Email **neal@nealfrazier.tech** with "ZOTHOS security" in the subject, or use
  GitHub's **private vulnerability reporting** on this repo (Security → Report a vulnerability).
- Please don't open public issues for undisclosed vulnerabilities.
- We aim to acknowledge within 3 days and to ship a fix or mitigation for
  high/critical issues within 30 days. You'll be credited in the release notes unless you prefer not to be.

## Known security properties of the live image (read this)

These are deliberate choices for a live/pentest desktop. They are **not safe for a
machine on an untrusted network** without changes.

| Behaviour | Detail | How to change it |
|---|---|---|
| **Fixed passwords, reset on every boot** | `zoth-auth-init` (runs before the login manager) sets the passwords for `zoth`, `azoth` **and `root`** to `zoth` on every boot, so changing them with `passwd` does not persist across reboots. | Disable the unit: `sudo systemctl disable zoth-auth-init`, then set your own passwords. |
| **Passwordless sudo** | `zoth` and `azoth` have `NOPASSWD: ALL` (`/etc/sudoers.d/99-zoth-users`). Combined with the known password, anyone with local or remote shell access as these users is root. | Remove that file (`sudo visudo -f /etc/sudoers.d/99-zoth-users`). |
| **Third-party package sources** | Kali rolling and Parrot are enabled at low pin priority (100) next to Debian trixie. | Remove `/etc/apt/sources.list.d/{kali,parrot}.list`. |
| **`curl \| sh` installers** | Some optional tool installers (Ollama, uv, rustup, Foundry, Starship, Tailscale, Claude CLI) run the vendor's install script. They are forced to https/TLS 1.2 and fail on HTTP errors, but the scripts themselves are not pinned or checksummed because vendors change them without versioning. | Prefer Debian packages or verified release binaries. |

## What was hardened (Oct 2026, after the third-party audit)

- `zoth-bridge` (127.0.0.1:8199): the unauthenticated `/api/exec` shell endpoint was **removed**. App launching is token-protected, allowlisted, and never uses a shell. Host/Origin checks block drive-by requests from websites.
- Zoth OS desk (`/opt/zoth-os/serve.py`): cross-origin and DNS-rebinding POSTs are rejected.
- Network services that packages enable on install (BeEF, nginx, caddy, PostgreSQL, exim4, rpcbind, BloodHound, libvirt, Docker...) are **disabled** in the image; a **default-deny inbound ufw firewall** is enabled. BeEF's default password is replaced.
- Ollama listens on `127.0.0.1` only and accepts browser requests from local pages only.
- The ISO build runs with **APT signature checking on**; Kali/Parrot archives are verified against keyrings whose fingerprints are pinned in `build/build-iso.sh`.
- `zoth-sentinel`'s root IPC socket is no longer world-writable.
- Electron apps block navigation to remote pages and `<webview>`; several are moving to `contextIsolation`.

## Release verification

Releases published after this change get a `SHA256SUMS` file signed with Sigstore
cosign (keyless, from GitHub Actions) plus SLSA build provenance. **v3.1.0 and
earlier are not signed**; only their checksums exist. See [docs/VERIFYING.md](docs/VERIFYING.md).

## Automated checks

| Workflow | What it does |
|---|---|
| `ci.yml` | Shell/Python/JS syntax checks and guards against the audit regressions (apt-secure off, `trusted=yes`, Ollama on 0.0.0.0, `/api/exec`). |
| `gitleaks.yml` | Gitleaks on every pull request and every push. Fails when tracked files contain secrets or operator PII (phones, machine homes, host disk serials). See [docs/SECRET-HYGIENE.md](docs/SECRET-HYGIENE.md). |
| `codeql.yml` | CodeQL security-extended on JS/TS, Python and Actions. |
| `semgrep.yml` | Semgrep security-audit + secrets rules (SARIF to code scanning). |
| `scorecard.yml` | OpenSSF Scorecard, published. |
| `sbom.yml` | SPDX + CycloneDX SBOMs of the source tree (attached to releases). |
| `release-sign.yml` | cosign signature + provenance for release checksums. |

## Not done yet (honest gaps)

- Builds are **not yet reproducible** end to end (see [REPRODUCIBLE_BUILDS.md](REPRODUCIBLE_BUILDS.md)).
- `zoth-vault-daemon` is a committed binary without source in this repo, so its cryptography cannot be audited here.
- No branch protection or second reviewer yet; no OpenSSF Best Practices badge yet.
- The ISO bundles proprietary software (e.g. Google Chrome); redistribution terms are being reviewed.
