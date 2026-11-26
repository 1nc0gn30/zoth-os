"""
Hardened loopback OpenAI-compatible bridge to the Antigravity CLI (`agy`).

Security & operational guarantees (v2.0.0):
- Strict loopback Host header allowlist (blocks DNS rebinding on every route).
- Strict loopback Origin allowlist with parsed scheme/host/port validation,
  Vary: Origin, no wildcard reflection, no Access-Control-Allow-Credentials.
- Optional bearer token enforcement via AGY_PROXY_TOKEN (hmac.compare_digest).
- Configurable MAX_BODY_BYTES (default 1 MiB) returning 413 OpenAI JSON before parsing.
- Strict Pydantic request schemas + OpenAI JSON error envelopes (zero plain-text 500s).
- Dynamic `agy models` catalog discovery with TTL cache + 27-model fallback and strict
  model validation (404 model_not_found on unknown IDs, never silently dropping --model).
- Subprocess lifecycle governance: asyncio.Semaphore concurrency cap (429 on saturation),
  hard execution timeout (504 Gateway Timeout), 8 MiB stdout stream line limit, stderr
  capture + non-zero exit handling (502 non-streaming / SSE error + [DONE] streaming),
  and guaranteed terminate() -> kill() orphan cleanup on disconnect or cancellation.
- Zero-egress dual-theme Operator Cockpit at GET / and Offline API Explorer at GET /docs.
"""

from __future__ import annotations

import asyncio
import hmac
import json
import math
import os
import re
import shutil
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional, Tuple, Union
from urllib.parse import urlparse

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from . import __version__
from .cockpit import render_cockpit_html, render_offline_docs_html

DEFAULT_MODEL = "gemini-3.8-flash-high"
STREAM_BUFFER_LIMIT = 8 * 1024 * 1024  # 8 MiB stdout line limit

ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]")
HOST_HEADER_RE = re.compile(r"^(localhost|127\.0\.0\.1|\[::1\])(?::([0-9]{1,5}))?$", re.IGNORECASE)

# Updated 27-model fallback matching live `agy models`
FALLBACK_MODEL_SPECS: List[Tuple[str, str]] = [
    ("gemini-4-neon-high", "Gemini 4 Neon (High)"),
    ("gemini-4-neon-xhigh", "Gemini 4 Neon (XHigh)"),
    ("gemini-4-neon-medium", "Gemini 4 Neon (Medium)"),
    ("gemini-4-neon-low", "Gemini 4 Neon (Low)"),
    ("gemini-4-carbon-medium", "Gemini 4 Carbon (Medium)"),
    ("gemini-4-carbon-high", "Gemini 4 Carbon (High)"),
    ("gemini-4-carbon-low", "Gemini 4 Carbon (Low)"),
    ("gemini-4-argon-medium", "Gemini 4 Argon (Medium)"),
    ("gemini-4-argon-high", "Gemini 4 Argon (High)"),
    ("gemini-4-argon-low", "Gemini 4 Argon (Low)"),
    ("gemini-4-hydrogen-high", "Gemini 4 Hydrogen (High)"),
    ("gemini-4-hydrogen-xhigh", "Gemini 4 Hydrogen (XHigh)"),
    ("gemini-4-hydrogen-medium", "Gemini 4 Hydrogen (Medium)"),
    ("gemini-4-hydrogen-low", "Gemini 4 Hydrogen (Low)"),
    ("gemini-pro-orchestrator-neon", "Orchestrator (Neon)"),
    ("gemini-pro-orchestrator", "Orchestrator (Carbon)"),
    ("gemini-pro-orchestrator-argon", "Orchestrator (Argon)"),
    ("gemini-3.8-flash-high", "Gemini 3.8 Flash (High)"),
    ("gemini-3.8-flash-medium", "Gemini 3.8 Flash (Medium)"),
    ("gemini-3.8-flash-low", "Gemini 3.8 Flash (Low)"),
    ("claude-opus-5-5-low", "Claude Opus 5.5 (Low)"),
    ("claude-opus-5-5-medium", "Claude Opus 5.5 (Medium)"),
    ("claude-opus-5-5-high", "Claude Opus 5.5 (High)"),
    ("claude-sonnet-5-5-low", "Claude Sonnet 5.5 (Low)"),
    ("claude-sonnet-5-5-medium", "Claude Sonnet 5.5 (Medium)"),
    ("claude-sonnet-5-5-high", "Claude Sonnet 5.5 (High)"),
    ("gpt-oss-120b-medium", "GPT-OSS 120B (Medium)"),
]


def _owner_for_model(model_id: str) -> str:
    lower = model_id.lower()
    if lower.startswith("claude-"):
        return "anthropic-antigravity"
    if lower.startswith("gemini-"):
        return "google-antigravity"
    if lower.startswith("gpt-"):
        return "openai-antigravity"
    return "antigravity"


def _build_model_entry(model_id: str, display_name: Optional[str] = None, created: int = 1764000000) -> Dict[str, Any]:
    return {
        "id": model_id,
        "object": "model",
        "created": created,
        "name": model_id,
        "display_name": display_name or model_id,
        "owned_by": _owner_for_model(model_id),
    }


FALLBACK_MODELS: List[Dict[str, Any]] = [
    _build_model_entry(mid, label) for mid, label in FALLBACK_MODEL_SPECS
]


def get_max_body_bytes() -> int:
    raw = os.environ.get("AGY_PROXY_MAX_BODY_BYTES", "").strip()
    if raw:
        try:
            val = int(raw)
            if val > 0:
                return val
        except ValueError:
            pass
    return 1_048_576  # 1 MiB default


def get_max_concurrency() -> int:
    raw = os.environ.get("AGY_PROXY_MAX_CONCURRENCY", "").strip()
    if raw:
        try:
            val = int(raw)
            if val >= 1:
                return val
        except ValueError:
            pass
    return 4


def get_acquire_timeout() -> float:
    raw = os.environ.get("AGY_PROXY_ACQUIRE_TIMEOUT", "").strip()
    if raw:
        try:
            val = float(raw)
            if val >= 0:
                return val
        except ValueError:
            pass
    return 0.25


def get_exec_timeout() -> float:
    raw = os.environ.get("AGY_PROXY_TIMEOUT_SECONDS", "").strip()
    if raw:
        try:
            val = float(raw)
            if val > 0:
                return val
        except ValueError:
            pass
    return 180.0


def get_model_cache_ttl() -> float:
    raw = os.environ.get("AGY_PROXY_MODEL_CACHE_TTL", "").strip()
    if raw:
        try:
            val = float(raw)
            if val >= 0:
                return val
        except ValueError:
            pass
    return 300.0


def resolve_agy_bin() -> Optional[str]:
    """Resolve `agy` binary dynamically without hardcoding user-home literals."""
    env_bin = os.environ.get("AGY_BIN", "").strip()
    if env_bin:
        p = Path(env_bin)
        if p.is_file() and os.access(p, os.X_OK):
            return str(p)
        found_env = shutil.which(env_bin)
        if found_env:
            return found_env
        return env_bin if p.exists() else None

    found = shutil.which("agy")
    if found:
        return found

    candidates = [
        Path.home() / ".gemini" / "antigravity-cli" / "bin" / "agy",
        Path.home() / ".local" / "bin" / "agy",
        Path("/usr/local/bin/agy"),
    ]
    for cand in candidates:
        if cand.is_file() and os.access(cand, os.X_OK):
            return str(cand)
    return None


def is_allowed_host(host_header: str) -> bool:
    if not host_header:
        return False
    m = HOST_HEADER_RE.match(host_header.strip())
    if not m:
        return False
    port_str = m.group(2)
    if port_str is not None:
        port = int(port_str)
        if port < 1 or port > 65535:
            return False
    return True


def is_allowed_loopback_origin(origin: str) -> bool:
    if not origin or any(ch.isspace() for ch in origin):
        return False
    try:
        parsed = urlparse(origin)
        port = parsed.port
    except ValueError:
        return False
    if parsed.scheme not in ("http", "https"):
        return False
    if parsed.username is not None or parsed.password is not None:
        return False
    if parsed.path or parsed.params or parsed.query or parsed.fragment:
        return False
    if parsed.hostname not in ("localhost", "127.0.0.1", "::1"):
        return False
    if port is not None and (port < 1 or port > 65535):
        return False
    host_part = f"[{parsed.hostname}]" if parsed.hostname == "::1" else parsed.hostname
    expected_netloc = f"{host_part}:{port}" if port is not None else host_part
    return parsed.netloc.lower() == expected_netloc.lower()


def openai_error_payload(
    message: str,
    error_type: str = "invalid_request_error",
    param: Optional[str] = None,
    code: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "error": {
            "message": message,
            "type": error_type,
            "param": param,
            "code": code,
        }
    }


def openai_error_response(
    status_code: int,
    message: str,
    error_type: str = "invalid_request_error",
    param: Optional[str] = None,
    code: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None,
) -> JSONResponse:
    base_headers = {"Vary": "Origin"}
    if headers:
        base_headers.update(headers)
    return JSONResponse(
        status_code=status_code,
        content=openai_error_payload(message, error_type=error_type, param=param, code=code),
        headers=base_headers,
    )


def parse_agy_models_output(raw_text: str) -> List[Dict[str, Any]]:
    """Parse `agy models` stdout (handling ANSI escapes and CR spinners)."""
    models: List[Dict[str, Any]] = []
    seen = set()
    now_ts = int(time.time())
    for raw_line in raw_text.splitlines():
        segment = raw_line.split("\r")[-1]
        clean = ANSI_ESCAPE_RE.sub("", segment).strip()
        if not clean or clean.startswith("Fetching") or clean.startswith("Usage:"):
            continue
        match = re.match(r"^([a-zA-Z0-9][a-zA-Z0-9._:-]{2,127})(?:\s+(.+))?$", clean)
        if not match:
            continue
        model_id = match.group(1).strip()
        display_name = (match.group(2) or model_id).strip()
        # Filter out obvious banner words
        if model_id.lower() in ("model", "models", "available", "name", "id", "error"):
            continue
        if model_id not in seen:
            seen.add(model_id)
            models.append(_build_model_entry(model_id, display_name=display_name, created=now_ts))
    return models


def sanitize_stderr(text: str, max_len: int = 360) -> str:
    clean = ANSI_ESCAPE_RE.sub("", text or "").strip()
    if not clean:
        return "Upstream agy process exited with a non-zero status."
    # Redact home directory paths if present
    home_str = str(Path.home())
    if home_str and home_str != "/":
        clean = clean.replace(home_str, "~")
    lines = [ln.strip() for ln in clean.splitlines() if ln.strip()]
    joined = " | ".join(lines[-4:])
    if len(joined) > max_len:
        joined = joined[-max_len:]
    return joined


async def terminate_process_safely(proc: Optional[asyncio.subprocess.Process], grace_seconds: float = 1.5) -> None:
    """Guarantee child subprocess termination without leaving orphans."""
    if proc is None or proc.returncode is not None:
        return
    try:
        proc.terminate()
    except ProcessLookupError:
        return
    except Exception:
        pass
    try:
        await asyncio.wait_for(proc.wait(), timeout=grace_seconds)
        return
    except (asyncio.TimeoutError, asyncio.CancelledError):
        pass
    except Exception:
        pass
    if proc.returncode is None:
        try:
            proc.kill()
        except ProcessLookupError:
            return
        except Exception:
            pass
        try:
            await asyncio.wait_for(proc.wait(), timeout=2.0)
        except Exception:
            pass


def _extract_content_text(content: Any) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: List[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict):
                if item.get("type") == "text" and item.get("text") is not None:
                    parts.append(str(item.get("text", "")))
                elif "text" in item and item.get("text") is not None:
                    parts.append(str(item["text"]))
                elif "content" in item and item.get("content") is not None:
                    parts.append(str(item["content"]))
        return "\n".join(parts)
    return str(content)


class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="allow")

    role: Literal["system", "developer", "user", "assistant", "tool", "function"]
    content: Optional[Union[str, List[Union[str, Dict[str, Any]]]]] = None
    name: Optional[str] = None
    tool_call_id: Optional[str] = None

    @field_validator("role", mode="before")
    @classmethod
    def _normalize_role(cls, value: Any) -> Any:
        if not isinstance(value, str):
            raise ValueError("role must be a string")
        return value.strip().lower()


class StreamOptions(BaseModel):
    model_config = ConfigDict(extra="allow")
    include_usage: bool = False


class ChatCompletionRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    model: str = Field(default=DEFAULT_MODEL, min_length=1, max_length=128)
    messages: List[ChatMessage] = Field(..., min_length=1)
    stream: bool = False
    stream_options: Optional[StreamOptions] = None
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1)
    top_p: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class ApiShowRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    name: Optional[str] = Field(default=None, max_length=128)
    model: Optional[str] = Field(default=None, max_length=128)


def format_messages_to_prompt(messages: List[Union[ChatMessage, Dict[str, Any]]]) -> str:
    """Format all OpenAI message roles cleanly while normalizing null content to ''."""
    lines: List[str] = []
    for msg in messages:
        if isinstance(msg, ChatMessage):
            role = msg.role.lower()
            text = _extract_content_text(msg.content)
            name = msg.name
            tool_call_id = msg.tool_call_id
        else:
            role = str(msg.get("role", "user")).strip().lower()
            text = _extract_content_text(msg.get("content"))
            name = msg.get("name")
            tool_call_id = msg.get("tool_call_id")

        if role in ("system", "developer"):
            lines.append(f"[System Instructions]:\n{text}\n")
        elif role == "user":
            lines.append(f"[User]:\n{text}\n")
        elif role == "assistant":
            lines.append(f"[Assistant]:\n{text}\n")
        elif role in ("tool", "function"):
            label = name or tool_call_id or role
            lines.append(f"[Tool Result ({label})]:\n{text}\n")
        else:
            lines.append(f"[{role.title()}]:\n{text}\n")
    return "\n".join(lines).strip()


def extract_usage(result_obj: Optional[Dict[str, Any]], prompt: str, completion_text: str) -> Dict[str, int]:
    """Extract real token usage from agy result JSON when present; fallback cleanly."""
    if isinstance(result_obj, dict):
        usage_src = None
        for key in ("usage", "token_usage", "stats"):
            if isinstance(result_obj.get(key), dict):
                usage_src = result_obj[key]
                break
        if usage_src:
            prompt_tok = usage_src.get("prompt_tokens", usage_src.get("input_tokens"))
            comp_tok = usage_src.get("completion_tokens", usage_src.get("output_tokens"))
            total_tok = usage_src.get("total_tokens")
            if isinstance(prompt_tok, int) and isinstance(comp_tok, int):
                total = total_tok if isinstance(total_tok, int) else (prompt_tok + comp_tok)
                return {
                    "prompt_tokens": max(0, prompt_tok),
                    "completion_tokens": max(0, comp_tok),
                    "total_tokens": max(0, total),
                }

    est_prompt = max(1, len(prompt) // 4) if prompt else 0
    est_comp = max(1, len(completion_text) // 4) if completion_text else 0
    return {
        "prompt_tokens": est_prompt,
        "completion_tokens": est_comp,
        "total_tokens": est_prompt + est_comp,
    }


class ProxyRuntime:
    """Mutable runtime state, model catalog cache, metrics, and concurrency governance."""

    def __init__(self, max_concurrency: Optional[int] = None) -> None:
        self.started_at = time.monotonic()
        self.started_epoch = int(time.time())
        self.max_concurrency = max_concurrency if max_concurrency is not None else get_max_concurrency()
        self._semaphore: Optional[asyncio.Semaphore] = None
        self._semaphore_loop: Optional[asyncio.AbstractEventLoop] = None
        self._catalog_lock: Optional[asyncio.Lock] = None
        self._catalog_lock_loop: Optional[asyncio.AbstractEventLoop] = None

        self.active_requests = 0
        self.total_requests = 0
        self.total_completions = 0
        self.total_errors = 0

        self._cached_models: List[Dict[str, Any]] = list(FALLBACK_MODELS)
        self._models_cached_at: float = 0.0
        self._models_source: str = "fallback"
        self._cached_agy_version: Optional[str] = None
        self._version_cached_at: float = 0.0

    def get_semaphore(self) -> asyncio.Semaphore:
        loop = asyncio.get_running_loop()
        if self._semaphore is None or self._semaphore_loop is not loop:
            self._semaphore = asyncio.Semaphore(self.max_concurrency)
            self._semaphore_loop = loop
        return self._semaphore

    def get_catalog_lock(self) -> asyncio.Lock:
        loop = asyncio.get_running_loop()
        if self._catalog_lock is None or self._catalog_lock_loop is not loop:
            self._catalog_lock = asyncio.Lock()
            self._catalog_lock_loop = loop
        return self._catalog_lock

    def invalidate_cache(self) -> None:
        self._models_cached_at = 0.0
        self._version_cached_at = 0.0

    def uptime_seconds(self) -> float:
        return round(max(0.0, time.monotonic() - self.started_at), 2)

    async def get_agy_version(self) -> Optional[str]:
        now = time.monotonic()
        if self._cached_agy_version is not None and (now - self._version_cached_at) < 300.0:
            return self._cached_agy_version
        agy_bin = resolve_agy_bin()
        if not agy_bin:
            self._cached_agy_version = None
            return None
        proc = None
        try:
            proc = await asyncio.create_subprocess_exec(
                agy_bin,
                "--version",
                stdin=asyncio.subprocess.DEVNULL,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=5.0)
            if proc.returncode == 0:
                text = ANSI_ESCAPE_RE.sub("", stdout.decode("utf-8", errors="replace")).strip()
                first_line = text.splitlines()[0].strip() if text else ""
                if first_line:
                    self._cached_agy_version = first_line[:64]
                    self._version_cached_at = now
                    return self._cached_agy_version
        except Exception:
            await terminate_process_safely(proc, grace_seconds=0.5)
        finally:
            await terminate_process_safely(proc, grace_seconds=0.5)
        return self._cached_agy_version

    async def get_models(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        ttl = get_model_cache_ttl()
        now = time.monotonic()
        if not force_refresh and self._models_cached_at > 0 and (now - self._models_cached_at) < ttl:
            return list(self._cached_models)

        async with self.get_catalog_lock():
            now = time.monotonic()
            if not force_refresh and self._models_cached_at > 0 and (now - self._models_cached_at) < ttl:
                return list(self._cached_models)

            agy_bin = resolve_agy_bin()
            if agy_bin:
                proc = None
                try:
                    proc = await asyncio.create_subprocess_exec(
                        agy_bin,
                        "models",
                        stdin=asyncio.subprocess.DEVNULL,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                        limit=1024 * 1024,
                    )
                    stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=12.0)
                    if proc.returncode == 0:
                        parsed = parse_agy_models_output(stdout.decode("utf-8", errors="replace"))
                        if parsed:
                            self._cached_models = parsed
                            self._models_cached_at = time.monotonic()
                            self._models_source = "live"
                            return list(self._cached_models)
                except Exception:
                    await terminate_process_safely(proc, grace_seconds=0.5)
                finally:
                    await terminate_process_safely(proc, grace_seconds=0.5)

            self._cached_models = list(FALLBACK_MODELS)
            # Retry fallback sooner (30s) unless TTL is smaller
            self._models_cached_at = time.monotonic() - max(0.0, ttl - min(ttl, 30.0))
            self._models_source = "fallback"
            return list(self._cached_models)


class LoopbackSecurityMiddleware:
    """Pure ASGI middleware enforcing Host allowlist, strict loopback CORS, optional Bearer auth, and MAX_BODY_BYTES."""

    AUTH_EXEMPT_PATHS = frozenset({"/", "/docs", "/health", "/version", "/openapi.json"})

    def __init__(self, app: ASGIApp, runtime: ProxyRuntime) -> None:
        self.app = app
        self.runtime = runtime

    async def _send_json(
        self,
        send: Send,
        status_code: int,
        payload: Dict[str, Any],
        extra_headers: Optional[List[Tuple[bytes, bytes]]] = None,
    ) -> None:
        body = json.dumps(payload).encode("utf-8")
        headers: List[Tuple[bytes, bytes]] = [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(body)).encode("ascii")),
            (b"vary", b"Origin"),
            (b"x-content-type-options", b"nosniff"),
            (b"x-frame-options", b"SAMEORIGIN"),
            (b"referrer-policy", b"strict-origin-when-cross-origin"),
        ]
        if extra_headers:
            headers.extend(extra_headers)
        await send({"type": "http.response.start", "status": status_code, "headers": headers})
        await send({"type": "http.response.body", "body": body})

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        self.runtime.total_requests += 1
        raw_headers = {k.lower(): v.decode("latin-1") for k, v in scope.get("headers", [])}
        method = scope.get("method", "GET").upper()
        path = scope.get("path", "/")

        # 1. Strict loopback Host allowlist (blocks DNS rebinding on every route)
        host_header = raw_headers.get(b"host", "")
        if not is_allowed_host(host_header):
            self.runtime.total_errors += 1
            await self._send_json(
                send,
                403,
                openai_error_payload(
                    f"Untrusted Host header '{host_header}' blocked. Loopback hosts only.",
                    error_type="security_error",
                    code="invalid_host",
                ),
            )
            return

        # 2. Strict loopback Origin enforcement & CORS
        origin = raw_headers.get(b"origin", "").strip()
        allowed_origin: Optional[str] = None
        if origin:
            if not is_allowed_loopback_origin(origin):
                self.runtime.total_errors += 1
                await self._send_json(
                    send,
                    403,
                    openai_error_payload(
                        f"Cross-origin request from untrusted Origin '{origin}' blocked.",
                        error_type="security_error",
                        code="origin_not_allowed",
                    ),
                )
                return
            allowed_origin = origin

        if method == "OPTIONS":
            preflight_headers: List[Tuple[bytes, bytes]] = [
                (b"access-control-allow-methods", b"GET, POST, HEAD, OPTIONS"),
                (b"access-control-allow-headers", b"Content-Type, Authorization, X-Requested-With"),
                (b"access-control-max-age", b"600"),
                (b"vary", b"Origin"),
                (b"x-content-type-options", b"nosniff"),
            ]
            if allowed_origin:
                preflight_headers.append((b"access-control-allow-origin", allowed_origin.encode("latin-1")))
            await send({"type": "http.response.start", "status": 200, "headers": preflight_headers})
            await send({"type": "http.response.body", "body": b""})
            return

        # 3. Optional opt-in bearer token auth (AGY_PROXY_TOKEN)
        expected_token = os.environ.get("AGY_PROXY_TOKEN", "").strip()
        if expected_token and path not in self.AUTH_EXEMPT_PATHS:
            auth_header = raw_headers.get(b"authorization", "").strip()
            provided_token = ""
            if auth_header.lower().startswith("bearer "):
                provided_token = auth_header[7:].strip()
            if not provided_token or not hmac.compare_digest(provided_token, expected_token):
                self.runtime.total_errors += 1
                extra = [(b"www-authenticate", b"Bearer")]
                if allowed_origin:
                    extra.append((b"access-control-allow-origin", allowed_origin.encode("latin-1")))
                await self._send_json(
                    send,
                    401,
                    openai_error_payload(
                        "Missing or invalid Bearer token. Set Authorization: Bearer <AGY_PROXY_TOKEN>.",
                        error_type="authentication_error",
                        code="invalid_api_key",
                    ),
                    extra_headers=extra,
                )
                return

        # 4. Enforce MAX_BODY_BYTES before body parsing on write methods
        body_replay_receive = receive
        if method in ("POST", "PUT", "PATCH"):
            max_bytes = get_max_body_bytes()
            cl_header = raw_headers.get(b"content-length", "").strip()
            if cl_header:
                try:
                    if int(cl_header) > max_bytes:
                        self.runtime.total_errors += 1
                        extra = (
                            [(b"access-control-allow-origin", allowed_origin.encode("latin-1"))]
                            if allowed_origin
                            else None
                        )
                        await self._send_json(
                            send,
                            413,
                            openai_error_payload(
                                f"Request body exceeds maximum allowed size of {max_bytes} bytes.",
                                error_type="invalid_request_error",
                                code="payload_too_large",
                            ),
                            extra_headers=extra,
                        )
                        return
                except ValueError:
                    pass

            chunks: List[bytes] = []
            total_bytes = 0
            more_body = True
            disconnected = False
            while more_body:
                message = await receive()
                msg_type = message.get("type")
                if msg_type == "http.disconnect":
                    disconnected = True
                    break
                if msg_type == "http.request":
                    chunk = message.get("body", b"")
                    total_bytes += len(chunk)
                    if total_bytes > max_bytes:
                        self.runtime.total_errors += 1
                        extra = (
                            [(b"access-control-allow-origin", allowed_origin.encode("latin-1"))]
                            if allowed_origin
                            else None
                        )
                        await self._send_json(
                            send,
                            413,
                            openai_error_payload(
                                f"Request body exceeds maximum allowed size of {max_bytes} bytes.",
                                error_type="invalid_request_error",
                                code="payload_too_large",
                            ),
                            extra_headers=extra,
                        )
                        return
                    chunks.append(chunk)
                    more_body = bool(message.get("more_body", False))

            full_body = b"".join(chunks)
            delivered = False

            async def _replay_receive() -> Message:
                nonlocal delivered
                if not delivered:
                    delivered = True
                    if disconnected:
                        return {"type": "http.disconnect"}
                    return {"type": "http.request", "body": full_body, "more_body": False}
                # Delegate subsequent calls (e.g. req.is_disconnected()) directly to upstream ASGI receive!
                return await receive()

            body_replay_receive = _replay_receive

        # 5. Inject Vary: Origin, security headers, and loopback ACAO (never ACAC)
        async def _send_with_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers_list = list(message.get("headers", []))
                existing_keys = {k.lower() for k, _ in headers_list}
                # Guarantee Vary: Origin
                if b"vary" not in existing_keys:
                    headers_list.append((b"vary", b"Origin"))
                else:
                    updated = []
                    for k, v in headers_list:
                        if k.lower() == b"vary" and b"origin" not in v.lower():
                            updated.append((k, v + b", Origin"))
                        else:
                            updated.append((k, v))
                    headers_list = updated
                if allowed_origin and b"access-control-allow-origin" not in existing_keys:
                    headers_list.append((b"access-control-allow-origin", allowed_origin.encode("latin-1")))
                # Never emit Access-Control-Allow-Credentials
                headers_list = [(k, v) for k, v in headers_list if k.lower() != b"access-control-allow-credentials"]
                if b"x-content-type-options" not in existing_keys:
                    headers_list.append((b"x-content-type-options", b"nosniff"))
                if b"x-frame-options" not in existing_keys:
                    headers_list.append((b"x-frame-options", b"SAMEORIGIN"))
                if b"referrer-policy" not in existing_keys:
                    headers_list.append((b"referrer-policy", b"strict-origin-when-cross-origin"))
                message = {**message, "headers": headers_list}
            await send(message)

        await self.app(scope, body_replay_receive, _send_with_headers)


def create_app(max_concurrency: Optional[int] = None) -> FastAPI:
    runtime = ProxyRuntime(max_concurrency=max_concurrency)

    application = FastAPI(
        title="AGY-Hermes OpenAI Bridge",
        version=__version__,
        description="Hardened loopback OpenAI-compatible bridge to the Antigravity CLI (`agy`) runtime.",
        docs_url=None,
        redoc_url=None,
    )
    application.state.runtime = runtime
    application.add_middleware(LoopbackSecurityMiddleware, runtime=runtime)

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        runtime.total_errors += 1
        errors = exc.errors()
        first = errors[0] if errors else {}
        err_type = str(first.get("type", ""))
        loc = first.get("loc", ())
        param = ".".join(str(p) for p in loc if p != "body") or None
        msg = str(first.get("msg", "Invalid request payload."))
        if err_type == "json_invalid":
            return openai_error_response(
                400,
                f"Malformed JSON body: {msg}",
                error_type="invalid_request_error",
                param=param,
                code="invalid_json",
            )
        return openai_error_response(
            422,
            f"Validation error{f' ({param})' if param else ''}: {msg}",
            error_type="invalid_request_error",
            param=param,
            code="validation_error",
        )

    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        if exc.status_code >= 400:
            runtime.total_errors += 1
        detail = exc.detail if isinstance(exc.detail, str) else "HTTP error"
        code_map = {
            400: "bad_request",
            401: "invalid_api_key",
            403: "forbidden",
            404: "not_found",
            405: "method_not_allowed",
            413: "payload_too_large",
            429: "rate_limit_error",
            502: "upstream_error",
            504: "gateway_timeout",
        }
        return openai_error_response(
            exc.status_code,
            detail,
            error_type="invalid_request_error" if exc.status_code < 500 else "server_error",
            code=code_map.get(exc.status_code, f"http_{exc.status_code}"),
            headers=dict(exc.headers) if exc.headers else None,
        )

    @application.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        runtime.total_errors += 1
        return openai_error_response(
            500,
            f"Internal proxy error: {type(exc).__name__}",
            error_type="server_error",
            code="internal_error",
        )

    @application.get("/", tags=["Operator"], include_in_schema=False)
    async def root_cockpit(request: Request) -> Response:
        accept = request.headers.get("accept", "").lower()
        models = await runtime.get_models()
        agy_bin = resolve_agy_bin()
        agy_version = await runtime.get_agy_version()
        if "application/json" in accept and "text/html" not in accept:
            return JSONResponse(
                {
                    "name": "AGY-Hermes OpenAI Bridge",
                    "version": __version__,
                    "status": "ok",
                    "agy_available": bool(agy_bin),
                    "agy_version": agy_version,
                    "models_count": len(models),
                    "active_requests": runtime.active_requests,
                    "max_concurrency": runtime.max_concurrency,
                    "uptime_seconds": runtime.uptime_seconds(),
                    "endpoints": {
                        "health": "/health",
                        "version": "/version",
                        "metrics": "/metrics",
                        "models": "/v1/models",
                        "chat_completions": "/v1/chat/completions",
                        "docs": "/docs",
                        "openapi": "/openapi.json",
                    },
                }
            )
        host_bind = request.headers.get("host", "127.0.0.1:18000")
        html = render_cockpit_html(
            version=__version__,
            host_bind=host_bind,
            agy_available=bool(agy_bin),
            agy_version=agy_version or "detected" if agy_bin else "unavailable",
            models=models,
            active_requests=runtime.active_requests,
            max_concurrency=runtime.max_concurrency,
            total_requests=runtime.total_requests,
            uptime_seconds=runtime.uptime_seconds(),
        )
        return HTMLResponse(content=html, status_code=200)

    @application.get("/docs", tags=["Operator"], include_in_schema=False)
    async def offline_docs(request: Request) -> HTMLResponse:
        host_bind = request.headers.get("host", "127.0.0.1:18000")
        return HTMLResponse(content=render_offline_docs_html(version=__version__, host_bind=host_bind), status_code=200)

    @application.get("/health", tags=["System"])
    async def health() -> Dict[str, Any]:
        models = await runtime.get_models()
        agy_bin = resolve_agy_bin()
        agy_version = await runtime.get_agy_version()
        return {
            "status": "ok",
            "version": __version__,
            "agy_available": bool(agy_bin),
            "agy_version": agy_version,
            "models_count": len(models),
            "models_source": runtime._models_source,
            "active_requests": runtime.active_requests,
            "max_concurrency": runtime.max_concurrency,
            "uptime_seconds": runtime.uptime_seconds(),
        }

    @application.head("/health", tags=["System"])
    async def health_head() -> Response:
        return Response(status_code=200, headers={"X-Proxy-Version": __version__})

    @application.get("/version", tags=["System"])
    async def version() -> Dict[str, str]:
        return {"version": __version__}

    @application.get("/metrics", tags=["System"])
    async def metrics() -> Dict[str, Any]:
        models = await runtime.get_models()
        return {
            "version": __version__,
            "uptime_seconds": runtime.uptime_seconds(),
            "total_requests": runtime.total_requests,
            "total_completions": runtime.total_completions,
            "total_errors": runtime.total_errors,
            "active_concurrency": runtime.active_requests,
            "max_concurrency": runtime.max_concurrency,
            "cached_models_count": len(models),
            "models_source": runtime._models_source,
            "agy_available": bool(resolve_agy_bin()),
            "auth_enabled": bool(os.environ.get("AGY_PROXY_TOKEN", "").strip()),
            "max_body_bytes": get_max_body_bytes(),
            "timeout_seconds": get_exec_timeout(),
        }

    @application.get("/v1/models", tags=["Models"])
    @application.get("/models", tags=["Models"])
    @application.get("/api/v1/models", tags=["Models"])
    async def list_models() -> Dict[str, Any]:
        models = await runtime.get_models()
        return {"object": "list", "data": models}

    @application.get("/v1/models/{model_id:path}", tags=["Models"])
    @application.get("/models/{model_id:path}", tags=["Models"])
    @application.get("/api/v1/models/{model_id:path}", tags=["Models"])
    async def get_model(model_id: str) -> Response:
        models = await runtime.get_models()
        for m in models:
            if m["id"] == model_id:
                return JSONResponse(status_code=200, content=m)
        runtime.total_errors += 1
        return openai_error_response(
            404,
            f"The model '{model_id}' does not exist.",
            error_type="invalid_request_error",
            param="model",
            code="model_not_found",
        )

    @application.get("/api/tags", tags=["Ollama Compatibility"])
    async def list_tags() -> Dict[str, Any]:
        models = await runtime.get_models()
        modified_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(runtime.started_epoch))
        return {
            "models": [
                {
                    "name": m["id"],
                    "model": m["id"],
                    "modified_at": modified_iso,
                    "size": 0,
                    "details": {"family": m["owned_by"]},
                }
                for m in models
            ]
        }

    @application.post("/api/show", tags=["Ollama Compatibility"])
    async def api_show(payload: ApiShowRequest) -> Dict[str, Any]:
        target = payload.name or payload.model or DEFAULT_MODEL
        return {
            "license": "MIT",
            "modelfile": f"FROM agy:{target}",
            "parameters": "",
            "template": "",
            "details": {"model": target, "bridge_version": __version__},
        }

    @application.post("/v1/chat/completions", tags=["Chat Completions"])
    @application.post("/chat/completions", tags=["Chat Completions"])
    async def chat_completions(body: ChatCompletionRequest, request: Request) -> Response:
        models = await runtime.get_models()
        valid_ids = {m["id"] for m in models}
        if body.model not in valid_ids:
            runtime.total_errors += 1
            return openai_error_response(
                404,
                f"The model '{body.model}' does not exist in the active AGY catalog ({len(models)} models available).",
                error_type="invalid_request_error",
                param="model",
                code="model_not_found",
            )

        agy_bin = resolve_agy_bin()
        if not agy_bin:
            runtime.total_errors += 1
            return openai_error_response(
                502,
                "Antigravity CLI (`agy`) binary was not found on PATH or AGY_BIN.",
                error_type="server_error",
                code="agy_binary_missing",
            )

        prompt = format_messages_to_prompt(body.messages)
        created_ts = int(time.time())
        completion_id = f"chatcmpl-agy-{uuid.uuid4().hex[:16]}"
        exec_timeout = get_exec_timeout()

        cmd = [
            agy_bin,
            "--input-format",
            "stream-json",
            "--output-format",
            "stream-json",
            "--sandbox",
            "--model",
            body.model,
        ]
        if os.environ.get("AGY_PROXY_PASS_PRINT_TIMEOUT", "1") != "0":
            cmd.extend(["--print-timeout", f"{int(max(1, math.ceil(exec_timeout)))}s"])
        cmd.append("-p=")

        stdin_payload = (
            json.dumps(
                {
                    "event": "user",
                    "message": {
                        "content": [{"type": "text", "text": prompt}],
                    },
                }
            )
            + "\n"
        ).encode("utf-8")

        semaphore = runtime.get_semaphore()
        acquire_timeout = get_acquire_timeout()
        try:
            await asyncio.wait_for(semaphore.acquire(), timeout=acquire_timeout)
        except asyncio.TimeoutError:
            runtime.total_errors += 1
            return openai_error_response(
                429,
                f"Concurrency limit reached ({runtime.max_concurrency} active turns). Retry shortly.",
                error_type="rate_limit_error",
                code="concurrency_limit_exceeded",
                headers={"Retry-After": "1"},
            )

        runtime.active_requests += 1
        runtime.total_completions += 1

        if body.stream:
            include_usage = bool(body.stream_options and body.stream_options.include_usage)

            async def event_generator():
                proc: Optional[asyncio.subprocess.Process] = None
                accumulated_text = ""
                final_result_obj: Optional[Dict[str, Any]] = None
                finished_cleanly = False
                deadline = time.monotonic() + exec_timeout
                read_task: Optional[asyncio.Task] = None

                try:
                    # Emit OpenAI-compliant initial role chunk
                    role_chunk = {
                        "id": completion_id,
                        "object": "chat.completion.chunk",
                        "created": created_ts,
                        "model": body.model,
                        "choices": [
                            {
                                "index": 0,
                                "delta": {"role": "assistant", "content": ""},
                                "finish_reason": None,
                            }
                        ],
                    }
                    yield f"data: {json.dumps(role_chunk)}\n\n"

                    proc = await asyncio.create_subprocess_exec(
                        *cmd,
                        stdin=asyncio.subprocess.PIPE,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                        limit=STREAM_BUFFER_LIMIT,
                    )
                    assert proc.stdin is not None and proc.stdout is not None and proc.stderr is not None

                    proc.stdin.write(stdin_payload)
                    await proc.stdin.drain()
                    proc.stdin.close()

                    while True:
                        if read_task is None:
                            read_task = asyncio.create_task(proc.stdout.readline())

                        remaining = deadline - time.monotonic()
                        if remaining <= 0:
                            read_task.cancel()
                            try:
                                await read_task
                            except BaseException:
                                pass
                            runtime.total_errors += 1
                            await terminate_process_safely(proc)
                            err_evt = {
                                "id": completion_id,
                                "object": "chat.completion.chunk",
                                "created": created_ts,
                                "model": body.model,
                                "error": openai_error_payload(
                                    f"Upstream agy turn exceeded timeout of {exec_timeout:.1f}s.",
                                    error_type="timeout_error",
                                    code="gateway_timeout",
                                )["error"],
                                "choices": [
                                    {
                                        "index": 0,
                                        "delta": {},
                                        "finish_reason": "error",
                                    }
                                ],
                            }
                            yield f"data: {json.dumps(err_evt)}\n\n"
                            yield "data: [DONE]\n\n"
                            return

                        done, _ = await asyncio.wait({read_task}, timeout=min(0.2, remaining))
                        if not done:
                            if await request.is_disconnected():
                                read_task.cancel()
                                try:
                                    await read_task
                                except BaseException:
                                    pass
                                await terminate_process_safely(proc)
                                return
                            continue

                        line = read_task.result()
                        read_task = None
                        if not line:
                            break

                        line_str = line.decode("utf-8", errors="replace").strip()
                        if not line_str:
                            continue
                        try:
                            ev = json.loads(line_str)
                        except json.JSONDecodeError:
                            continue

                        ev_type = ev.get("event")
                        if ev_type == "step_update":
                            su = ev.get("step_update") or {}
                            delta_text = su.get("text_delta", "")
                            if delta_text:
                                accumulated_text += delta_text
                                chunk = {
                                    "id": completion_id,
                                    "object": "chat.completion.chunk",
                                    "created": created_ts,
                                    "model": body.model,
                                    "choices": [
                                        {
                                            "index": 0,
                                            "delta": {"content": delta_text},
                                            "finish_reason": None,
                                        }
                                    ],
                                }
                                yield f"data: {json.dumps(chunk)}\n\n"
                        elif ev_type == "result":
                            res_obj = ev.get("result") or {}
                            final_result_obj = res_obj
                            if not accumulated_text and isinstance(res_obj.get("response"), str) and res_obj["response"]:
                                accumulated_text = res_obj["response"]
                                chunk = {
                                    "id": completion_id,
                                    "object": "chat.completion.chunk",
                                    "created": created_ts,
                                    "model": body.model,
                                    "choices": [
                                        {
                                            "index": 0,
                                            "delta": {"content": accumulated_text},
                                            "finish_reason": None,
                                        }
                                    ],
                                }
                                yield f"data: {json.dumps(chunk)}\n\n"
                            done_chunk = {
                                "id": completion_id,
                                "object": "chat.completion.chunk",
                                "created": created_ts,
                                "model": body.model,
                                "choices": [
                                    {
                                        "index": 0,
                                        "delta": {},
                                        "finish_reason": "stop",
                                    }
                                ],
                            }
                            yield f"data: {json.dumps(done_chunk)}\n\n"
                            finished_cleanly = True

                    rem_wait = max(0.5, deadline - time.monotonic())
                    stderr_bytes = await asyncio.wait_for(proc.stderr.read(), timeout=rem_wait)
                    rc = await asyncio.wait_for(proc.wait(), timeout=rem_wait)

                    if rc != 0:
                        runtime.total_errors += 1
                        err_msg = sanitize_stderr(stderr_bytes.decode("utf-8", errors="replace"))
                        err_evt = {
                            "id": completion_id,
                            "object": "chat.completion.chunk",
                            "created": created_ts,
                            "model": body.model,
                            "error": openai_error_payload(
                                f"Upstream agy exited with code {rc}: {err_msg}",
                                error_type="server_error",
                                code="upstream_error",
                            )["error"],
                            "choices": [
                                {
                                    "index": 0,
                                    "delta": {},
                                    "finish_reason": "error",
                                }
                            ],
                        }
                        yield f"data: {json.dumps(err_evt)}\n\n"
                        yield "data: [DONE]\n\n"
                        return

                    if not finished_cleanly:
                        done_chunk = {
                            "id": completion_id,
                            "object": "chat.completion.chunk",
                            "created": created_ts,
                            "model": body.model,
                            "choices": [
                                {
                                    "index": 0,
                                    "delta": {},
                                    "finish_reason": "stop",
                                }
                            ],
                        }
                        yield f"data: {json.dumps(done_chunk)}\n\n"

                    if include_usage:
                        usage_chunk = {
                            "id": completion_id,
                            "object": "chat.completion.chunk",
                            "created": created_ts,
                            "model": body.model,
                            "choices": [],
                            "usage": extract_usage(final_result_obj, prompt, accumulated_text),
                        }
                        yield f"data: {json.dumps(usage_chunk)}\n\n"

                    yield "data: [DONE]\n\n"

                except asyncio.CancelledError:
                    await terminate_process_safely(proc)
                    raise
                except Exception as exc:
                    runtime.total_errors += 1
                    await terminate_process_safely(proc)
                    err_evt = {
                        "id": completion_id,
                        "object": "chat.completion.chunk",
                        "created": created_ts,
                        "model": body.model,
                        "error": openai_error_payload(
                            f"AGY bridge streaming failure: {type(exc).__name__}: {exc}",
                            error_type="server_error",
                            code="stream_error",
                        )["error"],
                        "choices": [
                            {
                                "index": 0,
                                "delta": {},
                                "finish_reason": "error",
                            }
                        ],
                    }
                    yield f"data: {json.dumps(err_evt)}\n\n"
                    yield "data: [DONE]\n\n"
                finally:
                    if read_task is not None and not read_task.done():
                        read_task.cancel()
                        try:
                            await read_task
                        except BaseException:
                            pass
                    await terminate_process_safely(proc)
                    runtime.active_requests = max(0, runtime.active_requests - 1)
                    semaphore.release()

            return StreamingResponse(
                event_generator(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
            )

        # Non-streaming execution path
        proc: Optional[asyncio.subprocess.Process] = None
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                limit=STREAM_BUFFER_LIMIT,
            )
            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    proc.communicate(stdin_payload),
                    timeout=exec_timeout,
                )
            except asyncio.TimeoutError:
                runtime.total_errors += 1
                await terminate_process_safely(proc)
                return openai_error_response(
                    504,
                    f"Upstream agy turn exceeded timeout of {exec_timeout:.1f}s.",
                    error_type="timeout_error",
                    code="gateway_timeout",
                )

            if proc.returncode != 0:
                runtime.total_errors += 1
                err_msg = sanitize_stderr(stderr_bytes.decode("utf-8", errors="replace"))
                return openai_error_response(
                    502,
                    f"Upstream agy exited with code {proc.returncode}: {err_msg}",
                    error_type="server_error",
                    code="upstream_error",
                )

            full_text = ""
            final_result_obj: Optional[Dict[str, Any]] = None
            for line in stdout_bytes.decode("utf-8", errors="replace").splitlines():
                stripped = line.strip()
                if not stripped:
                    continue
                try:
                    ev = json.loads(stripped)
                except json.JSONDecodeError:
                    continue
                if ev.get("event") == "step_update":
                    full_text += (ev.get("step_update") or {}).get("text_delta", "")
                elif ev.get("event") == "result":
                    res_obj = ev.get("result") or {}
                    final_result_obj = res_obj
                    if isinstance(res_obj.get("response"), str) and res_obj["response"]:
                        full_text = res_obj["response"]

            final_text = full_text.strip()
            return JSONResponse(
                status_code=200,
                content={
                    "id": completion_id,
                    "object": "chat.completion",
                    "created": created_ts,
                    "model": body.model,
                    "choices": [
                        {
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": final_text,
                            },
                            "finish_reason": "stop",
                        }
                    ],
                    "usage": extract_usage(final_result_obj, prompt, final_text),
                },
            )
        except asyncio.CancelledError:
            await terminate_process_safely(proc)
            raise
        finally:
            await terminate_process_safely(proc)
            runtime.active_requests = max(0, runtime.active_requests - 1)
            semaphore.release()

    return application


app = create_app()
