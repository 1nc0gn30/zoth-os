# Anderson Sentinel — control panel

One place to switch the sentinel on and off, and to see what it is actually
doing while it runs.

    GUI      http://127.0.0.1:8150
    CLI      control/sentinel {on|off|restart|arm|disarm|status|open|panel|logs}
    Service  systemctl --user status anderson-control.service
    Launcher "Anderson Sentinel Control" in the desktop application menu

## Why it is a separate process

The panel never lives inside the daemon. If the sentinel is stopped, crashed,
or wedged (which is exactly when you need the switch), the panel is still there
answering. That is also why it binds only `127.0.0.1`: it can start and kill
processes, so it stays off the network unless you deliberately pass
`--host 0.0.0.0` (e.g. to reach it over Tailscale).

## Files

| Path | Purpose |
|---|---|
| `control/panel.py` | HTTP server, all state and start/stop logic (stdlib only) |
| `control/ui.html` | the interface — white, light-only, no dark mode |
| `control/sentinel` | CLI front door; talks to the panel over HTTP |
| `control/icon.svg` | launcher icon |
| `control/therm-watch.py` | stdlib thermal sampler — package/core temps, fan RPM, load, top CPU |
| `~/.config/systemd/user/anderson-control.service` | keeps the panel running |
| `~/.config/systemd/user/anderson-therm-watch.service` | keeps the sampler running (independent of the sentinel) |
| `~/.local/share/applications/anderson-control.desktop` | menu launcher |
| `~/.config/anderson_security/control.jsonl` | audit log of every action |
| `~/.config/anderson_security/thermal.jsonl` | one JSON sample per 30 s (rotates at 400 KB / 6000 lines) |
| `~/.config/anderson_security/daemon.pid` | pid of the daemon the panel started |

## Watching machine temperature

The sentinel is the heaviest thing this repo runs, so heat is a first-class
readout rather than a footnote: the GUI's telemetry grid carries
`PACKAGE TEMP` / `LOAD` / `FANS`, and `control/sentinel status` prints the same
three fields.

For a continuous record, `control/therm-watch.py` samples `/sys` + `/proc`
(never spawning `sensors` when `/sys` already has the answer) and appends one
JSON line per sample:

    control/therm-watch.py --once          # one sample
    control/therm-watch.py --pretty        # human summary of one sample
    control/therm-watch.py --interval 30   # loop (what the unit runs)
    control/therm-watch.py --tail 20       # last samples from the log

Warning at **85 °C**, critical at **95 °C**. The sampler is `Nice=10`,
`IOSchedulingClass=idle`, `CPUWeight=20` (~1 % CPU per 30 s sample) so it can
never be the thing that heats the machine. It is deliberately *not* tied to any
sentinel unit: heat has to be visible even when the daemon is stopped or broken.

## Routes

| Route | Does |
|---|---|
| `GET /` | the UI |
| `GET /api/state` | full telemetry snapshot (JSON) |
| `GET /health` | panel liveness |
| `POST /api/activate` | start `server.py --port 8103` in its own session/process group |
| `POST /api/deactivate` | SIGTERM the group, wait 8s, escalate to SIGKILL, confirm `:8103` closed |
| `POST /api/restart` | deactivate then activate |
| `POST /api/arm` / `POST /api/disarm` | proxy to the running daemon (refuse honestly when it is down) |

## Safety rules built in

- **Named-target kills only.** A process is a candidate for shutdown only if
  its `/proc/<pid>/cmdline` or cwd points at *this* repository and it is running
  `server.py`/`run.py`. The port number alone never selects a victim.
- **Group shutdown.** The daemon is spawned with `start_new_session=True`, so it
  owns its process group; the stop path signals the group and therefore reaps
  children too (`ffplay`, TTS helpers) — the stray `breach_claxon.wav` loop
  cannot survive a stop.
- **The panel is never in the blast radius.** The group-kill path refuses to
  signal the panel's own process group.
- **Verify, then report.** After a stop the panel re-scans `/proc` and re-probes
  `:8103`; if anything survived it says so instead of claiming success.
- **No fake success.** `arm`/`disarm` with the daemon down returns `ok:false`.

## Install / move

    cp control/panel.py /path/to/repo/control/          # repo-relative paths resolve themselves
    systemctl --user daemon-reload && systemctl --user restart anderson-control.service

Panel port change: edit `--port` in the unit's `ExecStart` (and set
`ANDERSON_PANEL_URL` for the CLI). Daemon port change: `DAEMON_PORT` in
`panel.py`.

## Verified

Activate → daemon came up as pid 456734 listening on `:8103` with `/health`
answering (`armed:false`, `DISARMED`, 10 enrolled faces, camera streaming).

Deactivate → process gone, `:8103` closed, no stray audio process, second stop
correctly reports "already stopped — no change", `arm` while offline returns
`ok:false`.

Kill-path safety — who may be signalled: `_is_daemon_proc()` accepts a pid only
when it is a **Python interpreter whose script argument is `server.py` /
`run.py` living inside this repo**. That test (not a port number, not a
substring) decides what `deactivate` may signal, because a loose "mentions
server.py" rule once matched an unrelated shell that merely sat in the repo —
and would have let `deactivate` signal it.

Self-kill question, answered with a substitute not the real daemon: a stdlib
stub was placed at `<repo>/.panel-test-daemon/server.py`, started, watched, and
then stopped through the real endpoint (`panel-safety-test.py`, 14/14):

    [therm] package temp = 66.0C (guard 82C)
    [stub] pid 574314, :8103 up = True
    [PASS] stub accepted by _is_daemon_proc
    [PASS] both decoys refused by _is_daemon_proc      # bash in the repo whose
                                                       # cmdline says server.py;
                                                       # python -c saying it too
    [PASS] stub present in find_daemon_pids [574314]   # no decoy in the list
    [PASS] state sees stub (pid=574314)                # extra_pids == []
    -> ok=True msg='stopped 1 process group(s) (escalated to SIGKILL) · :8103 closed'
    [PASS] stub process is gone        [PASS] :8103 closed
    [PASS] PANEL SURVIVED (still on :8150)
    [PASS] decoys untouched and still alive
    [PASS] state reports daemon down after / no pid claimed while stopped

Same-name-different-repo check: a running
`python3 /tmp/outside-repo-test/server.py` is refused
(`_is_daemon_proc -> False`, absent from `find_daemon_pids()`), so "named
server.py" alone is never enough.

The panel is not in its own blast radius, so a stop of `anderson-control.service`
is never the panel's own doing — it takes an explicit external
`systemctl --user stop` (one such stop is on record at 14:21:25; nothing in the
user units declares `PartOf=`/`Conflicts=` on the panel, and its group-kill
refuses its own process group).

UI: captured at 390 / 768 / 1440 px — `overflowPx: 0`, `errors: []` at all
three, screenshots inspected by eye: white light-only theme, correct
enabled/disabled button states for a stopped daemon, `PACKAGE TEMP 68°C`,
`LOAD 3.79`, `FANS 4108 rpm` in the telemetry grid, no clipping or tofu.


