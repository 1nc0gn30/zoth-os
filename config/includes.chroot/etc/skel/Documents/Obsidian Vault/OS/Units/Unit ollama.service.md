---
title: "ollama.service"
tags: [os, systemd]
---
# ollama.service

Ollama Service

- **Unit:** `ollama.service`
- **WantedBy:** `multi-user.target`
- **ExecStart:** `/usr/local/bin/ollama serve`

- **Description:** Ollama Service
- **ExecStart:** `/usr/local/bin/ollama serve`
- **WantedBy:** `multi-user.target`
- Image unit under `etc/systemd/system`. Loopback daemons unless the unit says otherwise.

## See also

[[Zoth OS]] · [[MOC Units]] · [[Pkg ollama|ollama]]