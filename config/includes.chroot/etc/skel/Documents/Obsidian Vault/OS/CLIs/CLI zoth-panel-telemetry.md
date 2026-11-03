---
title: "zoth-panel-telemetry"
tags: [os, cli]
aliases: ["zoth-panel-telemetry"]
---

# zoth-panel-telemetry

`file`: Bourne-Again shell script.

`zoth-panel-telemetry` is a lightweight system monitoring script that outputs real-time CPU and RAM telemetry formatted for desktop panel widgets. Located at `/usr/local/bin/zoth-panel-telemetry`.

## Telemetry Calculation
The script reads directly from Linux kernel pseudofiles:
- **CPU Usage**: Parses `/proc/stat` to calculate aggregate active user/system time versus total CPU cycles, outputting integer usage percentage (`${cpu}%`).
- **RAM Usage**: Parses `/proc/meminfo` for `MemTotal` and `MemAvailable`, computing consumed memory in gigabytes (`${ram}`, e.g. `1.8G`).

## Panel Output Markup
It emits XML-style Pango markup commonly consumed by desktop panel generic monitor applets:
- `<txt><span color="#d7b56d">${cpu}%  ·  ${ram}</span></txt>`: Displays gold-tinted telemetry text in the status bar.
- `<tool>ZOTHOS</tool>`: Defines tooltip text displayed on hover.
- `<click>zoth-os</click>`: Executes the `zoth-os` desktop launcher upon clicking the panel item.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[CLI zoth-os|zoth-os]]