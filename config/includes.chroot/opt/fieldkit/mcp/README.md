# FieldKit MCP Server for AI Agents (`v2.0.0`)

> **Hardened JSON-RPC 2.0 `stdio` Model Context Protocol (MCP) bridge for Physical AI mission DAG orchestration, 3D FOV/raycast verification, fail-closed voice gating, and on-device biometric vault auditing.**  
> Engineered by **Neal Frazier Tech (@1nc0gn30)** • [NullAI Platform](https://nullai.tech)

---

## Overview

The **FieldKit MCP Server** (`fieldkit-mcp`) connects MCP-compatible agents (Claude Desktop, Cursor, Cline, OpenCode, Hermes Agent, Antigravity, Zoth Studio) directly to the live **FieldKit Python SDK** (`Mission`, `RaycastEvaluator`, `NearFieldVoiceGate`, `SovereignBiometricVault`) and canonical YAML mission templates over standard `stdio` JSON-RPC 2.0.

Key protocol guarantees:
- Strict JSON-RPC 2.0 compliance (`-32700` Parse error, `-32600` Invalid Request, `-32602` Invalid params, `-32601` Method not found).
- Silent acceptance of JSON-RPC notifications (`notifications/initialized`, `notifications/cancelled`) with zero stdout reply.
- Supports `initialize`, `ping`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, and `prompts/list`.
- Bounded `1 MiB` stdin line cap and `128` active mission cap, plus optional atomic `0700`/`0600` disk persistence via `FIELDKIT_STATE_DIR`.

---

## Provided MCP Tools (10)

| Tool | Purpose |
| :--- | :--- |
| `fieldkit_create_mission` | Initialize a custom physical mission backed by a validated acyclic DAG (`Mission`). |
| `fieldkit_load_template` | Load canonical YAML templates (`industrial_pump`, `tccc_tourniquet`, `datacenter_sweep`). |
| `fieldkit_get_mission_status` | Query active step, DAG progress percentage, verification rules, and elapsed time. |
| `fieldkit_progress_step` | Advance to the next checkpoint once physical verification evidence is recorded. |
| `fieldkit_evaluate_fov_frame` | Match detected POV objects against step `verification_rules` plus optional 3D `RaycastEvaluator` pinch hit testing. |
| `fieldkit_vault_audit` | Inspect live `SovereignBiometricVault` cryptography (`AES-256-GCM`), honest key management, and zero-egress state. |
| `fieldkit_verify_raycast` | Run real 3D skeletal thumb/index pinch-to-bounding-box hit testing (`RaycastEvaluator`). |
| `fieldkit_verify_voice_gate` | Run fail-closed near-field distance (`0.0–1.0 m`) and speaker embedding verification (`NearFieldVoiceGate`). |
| `fieldkit_list_missions` | List active, completed, and aborted missions plus available canonical YAML templates. |
| `fieldkit_abort_mission` | Safely abort an active mission and record its terminal failure state and safety reason. |

---

## Exposed MCP Resources (4)

- `fieldkit://templates/industrial_pump` (`application/x-yaml`)
- `fieldkit://templates/tccc_tourniquet` (`application/x-yaml`)
- `fieldkit://templates/datacenter_sweep` (`application/x-yaml`)
- `fieldkit://docs/specification` (`text/markdown`)

---

## CLI Flags

```bash
fieldkit-mcp --stdio          # Start JSON-RPC 2.0 stdio MCP loop (default)
fieldkit-mcp --status         # Print human-readable runtime readiness summary
fieldkit-mcp --status --json  # Print machine-readable JSON manifest
fieldkit-mcp --version        # Print fieldkit-mcp 2.0.0
fieldkit-mcp --help           # Show usage flags
```

---

## Portable Host Integration

### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "fieldkit": {
      "command": "fieldkit-mcp",
      "args": ["--stdio"]
    }
  }
}
```

### Cursor / Cline (`mcp.json`)
```json
{
  "mcpServers": {
    "fieldkit": {
      "command": "fieldkit-mcp",
      "args": ["--stdio"],
      "env": {}
    }
  }
}
```

### Hermes Agent (`~/.hermes/config.yaml` or CLI)
```bash
hermes mcp add fieldkit -- fieldkit-mcp --stdio
```

---

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
