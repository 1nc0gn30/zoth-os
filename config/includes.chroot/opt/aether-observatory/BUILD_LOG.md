# AETHER-OBSERVATORY — BUILD & HARDENING LOG

Host target: `~/NullAITech/aether-observatory` on `127.0.0.1:8160` (`v2.0.0`).

---

## v2.0.0 — Whiteboard Remediation & Sovereign Hardening (2026-11-25)

- **Security & API Contracts (`src/server.js`)**:
  - Replaced wildcard `ACAO: *` on `/api/stream` with strict loopback origin enforcement (`HTTP 403` on non-loopback `Origin` across `/api/*`, `/health`, `/api/stream`, and `OPTIONS`).
  - Added explicit `OPTIONS` preflight handler (`204 No Content` / `403`), enforced `POST`-only on `/api/snapshot/now` (`405` on `GET`), added `/api/health` alias, strict integer validation on `/api/timeline/snapshots?limit=` (`400` on NaN/negative, clamped `1..2000`, returns `totalCount`), `404` on half-missing `/api/timeline/diff`, real `GET /api/timeline/export.{json,md}`, CSP `frame-ancestors` for Studio `:3000`, and `path.resolve` + `path.sep` static containment.
- **Async Non-Blocking Telemetry (`src/telemetry.js`, `src/recorder.js`)**:
  - Converted `sensors`, `ss -tlnp`, and `git` subprocess calls to async `execFile` with TTL caching and in-flight deduplication (eliminating single-threaded event-loop stalls).
  - Fixed CPU package temperature regex (`Package id 0` / `Tctl` / `Tdie` / `x86_pkg_temp` prioritized over NVMe `Composite`), socket `proto` (`tcp` / `tcp6`), `redactCmdline()` secret masking, portable `NULLAI_ROOT`, and `fs.mkdirSync(..., { recursive: true })` in `openDb()`.
- **Frontend Fixes (`public/`)**:
  - Fixed Time Machine chronological ordering, real field mappings (`load1`, `packageC`, `epoch`), real `/api/timeline/diff?t1=&t2=` and `/api/timeline/export.{md,json}`, and working `SCRUB` readout.
  - Fixed Sonorium audio graph (`filterTarget.connect(filter)` + `DynamicsCompressorNode` master limiter), lazy user-gesture `AudioContext`, clean stop/restart teardown, and live telemetry modulation.
  - Fixed SSE keys (`busyPct`, `packageC`, `memUsedPct`), `max zone` (`z.celsius`), `fan` (`thermals.fanRpm`), Git Pulse DOM construction (eliminated `innerHTML` XSS sink) + commit subjects, stray semicolon in `tokens.css:170` breaking `.skip-link`, 360° golden-angle constellation orbits (`constellation.js`), live Dark/Light theme sync on canvas, interactive Braille mode, zero-egress system fonts, raster `1200×630` `public/og-banner.png`, and `>= 44px` mobile tap targets.
- **MCP Server & AI Triage (`src/mcp_server.js`, `src/ai_triage.js`, `bin/aether-observatory.js`)**:
  - Implemented zero-dependency stdio JSON-RPC 2.0 MCP server (`aether-observatory mcp`) exposing `aether_observatory_telemetry`, `aether_constellation_nodes`, `aether_timeline_diff`, and `aether_snapshot_now`.
  - Added optional local Sovereign Anomaly Triage (`GET /api/providers`, `POST /api/ai/analyze`) with deterministic offline rules fallback.
  - Added `--version`, `--json` support on `constellation` and `snapshot`, `6000ms` CLI timeout, and real `totalCount` reporting.

## Verification Commands

```bash
npm test
aether-observatory --version
aether-observatory status --json
aether-observatory constellation --json
aether-observatory snapshot --json
```
