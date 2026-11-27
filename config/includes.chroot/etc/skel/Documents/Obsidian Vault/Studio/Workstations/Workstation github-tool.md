---
title: "Zoth GitHub Studio & Autonomous Repo Workstation"
tags: [studio, workstation, github, git-ops]
aliases: ["github-tool"]
version: "2.3.0"
executionType: "hybrid"
---

# Zoth GitHub Studio & Autonomous Repo Workstation

Hybrid dual-org GitHub Ops workstation (`v2.3.0`) combining read-only loopback `:3000` inspection of local `git`/`gh`/`gpg`/`ssh` toolchains and `~/NullAITech/` dual-org (`NullAITech` + `1nc0gn30`) repository parity with 100% offline browser Git status/remote auditing, Conventional Commit release synthesis, GitHub Actions CI-gate linting, and zero-secret SSH/GPG commit-signing playbooks.

## Specification & Taxonomy

- **ID:** `github-tool`
- **Name:** Zoth GitHub Studio & Autonomous Repo Workstation
- **Version:** `2.3.0`
- **Type:** `cockpit` (Multi-pane developer workstation for human-agent Git & CI engineering)
- **Execution Type:** `hybrid` (Loopback `:3000` read-only Git APIs + 100% offline client-side analyzers)
- **Band:** Build
- **Canonical Route:** `/workstations/github-tool` (alias `/tools/github-tool`)
- **CLI Quickstart:** `zoth open github-tool` / `zoth open github-tool --json`
- **Loopback APIs:** `GET /api/studio/github`, `GET /api/studio/github/status`, `POST /api/studio/github/audit`

## Operational Profile & Security Invariants

Registered in the Zoth Studio v2 matrix under the **Build** functional band. The workstation enforces strict loopback `Host`/`Origin` guards (`403` on untrusted hosts or cross-origin writes), `64 KB` request body caps (`413`), strict repository slug allowlists (`400`/`403` on path traversal), shell-free `execFileSync` invocations, **zero reads of `GH_TOKEN`, `~/.config/gh/hosts.yml`, `~/.git-credentials`, or `~/.ssh/id_*` private keys**, and automatic `~/` + secret-shape redaction across all API responses and formula-safe JSON/Markdown/CSV exports.

## See also

[[Zoth Studio]] · [[MOC Workstations]] · [[MCP github]] · [[MCP github-readonly]]
