---
title: "zoth-vault"
tags: [os, cli]
aliases: ["zoth-vault"]
---

# zoth-vault

`file`: Python script.

`zoth-vault` is the sovereign secrets and multi-vault manager CLI located at `/usr/local/bin/zoth-vault`.

### Core Architecture

- **Daemon Integration**: Connects over HTTP to the local [[CLI zoth-vault-daemon|zoth-vault-daemon]] (default port `8787`, configurable via `ZOTH_VAULT_PORT`), automatically spawning the daemon process if inactive.
- **Session Security**: Enforces `0600` permissions on session tokens stored under `$XDG_RUNTIME_DIR/zoth-vault` or `~/.cache/zoth-vault`.
- **Process Secret Injector**: Injects decrypted secrets directly into child processes (`zoth-vault run <command>`) without writing unencrypted secrets to disk.

### Supported Commands

- `init`: Initialize a new encrypted master vault with a passphrase.
- `status`: Inspect daemon connectivity and vault lock state.
- `unlock` / `lock`: Authenticate or lock the active session.
- `daemon [start|stop|restart]`: Control the background daemon service.
- `list`, `get`, `set`, `delete`: Query, read, write, or remove encrypted keys and tags.
- `export`, `import`: Export (.env or encrypted/decrypted JSON) or import key collections.
- `run`: Execute commands with vault secrets bound to environment variables.
- `menu`: Open the interactive terminal vault interface.

### External Vault Passthroughs

- `bw`: Delegate to the Bitwarden CLI.
- `keepass` / `keepassxc`: Launch KeePassXC offline database.
- `pass`: Access UNIX Pass GPG-encrypted secret trees.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-vault|zoth-vault]] · [[CLI zoth-vault-daemon|zoth-vault-daemon]]