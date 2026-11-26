#!/usr/bin/env python3
"""Anderson Sentinel — operator control panel.

A standalone console for activating and deactivating the Anderson Security
Sentinel daemon. It deliberately does NOT live inside the daemon: it keeps
working when the sentinel is stopped, crashed, or wedged (which is exactly
when you need it).

    /opt/zothos-ai-env/bin/python3 control/panel.py --port 8150

Stdlib only — no third-party imports, so it stays runnable even when the
engine virtualenv or its dependencies are broken.

Routes
    GET  /                 control UI (white, no dark mode)
    GET  /api/state        full telemetry snapshot (JSON)
    GET  /health           panel liveness
    POST /api/activate     launch the sentinel daemon
    POST /api/deactivate   stop the daemon and its process group
    POST /api/restart      deactivate then activate
    POST /api/arm          arm the perimeter (proxy to daemon :8103)
    POST /api/disarm       disarm the perimeter (proxy to daemon :8103)
"""

from __future__ import annotations

import argparse
import json
import os
import re
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

CONTROL_DIR = Path(__file__).resolve().parent
REPO_DIR = CONTROL_DIR.parent
UI_FILE = CONTROL_DIR / "ui.html"
DAEMON_ENTRY = REPO_DIR / "server.py"
VENV_PYTHON = Path("/opt/zothos-ai-env/bin/python3")
DAEMON_PORT = 8103
DEFAULT_PANEL_PORT = 8150

CONF_DIR = Path.home() / ".config" / "anderson_security"
PID_FILE = CONF_DIR / "daemon.pid"
DAEMON_LOG = CONF_DIR / "sentinel-daemon.log"
ACTION_LOG = CONF_DIR / "control.jsonl"

PROC = Path("/proc")
CLK_TCK = os.sysconf("SC_CLK_TCK")
ACTION_LOCK = threading.Lock()

FAVICON = (
    b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#ffffff"/>'
    b'<path d="M16 4 L28 9 L28 17 C28 23 23 27 16 29 C9 27 4 23 4 17 L4 9 Z" fill="none" stroke="#0a7d4f" stroke-width="2.5"/>'
    b'<circle cx="16" cy="16" r="3" fill="#0a7d4f"/></svg>'
)


# --------------------------------------------------------------------------- process helpers
def _alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def _cmdline(pid: int) -> str:
    try:
        raw = (PROC / str(pid) / "cmdline").read_bytes()
    except OSError:
        return ""
    return raw.replace(b"\0", b" ").decode("utf-8", "replace").strip()


def _cwd(pid: int) -> str:
    try:
        return os.readlink(PROC / str(pid) / "cwd")
    except OSError:
        return ""


def _argv(pid: int) -> list[str]:
    try:
        raw = (PROC / str(pid) / "cmdline").read_bytes()
    except OSError:
        return []
    return [arg.decode("utf-8", "replace") for arg in raw.split(b"\0") if arg]


def _is_daemon_proc(pid: int) -> bool:
    """True only for a python interpreter running THIS repo's server.py / run.py.

    Vetting is deliberately narrow because this same test decides what
    `deactivate` is allowed to signal: a shell, editor or grep that merely
    mentions "server.py" (or happens to sit in the repo) must never match, and
    a bare port number never selects a victim either.
    """
    if pid <= 1 or pid == os.getpid() or not _alive(pid):
        return False
    argv = _argv(pid)
    if not argv:
        return False
    if not Path(argv[0]).name.startswith("python"):
        return False
    repo = REPO_DIR.resolve()
    for arg in argv[1:]:
        if arg.startswith("-"):
            continue
        script = Path(arg)
        if script.name not in ("server.py", "run.py"):
            continue
        if not script.is_absolute():
            script = Path(_cwd(pid) or "/") / script
        try:
            resolved = script.resolve()
        except OSError:
            continue
        if repo == resolved.parent or repo in resolved.parents:
            return True
    return False


def find_daemon_pids() -> list[int]:
    found = []
    try:
        entries = list(PROC.iterdir())
    except OSError:
        return found
    for entry in entries:
        if entry.name.isdigit() and _is_daemon_proc(int(entry.name)):
            found.append(int(entry.name))
    return sorted(found)


def read_pid_file() -> int | None:
    try:
        return int(PID_FILE.read_text().strip())
    except (OSError, ValueError):
        return None


def port_open(port: int = DAEMON_PORT, host: str = "127.0.0.1") -> bool:
    with socket.socket() as sock:
        sock.settimeout(0.6)
        return sock.connect_ex((host, port)) == 0


def daemon_health(timeout: float = 1.5) -> dict | None:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{DAEMON_PORT}/health", timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception:
        return None


def daemon_post(path: str, timeout: float = 3.0) -> tuple[bool, str]:
    headers = {
        "Content-Type": "application/json",
        "Origin": f"http://127.0.0.1:{DAEMON_PORT}",
        "X-Sentinel-Action": "1",
    }
    token = os.environ.get("ANDERSON_API_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(
        f"http://127.0.0.1:{DAEMON_PORT}{path}",
        data=b"{}",
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return True, resp.read().decode()[:200]
    except Exception as exc:  # noqa: BLE001 - surfaced to the operator verbatim
        return False, str(exc)


# --------------------------------------------------------------------------- telemetry
def _proc_ticks(pid: int) -> int | None:
    try:
        stat = (PROC / str(pid) / "stat").read_text()
    except OSError:
        return None
    parts = stat.rsplit(") ", 1)[-1].split()
    if len(parts) < 13:
        return None
    return int(parts[11]) + int(parts[12])  # utime + stime


def proc_cpu(pid: int, sample: float = 0.3) -> float | None:
    first = _proc_ticks(pid)
    if first is None:
        return None
    time.sleep(sample)
    second = _proc_ticks(pid)
    if second is None:
        return None
    return round(max(second - first, 0) / CLK_TCK / sample * 100, 1)


def proc_age_rss(pid: int) -> tuple[int | None, int | None]:
    try:
        out = subprocess.run(
            ["ps", "-o", "etimes=,rss=", "-p", str(pid)],
            capture_output=True, text=True, timeout=5,
        ).stdout.split()
        return int(out[0]), int(out[1]) * 1024
    except Exception:
        return None, None


def thermals() -> dict:
    info: dict = {"package_c": None, "fans_rpm": []}
    try:
        out = subprocess.run(["sensors"], capture_output=True, text=True, timeout=6).stdout
    except Exception:
        return info
    match = re.search(r"Package id 0:\s*\+([\d.]+)°C", out)
    if match:
        info["package_c"] = float(match.group(1))
    info["fans_rpm"] = [int(v) for v in re.findall(r"fan\d+:\s*(\d+) RPM", out)]
    return info


def tail_lines(path: Path, count: int = 25) -> list[str]:
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        return []
    return lines[-count:]


def recent_actions(count: int = 12) -> list[dict]:
    out = []
    for line in tail_lines(ACTION_LOG, count):
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def log_action(action: str, ok: bool, message: str) -> dict:
    CONF_DIR.mkdir(parents=True, exist_ok=True)
    record = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "action": action,
        "ok": bool(ok),
        "message": message,
    }
    try:
        with ACTION_LOG.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record) + "\n")
    except OSError:
        pass
    return record


def snapshot() -> dict:
    pids = find_daemon_pids()
    if not pids:
        pid_file = read_pid_file()
        if pid_file and _is_daemon_proc(pid_file):
            pids = [pid_file]
    pid = pids[0] if pids else None

    listening = port_open()
    health = daemon_health() if listening else None
    cpu = rss = age = None
    if pid:
        cpu = proc_cpu(pid)
        age, rss = proc_age_rss(pid)

    heat = thermals()
    health = health or {}
    return {
        "ts": time.strftime("%H:%M:%S"),
        "daemon": {
            "running": pid is not None,
            "pid": pid,
            "extra_pids": pids[1:],
            "cpu_pct": cpu,
            "rss_bytes": rss,
            "uptime_sec": age,
            "port": DAEMON_PORT,
            "port_open": listening,
            "health_ok": bool(health),
            "armed": health.get("armed"),
            "security_status": health.get("security_status"),
            "enrolled": health.get("enrolled_count"),
            "camera_active": health.get("camera_active"),
        },
        "host": {
            "package_c": heat["package_c"],
            "fans_rpm": heat["fans_rpm"],
            "load": [round(v, 2) for v in os.getloadavg()],
        },
        "log": tail_lines(DAEMON_LOG, 25),
        "actions": recent_actions(12),
    }


# --------------------------------------------------------------------------- actions
def activate() -> dict:
    with ACTION_LOCK:
        existing = find_daemon_pids()
        if existing:
            return log_action("activate", True, f"already running (pid {existing[0]}) — no change")
        if not DAEMON_ENTRY.exists():
            return log_action("activate", False, f"entrypoint missing: {DAEMON_ENTRY}")

        CONF_DIR.mkdir(parents=True, exist_ok=True)
        python = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable
        env = dict(os.environ)
        env["PATH"] = f"{VENV_PYTHON.parent}:{env.get('PATH', '')}"

        try:
            with DAEMON_LOG.open("ab", buffering=0) as logfile:
                logfile.write(f"\n=== activate {time.strftime('%Y-%m-%d %H:%M:%S')} ===\n".encode())
                proc = subprocess.Popen(
                    [python, str(DAEMON_ENTRY), "--port", str(DAEMON_PORT)],
                    cwd=str(REPO_DIR),
                    stdin=subprocess.DEVNULL,
                    stdout=logfile,
                    stderr=subprocess.STDOUT,
                    start_new_session=True,
                    env=env,
                )
        except OSError as exc:
            return log_action("activate", False, f"spawn failed: {exc}")

        PID_FILE.write_text(str(proc.pid))

        deadline = time.time() + 20
        while time.time() < deadline:
            if proc.poll() is not None:
                break
            if daemon_health(timeout=1.0):
                break
            time.sleep(0.4)

        if proc.poll() is not None:
            detail = " | ".join(tail_lines(DAEMON_LOG, 4))
            return log_action("activate", False, f"daemon exited rc={proc.returncode} · {detail}")
        if daemon_health(timeout=1.0):
            return log_action("activate", True, f"daemon online · pid {proc.pid} · :{DAEMON_PORT} answering /health")
        return log_action("activate", False, f"spawned pid {proc.pid} but :{DAEMON_PORT}/health silent — check daemon log")


def deactivate() -> dict:
    with ACTION_LOCK:
        targets = set(find_daemon_pids())
        pid_file = read_pid_file()
        if pid_file and _is_daemon_proc(pid_file):
            targets.add(pid_file)
        if not targets:
            try:
                PID_FILE.unlink()
            except OSError:
                pass
            return log_action("deactivate", True, "already stopped — no change")

        own_pgid = os.getpgrp()
        pairs: list[tuple[int, int | None]] = []
        for pid in sorted(targets):
            try:
                pgid = os.getpgid(pid)
            except OSError:
                pgid = None
            pairs.append((pid, pgid))
            try:
                if pgid and pgid != own_pgid:
                    os.killpg(pgid, signal.SIGTERM)
                else:
                    os.kill(pid, signal.SIGTERM)
            except OSError:
                pass

        deadline = time.time() + 8
        while time.time() < deadline and any(_alive(pid) for pid, _ in pairs):
            time.sleep(0.3)

        escalated = False
        for pid, pgid in pairs:
            if not _alive(pid):
                continue
            escalated = True
            try:
                if pgid and pgid != own_pgid:
                    os.killpg(pgid, signal.SIGKILL)
                else:
                    os.kill(pid, signal.SIGKILL)
            except OSError:
                pass

        time.sleep(0.6)
        survivors = find_daemon_pids()
        try:
            PID_FILE.unlink()
        except OSError:
            pass

        if survivors or port_open():
            return log_action(
                "deactivate", False,
                f"still alive after SIGKILL · pids={survivors} · :{DAEMON_PORT} open={port_open()}",
            )
        note = " (escalated to SIGKILL)" if escalated else ""
        return log_action(
            "deactivate", True,
            f"stopped {len(pairs)} process group(s){note} · :{DAEMON_PORT} closed",
        )


def restart() -> dict:
    stop = deactivate()
    start = activate()
    ok = bool(start.get("ok"))
    return log_action("restart", ok, f"stop -> {stop['message']}; start -> {start['message']}")


def perimeter(action: str) -> dict:
    with ACTION_LOCK:
        if not daemon_health():
            return log_action(action, False, "daemon offline — activate it first")
        ok, detail = daemon_post(f"/api/{action}")
        return log_action(action, ok, f"{action} {'accepted' if ok else 'failed'} · {detail}")


ROUTES = {
    "/api/activate": activate,
    "/api/deactivate": deactivate,
    "/api/restart": restart,
    "/api/arm": lambda: perimeter("arm"),
    "/api/disarm": lambda: perimeter("disarm"),
}


class Handler(BaseHTTPRequestHandler):
    server_version = "AndersonControl/2.6"

    def log_message(self, format, *args):  # noqa: A002 - stdlib signature
        return

    @staticmethod
    def _is_loopback_host(host_header: str) -> bool:
        if not host_header:
            return False
        raw = host_header.strip().lower()
        if raw.startswith("["):
            end = raw.find("]")
            if end == -1 or raw[1:end] != "::1":
                return False
            rest = raw[end + 1:]
            if not rest:
                return True
            return rest.startswith(":") and rest[1:].isdigit() and 1 <= int(rest[1:]) <= 65535
        parts = raw.split(":")
        if len(parts) > 2 or parts[0] not in ("localhost", "127.0.0.1"):
            return False
        if len(parts) == 1:
            return True
        return parts[1].isdigit() and 1 <= int(parts[1]) <= 65535

    @staticmethod
    def _parse_loopback_origin(val: str) -> str | None:
        from urllib.parse import urlparse
        if not val:
            return None
        try:
            u = urlparse(val.strip())
            if u.scheme not in ("http", "https") or u.username or u.password:
                return None
            host = (u.hostname or "").lower()
            if host not in ("localhost", "127.0.0.1", "::1"):
                return None
            port = u.port
            if port is not None and not (1 <= port <= 65535):
                return None
            hfmt = f"[{host}]" if ":" in host else host
            netloc = f"{hfmt}:{port}" if port is not None else hfmt
            if u.netloc.lower() != netloc:
                return None
            return f"{u.scheme}://{netloc}"
        except ValueError:
            return None

    def _guard(self, is_post: bool = False) -> tuple[bool, str | None]:
        host = self.headers.get("Host", "")
        if not self._is_loopback_host(host):
            self._send(b'{"detail":"Forbidden: disallowed Host header"}', code=403)
            return False, None
        origin = self.headers.get("Origin", "")
        allowed_origin = None
        if origin:
            allowed_origin = self._parse_loopback_origin(origin)
            if not allowed_origin:
                self._send(b'{"detail":"Forbidden: disallowed Origin header"}', code=403)
                return False, None
        if is_post:
            referer = self.headers.get("Referer", "")
            if referer and not self._parse_loopback_origin(referer):
                self._send(b'{"detail":"Forbidden: disallowed Referer header"}', code=403)
                return False, None
            ctype = self.headers.get("Content-Type", "").lower().split(";")[0].strip()
            if ctype in ("text/plain", "application/x-www-form-urlencoded", "multipart/form-data"):
                if not allowed_origin and not self.headers.get("X-Sentinel-Action"):
                    self._send(b'{"detail":"Forbidden: cross-site simple POST rejected"}', code=403)
                    return False, None
            cl = self.headers.get("Content-Length", "")
            if cl and cl.isdigit() and int(cl) > 131072:
                self._send(b'{"detail":"Payload Too Large"}', code=413)
                return False, None
        return True, allowed_origin

    def _send(self, body: bytes, ctype: str = "application/json", code: int = 200, allowed_origin: str | None = None) -> None:
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Vary", "Origin")
        if allowed_origin:
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
        self.end_headers()
        try:
            self.wfile.write(body)
        except OSError:
            pass

    def do_OPTIONS(self):  # noqa: N802
        ok, allowed_origin = self._guard(is_post=False)
        if not ok:
            return
        self.send_response(204)
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Sentinel-Action")
        if allowed_origin:
            self.send_header("Access-Control-Allow-Origin", allowed_origin)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_HEAD(self):  # noqa: N802
        ok, allowed_origin = self._guard(is_post=False)
        if not ok:
            return
        route = self.path.split("?")[0]
        if route == "/health":
            self.send_response(200)
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
            self.send_header("Vary", "Origin")
            if allowed_origin:
                self.send_header("Access-Control-Allow-Origin", allowed_origin)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self._send(b"", code=404, allowed_origin=allowed_origin)

    def do_GET(self):  # noqa: N802
        ok, allowed_origin = self._guard(is_post=False)
        if not ok:
            return
        route = self.path.split("?")[0]
        if route in ("/", "/index.html"):
            try:
                return self._send(UI_FILE.read_bytes(), "text/html; charset=utf-8", allowed_origin=allowed_origin)
            except OSError:
                return self._send(b"<h1>control/ui.html missing</h1>", "text/html; charset=utf-8", 500, allowed_origin=allowed_origin)
        if route == "/api/state":
            return self._send(json.dumps(snapshot()).encode(), allowed_origin=allowed_origin)
        if route == "/health":
            return self._send(json.dumps({"status": "ok", "version": "2.6.0", "panel": True, "controls_daemon_port": DAEMON_PORT}).encode(), allowed_origin=allowed_origin)
        if route == "/favicon.ico":
            return self._send(FAVICON, "image/svg+xml", allowed_origin=allowed_origin)
        return self._send(b'{"error":"not found"}', code=404, allowed_origin=allowed_origin)

    def do_POST(self):  # noqa: N802
        ok, allowed_origin = self._guard(is_post=True)
        if not ok:
            return
        route = self.path.split("?")[0]
        action = ROUTES.get(route)
        if action is None:
            return self._send(b'{"error":"not found"}', code=404, allowed_origin=allowed_origin)
        result = dict(action())
        result["state"] = snapshot()
        return self._send(json.dumps(result).encode(), allowed_origin=allowed_origin)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Anderson Sentinel control panel")
    parser.add_argument("--host", default="127.0.0.1", help="bind host (default 127.0.0.1)")
    parser.add_argument("--port", type=int, default=DEFAULT_PANEL_PORT, help="panel port (default 8150)")
    args = parser.parse_args(argv)

    CONF_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    server.daemon_threads = True
    print(
        f"[anderson-control] panel http://{args.host}:{args.port} "
        f"| managing {DAEMON_ENTRY} on :{DAEMON_PORT}",
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[anderson-control] panel stopped", flush=True)
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
