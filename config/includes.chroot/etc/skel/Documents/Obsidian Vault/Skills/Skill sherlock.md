---
title: "sherlock"
tags: [skill, hermes]
aliases: ["sherlock"]
---

# sherlock

**sherlock** is an optional Hermes workstation skill for conducting automated OSINT username reconnaissance across 400+ social networks and online services.

- **Origin:** Hermes skill (`~/.hermes/hermes-agent/optional-skills/security/sherlock/SKILL.md`)
- **Category:** Workstation skill (Hermes Security), not a Zoth product.
- **Prerequisites:** `sherlock` CLI tool (`sherlock-project` via pipx, pip, or Docker).

### When to Load
Load this skill when:
- Investigating account footprints or registrations associated with a specific username across the web.
- Checking username availability across dozens of services simultaneously.
- Conducting passive OSINT or reconnaissance research tasks.

### Core Capabilities & Execution
- **Command Invocation:** Executes non-interactive CLI sweeps (`sherlock --print-found --no-color "<username>" --timeout 90`).
- **Optional Routing Flags:** Supports Tor proxy routing (`--tor`) and NSFW service coverage (`--nsfw`) when specifically requested.
- **Output Parsing:** Captures matching target profiles (`[+] Platform: URL`), compiles categorized links, and tracks output dump files (`<username>.txt`).
- **Error Handling:** Manages false-positive detection, site timeouts, and rate limits across public endpoints.

## See also

[[MOC Skills]] · [[Zoth OS]]