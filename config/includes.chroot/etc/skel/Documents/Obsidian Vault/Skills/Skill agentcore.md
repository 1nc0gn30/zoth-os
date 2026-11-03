---
title: "agentcore"
tags: [skill, hermes]
aliases: ["agentcore"]
---

# AWS Bedrock AgentCore

A workstation skill from Hermes for running `agent-browser` workflows inside managed cloud browser sessions hosted on AWS Bedrock AgentCore.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/tools/agent-browser-0.26.0-linux-x64/skill-data/agentcore/SKILL.md`

## When to load
Load this skill when browser automation needs to execute remotely on AWS infrastructure rather than the local desktop:
- Running `agent-browser` using AWS credentials (IAM roles, environment variables, or SSO via `aws configure export-credentials`).
- Preserving browser session state (cookies, local storage, active logins) across automated tasks using persistent profile IDs.
- Viewing live session execution in real time via the AWS Bedrock AgentCore Console Live View URL.
- Offloading heavy browser workloads or maintaining cloud-hosted test runners.

## Configuration & usage
- **Provider invocation:** Run commands with `-p agentcore` (e.g., `agent-browser -p agentcore open https://example.com`) or export `AGENT_BROWSER_PROVIDER=agentcore`.
- **Environment variables:**
  - `AGENTCORE_REGION`: Target AWS region (defaults to `us-east-1`).
  - `AGENTCORE_BROWSER_ID`: Cloud browser identifier (defaults to `aws.browser.v1`).
  - `AGENTCORE_PROFILE_ID`: Unique ID to persist authentication and cookies across runs.
  - `AGENTCORE_SESSION_TIMEOUT`: Session lifetime in seconds (defaults to `3600`).
- **Standard tooling:** Operates identically to local Chrome CDP sessions, supporting standard commands like `snapshot -i`, `click @eN`, `fill`, and `screenshot`.

## See also

[[MOC Skills]] · [[Zoth OS]]