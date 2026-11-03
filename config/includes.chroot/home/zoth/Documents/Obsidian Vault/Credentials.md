# Credentials

Live ISO and this workstation:

| User | Password | Role |
|---|---|---|
| `zoth` | `zoth` | UID 1000, default session, NOPASSWD sudo |
| `azoth` | `zoth` | UID 1001, sandboxed agent / build user |
| `root` | `zoth` | |

`zoth-auth-init` deletes legacy `neo` on boot. `build-iso.sh` useradds `zoth` and `azoth`. SECURITY.md matches zoth/azoth NOPASSWD sudo.

Walk-away overlay `zoth-lock` uses a **separate** scrypt hash at `~/.config/zothos/session-lock.hash` (mode 0600). Super+L still uses the KDE login password.

Do not print Signal numbers, tokens, or `build/cosign.key`.

## Related

- [[Zoth OS]]
- [[Repo vs Live OS]]
