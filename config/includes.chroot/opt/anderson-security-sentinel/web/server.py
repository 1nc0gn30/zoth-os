import os
import re
import hmac
import json
import time
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Response
from fastapi.responses import StreamingResponse, FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

from engine.sentinel import (
    AndersonSentinel,
    normalize_vision_mode,
    validate_public_https_webhook,
)
from engine.config import INTRUDERS_DIR

SENTINEL_VERSION = "2.6.0"
MAX_BODY_BYTES = 131072  # 128 KiB streaming request body cap
ALLOWED_LOOPBACK_HOSTS = {"localhost", "127.0.0.1", "::1"}
SAFE_INTRUDER_NAME_RE = re.compile(r"^[A-Za-z0-9._-]+\.jpg$")

SECURITY_HEADERS = [
    (b"x-frame-options", b"SAMEORIGIN"),
    (b"content-security-policy", b"frame-ancestors 'self' http://127.0.0.1:3000 http://localhost:3000"),
    (b"x-content-type-options", b"nosniff"),
    (b"referrer-policy", b"strict-origin-when-cross-origin"),
    (b"vary", b"Origin"),
]


def is_allowed_host(host_header: str) -> bool:
    """Strict loopback Host header allowlist (rejects evil.example:* and spoofed suffixes)."""
    if not host_header:
        return False
    raw = host_header.strip().lower()
    if any(ch in raw for ch in ("/", "\\", "@", " ", "\t", "\r", "\n")):
        return False
    if raw.startswith("["):
        end = raw.find("]")
        if end == -1:
            return False
        hostname = raw[1:end]
        rest = raw[end + 1:]
        if hostname != "::1":
            return False
        if not rest:
            return True
        if not rest.startswith(":"):
            return False
        port_str = rest[1:]
    else:
        parts = raw.split(":")
        if len(parts) > 2:
            return False
        hostname = parts[0]
        if hostname not in ("localhost", "127.0.0.1"):
            return False
        if len(parts) == 1:
            return True
        port_str = parts[1]

    if not port_str.isdigit():
        return False
    port = int(port_str)
    return 1 <= port <= 65535


def parse_loopback_origin(origin_or_url: str) -> str | None:
    """Strictly parse an Origin/Referer URL and return exact canonical loopback origin or None."""
    if not origin_or_url:
        return None
    raw = origin_or_url.strip()
    if any(ch in raw for ch in ("\r", "\n", " ", "\t")):
        return None
    try:
        u = urlparse(raw)
        if u.scheme not in ("http", "https"):
            return None
        if u.username is not None or u.password is not None:
            return None
        hostname = (u.hostname or "").lower()
        if hostname not in ALLOWED_LOOPBACK_HOSTS:
            return None
        port = u.port  # raises ValueError on spoofed ports like 8103.example.invalid
        if port is not None and not (1 <= port <= 65535):
            return None
        host_fmt = f"[{hostname}]" if ":" in hostname else hostname
        expected_netloc = f"{host_fmt}:{port}" if port is not None else host_fmt
        if u.netloc.lower() != expected_netloc:
            return None
        return f"{u.scheme}://{expected_netloc}"
    except ValueError:
        return None


def _get_header(scope, name_lower: bytes) -> str:
    for k, v in scope.get("headers", []):
        if k.lower() == name_lower:
            return v.decode("latin-1", errors="ignore").strip()
    return ""


class LoopbackSecurityMiddleware:
    """Pure ASGI middleware enforcing Host allowlist, strict loopback Origin/CORS, CSRF, headers, and streaming body cap."""

    def __init__(self, app, max_body_bytes: int = MAX_BODY_BYTES):
        self.app = app
        self.max_body_bytes = max_body_bytes

    async def _send_json_error(self, send, status: int, detail: str, allowed_origin: str | None = None):
        payload = json.dumps({"detail": detail}).encode("utf-8")
        headers = [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(payload)).encode("ascii")),
        ] + list(SECURITY_HEADERS)
        if allowed_origin:
            headers.append((b"access-control-allow-origin", allowed_origin.encode("ascii")))
        await send({"type": "http.response.start", "status": status, "headers": headers})
        await send({"type": "http.response.body", "body": payload})

    async def _reject_ws(self, send, status: int = 403, detail: str = "Forbidden"):
        # Standard ASGI websocket denial before accept()
        await send({"type": "websocket.close", "code": 1008, "reason": detail})

    async def __call__(self, scope, receive, send):
        scope_type = scope.get("type")
        if scope_type not in ("http", "websocket"):
            await self.app(scope, receive, send)
            return

        host = _get_header(scope, b"host")
        origin = _get_header(scope, b"origin")
        referer = _get_header(scope, b"referer")

        # 1. Strict loopback Host header check (blocks DNS rebinding on ALL HTTP & WS routes)
        if not is_allowed_host(host):
            if scope_type == "websocket":
                await self._reject_ws(send, 403, "Disallowed Host header")
                return
            await self._send_json_error(send, 403, "Forbidden: disallowed Host header")
            return

        # 2. Strict loopback Origin check (when Origin header is present)
        allowed_origin: str | None = None
        if origin:
            allowed_origin = parse_loopback_origin(origin)
            if not allowed_origin:
                if scope_type == "websocket":
                    await self._reject_ws(send, 403, "Disallowed Origin header")
                    return
                await self._send_json_error(send, 403, "Forbidden: disallowed Origin header")
                return

        if scope_type == "websocket":
            await self.app(scope, receive, send)
            return

        method = scope.get("method", "GET").upper()

        # 3. CORS Preflight OPTIONS handling
        if method == "OPTIONS":
            headers = list(SECURITY_HEADERS) + [
                (b"access-control-allow-methods", b"GET, POST, HEAD, OPTIONS"),
                (b"access-control-allow-headers", b"Content-Type, Authorization, X-Sentinel-Action"),
                (b"access-control-max-age", b"600"),
                (b"content-length", b"0"),
            ]
            if allowed_origin:
                headers.append((b"access-control-allow-origin", allowed_origin.encode("ascii")))
            await send({"type": "http.response.start", "status": 204, "headers": headers})
            await send({"type": "http.response.body", "body": b""})
            return

        # 4. CSRF & Optional Bearer Token Protection on Mutating Requests
        if method in ("POST", "PUT", "PATCH", "DELETE"):
            # Optional ANDERSON_API_TOKEN enforcement via constant-time comparison
            expected_token = os.environ.get("ANDERSON_API_TOKEN", "").strip()
            if expected_token:
                auth_header = _get_header(scope, b"authorization")
                provided = auth_header[7:].strip() if auth_header.lower().startswith("bearer ") else ""
                if not provided or not hmac.compare_digest(provided, expected_token):
                    await self._send_json_error(send, 401, "Unauthorized: valid Bearer token required", allowed_origin)
                    return

            if referer:
                if not parse_loopback_origin(referer):
                    await self._send_json_error(send, 403, "Forbidden: disallowed Referer header")
                    return

            # Block simple cross-site POST CSRF (text/plain, form-urlencoded, multipart) without trusted loopback Origin
            ctype = _get_header(scope, b"content-type").lower().split(";")[0].strip()
            has_custom_action = bool(_get_header(scope, b"x-sentinel-action"))
            if ctype in ("text/plain", "application/x-www-form-urlencoded", "multipart/form-data"):
                if not allowed_origin and not has_custom_action:
                    await self._send_json_error(send, 403, "Forbidden: cross-site simple POST rejected")
                    return

            # 5. Streaming MAX_BODY_BYTES cap (reject >128 KiB BEFORE buffering into RAM)
            cl_raw = _get_header(scope, b"content-length")
            if cl_raw:
                try:
                    if int(cl_raw) > self.max_body_bytes:
                        await self._send_json_error(
                            send, 413, f"Payload Too Large: limit is {self.max_body_bytes} bytes", allowed_origin
                        )
                        return
                except ValueError:
                    await self._send_json_error(send, 400, "Invalid Content-Length header", allowed_origin)
                    return

        bytes_seen = 0
        body_exceeded = False

        async def limited_receive():
            nonlocal bytes_seen, body_exceeded
            message = await receive()
            if message.get("type") == "http.request":
                chunk = message.get("body", b"")
                bytes_seen += len(chunk)
                if bytes_seen > self.max_body_bytes:
                    body_exceeded = True
                    raise _PayloadTooLargeError()
            return message

        async def send_with_headers(message):
            if message.get("type") == "http.response.start":
                raw_headers = list(message.get("headers", []))
                existing_keys = {k.lower() for k, _ in raw_headers}
                for hk, hv in SECURITY_HEADERS:
                    if hk not in existing_keys:
                        raw_headers.append((hk, hv))
                if allowed_origin and b"access-control-allow-origin" not in existing_keys:
                    raw_headers.append((b"access-control-allow-origin", allowed_origin.encode("ascii")))
                message = {**message, "headers": raw_headers}
            await send(message)

        try:
            await self.app(scope, limited_receive if method in ("POST", "PUT", "PATCH") else receive, send_with_headers)
        except _PayloadTooLargeError:
            await self._send_json_error(
                send, 413, f"Payload Too Large: limit is {self.max_body_bytes} bytes", allowed_origin
            )


class _PayloadTooLargeError(Exception):
    pass


active_websockets: set[WebSocket] = set()
_sentinel_instance: AndersonSentinel | None = None


def get_sentinel() -> AndersonSentinel:
    global _sentinel_instance
    if _sentinel_instance is None:
        _sentinel_instance = AndersonSentinel()
    return _sentinel_instance


def websocket_broadcaster(event_type, data):
    msg = {"type": event_type, "data": data}
    loop = getattr(app.state, "loop", None)
    if loop is None or loop.is_closed():
        return
    for ws in list(active_websockets):
        try:
            asyncio.run_coroutine_threadsafe(ws.send_json(msg), loop)
        except Exception:
            pass


@asynccontextmanager
async def lifespan(fastapi_app: FastAPI):
    fastapi_app.state.loop = asyncio.get_running_loop()
    inst = get_sentinel()
    fastapi_app.state.sentinel = inst
    if websocket_broadcaster not in inst.listeners:
        inst.add_listener(websocket_broadcaster)
    inst.start()
    try:
        yield
    finally:
        inst.stop()
        inst.remove_listener(websocket_broadcaster)


app = FastAPI(
    title="Anderson Sentinel // Autonomous Security Daemon",
    description="Local loopback biometric perimeter defense, 802.11 RF tomography, USB/BLE tripwire, and SHA-256 forensic dossier API.",
    version=SENTINEL_VERSION,
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)
app.add_middleware(LoopbackSecurityMiddleware, max_body_bytes=MAX_BODY_BYTES)

CURRENT_DIR = Path(__file__).resolve().parent
STATIC_DIR = CURRENT_DIR / "static"
TEMPLATES_DIR = CURRENT_DIR / "templates"
PUBLIC_DIR = CURRENT_DIR.parent / "public"

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
if PUBLIC_DIR.is_dir():
    app.mount("/public", StaticFiles(directory=str(PUBLIC_DIR)), name="public")


@app.head("/health", include_in_schema=False)
async def health_check_head():
    return Response(status_code=200)


@app.get("/health")
async def health_check():
    inst = get_sentinel()
    return {
        "status": "ok",
        "service": "anderson-security-sentinel",
        "version": SENTINEL_VERSION,
        "port": 8103,
        "armed": inst.settings.get("armed", True),
        "security_status": inst.security_status,
        "enrolled_count": len(inst.detector.enrolled_embeddings),
        "camera_active": inst.camera.is_active(),
        "license": "100% Free & Open Access (Zero Paywalls)"
    }


@app.get("/docs", response_class=HTMLResponse, include_in_schema=False)
async def offline_openapi_docs():
    """Zero-egress offline OpenAPI Explorer rendering /openapi.json with zero CDN dependencies."""
    return HTMLResponse(
        content=f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anderson Security Sentinel v{SENTINEL_VERSION} — Offline OpenAPI Explorer</title>
  <style>
    :root {{
      --bg: #08080B; --card: #0E1118; --ink: #F5F1E6; --muted: #9CA3AF;
      --gold: #D4AF37; --green: #00FF88; --cyan: #38BDF8; --border: rgba(212,175,55,0.28);
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --sans: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    }}
    @media (prefers-color-scheme: light) {{
      :root {{
        --bg: #FAF7F0; --card: #FFFFFF; --ink: #181613; --muted: #475467;
        --gold: #8C6A2E; --green: #047857; --cyan: #0369A1; --border: rgba(16,24,40,0.14);
      }}
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; padding: 24px; background: var(--bg); color: var(--ink); font-family: var(--sans); line-height: 1.5; }}
    .wrap {{ max-width: 1080px; margin: 0 auto; }}
    header {{ display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 20px; }}
    h1 {{ margin: 0; font-size: 1.45rem; font-family: var(--mono); }}
    .badge {{ font-family: var(--mono); font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--border); color: var(--gold); }}
    .nav-link {{ display: inline-flex; align-items: center; min-height: 44px; padding: 8px 14px; border-radius: 6px; border: 1px solid var(--border); color: var(--ink); text-decoration: none; font-family: var(--mono); font-size: 0.78rem; font-weight: 700; }}
    .endpoint {{ background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; margin-bottom: 12px; }}
    .ep-head {{ display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-family: var(--mono); }}
    .method {{ font-size: 0.72rem; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; }}
    .m-get {{ background: rgba(0,255,136,0.15); color: var(--green); border: 1px solid var(--green); }}
    .m-post {{ background: rgba(56,189,248,0.15); color: var(--cyan); border: 1px solid var(--cyan); }}
    .m-head {{ background: rgba(212,175,55,0.15); color: var(--gold); border: 1px solid var(--gold); }}
    .path {{ font-weight: 700; font-size: 0.92rem; }}
    .summary {{ color: var(--muted); font-size: 0.84rem; margin-top: 6px; }}
    pre {{ margin: 10px 0 0; padding: 10px; border-radius: 6px; background: rgba(127,127,127,0.08); overflow-x: auto; font-family: var(--mono); font-size: 0.75rem; }}
    footer {{ margin-top: 28px; padding-top: 14px; border-top: 1px solid var(--border); font-family: var(--mono); font-size: 0.75rem; color: var(--muted); }}
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>ANDERSON SECURITY SENTINEL // OPENAPI EXPLORER</h1>
        <div style="font-family: var(--mono); font-size: 0.78rem; color: var(--muted); margin-top: 4px;">
          v{SENTINEL_VERSION} · Zero-Egress Local Loopback Specification (127.0.0.1:8103)
        </div>
      </div>
      <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
        <span class="badge">ZERO CDN EGRESS</span>
        <a class="nav-link" href="/openapi.json">Raw /openapi.json</a>
        <a class="nav-link" href="/">← Back to Dashboard</a>
      </div>
    </header>
    <main id="routes">Loading OpenAPI specification...</main>
    <footer>
      Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform · All endpoints enforce strict loopback Host &amp; Origin validation.
    </footer>
  </div>
  <script>
    (async function () {{
      const root = document.getElementById('routes');
      try {{
        const res = await fetch('/openapi.json');
        const spec = await res.json();
        root.textContent = '';
        const paths = Object.entries(spec.paths || {{}});
        paths.forEach(([route, methods]) => {{
          Object.entries(methods).forEach(([verb, meta]) => {{
            const card = document.createElement('section');
            card.className = 'endpoint';
            const head = document.createElement('div');
            head.className = 'ep-head';
            const m = document.createElement('span');
            m.className = 'method m-' + verb.toLowerCase();
            m.textContent = verb.toUpperCase();
            const p = document.createElement('span');
            p.className = 'path';
            p.textContent = route;
            head.appendChild(m);
            head.appendChild(p);
            card.appendChild(head);
            const sum = document.createElement('div');
            sum.className = 'summary';
            sum.textContent = meta.summary || meta.operationId || '';
            card.appendChild(sum);
            root.appendChild(card);
          }});
        }});
      }} catch (err) {{
        root.textContent = 'Failed to load /openapi.json: ' + err;
      }}
    }})();
  </script>
</body>
</html>"""
    )


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    svg_icon = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
        '<rect width="32" height="32" rx="6" fill="#08080B"/>'
        '<path d="M16 4 L28 9 L28 17 C28 23 23 27 16 29 C9 27 4 23 4 17 L4 9 Z" fill="none" stroke="#D4AF37" stroke-width="2.2"/>'
        '<circle cx="16" cy="16" r="3.2" fill="#00FF88"/></svg>'
    )
    return Response(content=svg_icon, media_type="image/svg+xml")


@app.get("/", response_class=HTMLResponse)
async def get_index():
    index_file = TEMPLATES_DIR / "index.html"
    if not index_file.exists():
        return HTMLResponse("<h1>Anderson Sentinel Dashboard</h1>")
    return HTMLResponse(index_file.read_text(encoding="utf-8"))


async def generate_mjpeg_stream():
    inst = get_sentinel()
    while True:
        frame_bytes = inst.get_latest_jpeg(use_hud=inst.settings.get("draw_hud_on_stream", True))
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
        )
        await asyncio.sleep(0.033)  # ~30 FPS non-blocking async yield


@app.get("/video_feed")
async def video_feed():
    return StreamingResponse(
        generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/api/status")
async def get_status():
    inst = get_sentinel()
    return {
        "version": SENTINEL_VERSION,
        "armed": inst.settings.get("armed", True),
        "status": inst.security_status,
        "enrolled_count": len(inst.detector.enrolled_embeddings),
        "camera_active": inst.camera.is_active(),
        "fps": round(inst.camera.fps_actual, 1),
        "recent_events": inst.events[:15],
        "current_targets": len(inst.current_targets)
    }


@app.post("/api/arm")
async def arm_perimeter():
    inst = get_sentinel()
    inst.arm()
    return {"success": True, "status": "ARMED"}


@app.post("/api/disarm")
async def disarm_perimeter():
    inst = get_sentinel()
    inst.disarm()
    return {"success": True, "status": "DISARMED"}


@app.post("/api/enroll")
async def enroll_face():
    inst = get_sentinel()
    success, message = inst.enroll_current_face()
    return {"success": success, "message": message, "enrolled_count": len(inst.detector.enrolled_embeddings)}


@app.post("/api/clear_faces")
async def clear_faces():
    inst = get_sentinel()
    success, message = inst.clear_enrolled_faces()
    return {"success": success, "message": message}


@app.post("/api/test_voice/{kind}")
async def test_voice(kind: str):
    if kind not in ("welcome", "intruder", "shoulder"):
        raise HTTPException(status_code=400, detail="Invalid voice type")
    inst = get_sentinel()
    if kind == "shoulder":
        inst.synth.speak(
            inst.settings.get("shoulder_phrase", "Warning. Someone is looking over your shoulder."),
            alert_type="shoulder"
        )
        inst._log_event("TEST", "Testing Shoulder Surfer Voice Alert.")
    else:
        inst.test_voice(kind)
    return {"success": True, "tested": kind}


class SettingsUpdate(BaseModel):
    similarity_threshold: float | None = Field(default=None, ge=0.1, le=0.99)
    welcome_cooldown_sec: float | None = Field(default=None, ge=1.0, le=3600.0)
    intruder_cooldown_sec: float | None = Field(default=None, ge=1.0, le=3600.0)
    shoulder_cooldown_sec: float | None = Field(default=None, ge=1.0, le=3600.0)
    walk_away_lock_sec: float | None = Field(default=None, ge=0.0, le=3600.0)
    welcome_phrase: str | None = Field(default=None, max_length=240)
    intruder_phrase: str | None = Field(default=None, max_length=240)
    shoulder_phrase: str | None = Field(default=None, max_length=240)
    webhook_url: str | None = Field(default=None, max_length=512)
    tts_engine: str | None = Field(default=None, max_length=32)
    tts_voice: str | None = Field(default=None, max_length=120)
    save_intruder_snapshots: bool | None = None
    draw_hud_on_stream: bool | None = None
    auto_lockdown_on_breach: bool | None = None
    desktop_notifications: bool | None = None
    shoulder_surfer_alert: bool | None = None
    play_sound_effects: bool | None = None
    wifi_xray_enabled: bool | None = None
    wifi_scan_interval_sec: float | None = Field(default=None, ge=1.0, le=300.0)
    wifi_path_loss_n: float | None = Field(default=None, ge=1.0, le=6.0)
    rf_presence_alerts: bool | None = None
    rf_alert_cooldown_sec: float | None = Field(default=None, ge=1.0, le=3600.0)
    rf_audio_ping: bool | None = None
    vision_mode: str | None = Field(default=None, max_length=32)
    usb_guard_enabled: bool | None = None
    auto_lockdown_on_usb_breach: bool | None = None
    ble_guard_enabled: bool | None = None

    @field_validator("tts_engine")
    @classmethod
    def check_tts_engine(cls, v):
        if v is None:
            return v
        if v not in ("edge", "espeak"):
            raise ValueError("tts_engine must be 'edge' or 'espeak'")
        return v

    @field_validator("vision_mode")
    @classmethod
    def check_vision_mode(cls, v):
        if v is None:
            return v
        return normalize_vision_mode(v)

    @field_validator("webhook_url")
    @classmethod
    def check_webhook_url(cls, v):
        if v is None:
            return v
        return validate_public_https_webhook(v)


class VisionModeUpdate(BaseModel):
    mode: str = Field(..., min_length=1, max_length=32)

    @field_validator("mode")
    @classmethod
    def check_mode(cls, v):
        return normalize_vision_mode(v)


@app.get("/api/vision_mode")
async def get_vision_mode():
    inst = get_sentinel()
    return {"mode": inst.vision_mode}


@app.post("/api/vision_mode")
async def update_vision_mode(update: VisionModeUpdate):
    inst = get_sentinel()
    normalized = inst.set_vision_mode(update.mode)
    return {"success": True, "mode": normalized}


@app.get("/api/usb_status")
async def get_usb_status():
    return get_sentinel().usb_guard.get_status()


@app.post("/api/usb/baseline")
async def reset_usb_baseline():
    inst = get_sentinel()
    inst.usb_guard.reset_baseline()
    return {"success": True, "status": inst.usb_guard.get_status()}


@app.get("/api/bluetooth_status")
async def get_bluetooth_status():
    return get_sentinel().ble_guard.get_status()


@app.get("/api/wifi_xray")
async def get_wifi_xray():
    return get_sentinel().wifi_xray.get_state_snapshot()


@app.post("/api/wifi_xray/scan")
async def trigger_wifi_xray_scan():
    get_sentinel().wifi_xray.trigger_scan_now()
    return {"success": True, "message": "WiFi X-Ray scan initiated"}


@app.get("/api/cameras")
async def get_detected_cameras():
    return get_sentinel().wifi_xray.camera_scanner.get_summary()


@app.get("/api/building_perimeter")
async def get_building_perimeter():
    return get_sentinel().wifi_xray.building_perimeter


@app.post("/api/lockdown")
async def trigger_lockdown():
    get_sentinel()._lock_system_screen()
    return {"success": True, "message": "Lockdown executed"}


@app.get("/api/export_dossier")
async def export_dossier_json():
    inst = get_sentinel()
    dossier = inst.dossier_gen.build_dossier(inst)
    return JSONResponse(
        content=dossier,
        headers={"Content-Disposition": f"attachment; filename={dossier['dossier_id']}.json"}
    )


@app.get("/api/export_dossier_html", response_class=HTMLResponse)
async def export_dossier_html():
    inst = get_sentinel()
    dossier = inst.dossier_gen.build_dossier(inst)
    html_content = inst.dossier_gen.generate_html_report(dossier)
    return HTMLResponse(content=html_content)


@app.get("/api/export_audit")
async def export_audit():
    inst = get_sentinel()
    dossier = inst.dossier_gen.build_dossier(inst)
    return JSONResponse(
        content=dossier,
        headers={"Content-Disposition": f"attachment; filename=sentinel_audit_{int(time.time())}.json"}
    )


@app.get("/api/settings")
async def get_settings():
    return get_sentinel().settings


@app.post("/api/settings")
async def update_settings(update: SettingsUpdate):
    inst = get_sentinel()
    data = update.model_dump(exclude_none=True)
    inst.update_settings(data)
    return {"success": True, "settings": inst.settings}


@app.get("/api/intruders")
async def list_intruders():
    snaps = []
    if INTRUDERS_DIR.exists():
        resolved_dir = INTRUDERS_DIR.resolve()
        files = sorted(INTRUDERS_DIR.glob("*.jpg"), key=os.path.getmtime, reverse=True)
        for f in files[:20]:
            if f.is_symlink() or not f.is_file():
                continue
            try:
                if not f.resolve().is_relative_to(resolved_dir):
                    continue
            except Exception:
                continue
            snaps.append({
                "filename": f.name,
                "url": f"/api/intruders/{f.name}",
                "timestamp": time.ctime(f.stat().st_mtime),
                "size_kb": round(f.stat().st_size / 1024, 1)
            })
    return snaps


@app.get("/api/intruders/{filename}")
async def get_intruder_image(filename: str):
    if ".." in filename or "/" in filename or "\\" in filename or not SAFE_INTRUDER_NAME_RE.match(filename):
        raise HTTPException(status_code=403, detail="Forbidden snapshot filename")
    filepath = INTRUDERS_DIR / filename
    if filepath.is_symlink():
        raise HTTPException(status_code=403, detail="Forbidden: symlink access denied")
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="Snapshot not found")
    try:
        if not filepath.resolve().is_relative_to(INTRUDERS_DIR.resolve()):
            raise HTTPException(status_code=403, detail="Forbidden: path escape denied")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=403, detail="Forbidden: invalid path")
    return FileResponse(str(filepath), media_type="image/jpeg")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_websockets.add(websocket)
    inst = get_sentinel()
    try:
        await websocket.send_json({
            "type": "init",
            "data": {
                "version": SENTINEL_VERSION,
                "status": inst.security_status,
                "armed": inst.settings.get("armed", True),
                "enrolled_count": len(inst.detector.enrolled_embeddings),
                "events": inst.events[:15],
                "wifi_xray": inst.wifi_xray.get_state_snapshot(),
                "vision_mode": inst.vision_mode,
                "usb_status": inst.usb_guard.get_status(),
                "ble_status": inst.ble_guard.get_status()
            }
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_websockets.discard(websocket)
    except Exception:
        active_websockets.discard(websocket)
