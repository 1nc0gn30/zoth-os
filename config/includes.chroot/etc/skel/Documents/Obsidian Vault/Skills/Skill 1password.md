---
title: "1password"
tags: [skill, hermes]
aliases: ["1password"]
---

# 1Password CLI

A workstation skill from Hermes for setting up the 1Password CLI (`op`), authenticating, and securely reading or injecting secrets into agent workflows.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/optional-skills/security/1password/SKILL.md`

## When to load
Load this skill when an agent or user needs secrets managed via 1Password instead of plaintext environment variables or files:
- Installing or configuring the 1Password CLI (`op`).
- Authenticating via service account token (`OP_SERVICE_ACCOUNT_TOKEN`), desktop app biometric integration, or Connect server.
- Reading secret references using URIs like `op://Vault/Item/field` or retrieving one-time passwords (OTP).
- Injecting secrets into configuration templates via `op inject`.
- Executing commands with secret environment variables using `op run`.

## Key capabilities & workflows
- **Service account authentication:** Recommended for headless Hermes sessions; token persists automatically without requiring interactive desktop prompts.
- **Desktop app integration:** Uses a dedicated tmux session to maintain persistent biometric authentication context across non-interactive terminal executions.
- **Security guardrails:** Emphasizes `op run` and `op inject` over saving secrets to disk; forbids printing raw credentials unless explicitly asked.

## See also

[[MOC Skills]] · [[Zoth OS]]