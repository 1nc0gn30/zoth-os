# Contributing to ZOTHOS

Thanks for helping. ZOTHOS is a live-build overlay on Debian 13 (trixie).

## Layout
- `config/includes.chroot/` - files copied into the image (scripts in `usr/local/bin`, apps in `opt/`).
- `config/package-lists/`, `package-lists/` - packages baked into the ISO.
- `build/build-iso.sh` - the clean, documented build. `build/hooks/normal/` - chroot hooks.
- `docs/` - build, verification and VM validation guides.

## Workflow
1. Open an issue first for anything larger than a small fix.
2. Branch from `main`, keep commits focused, write clear messages (`area: what and why`).
3. Run the same checks as CI before pushing:
   ```bash
   bash -n path/to/script            # shell syntax
   python3 -m py_compile path/to.py  # python syntax
   node --check config/includes.chroot/opt/<app>/main.js
   ```
4. Open a pull request. CI (syntax + policy guards), gitleaks, CodeQL and Semgrep must pass. Scan locally with `bash tools/scan-secrets.sh` ([docs/SECRET-HYGIENE.md](docs/SECRET-HYGIENE.md)).

## Rules for security-sensitive changes
- Never bind new services to `0.0.0.0` by default; use `127.0.0.1` and document how to expose.
- Never pass request data to a shell. Use argv lists and allowlists.
- Local HTTP APIs that change state must check `Host`/`Origin` and, if they launch or execute anything, require a token.
- No `[trusted=yes]` network apt sources and no `--apt-secure false`.
- New Electron windows: `contextIsolation: true`, `nodeIntegration: false`, a preload with a minimal `contextBridge` API.
- No secrets, phone numbers, machine homes, or host disk serials in the repo. Use the placeholders in [docs/SECRET-HYGIENE.md](docs/SECRET-HYGIENE.md). Report vulnerabilities privately (see [SECURITY.md](SECURITY.md)).

## Claims
Don't add marketing claims the code can't back up ("verified", "military-grade",
"zero egress", "hardened kernel"). State what the system actually does.

## Code of conduct
See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
