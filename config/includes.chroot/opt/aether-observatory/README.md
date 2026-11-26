# AETHER-OBSERVATORY (`v2.0.0`)

> **Zero-egress cyber-physical telemetry workstation: 3D process/port constellation, SQLite flight recorder with diff/export, stdio JSON-RPC 2.0 MCP server, local sovereign AI anomaly triage, and WebAudio acoustic sonification.**

Engineered by Neal Frazier Tech ([@1nc0gn30](https://github.com/1nc0gn30/aether-observatory)) · [NullAI Platform](https://nullai.tech)

---

## What It Does

A single-page local telemetry workstation built on zero-dependency Node.js `>=22` (`node:http` + `node:sqlite`). It instruments real host hardware and sockets (`/proc/stat`, `/proc/meminfo`, `/proc/diskstats`, `/proc/net/dev`, `/sys/class/thermal`, `sensors(1)`, `ss -tlnp`) via async TTL-cached `execFile` probes (zero shell execution, zero external CDN requests, zero fake mocks).

- **3D Daemon & Port Constellation**: Maps all listening TCP/TCP6 sockets onto concentric golden-angle 3D orbits joined with the Zoth Studio tool registry, with three interactive pipelines (**01 VECTOR**, **02 BRAILLE**, **03 DITHER**) and a secret-redacted Deep Socket Inspector drawer.
- **Flight Odometers & Live Telemetry**: Split-flap odometers and real-time charts for CPU load/busy%, true CPU package temperature (`Package id 0` / `Tctl` / `x86_pkg_temp`), fan RPM, memory/swap pressure, and 14-day Git activity across `~/NullAITech`.
- **Sonorium (WebAudio)**: Opt-in procedural drone routed through a lowpass filter and `DynamicsCompressorNode` master limiter into a 60fps FFT waterfall, dynamically modulated by live CPU, RAM, package thermal, and open socket counts.
- **Time Machine Flight Recorder**: Persistent SQLite ring-buffer (`data/aether-flight.db`, 8,640 rows = 24h @ 10s cadence) with chronological scrubber, T1→T2 port/thermal/load diff, and one-click Markdown/JSON export.
- **Sovereign AI Anomaly Triage**: Optional local triage via AGY Bridge (`:18000`), Ollama (`:11434`), AZOTH (`:8136`), or local CLIs, with an honest offline deterministic rule engine fallback.
- **Stdio MCP Server**: Built-in JSON-RPC 2.0 MCP server (`aether-observatory mcp`) exposing `aether_observatory_telemetry`, `aether_constellation_nodes`, `aether_timeline_diff`, and `aether_snapshot_now`.

## Quick Start

```bash
# Verify CLI installation
aether-observatory --version
aether-observatory --help

# Run the loopback daemon (default 127.0.0.1:8160)
aether-observatory serve --port 8160

# CLI commands (all support --json)
aether-observatory status --json
aether-observatory constellation --json
aether-observatory snapshot --json

# Start stdio JSON-RPC 2.0 MCP server
aether-observatory mcp
```

Open the standalone workstation at `http://127.0.0.1:8160` (supports `?theme=light|dark` and `?embed=1`).

## HTTP & SSE API (`127.0.0.1:8160`)

All API, SSE, and `OPTIONS` preflight endpoints enforce strict loopback-only CORS (`127.0.0.1`, `localhost`, `[::1]`, `zoth.nullai.tech`) and reject foreign `Origin` headers with `HTTP 403`.

| Method & Endpoint | Description |
| :--- | :--- |
| `GET /health` · `GET /api/health` | Service health (`{"status":"ok","service":"aether-observatory","version":"2.0.0","port":8160,"bind":"127.0.0.1","db":...,"totalSnapshots":...}`) |
| `GET /api/telemetry` · `GET /api/telemetry/live` | Live CPU, core %, CPU package temp (`Package id 0` priority), thermal zones, fan RPM, memory/swap, disk I/O, network counters, listening ports, process count |
| `GET /api/constellation/nodes` | Live `ss -tlnp` listeners joined with `toolsData.js` (`port`, `proto` `tcp`/`tcp6`, `pid`, `uptimeSec`, `latencyMs`, secret-redacted `cmdline`) |
| `GET /api/git/pulse` | Top 14 most recently active git repos under `NULLAI_ROOT` (default `~/NullAITech`) with branch, latest commit subject, 14-day count, and dirty file count |
| `GET /api/timeline/snapshots?limit=240` | SQLite ring-buffer frames (`limit` strictly validated integer `1..2000`; returns `totalCount`, `count`, `frames`) |
| `GET /api/timeline/diff?t1=<epoch>&t2=<epoch>` | Spawned/terminated ports, thermal spikes, load/busy/memory/process deltas between two epoch-ms timestamps (`404` if either snapshot is missing) |
| `GET /api/timeline/export.md` · `export.json` | Downloadable Markdown or JSON incident diff report for `?t1=&t2=` (or recent default window) |
| `POST /api/snapshot/now` | Samples live telemetry immediately and persists a frame (`POST`-only; `GET` returns `405`) |
| `GET /api/stream` | Loopback-gated SSE stream broadcasting compact frames immediately on connect and every 10 seconds |
| `GET /api/providers` · `POST /api/ai/analyze` | Detect local sovereign AI providers and run telemetry/diff anomaly triage with deterministic fallback |

## Testing

```bash
npm test
```

Runs `node --test tests/test_observatory.mjs` against an isolated temporary SQLite database, verifying telemetry parsing (`Package id 0` vs NVMe `Composite`), secret redaction, SQLite ring-buffer, CORS/preflight/method guards, export endpoints, MCP stdio JSON-RPC, and production guardrails.

## Open-Access & Support

100% free and open-access — zero paywalls, zero accounts, zero external analytics or CDN fonts.

- [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X)
- Solana Tip: `GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`
