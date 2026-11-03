---
title: "zoth-control-center"
tags: [os, cli]
aliases: ["zoth-control-center"]
---

# zoth-control-center

`file`: Python script.

`zoth-control-center` is the hardware, daemon, and service supervisor located at `/usr/local/bin/zoth-control-center`.

It monitors core runtime engines and development servers across the Zoth ecosystem, providing immediate status checks and automated service boot capabilities.

### Supervised Services & Ports

- **Zoth Studio v2**: Port `3000` (`~/NullAITech/zoth-studio-v2`)
- **Zoth Civilization**: Port `9393` (`~/NullAITech/zoth-civilization/server.js`)
- **Zoth WebGen**: Port `5173` (`~/NullAITech/bolt.diy`)
- **Ollama Local LLM**: Port `11434` (`ollama serve`)
- **Neuro Memory Daemon**: Port `8094` (`~/NullAITech/zoth-studio-v2/server/daemon-runner.mjs`)
- **Sovereign Agent Bridge**: Port `8102` (`~/NullAITech/zoth-studio-v2/server/daemon-runner.mjs`)

### CLI Commands & Features

- **Hardware Inspection**: Detects total CPU logical threads and checks availability of `/dev/kvm` hardware virtualization.
- **Default Dashboard (`--status`)**: Renders an ANSI-colored console overview with `[ONLINE]` / `[OFFLINE]` badges for each service port.
- **`--json`**: Outputs hardware virtualization state and service availability as machine-readable JSON.
- **`--boot-all`**: Scans all managed services and launches any offline processes in the background using their designated boot commands.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Desktop zoth-control-center|zoth-control-center]]