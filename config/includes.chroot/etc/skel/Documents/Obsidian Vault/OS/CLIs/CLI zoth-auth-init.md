---
title: "zoth-auth-init"
tags: [os, cli]
aliases: ["zoth-auth-init"]
---

# zoth-auth-init

`file`: Bourne-Again shell script.

`zoth-auth-init` is the ZOTHOS Sovereign Authentication & Credential Enforcer script located at `/usr/local/bin/zoth-auth-init`, invoked at boot by [[Unit zoth-auth-init.service|zoth-auth-init.service]].

It standardizes system credentials, user accounts, PAM permissions, and display session profiles during live boot.

### Key Operations

- **Account Lifecycle**:
  - Purges legacy `neo` user and group.
  - Ensures primary user `zoth` (UID 1000) and secondary user `azoth` (UID 1001) exist with corresponding groups.
  - Sets default passwords (`zoth`) for `zoth`, `azoth`, and `root`.
- **Group Membership & Sudo**:
  - Grants `zoth` and `azoth` membership across key groups (`sudo`, `audio`, `video`, `docker`, `kvm`, `render`, `input`, `autologin`, `nopasswdlogin`, etc.).
  - Writes passwordless sudo configuration to `/etc/sudoers.d/99-zoth-users` with strict `0440` permissions.
- **PAM & Shadow Security**:
  - Sets permissions for `/etc/shadow` and `/etc/gshadow` (`0640` `root:shadow`).
  - Sets SUID bit and ownership on `unix_chkpwd` (`2755` `root:shadow`) to guarantee smooth PAM authentication.
- **Session & Desktop Profiles**:
  - Configures `AccountsService` metadata (`Session=plasmax11`) and avatar icons.
  - Seeds new home directories from `/etc/skel` and fixes top-level dotfile ownership without slow recursive traversal.
  - Purges installer artifacts (e.g., `calamares-install-debian.desktop`) and unblocks wireless hardware via `rfkill unblock all`.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Unit zoth-auth-init.service|zoth-auth-init.service]]