#!/usr/bin/env python3
"""konsole-relay (v2.1.0): Loopback KDE Konsole D-Bus Relay Daemon & CLI.

Python stdlib only. Communicates with open KDE Konsole sessions over session
D-Bus (qdbus/qdbus6) and exposes a hardened 127.0.0.1-only HTTP API with
fail-closed bearer authentication, DNS-rebinding & cross-origin guards,
rate limiting, per-session send serialization, and secret-scrubbed auditing.
"""

import argparse
import glob
import hmac
import json
import os
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

VERSION = "2.1.0"
CONF = os.path.expanduser("~/.config/konsole-relay")
TOKEN_FILE = os.path.join(CONF, "token")
AUDIT = os.path.join(CONF, "audit.log")
DEFAULT_PORT = 8797
MAX_BODY_BYTES = 65536
MIN_TOKEN_LEN = 32
MAX_LINES = 500
AUDIT_MAX_BYTES = 1_048_576  # 1 MiB rollover
RATE_LIMIT_WINDOW_S = 60.0
RATE_LIMIT_MAX_FAILS = 10
SOCKET_TIMEOUT_S = 10.0

QDBUS = shutil.which("qdbus") or shutil.which("qdbus6") or "qdbus"
SVC_RE = re.compile(r"^org\.kde\.konsole-\d+$")
SESSION_PATH_RE = re.compile(r"^/Sessions/(\d+)$")
TOKEN_RE = re.compile(r"^[A-Za-z0-9._~+/=-]{32,}$")

_SECRET_PATTERNS = [
    (re.compile(r"(?i)(Bearer\s+)[^\s\"']+"), r"\1[REDACTED]"),
    (re.compile(r"\b(sk-[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{12,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{20,})\b"), "[REDACTED]"),
    (re.compile(r"(?i)\b(password|passwd|secret|token|api[_-]?key|access[_-]?token)(\s*[:=]\s*)([^\s&;,\"']+)"), r"\1\2[REDACTED]"),
]
_HOME_PATH_RE = re.compile(r"/home/[A-Za-z0-9._-]+(?=/|$)")

_SESSION_LOCKS_GUARD = threading.Lock()
_SESSION_LOCKS = {}
_AUDIT_LOCK = threading.Lock()
_AUTH_FAIL_LOCK = threading.Lock()
_AUTH_FAILS = {}


def redact_home(value):
    """Replace literal home directory paths with portable '~' notation."""
    if not isinstance(value, str) or not value:
        return value
    home = os.path.expanduser("~")
    out = value
    if home and home != "~":
        out = out.replace(home + "/", "~/")
        if out == home:
            out = "~"
    return _HOME_PATH_RE.sub("~", out)


def scrub_secrets(text):
    """Scrub common bearer tokens, API keys, and inline secret assignments."""
    if not isinstance(text, str) or not text:
        return text
    out = text
    for pat, repl in _SECRET_PATTERNS:
        out = pat.sub(repl, out)
    return redact_home(out)


def is_valid_token(tok):
    """Enforce non-empty, non-whitespace token of at least MIN_TOKEN_LEN chars."""
    return isinstance(tok, str) and len(tok) >= MIN_TOKEN_LEN and bool(TOKEN_RE.match(tok))


def validate_target(svc, sid):
    """Strictly validate Konsole D-Bus service name and positive session ID."""
    if not isinstance(svc, str) or not SVC_RE.match(svc):
        raise ValueError("invalid Konsole service; expected org.kde.konsole-<pid>")
    if isinstance(sid, bool) or not isinstance(sid, int) or sid < 1:
        raise ValueError("invalid Konsole session id; expected integer >= 1")
    return svc, sid


def clamp_lines(raw_val, default=60, max_lines=MAX_LINES):
    """Parse and clamp a line count into 1..max_lines, rejecting invalid/non-positive values."""
    if raw_val is None:
        return default
    if isinstance(raw_val, bool):
        raise ValueError("lines must be an integer >= 1")
    try:
        n = int(raw_val)
    except (TypeError, ValueError) as exc:
        raise ValueError("lines must be an integer >= 1") from exc
    if n < 1:
        raise ValueError("lines must be >= 1")
    return min(n, max_lines)


def _get_session_lock(svc, sid):
    key = (svc, sid)
    with _SESSION_LOCKS_GUARD:
        lock = _SESSION_LOCKS.get(key)
        if lock is None:
            lock = threading.Lock()
            _SESSION_LOCKS[key] = lock
        return lock


def qd(*args, timeout=5):
    """Invoke qdbus/qdbus6 without a shell, guarding D-Bus address arguments against flag injection."""
    str_args = [str(a) for a in args]
    # Service (0), object path (1), and interface/method (2) must never be CLI options
    for idx in range(min(3, len(str_args))):
        if str_args[idx].startswith("-"):
            raise ValueError("invalid qdbus target argument")
    r = subprocess.run([QDBUS, *str_args], capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError(redact_home(r.stderr.strip()) or "qdbus command failed")
    return r.stdout.rstrip("\n")


def services():
    return sorted(s.strip() for s in qd().splitlines() if SVC_RE.match(s.strip()))


def session_ids(svc):
    if not isinstance(svc, str) or not SVC_RE.match(svc):
        raise ValueError("invalid Konsole service; expected org.kde.konsole-<pid>")
    out = []
    for line in qd(svc).splitlines():
        m = SESSION_PATH_RE.match(line.strip())
        if m:
            sid = int(m.group(1))
            if sid >= 1:
                out.append(sid)
    return sorted(out)


def proc_name(pid):
    try:
        pid_int = int(pid)
        if pid_int <= 0:
            return ""
        with open(f"/proc/{pid_int}/cmdline", "rb") as f:
            parts = [p.decode(errors="replace") for p in f.read().split(b"\0") if p]
        return redact_home(" ".join(parts)[:200])
    except (OSError, ValueError):
        return ""


def session_info(svc, sid):
    svc, sid = validate_target(svc, sid)
    p = f"/Sessions/{sid}"

    def g(*a):
        try:
            return qd(svc, p, *a)
        except Exception:
            return ""

    fg = g("org.kde.konsole.Session.foregroundProcessId")
    return {
        "service": svc,
        "session": sid,
        "title": redact_home(g("org.kde.konsole.Session.title", 1)),
        "shell_pid": int(g("org.kde.konsole.Session.processId") or 0),
        "fg_pid": int(fg or 0),
        "fg_cmd": proc_name(fg) if fg else "",
    }


def list_all():
    out = []
    for s in services():
        for sid in session_ids(s):
            out.append(session_info(s, sid))
    return out


def resolve(target):
    """Resolve 'svc/sid', 'pid/sid', 'pid' (session 1), or unique title/fg substring."""
    if not isinstance(target, str):
        raise ValueError("target must be a non-empty string")
    raw = target.strip()
    if not raw or raw.startswith("-"):
        raise ValueError("invalid target")
    if "/" in raw:
        a, b = raw.rsplit("/", 1)
        if not b or not re.fullmatch(r"\d+", b):
            raise ValueError("invalid Konsole session id; expected integer >= 1")
        sid = int(b)
        svc = f"org.kde.konsole-{a}" if re.fullmatch(r"\d+", a) else a
        return validate_target(svc, sid)
    if re.fullmatch(r"\d+", raw):
        if int(raw) < 1:
            raise ValueError("invalid Konsole pid")
        return validate_target(f"org.kde.konsole-{raw}", 1)
    hits = [i for i in list_all() if raw.lower() in (i["title"] + " " + i["fg_cmd"]).lower()]
    if len(hits) == 0:
        raise LookupError(f"target '{raw}' matched 0 sessions; use svc/sid")
    if len(hits) > 1:
        raise ValueError(f"target '{raw}' matched {len(hits)} sessions; use svc/sid")
    return validate_target(hits[0]["service"], int(hits[0]["session"]))


def audit(entry):
    """Append a secret-scrubbed JSONL audit event with 0700/0600 enforcement & 1 MiB rotation."""
    clean = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S%z")}
    for k, v in entry.items():
        if isinstance(v, str):
            clean[k] = scrub_secrets(v)
        else:
            clean[k] = v

    with _AUDIT_LOCK:
        os.makedirs(CONF, mode=0o700, exist_ok=True)
        try:
            os.chmod(CONF, 0o700)
        except OSError:
            pass
        try:
            if os.path.exists(AUDIT) and os.path.getsize(AUDIT) >= AUDIT_MAX_BYTES:
                rotated = AUDIT + ".1"
                os.replace(AUDIT, rotated)
                try:
                    os.chmod(rotated, 0o600)
                except OSError:
                    pass
        except OSError:
            pass
        fd = os.open(AUDIT, os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
        with os.fdopen(fd, "a", encoding="utf-8") as f:
            f.write(json.dumps(clean) + "\n")
        try:
            os.chmod(AUDIT, 0o600)
        except OSError:
            pass


def read_text(svc, sid, lines=60, source=None, client_ip=None):
    svc, sid = validate_target(svc, sid)
    lines = clamp_lines(lines, default=60)
    if source:
        entry = {"event": "read", "source": source, "service": svc, "session": sid, "lines": lines}
        if client_ip:
            entry["client_ip"] = client_ip
        audit(entry)
    p = f"/Sessions/{sid}"
    txt = qd(svc, p, "org.kde.konsole.Session.getAllDisplayedText", "true")
    rows = txt.splitlines()
    if len(rows) < lines:
        try:  # try scrollback via negative offsets
            hist = qd(svc, p, "org.kde.konsole.Session.getDisplayedText", -(lines - len(rows)), -1)
            if hist.strip():
                rows = hist.splitlines() + rows
        except Exception:
            pass
    return "\n".join(rows[-lines:])


def send(svc, sid, text, enter=True, source="cli", client_ip=None):
    svc, sid = validate_target(svc, sid)
    if not isinstance(text, str):
        raise ValueError("text must be a string")
    p = f"/Sessions/{sid}"
    lock = _get_session_lock(svc, sid)
    with lock:
        entry = {
            "event": "send",
            "source": source,
            "service": svc,
            "session": sid,
            "enter": bool(enter),
            "len": len(text),
            "text": scrub_secrets(text[:500]),
        }
        if client_ip:
            entry["client_ip"] = client_ip
        audit(entry)
        if text:
            qd(svc, p, "org.kde.konsole.Session.sendText", text)
        if enter:
            time.sleep(0.15)
            qd(svc, p, "org.kde.konsole.Session.sendText", "\r")
    return {"ok": True, "service": svc, "session": sid}


def tail_agy(n=20, source=None, client_ip=None):
    n = clamp_lines(n, default=20)
    files = glob.glob(os.path.expanduser("~/.gemini/antigravity-cli/conversations/*"))
    if not files:
        if source:
            entry = {"event": "agy", "source": source, "lines": n, "file": None}
            if client_ip:
                entry["client_ip"] = client_ip
            audit(entry)
        return {"file": None, "lines": []}
    f = max(files, key=os.path.getmtime)
    if os.path.isdir(f):
        inner = [x for x in glob.glob(os.path.join(f, "**", "*"), recursive=True) if os.path.isfile(x)]
        if not inner:
            redacted = redact_home(f)
            if source:
                entry = {"event": "agy", "source": source, "lines": n, "file": redacted}
                if client_ip:
                    entry["client_ip"] = client_ip
                audit(entry)
            return {"file": redacted, "lines": []}
        f = max(inner, key=os.path.getmtime)
    with open(f, "rb") as fh:
        fh.seek(0, 2)
        size = fh.tell()
        fh.seek(max(0, size - 65536))
        data = fh.read().decode(errors="replace")
    data = re.sub(r"[^\x09\x0a\x20-\x7e\u00a0-\uffff]+", " ", data).replace("\ufffd", "")
    redacted = redact_home(f)
    if source:
        entry = {"event": "agy", "source": source, "lines": n, "file": redacted}
        if client_ip:
            entry["client_ip"] = client_ip
        audit(entry)
    return {"file": redacted, "lines": data.splitlines()[-n:]}


def load_token(create=False, rotate=False):
    """Fail-closed bearer token loader enforcing 0700/0600 modes and >= 32 char entropy."""
    if rotate:
        os.makedirs(CONF, mode=0o700, exist_ok=True)
        os.chmod(CONF, 0o700)
        new_tok = secrets.token_urlsafe(32)
        fd, tmp_path = tempfile.mkstemp(prefix=".token.", dir=CONF)
        try:
            os.chmod(tmp_path, 0o600)
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(new_tok)
            os.replace(tmp_path, TOKEN_FILE)
            os.chmod(TOKEN_FILE, 0o600)
        except Exception:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass
            raise
    elif not os.path.exists(TOKEN_FILE):
        if not create:
            raise RuntimeError(f"no token at {redact_home(TOKEN_FILE)}")
        os.makedirs(CONF, mode=0o700, exist_ok=True)
        os.chmod(CONF, 0o700)
        fd = os.open(TOKEN_FILE, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(secrets.token_urlsafe(32))

    if os.path.isdir(CONF):
        try:
            os.chmod(CONF, 0o700)
        except OSError:
            pass
    os.chmod(TOKEN_FILE, 0o600)
    with open(TOKEN_FILE, "r", encoding="utf-8") as f:
        tok = f.read().strip()
    if not is_valid_token(tok):
        raise RuntimeError(
            f"invalid or empty bearer token at {redact_home(TOKEN_FILE)} (minimum {MIN_TOKEN_LEN} non-whitespace chars required)"
        )
    return tok


def reset_rate_limits():
    """Clear in-memory failed-auth rate limit buckets (used in tests)."""
    with _AUTH_FAIL_LOCK:
        _AUTH_FAILS.clear()


class RelayHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 32
    allow_reuse_address = True


class Handler(BaseHTTPRequestHandler):
    token = ""
    server_version = "konsole-relay"
    sys_version = ""

    def version_string(self):
        return self.server_version

    def setup(self):
        super().setup()
        try:
            self.connection.settimeout(SOCKET_TIMEOUT_S)
        except OSError:
            pass

    def log_message(self, *a):
        pass

    def _client_ip(self):
        return self.client_address[0] if self.client_address else "unknown"

    def _send_security_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
        self.send_header("Cache-Control", "no-store")

    def _out(self, code, obj, extra_headers=None, body_allowed=True):
        b = json.dumps(obj).encode("utf-8") if body_allowed else b""
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b)))
        self._send_security_headers()
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        if body_allowed and b:
            self.wfile.write(b)

    def _allowed_hosts(self):
        port = getattr(self.server, "server_port", DEFAULT_PORT)
        return {
            f"127.0.0.1:{port}",
            f"localhost:{port}",
            f"[::1]:{port}",
            "127.0.0.1",
            "localhost",
            "[::1]",
        }

    def _check_transport_guards(self, body_allowed=True):
        host = (self.headers.get("Host") or "").strip().lower()
        if not host or host not in self._allowed_hosts():
            self._out(400, {"error": "invalid Host header"}, body_allowed=body_allowed)
            return False
        if "Origin" in self.headers:
            self._out(403, {"error": "cross-origin requests are forbidden"}, body_allowed=body_allowed)
            return False
        sfs = self.headers.get("Sec-Fetch-Site")
        if sfs is not None and sfs.strip().lower() != "none":
            self._out(403, {"error": "cross-site requests are forbidden"}, body_allowed=body_allowed)
            return False
        return True

    def _check_rate_limit(self, ip, body_allowed=True):
        now = time.monotonic()
        cutoff = now - RATE_LIMIT_WINDOW_S
        with _AUTH_FAIL_LOCK:
            recent = [t for t in _AUTH_FAILS.get(ip, []) if t > cutoff]
            if recent:
                _AUTH_FAILS[ip] = recent
            else:
                _AUTH_FAILS.pop(ip, None)
            if len(recent) >= RATE_LIMIT_MAX_FAILS:
                retry_after = max(1, int(RATE_LIMIT_WINDOW_S - (now - recent[0])) + 1)
                audit({"event": "auth_rate_limited", "source": "http", "client_ip": ip, "path": self.path[:120]})
                self._out(
                    429,
                    {"error": "too many failed authentication attempts"},
                    extra_headers={"Retry-After": str(retry_after)},
                    body_allowed=body_allowed,
                )
                return False
        return True

    def _record_auth_fail(self, ip):
        now = time.monotonic()
        cutoff = now - RATE_LIMIT_WINDOW_S
        with _AUTH_FAIL_LOCK:
            recent = [t for t in _AUTH_FAILS.get(ip, []) if t > cutoff]
            recent.append(now)
            _AUTH_FAILS[ip] = recent
        audit({"event": "auth_fail", "source": "http", "client_ip": ip, "path": self.path[:120]})

    def _auth(self, body_allowed=True):
        ip = self._client_ip()
        if not self._check_rate_limit(ip, body_allowed=body_allowed):
            return False
        if not is_valid_token(self.token):
            self._out(503, {"error": "relay authentication unavailable"}, body_allowed=body_allowed)
            return False
        h = self.headers.get("Authorization", "")
        ok = (
            h.startswith("Bearer ")
            and len(h) > 7
            and hmac.compare_digest(h[7:].encode("utf-8"), self.token.encode("utf-8"))
        )
        if not ok:
            self._record_auth_fail(ip)
            self._out(401, {"error": "unauthorized"}, body_allowed=body_allowed)
        return ok

    def do_HEAD(self):
        if not self._check_transport_guards(body_allowed=False):
            return
        u = urlparse(self.path)
        if u.path == "/health":
            return self._out(200, {"ok": True}, body_allowed=False)
        if not self._auth(body_allowed=False):
            return
        if u.path in ("/sessions", "/read", "/agy"):
            return self._out(200, {}, body_allowed=False)
        return self._out(404, {"error": "not found"}, body_allowed=False)

    def do_OPTIONS(self):
        if not self._check_transport_guards():
            return
        return self._out(
            405,
            {"error": "method not allowed"},
            extra_headers={"Allow": "GET, POST, HEAD"},
        )

    def do_GET(self):
        if not self._check_transport_guards():
            return
        u = urlparse(self.path)
        if u.path == "/health":
            return self._out(200, {"ok": True})
        if not self._auth():
            return
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        ip = self._client_ip()
        try:
            if u.path == "/sessions":
                return self._out(200, list_all())
            if u.path == "/read":
                if "target" not in q:
                    return self._out(400, {"error": "missing target query parameter"})
                svc, sid = resolve(q["target"])
                lines = clamp_lines(q.get("lines"), default=60)
                return self._out(
                    200,
                    {"service": svc, "session": sid, "text": read_text(svc, sid, lines, source="http", client_ip=ip)},
                )
            if u.path == "/agy":
                lines = clamp_lines(q.get("lines"), default=20)
                return self._out(200, tail_agy(lines, source="http", client_ip=ip))
            self._out(404, {"error": "not found"})
        except LookupError as e:
            self._out(404, {"error": redact_home(str(e))})
        except (ValueError, KeyError) as e:
            self._out(400, {"error": redact_home(str(e))})
        except Exception:
            self._out(500, {"error": "internal relay error"})

    def do_POST(self):
        if not self._check_transport_guards():
            return
        if not self._auth():
            return
        u = urlparse(self.path)
        if u.path != "/send":
            return self._out(404, {"error": "not found"})
        raw_cl = self.headers.get("Content-Length")
        if raw_cl is None:
            n = 0
        else:
            raw_cl_s = raw_cl.strip()
            if not re.fullmatch(r"-?\d+", raw_cl_s):
                return self._out(400, {"error": "invalid Content-Length"})
            n = int(raw_cl_s)
            if n < 0:
                return self._out(400, {"error": "negative Content-Length"})
            if n > MAX_BODY_BYTES:
                return self._out(413, {"error": "too large"})
        try:
            raw_body = self.rfile.read(n) if n > 0 else b"{}"
            body = json.loads(raw_body.decode("utf-8") if raw_body else "{}")
        except (UnicodeDecodeError, json.JSONDecodeError):
            return self._out(400, {"error": "invalid JSON body"})
        if not isinstance(body, dict):
            return self._out(400, {"error": "JSON body must be an object"})
        try:
            if "target" not in body:
                return self._out(400, {"error": "missing target field"})
            svc, sid = resolve(body["target"])
            text = body.get("text", "")
            enter = bool(body.get("enter", True))
            self._out(200, send(svc, sid, text, enter, source="http", client_ip=self._client_ip()))
        except LookupError as e:
            self._out(404, {"error": redact_home(str(e))})
        except (ValueError, KeyError) as e:
            self._out(400, {"error": redact_home(str(e))})
        except Exception:
            self._out(500, {"error": "internal relay error"})


def serve(port):
    Handler.token = load_token(create=True)
    srv = RelayHTTPServer(("127.0.0.1", port), Handler)
    print(f"konsole-relay v{VERSION} listening on http://127.0.0.1:{port}", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()


def probe_health(port=DEFAULT_PORT, timeout=2.0):
    """Strictly read-only loopback /health probe (bypassing system proxies)."""
    url = f"http://127.0.0.1:{int(port)}/health"
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    req = urllib.request.Request(url, method="GET", headers={"Host": f"127.0.0.1:{int(port)}"})
    try:
        with opener.open(req, timeout=timeout) as resp:
            body = resp.read(4096).decode("utf-8", errors="replace")
            data = json.loads(body) if body.strip() else {}
            return {
                "ok": resp.status == 200 and bool(data.get("ok")),
                "url": url,
                "port": int(port),
                "status_code": resp.status,
            }
    except urllib.error.HTTPError as e:
        return {"ok": False, "url": url, "port": int(port), "status_code": e.code}
    except Exception as e:
        return {"ok": False, "url": url, "port": int(port), "status_code": 0, "error": redact_home(str(e))}


def _stat_path_info(path_str):
    try:
        st = os.stat(path_str)
        mode = st.st_mode & 0o777
        return {
            "path": redact_home(path_str),
            "exists": True,
            "mode": f"{mode:04o}",
            "size": st.st_size,
            "world_or_group_permissive": bool(mode & 0o077),
        }
    except OSError:
        return {
            "path": redact_home(path_str),
            "exists": False,
            "mode": None,
            "size": None,
            "world_or_group_permissive": False,
        }


def collect_status(port=DEFAULT_PORT):
    """Collect strictly read-only systemd, listener, permission, and session telemetry."""
    systemd = {"available": False, "unit": "konsole-relay.service", "active": False, "active_state": "unavailable"}
    try:
        props = ",".join([
            "Id", "ActiveState", "SubState", "UnitFileState", "MainPID",
            "MemoryCurrent", "NoNewPrivileges", "PrivateTmp", "UMask", "MemoryMax",
        ])
        r = subprocess.run(
            ["systemctl", "--user", "show", "konsole-relay.service", "-p", props, "--no-pager"],
            capture_output=True, text=True, timeout=2,
        )
        if r.returncode == 0 and r.stdout.strip():
            kv = {}
            for line in r.stdout.splitlines():
                if "=" in line:
                    k, v = line.split("=", 1)
                    kv[k.strip()] = v.strip()
            pid_raw = kv.get("MainPID", "0")
            mem_raw = kv.get("MemoryCurrent", "")
            systemd = {
                "available": bool(kv.get("ActiveState")),
                "unit": kv.get("Id") or "konsole-relay.service",
                "active": kv.get("ActiveState") == "active",
                "active_state": kv.get("ActiveState") or "unknown",
                "sub_state": kv.get("SubState") or "unknown",
                "unit_file_state": kv.get("UnitFileState") or "unknown",
                "pid": int(pid_raw) if pid_raw.isdigit() and int(pid_raw) > 0 else None,
                "memory_current_bytes": int(mem_raw) if mem_raw.isdigit() else None,
                "hardening": {
                    "no_new_privileges": kv.get("NoNewPrivileges") == "yes",
                    "private_tmp": kv.get("PrivateTmp") == "yes",
                    "umask": kv.get("UMask") or "",
                    "memory_max": kv.get("MemoryMax") or "",
                },
            }
    except Exception:
        pass

    health = probe_health(port=port)
    perms = {
        "conf_dir": _stat_path_info(CONF),
        "token_file": _stat_path_info(TOKEN_FILE),
        "audit_file": _stat_path_info(AUDIT),
    }

    sessions_count = 0
    dbus_ok = False
    try:
        sessions_count = len(list_all())
        dbus_ok = True
    except Exception:
        pass

    return {
        "version": VERSION,
        "port": int(port),
        "systemd": systemd,
        "health": health,
        "permissions": perms,
        "dbus_reachable": dbus_ok,
        "konsole_sessions": sessions_count,
    }


def read_audit_tail(lines=20):
    """Read last N lines of audit.log (redacted & secret-scrubbed)."""
    n = clamp_lines(lines, default=20)
    if not os.path.exists(AUDIT):
        return {"file": redact_home(AUDIT), "entries": []}
    with open(AUDIT, "r", encoding="utf-8", errors="replace") as f:
        raw_lines = f.read().splitlines()[-n:]
    entries = []
    for line in raw_lines:
        if not line.strip():
            continue
        try:
            obj = json.loads(line)
            if isinstance(obj, dict):
                entries.append({k: (scrub_secrets(v) if isinstance(v, str) else v) for k, v in obj.items()})
            else:
                entries.append({"raw": scrub_secrets(line)})
        except json.JSONDecodeError:
            entries.append({"raw": scrub_secrets(line)})
    return {"file": redact_home(AUDIT), "entries": entries}


def main(argv=None):
    ap = argparse.ArgumentParser(
        prog="konsole-relay",
        description=f"konsole-relay v{VERSION} — Loopback KDE Konsole D-Bus Relay Daemon & CLI",
    )
    ap.add_argument("--version", action="version", version=f"konsole-relay {VERSION}")
    sp = ap.add_subparsers(dest="cmd", required=True)

    p_ls = sp.add_parser("ls", help="List open KDE Konsole sessions over D-Bus")
    p_ls.add_argument("--json", action="store_true", help="Emit JSON output")

    p_read = sp.add_parser("read", help="Read displayed text from a Konsole session")
    p_read.add_argument("target", help="Target svc/sid, pid/sid, pid, or unique title substring")
    p_read.add_argument("-n", "--lines", type=int, default=60)
    p_read.add_argument("--json", action="store_true", help="Emit JSON output")

    p_send = sp.add_parser("send", help="Send text (and optional Enter) to a Konsole session")
    p_send.add_argument("target")
    p_send.add_argument("text")
    p_send.add_argument("--no-enter", action="store_true")

    p_agy = sp.add_parser("agy", help="Tail newest Antigravity conversation file (best-effort)")
    p_agy.add_argument("-n", "--lines", type=int, default=20)
    p_agy.add_argument("--json", action="store_true", help="Emit JSON output")

    p_status = sp.add_parser("status", help="Inspect systemd state, loopback /health, permissions, and session count")
    p_status.add_argument("--port", type=int, default=int(os.environ.get("KONSOLE_RELAY_PORT", DEFAULT_PORT)))
    p_status.add_argument("--json", action="store_true", help="Emit JSON output")

    p_health = sp.add_parser("health", help="Probe local 127.0.0.1 /health endpoint")
    p_health.add_argument("--port", type=int, default=int(os.environ.get("KONSOLE_RELAY_PORT", DEFAULT_PORT)))
    p_health.add_argument("--json", action="store_true", help="Emit JSON output")

    p_audit = sp.add_parser("audit", help="Display recent entries from ~/.config/konsole-relay/audit.log")
    p_audit.add_argument("-n", "--lines", type=int, default=20)
    p_audit.add_argument("--json", action="store_true", help="Emit JSON output")

    p_serve = sp.add_parser("serve", help="Run loopback-only HTTP relay server")
    p_serve.add_argument("--port", type=int, default=int(os.environ.get("KONSOLE_RELAY_PORT", DEFAULT_PORT)))

    p_tok = sp.add_parser("init-token", help="Create (or --rotate) 0600 bearer token without printing it")
    p_tok.add_argument("--rotate", action="store_true", help="Atomically rotate existing bearer token")

    a = ap.parse_args(argv)
    try:
        if a.cmd == "ls":
            sessions = list_all()
            if a.json:
                print(json.dumps(sessions, indent=2))
            else:
                for i in sessions:
                    print(f"{i['service']}/{i['session']}\tshell={i['shell_pid']}\tfg={i['fg_pid']} {i['fg_cmd'][:60]}\t{i['title']}")
        elif a.cmd == "read":
            svc, sid = resolve(a.target)
            txt = read_text(svc, sid, a.lines, source="cli")
            if a.json:
                print(json.dumps({"service": svc, "session": sid, "text": txt}, indent=2))
            else:
                print(txt)
        elif a.cmd == "send":
            print(json.dumps(send(*resolve(a.target), a.text, not a.no_enter, source="cli")))
        elif a.cmd == "agy":
            d = tail_agy(a.lines, source="cli")
            if a.json:
                print(json.dumps(d, indent=2))
            else:
                print(f"# {d['file']}")
                print("\n".join(d["lines"]))
        elif a.cmd == "status":
            st = collect_status(port=a.port)
            if a.json:
                print(json.dumps(st, indent=2))
            else:
                print(
                    f"konsole-relay v{st['version']} | unit={st['systemd']['active_state']} (pid={st['systemd'].get('pid')}) "
                    f"| health={st['health']['ok']} (:{st['port']}) | sessions={st['konsole_sessions']} "
                    f"| token={st['permissions']['token_file']['mode']} | audit={st['permissions']['audit_file']['mode']}"
                )
        elif a.cmd == "health":
            h = probe_health(port=a.port)
            if a.json:
                print(json.dumps(h, indent=2))
            else:
                print(f"{'ok' if h['ok'] else 'down'} ({h['url']} HTTP {h['status_code']})")
            return 0 if h["ok"] else 1
        elif a.cmd == "audit":
            d = read_audit_tail(lines=a.lines)
            if a.json:
                print(json.dumps(d, indent=2))
            else:
                print(f"# {d['file']} ({len(d['entries'])} entries)")
                for e in d["entries"]:
                    print(json.dumps(e))
        elif a.cmd == "serve":
            serve(a.port)
        elif a.cmd == "init-token":
            load_token(create=True, rotate=a.rotate)
            action = "rotated" if a.rotate else "ready"
            print(f"token {action} at {redact_home(TOKEN_FILE)} (not printed)")
    except Exception as e:
        print(f"error: {redact_home(str(e))}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
