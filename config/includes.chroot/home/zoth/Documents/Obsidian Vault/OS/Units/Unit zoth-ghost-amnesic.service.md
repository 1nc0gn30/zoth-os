---
title: "zoth-ghost-amnesic.service"
tags: [os, systemd]
---
# zoth-ghost-amnesic.service

ZOTHOS Ghost Amnesic Anti-Forensics Memory & History Scrub

- **Unit:** `zoth-ghost-amnesic.service`
- **WantedBy:** `shutdown.target halt.target poweroff.target reboot.target sleep.target suspend.target hibernate.target hybrid-sleep.target`
- **ExecStart:** `/bin/bash -c "if [ -x /usr/local/bin/zoth-ghost ]; then /usr/local/bin/zoth-ghost scrub; else sync; echo 3 > /proc/sys/vm/drop_caches; for h in /home/*/.bash_history /root/.bash_history /home/*/.zsh_history /root/.zsh_h…`

- **Description:** ZOTHOS Ghost Amnesic Anti-Forensics Memory & History Scrub
- **ExecStart:** `/bin/bash -c "if [ -x /usr/local/bin/zoth-ghost ]; then /usr/local/bin/zoth-ghost scrub; else sync; echo 3 > /proc/sys/vm/drop_caches; for h in /home/*/.bash_history /root/.bash_history /home/*/.zsh_history /root/.zsh_hi`
- **WantedBy:** `shutdown.target halt.target poweroff.target reboot.target sleep.target suspend.target hibernate.target hybrid-sleep.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[CLI zoth-ghost-amnesic|zoth-ghost-amnesic]] · [[Desktop zoth-ghost-amnesic|zoth-ghost-amnesic]]