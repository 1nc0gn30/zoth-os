---
title: "zoth-vault-daemon"
tags: [os, cli]
aliases: ["zoth-vault-daemon"]
---

# zoth-vault-daemon

`file`: ELF 64-bit LSB pie executable.

`zoth-vault-daemon` is the compiled ELF backend daemon providing the local cryptographic secret storage engine for ZothOS, located at `/usr/local/bin/zoth-vault-daemon`.

### Architecture & Capabilities

- **Cryptographic Backend**: Implements Argon2id password-based key derivation, XChaCha20-Poly1305 symmetric encryption, BLAKE3 hashing, and memory zeroization for stored secrets.
- **Local Service**: Listens on local port `8787` by default (configurable via `--port` or the `ZOTH_VAULT_PORT` environment variable).
- **HTTP API**: Provides local endpoints (e.g. `/health`, `/v1/session`) consumed by the [[CLI zoth-vault|zoth-vault]] CLI interface and desktop tools.
- **Session & Process Management**: Manages authenticated sessions, lock/unlock states, and encrypted credential payloads without leaving secrets on disk unencrypted.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[CLI zoth-vault|zoth-vault]]