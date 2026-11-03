---
title: "kokoro-voice-runtime"
tags: [os, daemon]
aliases: ["kokoro_voice", "kokoro-voice-runtime"]
port: 9394
subsystem: "Voice & Audio"
status: "standby"
health_url: "http://127.0.0.1:9394/health"
repo: "~/NullAITech/zoth-civilization/engine/kokoro_worker.py"
---

# kokoro-voice-runtime

Kokoro Voice Engine

- **Name:** `kokoro-voice-runtime`
- **Ports:** 9394
- **Health:** `http://127.0.0.1:9394/health`
- **Stats:** `http://127.0.0.1:9394/health`
- **Repo:** `~/NullAITech/zoth-civilization/engine/kokoro_worker.py`
- **Optional:** `true`

Registered in `NullAITech/src/conductor.py`. Bind is loopback unless the spec says otherwise. Civilization remains paused.

## See also

[[Zoth OS]] · [[MOC Daemons]]