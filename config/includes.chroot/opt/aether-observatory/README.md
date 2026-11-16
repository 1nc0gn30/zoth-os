# AETHER-OBSERVATORY

> **Avant-garde cyber-physical telemetry, 3D process/port constellation, time-machine flight recorder, and WebAudio acoustic sonification workstation.**

Built by Neal Frazier Tech [@1nc0gn30](https://x.com/1nc0gn30) · NullAI Platform · 2026-11-15

---

## What it is

A single-page observatory that treats the local Linux workstation as a *physical* instrument. Real hardware telemetry (`/sys/class/thermal`, `/proc/stat`, `/proc/meminfo`, `ss -tlnp`), a live 3D orbital map of every listening daemon, a persistent SQLite flight recorder, an opt-in WebAudio drone sonifier that harmonizes with CPU/temp/socket load, and a T1-vs-T2 incident diff engine for any two snapshots.

No mocks, no `setTimeout`-driven fake data — every panel measures the real machine.

## Quick start

```bash
# Install the CLI once (already done for you)
which aether-observatory

# Run the daemon (or use --port to change it)
aether-observatory serve --port 8160

# Open the observatory
http://127.0.0.1:8160
```

## API

| Endpoint                   | Description                                                         |
|----------------------------|---------------------------------------------------------------------|
| `GET /health`              | Liveness probe (`{"ok":true}`)                                      |
| `GET /api/telemetry/live`  | CPU model/coreCount/load1/busyPct, thermals (11 zones), mem, `ss -tlnp` count, process count |
| `GET /api/constellation/nodes` | Live `ss -tlnp` joined with zoth-studio registry (`~/NullAITech/zoth-studio-v2/src/data/toolsData.js`). Returns `{port, name, pid, zothTool, uptimeSec, latencyMs}` |
| `GET /api/git/pulse`       | All repos under `~/NullAITech/*` with branch, 14-day commits, dirty files |
| `GET /api/timeline/snapshots` | SQLite ring-buffer (8640 rows = 24h @ 10s) of historical telemetry frames |
| `GET /api/timeline/diff?t1=&t2=` | Spawned/killed ports, thermal spikes, load deltas between two snapshot IDs |
| `GET /api/stream`          | SSE live telemetry stream (250ms)                                   |

## UI features

- **Aperture intro** — 1.6s Braille aperture (U+2800), ESC-skip, deterministic seed, removed from DOM when done.
- **3 Modes** — VECTOR-ORBITAL / BRAILLE-SUBPIXEL / BAYER-8X8-DITHER (1-bit halftone + scanlines).
- **Interactive camera** — drag to orbit, wheel/pinch to zoom, click node to inspect (drawer with PID/uptime/latency/addresses).
- **Split-flap odometers** — Uptime, listening sockets, thermal package.
- **Hardware knobs** — rotary SVG dials for Pitch/Harmonics/Brightness/Drift (drag vertically, wheel fine, ↑↓ keys).
- **Time machine** — scrubber + DIFF T1/T2 mode + Markdown/JSON export.
- **Dual theme** — Obsidian Sovereign Dark `#07090E` + gold #D4AF37 / cyan #38BDF8 · Editorial Ivory Light `#F7F4EB` + ink #111318 / bronze #8C6239.
- **Docs drawer** — full in-app documentation; coffee link in footer.
- **JSON-LD** — WebApplication + FAQPage schema.org markup for SEO/a11y.
- **a11y** — skip-link, ARIA labels, prefers-reduced-motion, ≥44px touch targets on mobile.

## Files

```
.
├── bin/
│   ├── aether-observatory          # POSIX wrapper
│   └── aether-observatory.js       # ES module CLI
├── src/
│   ├── telemetry.js                # /sys/class/thermal + /proc/stat + /proc/meminfo + ss
│   ├── recorder.js                 # SQLite ring-buffer (8640 rows, 10s cadence)
│   └── server.js                   # node:http + node:sqlite daemon
├── public/
│   ├── index.html                  # Single-page app
│   ├── css/{tokens,app}.css        # Dual-theme tokens + layout
│   ├── js/
│   │   ├── app.js                  # Bootstrap + SSE + drawers + touch hints
│   │   ├── intro.js                # Braille aperture intro
│   │   ├── constellation.js        # 3D orbital map, 3 modes
│   │   ├── sonifier.js             # WebAudio drone + 4 knobs + FFT waterfall
│   │   └── timemachine.js          # Scrubber + diff + export
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
└── data/
    └── aether-flight.db            # SQLite ring-buffer (auto-created)
```

## Verification (what was checked)

- ✅ Real telemetry: `/sys/class/thermal` (11 zones), `/proc/stat`, `/proc/meminfo`, `sensors` binary, `ss -tlnp`, `uptime`.
- ✅ Real constellation: 32+ live nodes from `ss -tlnp` joined with `toolsData.js`.
- ✅ SQLite ring-buffer: 8640 rows @ 10s cadence, persistent across restarts.
- ✅ `overflowPx === 0` at 390x844, 820x1180, 1440x900, both themes.
- ✅ `imgsMissingAlt === 0`, `errors.length === 0` in harness.
- ✅ Mobile touch targets ≥44px.
- ✅ JSON-LD valid (WebApplication + FAQPage).
- ✅ robots.txt + sitemap.xml served.
- ✅ Coffee link in footer.
- ✅ No secrets/keys in repo.

## License / paywall
Free. No paywalls, no accounts, no tracking cookies, no external analytics. Voluntary [☕ buy me a coffee](https://buymeacoffee.com/1nc0gn30).

---

**Built in 12 hours. All real. No mocks.**
