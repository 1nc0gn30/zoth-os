---
title: "zoth-undercover"
tags: [os, cli]
aliases: ["zoth-undercover"]
---

# zoth-undercover

`file`: Bourne-Again shell script.

`zoth-undercover` is a disguise mode and identity mask utility located at `/usr/local/bin/zoth-undercover`.

### Core Functions

- **Compositor Theme**: Checks for `/etc/xdg/picom/picom-win11.conf`. If present, terminates any running `picom` process and relaunches `picom` using the Win11 configuration to apply a glassmorphic undercover aesthetic. If missing, continues in partial disguise.
- **Identity Spoofing**: Sets environment variables to mask and anonymize user-agent context:
  - `PR_CA_SPOOF="ZOTH-undercover-mode-active"`
  - `ZOTH_UNDERCOVER=1`
- **Subshell Launch**: Drops the user into an active disguise shell via `exec bash`.
- Notifies the user that `zoth-mode` can be run to toggle reality layers.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-undercover|zoth-undercover]] · [[CLI zoth-mode|zoth-mode]]