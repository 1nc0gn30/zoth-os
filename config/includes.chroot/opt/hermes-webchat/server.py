#!/usr/bin/env python3
"""
Zoth Hermes Web Console (v2.1.0)
================================
Tailnet-only chat console for the Hermes Agent CLI on this workstation.

Exposure model: binds the Tailscale interface address ONLY (100.x) by default
(or explicit WEBCHAT_HOST / WEBCHAT_BIND), so it is reachable from the user's
own devices on the tailnet and from nowhere else. Traffic is WireGuard-encrypted
by Tailscale; a fail-closed bearer token stored in an HttpOnly SameSite=Strict
cookie provides a second layer.

Every turn is a real Hermes CLI invocation:

    hermes --continue <session> -z "<prompt>"

Subprocess stdout is streamed to the browser over SSE as it is produced.
Stdlib only. Zero external dependencies.
"""

from __future__ import annotations

import hmac
import json
import os
import queue
import re
import signal
import socket
import subprocess
import threading
import time
import urllib.parse
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VERSION = "2.1.0"
HOME = os.path.expanduser("~")
HERMES_HOME = os.environ.get("HERMES_HOME") or os.path.join(HOME, ".hermes")
HERMES_BIN = os.environ.get(
    "WEBCHAT_HERMES_BIN",
    os.path.join(HERMES_HOME, "hermes-agent", ".hermes", "bin", "hermes"),
)
APP_DIR = os.path.dirname(os.path.abspath(__file__))
HISTORY_DIR = os.path.expanduser(
    os.environ.get("WEBCHAT_HISTORY_DIR") or os.path.join(HERMES_HOME, "webchat")
)
HIST_PATH = os.path.join(HISTORY_DIR, "history.jsonl")
STATE_PATH = os.path.expanduser(
    os.environ.get("WEBCHAT_STATE_FILE") or os.path.join(HISTORY_DIR, "state.json")
)
TOKEN_PATH = os.path.expanduser(
    os.environ.get("WEBCHAT_TOKEN_FILE")
    or os.path.join(HOME, ".config", "zoth-webchat", "token")
)
PORT = int(os.environ.get("WEBCHAT_PORT", "8178"))
TURN_TIMEOUT = int(os.environ.get("WEBCHAT_TIMEOUT", "900"))

MAX_TEXT = 16000
MAX_POST_BYTES = 65536
MAX_HISTORY = 400
MAX_KEEP = 100000
MAX_JOB_CHUNKS = 4096
MAX_JOB_BYTES = 2 * 1024 * 1024  # 2 MiB
SSE_QUEUE_MAX = 256
LOGIN_WINDOW_SECS = 60.0
LOGIN_MAX_FAILURES = 5
COOKIE = "zc_token"

SESSION_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")

CSP_HEADER = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self'; "
    "img-src 'self' data:; "
    "connect-src 'self'; "
    "frame-ancestors 'none'; "
    "base-uri 'none'; "
    "form-action 'self'"
)


def _ensure_private_dir(path: str) -> None:
    os.makedirs(path, mode=0o700, exist_ok=True)
    try:
        os.chmod(path, 0o700)
    except OSError:
        pass


def _write_private_file(path: str, text: str, append: bool = False) -> None:
    _ensure_private_dir(os.path.dirname(path) or ".")
    flags = os.O_WRONLY | os.O_CREAT | (os.O_APPEND if append else os.O_TRUNC)
    fd = os.open(path, flags, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(text)
    finally:
        try:
            os.chmod(path, 0o600)
        except OSError:
            pass


def _validate_session_name(name: str) -> str | None:
    clean = str(name or "").strip()
    if SESSION_RE.match(clean):
        return clean
    return None


def _load_persisted_session() -> str:
    env_sess = _validate_session_name(os.environ.get("WEBCHAT_SESSION", "zoth-webchat"))
    default_sess = env_sess or "zoth-webchat"
    try:
        with open(STATE_PATH, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        if isinstance(data, dict):
            saved = _validate_session_name(data.get("session", ""))
            if saved:
                return saved
    except (OSError, ValueError):
        pass
    return default_sess


def _save_persisted_session(session_name: str) -> None:
    payload = json.dumps({"session": session_name, "updated_at": time.time()}) + "\n"
    try:
        _write_private_file(STATE_PATH, payload, append=False)
    except OSError:
        pass


_ensure_private_dir(HISTORY_DIR)
SESSION = _load_persisted_session()


# ---------- Token hot-reload (fail-closed) ----------
_token_lock = threading.Lock()
_token_cache = {"mtime_ns": None, "size": None, "value": ""}


def get_token() -> str:
    """Return current bearer token from TOKEN_PATH, hot-reloading on mtime/size change.

    Fail-closed: returns empty string when file is missing, unreadable, or blank.
    """
    with _token_lock:
        try:
            st = os.stat(TOKEN_PATH)
        except OSError:
            _token_cache["mtime_ns"] = None
            _token_cache["size"] = None
            _token_cache["value"] = ""
            return ""
        if (
            _token_cache["mtime_ns"] == st.st_mtime_ns
            and _token_cache["size"] == st.st_size
        ):
            return _token_cache["value"]
        try:
            with open(TOKEN_PATH, "r", encoding="utf-8") as fh:
                val = fh.read().strip()
        except OSError:
            val = ""
        _token_cache["mtime_ns"] = st.st_mtime_ns
        _token_cache["size"] = st.st_size
        _token_cache["value"] = val
        return val


def tailnet_ip(wait_secs: int = 30) -> str:
    """Real tailnet IPv4 address, waiting briefly at boot for tailscaled."""
    deadline = time.time() + max(0, wait_secs)
    while True:
        try:
            out = (
                subprocess.run(
                    ["tailscale", "ip", "-4"],
                    capture_output=True,
                    text=True,
                    timeout=3,
                    check=False,
                )
                .stdout.strip()
                .splitlines()
            )
            if out and out[0].strip():
                return out[0].strip()
        except Exception:
            pass
        if time.time() >= deadline:
            return ""
        time.sleep(1)


EXPLICIT_BIND = (
    os.environ.get("WEBCHAT_HOST") or os.environ.get("WEBCHAT_BIND") or ""
).strip()
TAILNET = tailnet_ip(wait_secs=0 if EXPLICIT_BIND else 30)
BIND = EXPLICIT_BIND or TAILNET or "127.0.0.1"
HOSTNAME = socket.gethostname()


def _build_allowed_hosts(bind: str, port: int, tailnet: str) -> set[str]:
    hosts: set[str] = {
        f"127.0.0.1:{port}",
        f"localhost:{port}",
        f"[::1]:{port}",
    }
    if bind:
        if ":" in bind and not bind.startswith("["):
            hosts.add(f"[{bind}]:{port}")
        else:
            hosts.add(f"{bind}:{port}")
    if tailnet:
        hosts.add(f"{tailnet}:{port}")
    if port == 80:
        hosts.update({"127.0.0.1", "localhost", "[::1]"})
        if bind:
            hosts.add(bind)
        if tailnet:
            hosts.add(tailnet)
    return {h.lower() for h in hosts}


ALLOWED_HOSTS = _build_allowed_hosts(BIND, PORT, TAILNET)

_hist_lock = threading.Lock()
_hist_stats_cache = {"mtime_ns": None, "size": None, "turns": 0, "messages": 0, "last_secs": None}
_state_lock = threading.Lock()
_jobs: dict[str, Job] = {}
_cur: dict[str, Job | None] = {"job": None}
_started = time.time()

# Per-IP login failure sliding window
_rate_lock = threading.Lock()
_login_failures: dict[str, list[float]] = {}


def _check_login_rate_limit(ip: str) -> bool:
    """Return True if request is allowed, False if IP exceeded 5 failures / 60s."""
    now = time.monotonic()
    cutoff = now - LOGIN_WINDOW_SECS
    with _rate_lock:
        recent = [ts for ts in _login_failures.get(ip, []) if ts >= cutoff]
        if recent:
            _login_failures[ip] = recent
        else:
            _login_failures.pop(ip, None)
        return len(recent) < LOGIN_MAX_FAILURES


def _record_login_failure(ip: str) -> None:
    now = time.monotonic()
    cutoff = now - LOGIN_WINDOW_SECS
    with _rate_lock:
        recent = [ts for ts in _login_failures.get(ip, []) if ts >= cutoff]
        recent.append(now)
        _login_failures[ip] = recent


def _clear_login_failures(ip: str) -> None:
    with _rate_lock:
        _login_failures.pop(ip, None)


def append_history(role: str, text: str, **extra) -> None:
    rec = {"role": role, "text": text, "ts": time.time()}
    rec.update(extra)
    line = json.dumps(rec, ensure_ascii=False) + "\n"
    with _hist_lock:
        _write_private_file(HIST_PATH, line, append=True)


def read_history(limit: int = MAX_HISTORY) -> list[dict]:
    if not os.path.exists(HIST_PATH):
        return []
    with _hist_lock:
        try:
            with open(HIST_PATH, "r", encoding="utf-8", errors="replace") as fh:
                lines = fh.readlines()
        except OSError:
            return []
    out: list[dict] = []
    for ln in lines[-limit:]:
        ln = ln.strip()
        if not ln:
            continue
        try:
            obj = json.loads(ln)
            if isinstance(obj, dict):
                out.append(obj)
        except ValueError:
            continue
    return out


def get_history_stats() -> tuple[int, int, float | None]:
    """O(1) cached stats keyed by (st_mtime_ns, st_size) of HIST_PATH."""
    with _hist_lock:
        try:
            st = os.stat(HIST_PATH)
        except OSError:
            _hist_stats_cache.update({"mtime_ns": None, "size": None, "turns": 0, "messages": 0, "last_secs": None})
            return 0, 0, None
        if (
            _hist_stats_cache["mtime_ns"] == st.st_mtime_ns
            and _hist_stats_cache["size"] == st.st_size
        ):
            return (
                _hist_stats_cache["turns"],
                _hist_stats_cache["messages"],
                _hist_stats_cache["last_secs"],
            )
        turns = 0
        messages = 0
        last_secs = None
        try:
            with open(HIST_PATH, "r", encoding="utf-8", errors="replace") as fh:
                for ln in fh:
                    ln = ln.strip()
                    if not ln:
                        continue
                    try:
                        rec = json.loads(ln)
                    except ValueError:
                        continue
                    if not isinstance(rec, dict):
                        continue
                    turns += 1
                    role = rec.get("role")
                    if role in ("user", "assistant"):
                        messages += 1
                    if role == "assistant" and rec.get("secs") is not None:
                        last_secs = rec.get("secs")
        except OSError:
            pass
        _hist_stats_cache.update(
            {
                "mtime_ns": st.st_mtime_ns,
                "size": st.st_size,
                "turns": turns,
                "messages": messages,
                "last_secs": last_secs,
            }
        )
        return turns, messages, last_secs


def truncate_history(keep: int = 0) -> int:
    keep = max(0, min(MAX_KEEP, int(keep)))
    with _hist_lock:
        if not os.path.exists(HIST_PATH):
            return 0
        with open(HIST_PATH, "r", encoding="utf-8", errors="replace") as fh:
            lines = [ln for ln in fh.readlines() if ln.strip()]
        kept = lines[-keep:] if keep > 0 else []
        _write_private_file(HIST_PATH, "".join(kept), append=False)
        _hist_stats_cache["mtime_ns"] = None
    return len(kept)


def _kill_process_group(proc: subprocess.Popen | None) -> None:
    if not proc or proc.poll() is not None:
        return
    try:
        os.killpg(proc.pid, signal.SIGKILL)
    except (ProcessLookupError, PermissionError, OSError):
        try:
            proc.kill()
        except OSError:
            pass


class Job:
    def __init__(self, text: str):
        self.id = uuid.uuid4().hex[:12]
        self.text = text
        self.chunks: list[str] = []
        self.total_bytes = 0
        self.truncated = False
        self.done = False
        self.rc: int | None = None
        self.t0 = time.time()
        self.t1: float | None = None
        self.clients: list[queue.Queue] = []
        self.proc: subprocess.Popen | None = None
        self.stopped = False
        self.lock = threading.Lock()

    def push(self, s: str) -> None:
        encoded_len = len(s.encode("utf-8", errors="replace"))
        with self.lock:
            to_emit: str | None = s
            if (
                len(self.chunks) >= MAX_JOB_CHUNKS
                or self.total_bytes + encoded_len > MAX_JOB_BYTES
            ):
                if not self.truncated:
                    self.truncated = True
                    to_emit = "\n[console] output truncated at 2 MiB buffer limit.\n"
                    self.chunks.append(to_emit)
                else:
                    to_emit = None
            else:
                self.chunks.append(s)
                self.total_bytes += encoded_len

            if to_emit is None:
                return
            for q in list(self.clients):
                try:
                    q.put_nowait(to_emit)
                except queue.Full:
                    try:
                        q.get_nowait()
                        q.put_nowait(to_emit)
                    except Exception:
                        pass
                except Exception:
                    pass

    def finish(self, rc: int) -> None:
        with self.lock:
            self.done = True
            self.rc = rc
            self.t1 = time.time()
            for q in list(self.clients):
                try:
                    q.put_nowait(None)
                except queue.Full:
                    try:
                        q.get_nowait()
                        q.put_nowait(None)
                    except Exception:
                        pass
                except Exception:
                    pass

    @property
    def secs(self) -> float:
        return round((self.t1 or time.time()) - self.t0, 1)

    def body(self) -> str:
        with self.lock:
            return "".join(self.chunks).strip()


def run_turn(job: Job, text: str, session: str) -> None:
    safe_session = _validate_session_name(session) or "zoth-webchat"
    cmd = [HERMES_BIN, "--continue", safe_session, "-z", text]
    env = dict(os.environ)
    env["HERMES_HOME"] = HERMES_HOME
    env["PATH"] = env.get("PATH", "") + ":/usr/local/bin:/usr/bin:/bin"
    rc = -1
    proc: subprocess.Popen | None = None
    try:
        proc = subprocess.Popen(
            cmd,
            cwd=HOME,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            start_new_session=True,
        )
        job.proc = proc

        def watchdog() -> None:
            try:
                proc.wait(timeout=TURN_TIMEOUT)
            except subprocess.TimeoutExpired:
                job.push("\n[console] turn exceeded %ds - terminating.\n" % TURN_TIMEOUT)
                _kill_process_group(proc)
            except Exception:
                pass

        threading.Thread(target=watchdog, daemon=True).start()
        banner = ("\u21aa restored workspace dir:", "[hermes]")
        if proc.stdout is not None:
            for line in proc.stdout:
                if line.strip().startswith(banner):
                    continue
                job.push(line)
        rc = proc.wait()
    except Exception as exc:
        job.push("\n[console] failed to launch hermes: %s\n" % exc)
        rc = -1
    finally:
        if proc is not None and proc.poll() is None:
            _kill_process_group(proc)
        job.finish(rc)
        body = job.body() or "(no output)"
        append_history(
            "assistant",
            body,
            rc=rc,
            secs=job.secs,
            job=job.id,
            stopped=job.stopped,
        )
        with _state_lock:
            if _cur["job"] is job:
                _cur["job"] = None


class WebchatHTTPServer(ThreadingHTTPServer):
    request_queue_size = 32
    allow_reuse_address = True
    daemon_threads = True


class Handler(BaseHTTPRequestHandler):
    server_version = "ZothConsole/2.1"
    sys_version = ""
    protocol_version = "HTTP/1.1"

    def _send_security_headers(self, cache_control: str = "no-store") -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", CSP_HEADER)
        if cache_control:
            self.send_header("Cache-Control", cache_control)

    def _allowed_hosts(self) -> set[str]:
        return getattr(self.server, "allowed_hosts", ALLOWED_HOSTS)

    def _validate_host(self) -> bool:
        host = (self.headers.get("Host") or "").strip().lower()
        if not host or host not in self._allowed_hosts():
            self._json(400, {"error": "invalid host"})
            return False
        return True

    def _is_origin_allowed(self) -> bool:
        sfs = (self.headers.get("Sec-Fetch-Site") or "").strip().lower()
        if sfs and sfs not in ("same-origin", "none"):
            return False
        origin = (self.headers.get("Origin") or "").strip()
        if not origin:
            return True
        try:
            parsed = urllib.parse.urlparse(origin)
        except ValueError:
            return False
        if parsed.scheme not in ("http", "https"):
            return False
        netloc = (parsed.netloc or "").strip().lower()
        return netloc in self._allowed_hosts()

    def _json(
        self,
        code: int,
        obj: dict,
        cookie: str | None = None,
        clear_cookie: bool = False,
        extra_headers: dict[str, str] | None = None,
        head_only: bool = False,
    ) -> None:
        raw = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self._send_security_headers("no-store")
        if clear_cookie:
            self.send_header(
                "Set-Cookie",
                "%s=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" % COOKIE,
            )
        elif cookie is not None:
            self.send_header(
                "Set-Cookie",
                "%s=%s; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000"
                % (COOKIE, cookie),
            )
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.send_header("Connection", "close")
        self.end_headers()
        if not head_only:
            self.wfile.write(raw)

    def _file(self, name: str, ctype: str, head_only: bool = False) -> None:
        path = os.path.join(APP_DIR, name)
        if not os.path.isfile(path):
            self._json(404, {"error": "not found"}, head_only=head_only)
            return
        with open(path, "rb") as fh:
            raw = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(raw)))
        self._send_security_headers("no-store")
        self.send_header("Connection", "close")
        self.end_headers()
        if not head_only:
            self.wfile.write(raw)

    def _health_payload(self) -> dict:
        return {
            "ok": True,
            "service": "hermes-webchat",
            "version": VERSION,
            "auth_required": True,
            "token_configured": bool(get_token()),
        }

    def _require_auth(self) -> bool:
        tok = get_token()
        if not tok:
            self._json(503, {"error": "token not configured"})
            return False
        raw = self.headers.get("Cookie") or ""
        for part in raw.split(";"):
            k, _, v = part.strip().partition("=")
            if k == COOKIE and hmac.compare_digest(v, tok):
                return True
        hdr_tok = self.headers.get("X-Zoth-Token") or ""
        if hdr_tok and hmac.compare_digest(hdr_tok, tok):
            return True
        self._json(401, {"error": "unauthorized"})
        return False

    def log_message(self, fmt: str, *args) -> None:
        return  # quiet; startup banner logged to journal

    def _handle_static_or_health(self, path: str, head_only: bool = False) -> bool:
        if path in ("/health", "/api/health"):
            self._json(200, self._health_payload(), head_only=head_only)
            return True
        if path in ("/", "/index.html"):
            self._file("index.html", "text/html; charset=utf-8", head_only=head_only)
            return True
        if path == "/app.js":
            self._file("app.js", "application/javascript; charset=utf-8", head_only=head_only)
            return True
        if path == "/app.css":
            self._file("app.css", "text/css; charset=utf-8", head_only=head_only)
            return True
        if path == "/favicon.svg":
            self._file("favicon.svg", "image/svg+xml", head_only=head_only)
            return True
        if path == "/robots.txt":
            raw = b"User-agent: *\nDisallow: /\n"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self._send_security_headers("no-store")
            self.send_header("Connection", "close")
            self.end_headers()
            if not head_only:
                self.wfile.write(raw)
            return True
        return False

    # ---------- OPTIONS ----------
    def do_OPTIONS(self) -> None:
        if not self._validate_host():
            return
        if not self._is_origin_allowed():
            self._json(403, {"error": "cross-origin blocked"})
            return
        self.send_response(204)
        self.send_header("Allow", "GET, HEAD, POST, OPTIONS")
        self.send_header("Content-Length", "0")
        self._send_security_headers("no-store")
        self.send_header("Connection", "close")
        self.end_headers()

    # ---------- HEAD ----------
    def do_HEAD(self) -> None:
        if not self._validate_host():
            return
        path, _, qs = self.path.partition("?")
        if path in ("/", "/index.html") and qs:
            params = urllib.parse.parse_qs(qs, keep_blank_values=True)
            if "token" in params:
                self._json(
                    400,
                    {"error": "query token login disabled; use POST /api/login"},
                    head_only=True,
                )
                return
        if self._handle_static_or_health(path, head_only=True):
            return
        self._json(404, {"error": "not found"}, head_only=True)

    # ---------- GET ----------
    def do_GET(self) -> None:
        if not self._validate_host():
            return
        path, _, qs = self.path.partition("?")
        params = urllib.parse.parse_qs(qs, keep_blank_values=True) if qs else {}

        # Reject query-string token login so secrets never enter browser history or Referer logs
        if path in ("/", "/index.html") and "token" in params:
            self._json(
                400,
                {"error": "query token login disabled; use POST /api/login"},
            )
            return

        if self._handle_static_or_health(path, head_only=False):
            return

        if path == "/api/status":
            if not self._require_auth():
                return
            with _state_lock:
                job = _cur["job"]
                cur_session = SESSION
            turns, messages, last_secs = get_history_stats()
            self._json(
                200,
                {
                    "ok": True,
                    "version": VERSION,
                    "host": HOSTNAME,
                    "tailnet": TAILNET,
                    "bind": BIND,
                    "port": getattr(self.server, "server_port", PORT),
                    "session": cur_session,
                    "busy": bool(job and not job.done),
                    "job": job.id if job else None,
                    "hermes_bin": os.path.isfile(HERMES_BIN),
                    "uptime": int(time.time() - _started),
                    "turns": turns,
                    "messages": messages,
                    "last_secs": last_secs,
                    "auth_required": True,
                },
            )
        elif path == "/api/history":
            if not self._require_auth():
                return
            self._json(200, {"messages": read_history()})
        elif path == "/api/stream":
            if not self._require_auth():
                return
            job_id = (params.get("job") or [""])[0]
            with _state_lock:
                job = _jobs.get(job_id)
            if not job:
                self._json(404, {"error": "unknown job"})
                return
            self._stream(job)
        else:
            self._json(404, {"error": "not found"})

    def _sse(self, event: str, data: dict) -> None:
        self.wfile.write(
            ("event: %s\ndata: %s\n\n" % (event, json.dumps(data))).encode("utf-8")
        )
        self.wfile.flush()

    def _stream(self, job: Job) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self._send_security_headers("no-store, no-cache")
        self.send_header("X-Accel-Buffering", "no")
        self.send_header("Connection", "close")
        self.end_headers()
        q: queue.Queue = queue.Queue(maxsize=SSE_QUEUE_MAX)
        try:
            with job.lock:
                for chunk in job.chunks:
                    self._sse("chunk", {"t": chunk})
                if job.done:
                    self._sse(
                        "done",
                        {"rc": job.rc, "secs": job.secs, "stopped": job.stopped},
                    )
                    return
                job.clients.append(q)
            while True:
                try:
                    item = q.get(timeout=20)
                except queue.Empty:
                    self.wfile.write(b": keepalive\n\n")
                    self.wfile.flush()
                    continue
                if item is None:
                    self._sse(
                        "done",
                        {"rc": job.rc, "secs": job.secs, "stopped": job.stopped},
                    )
                    return
                self._sse("chunk", {"t": item})
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass
        finally:
            with job.lock:
                try:
                    job.clients.remove(q)
                except ValueError:
                    pass

    # ---------- POST ----------
    def _read_json_body(self) -> dict | None:
        raw_len = self.headers.get("Content-Length")
        if raw_len is None:
            self._json(400, {"error": "invalid content-length"})
            return None
        raw_len_s = raw_len.strip()
        if not raw_len_s or not raw_len_s.isdigit():
            self._json(400, {"error": "invalid content-length"})
            return None
        length = int(raw_len_s)
        if length < 0:
            self._json(400, {"error": "invalid content-length"})
            return None
        if length > MAX_POST_BYTES:
            self._json(413, {"error": "payload too large"})
            return None
        try:
            raw = self.rfile.read(length).decode("utf-8") if length else "{}"
            body = json.loads(raw or "{}")
        except Exception:
            self._json(400, {"error": "bad json"})
            return None
        if not isinstance(body, dict):
            self._json(400, {"error": "bad json"})
            return None
        return body

    def do_POST(self) -> None:
        global SESSION
        if not self._validate_host():
            return
        if not self._is_origin_allowed():
            self._json(403, {"error": "cross-origin blocked"})
            return

        path, _, _qs = self.path.partition("?")
        body = self._read_json_body()
        if body is None:
            return

        if path == "/api/logout":
            self._json(200, {"ok": True}, clear_cookie=True)
            return

        if path == "/api/login":
            tok = get_token()
            if not tok:
                self._json(503, {"error": "token not configured"})
                return
            client_ip = (self.client_address[0] if self.client_address else "") or "unknown"
            if not _check_login_rate_limit(client_ip):
                self._json(
                    429,
                    {"error": "too many attempts"},
                    extra_headers={"Retry-After": str(int(LOGIN_WINDOW_SECS))},
                )
                return
            given = str(body.get("token") or "").strip()
            if given and hmac.compare_digest(given, tok):
                _clear_login_failures(client_ip)
                self._json(200, {"ok": True}, cookie=tok)
            else:
                _record_login_failure(client_ip)
                time.sleep(0.15)
                self._json(403, {"error": "invalid token"})
            return

        if not self._require_auth():
            return

        if path == "/api/send":
            text = str(body.get("text") or "").strip()
            if not text:
                self._json(400, {"error": "text required"})
                return
            if len(text) > MAX_TEXT:
                self._json(400, {"error": "text too long (max %d)" % MAX_TEXT})
                return
            with _state_lock:
                job = _cur["job"]
                if job and not job.done:
                    self._json(409, {"error": "busy", "job": job.id})
                    return
                new = Job(text)
                _jobs[new.id] = new
                if len(_jobs) > 60:
                    for k in list(_jobs)[:-30]:
                        _jobs.pop(k, None)
                _cur["job"] = new
                cur_session = SESSION
            append_history("user", text, job=new.id)
            threading.Thread(
                target=run_turn, args=(new, text, cur_session), daemon=True
            ).start()
            self._json(200, {"job": new.id, "session": cur_session})

        elif path == "/api/stop":
            with _state_lock:
                job = _cur["job"]
            if job and not job.done and job.proc:
                job.stopped = True
                _kill_process_group(job.proc)
                self._json(200, {"stopped": job.id})
            else:
                self._json(200, {"stopped": None})

        elif path == "/api/history/clear":
            raw_keep = body.get("keep", 0)
            try:
                if isinstance(raw_keep, bool):
                    raise ValueError("bool not int")
                keep_val = int(raw_keep)
            except (TypeError, ValueError):
                self._json(400, {"error": "invalid keep value"})
                return
            kept = truncate_history(keep_val)
            self._json(200, {"kept": kept})

        elif path == "/api/session/new":
            raw_sess = body.get("session")
            if raw_sess is not None and str(raw_sess).strip() != "":
                validated = _validate_session_name(str(raw_sess))
                if not validated:
                    self._json(
                        400,
                        {"error": "invalid session name (must match ^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$)"},
                    )
                    return
                next_session = validated
            else:
                next_session = "zoth-webchat-%d" % int(time.time())
            with _state_lock:
                SESSION = next_session
            _save_persisted_session(next_session)
            append_history("system", "new agent session: %s" % next_session)
            self._json(200, {"session": next_session})

        else:
            self._json(404, {"error": "not found"})


def main() -> None:
    httpd = WebchatHTTPServer((BIND, PORT), Handler)
    actual_port = httpd.server_address[1]
    httpd.allowed_hosts = _build_allowed_hosts(BIND, actual_port, TAILNET)
    tok_state = "token" if get_token() else "fail-closed(no-token)"
    print(
        "Zoth Hermes Web Console v%s -> http://%s:%d  (session=%s, auth=%s, tailnet=%s)"
        % (VERSION, BIND, actual_port, SESSION, tok_state, TAILNET or "down"),
        flush=True,
    )
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
