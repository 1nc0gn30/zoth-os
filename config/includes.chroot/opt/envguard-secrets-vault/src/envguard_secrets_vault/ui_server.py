"""EnvGuard Secrets Vault - Hardened Loopback Studio UI Server & REST API.

Zero-dependency HTTP server delivering the EnvGuard Secrets Studio and
loopback-hardened REST APIs for live secret auditing, masking, example generation,
PBKDF2 + AES-256-CTR-HMAC-SHA256 vault encryption/decryption, environment diffing,
GF(256) Shamir secret sharing, TTL rotation sentinel, MCP client configurations,
and hardened ZIP bundle exporting.
"""

from __future__ import annotations

import datetime
import io
import json
import urllib.parse
import zipfile
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Optional

from envguard_secrets_vault.mcp_server import (
    PBKDF2_ITERATIONS,
    SERVER_VERSION,
    diff_environments,
    generate_env_example,
    generate_mcp_client_config,
    get_diagnostics,
    mask_env_content,
    scan_secrets,
    validate_kdf_iterations,
    vault_decrypt,
    vault_encrypt,
)

MAX_BODY_BYTES = 1_048_576  # 1 MiB strict request body limit
LOOPBACK_HOSTS = frozenset({"127.0.0.1", "localhost", "::1"})
ALLOWED_EXTRA_CORS_PORTS = frozenset({3000})

CONTENT_SECURITY_POLICY = (
    "default-src 'self'; "
    "script-src 'self' 'unsafe-inline'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; "
    "font-src 'self' data:; "
    "connect-src 'self' http://127.0.0.1:* http://localhost:*; "
    "frame-ancestors 'self' http://127.0.0.1:* http://localhost:*; "
    "base-uri 'self'; "
    "form-action 'self'"
)

# Zero-CDN, XSS-safe fallback Studio HTML (used only if public/index.html is absent)
BUILTIN_STUDIO_HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EnvGuard Secrets Vault v{SERVER_VERSION} — Fallback Studio</title>
  <style>
    :root {{ --bg:#F6F3EC; --card:#FFFFFF; --ink:#1A1712; --muted:#4A453B; --accent:#8C6A1D; --border:#DDD5C5; }}
    @media (prefers-color-scheme: dark) {{
      :root {{ --bg:#0B0D12; --card:#131722; --ink:#F4EFE6; --muted:#B9B2A6; --accent:#E8C46A; --border:#262C3D; }}
    }}
    body {{ margin:0; font-family:system-ui,-apple-system,sans-serif; background:var(--bg); color:var(--ink); padding:24px; }}
    .wrap {{ max-width:960px; margin:0 auto; }}
    .card {{ background:var(--card); border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:16px; }}
    textarea {{ width:100%; min-height:160px; font-family:ui-monospace,monospace; padding:12px; background:var(--bg); color:var(--ink); border:1px solid var(--border); border-radius:8px; }}
    button {{ min-height:44px; padding:10px 18px; border-radius:8px; border:1px solid var(--accent); background:var(--accent); color:#0B0D12; font-weight:700; cursor:pointer; }}
    pre {{ white-space:pre-wrap; word-break:break-word; font-family:ui-monospace,monospace; font-size:13px; }}
  </style>
</head>
<body>
  <main class="wrap">
    <div class="card">
      <h1>EnvGuard Secrets Vault v{SERVER_VERSION}</h1>
      <p>Hardened loopback REST API active. PBKDF2-HMAC-SHA256 (600k) + AES-256-CTR + HMAC-SHA256.</p>
    </div>
    <div class="card">
      <label for="env-in"><strong>Paste .env content to scan locally</strong></label>
      <textarea id="env-in" aria-label="Paste .env content to scan">PORT=8088&#10;NODE_ENV=production</textarea>
      <p><button type="button" id="scan-btn">Run Local Scan</button></p>
      <pre id="scan-out"></pre>
    </div>
  </main>
  <script>
    document.getElementById('scan-btn').addEventListener('click', async () => {{
      const out = document.getElementById('scan-out');
      try {{
        const res = await fetch('/api/scan', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ content: document.getElementById('env-in').value }})
        }});
        const data = await res.json();
        out.textContent = JSON.stringify(data, null, 2);
      }} catch (err) {{
        out.textContent = 'Scan error: ' + String(err);
      }}
    }});
  </script>
</body>
</html>
"""


def _parse_int_param(
    value: Any,
    name: str,
    default: int,
    min_val: Optional[int] = None,
    max_val: Optional[int] = None,
) -> int:
    if value is None:
        val = default
    elif isinstance(value, bool):
        raise ValueError(f"Parameter '{name}' must be an integer, not boolean.")
    else:
        try:
            val = int(value)
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Parameter '{name}' must be an integer.") from exc
    if min_val is not None and val < min_val:
        raise ValueError(f"Parameter '{name}' must be >= {min_val}.")
    if max_val is not None and val > max_val:
        raise ValueError(f"Parameter '{name}' must be <= {max_val}.")
    return val


def _is_valid_loopback_host(host_header: Optional[str], server_port: int) -> bool:
    """Validate Host header strictly against loopback hostnames and bound port."""
    if not host_header:
        return False
    raw = host_header.strip()
    if not raw or any(ch in raw for ch in (" ", "\t", "/", "@", "\\")):
        return False

    hostname = ""
    port_str: Optional[str] = None
    if raw.startswith("["):
        end = raw.find("]")
        if end == -1:
            return False
        hostname = raw[1:end].lower()
        rest = raw[end + 1 :]
        if rest:
            if not rest.startswith(":"):
                return False
            port_str = rest[1:]
    else:
        if raw.count(":") == 1:
            h, p = raw.split(":", 1)
            hostname = h.lower()
            port_str = p
        elif raw.count(":") == 0:
            hostname = raw.lower()
        else:
            return False

    if hostname not in LOOPBACK_HOSTS:
        return False
    if port_str is not None:
        if not port_str.isdigit():
            return False
        if int(port_str) != server_port:
            return False
    return True


def _validate_origin(origin_header: Optional[str], server_port: int) -> tuple[bool, Optional[str]]:
    """Validate optional Origin header against exact loopback ports (server_port and Studio :3000)."""
    if not origin_header:
        return True, None
    raw = origin_header.strip()
    try:
        parsed = urllib.parse.urlparse(raw)
    except Exception:
        return False, None

    if parsed.scheme != "http":
        return False, None
    if parsed.username is not None or parsed.password is not None:
        return False, None
    if parsed.path not in ("", "/") or parsed.params or parsed.query or parsed.fragment:
        return False, None
    if not parsed.hostname or parsed.hostname.lower() not in LOOPBACK_HOSTS:
        return False, None
    try:
        origin_port = parsed.port
    except ValueError:
        return False, None
    if origin_port not in ({server_port} | set(ALLOWED_EXTRA_CORS_PORTS)):
        return False, None

    return True, raw


class StudioHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Hardened loopback HTTP request handler serving EnvGuard Studio UI and REST APIs."""

    def __init__(self, *args: Any, directory: Optional[str] = None, **kwargs: Any) -> None:
        if directory is None:
            repo_public = Path(__file__).resolve().parent.parent.parent / "public"
            if repo_public.is_dir() and (repo_public / "index.html").is_file():
                directory = str(repo_public)
            else:
                directory = str(Path.cwd() / "public")
        self.public_dir = Path(directory)
        self._allowed_origin: Optional[str] = None
        super().__init__(*args, directory=directory, **kwargs)

    def end_headers(self) -> None:
        """Attach mandatory security headers and exact-match CORS headers on every response."""
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Content-Security-Policy", CONTENT_SECURITY_POLICY)
        self.send_header("Vary", "Origin")
        if self._allowed_origin:
            self.send_header("Access-Control-Allow-Origin", self._allowed_origin)
            self.send_header("Access-Control-Allow-Methods", "GET, HEAD, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def _guard_host_and_origin(self) -> bool:
        """Validate Host and Origin headers; emit 403 Forbidden JSON on violation."""
        self._allowed_origin = None
        server_port = int(self.server.server_address[1])

        host_hdr = self.headers.get("Host")
        if not _is_valid_loopback_host(host_hdr, server_port):
            self._send_json_response(
                {"error": "Forbidden Host header: loopback access only."},
                status=HTTPStatus.FORBIDDEN,
            )
            return False

        origin_hdr = self.headers.get("Origin")
        ok_origin, allowed_origin = _validate_origin(origin_hdr, server_port)
        if not ok_origin:
            self._send_json_response(
                {"error": "Forbidden Origin: cross-origin access denied."},
                status=HTTPStatus.FORBIDDEN,
            )
            return False

        self._allowed_origin = allowed_origin
        return True

    def _send_json_response(self, data: Any, status: int = 200, send_body: bool = True) -> None:
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if send_body:
            self.wfile.write(payload)

    def list_directory(self, path: str) -> None:  # type: ignore[override]
        """Disable directory listings completely (403 Forbidden)."""
        self._send_json_response(
            {"error": "Directory listing is disabled."},
            status=HTTPStatus.FORBIDDEN,
            send_body=(self.command != "HEAD"),
        )
        return None

    def do_OPTIONS(self) -> None:
        if not self._guard_host_and_origin():
            return
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _handle_get_or_head(self, send_body: bool) -> None:
        if not self._guard_host_and_origin():
            return

        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        if path in ("/health", "/api/health"):
            self._send_json_response(
                {
                    "status": "ok" if path == "/api/health" else "healthy",
                    "app": "envguard-secrets-vault",
                    "service": "envguard-secrets-vault",
                    "version": SERVER_VERSION,
                    "sovereign": True,
                    "port": int(self.server.server_address[1]),
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                },
                send_body=send_body,
            )
            return

        if path == "/api/mcp/config":
            params = urllib.parse.parse_qs(parsed_url.query)
            client_type = params.get("client", ["all"])[0]
            configs = generate_mcp_client_config(client_type)
            self._send_json_response(configs, send_body=send_body)
            return

        if path == "/api/diagnostics":
            self._send_json_response(get_diagnostics(), send_body=send_body)
            return

        # Serve static HTML or built-in UI fallback
        index_file = self.public_dir / "index.html"
        if path in ("/", "/index.html"):
            if index_file.exists():
                if send_body:
                    super().do_GET()
                else:
                    super().do_HEAD()
            else:
                html_bytes = BUILTIN_STUDIO_HTML.encode("utf-8")
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(html_bytes)))
                self.end_headers()
                if send_body:
                    self.wfile.write(html_bytes)
            return

        if send_body:
            super().do_GET()
        else:
            super().do_HEAD()

    def do_GET(self) -> None:
        self._handle_get_or_head(send_body=True)

    def do_HEAD(self) -> None:
        self._handle_get_or_head(send_body=False)

    def _read_post_data(self) -> Optional[Dict[str, Any]]:
        """Validate Content-Length, enforce 1 MiB body limit, and parse JSON/form body strictly."""
        raw_cl = self.headers.get("Content-Length")
        if raw_cl is None:
            self._send_json_response(
                {"error": "Missing required Content-Length header."},
                status=HTTPStatus.BAD_REQUEST,
            )
            return None
        try:
            content_length = int(raw_cl.strip())
            if content_length < 0:
                raise ValueError("negative")
        except ValueError:
            self._send_json_response(
                {"error": "Invalid Content-Length header."},
                status=HTTPStatus.BAD_REQUEST,
            )
            return None

        if content_length > MAX_BODY_BYTES:
            self.close_connection = True
            self._send_json_response(
                {"error": f"Payload too large: maximum allowed body size is {MAX_BODY_BYTES} bytes (1 MiB)."},
                status=HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
            )
            return None

        post_data = self.rfile.read(content_length) if content_length > 0 else b""
        content_type = (self.headers.get("Content-Type") or "").lower()

        if "application/x-www-form-urlencoded" in content_type:
            try:
                parsed_form = urllib.parse.parse_qs(post_data.decode("utf-8"), keep_blank_values=True)
                return {k: v[0] for k, v in parsed_form.items()}
            except UnicodeDecodeError:
                self._send_json_response({"error": "Invalid UTF-8 form body."}, status=HTTPStatus.BAD_REQUEST)
                return None

        if not post_data:
            return {}

        try:
            parsed = json.loads(post_data.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            self._send_json_response(
                {"error": f"Malformed JSON payload: {exc}"},
                status=HTTPStatus.BAD_REQUEST,
            )
            return None

        if not isinstance(parsed, dict):
            self._send_json_response(
                {"error": "JSON request body must be an object."},
                status=HTTPStatus.BAD_REQUEST,
            )
            return None
        return parsed

    def do_POST(self) -> None:
        if not self._guard_host_and_origin():
            return

        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path

        data = self._read_post_data()
        if data is None:
            return

        if path == "/api/scan":
            if data.get("path") or data.get("target_path"):
                self._send_json_response(
                    {"error": "Filesystem path access is disabled over HTTP API; supply inline content instead."},
                    status=HTTPStatus.FORBIDDEN,
                )
                return
            raw_content = data.get("content", "")
            if not isinstance(raw_content, str):
                self._send_json_response({"error": "'content' must be a string."}, status=HTTPStatus.BAD_REQUEST)
                return
            try:
                min_score = _parse_int_param(data.get("min_score"), "min_score", default=80, min_val=0, max_val=100)
            except ValueError as e:
                self._send_json_response({"error": str(e)}, status=HTTPStatus.BAD_REQUEST)
                return
            res = scan_secrets(raw_content, source="<api_input>", min_score=min_score)
            self._send_json_response(res)
            return

        if path == "/api/mask":
            raw_content = data.get("content", "")
            mode = data.get("mode", "partial")
            if not isinstance(raw_content, str) or mode not in ("partial", "full"):
                self._send_json_response(
                    {"error": "Invalid 'content' or 'mode' (expected 'partial' or 'full')."},
                    status=HTTPStatus.BAD_REQUEST,
                )
                return
            res = mask_env_content(raw_content, mode=mode)
            self._send_json_response(res)
            return

        if path == "/api/example":
            raw_content = data.get("content", "")
            if not isinstance(raw_content, str):
                self._send_json_response({"error": "'content' must be a string."}, status=HTTPStatus.BAD_REQUEST)
                return
            res = generate_env_example(raw_content)
            self._send_json_response(res)
            return

        if path == "/api/encrypt":
            raw_content = data.get("content", "")
            password = data.get("password", "")
            if not isinstance(raw_content, str) or not isinstance(password, str) or not password:
                self._send_json_response({"error": "Password is required"}, status=HTTPStatus.BAD_REQUEST)
                return
            raw_iters = data.get("kdf_iterations", data.get("iterations", PBKDF2_ITERATIONS))
            try:
                iterations = validate_kdf_iterations(raw_iters)
                res = vault_encrypt(raw_content, password=password, iterations=iterations)
                self._send_json_response(res)
            except ValueError as e:
                self._send_json_response({"error": str(e)}, status=HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/decrypt":
            vault_armor = data.get("vault_armor", "") or data.get("vault", "")
            password = data.get("password", "")
            if not isinstance(vault_armor, str) or not isinstance(password, str) or not password:
                self._send_json_response({"error": "Password is required"}, status=HTTPStatus.BAD_REQUEST)
                return
            try:
                res = vault_decrypt(vault_armor, password=password)
                self._send_json_response(res)
            except ValueError as e:
                self._send_json_response({"error": str(e)}, status=HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/diff":
            env_a = data.get("env_a", "")
            env_b = data.get("env_b", "")
            name_a = str(data.get("name_a", "Environment A"))
            name_b = str(data.get("name_b", "Environment B"))
            if not isinstance(env_a, str) or not isinstance(env_b, str):
                self._send_json_response({"error": "'env_a' and 'env_b' must be strings."}, status=HTTPStatus.BAD_REQUEST)
                return
            res = diff_environments(env_a, env_b, name_a=name_a, name_b=name_b)
            self._send_json_response(res)
            return

        if path == "/api/mcp/config":
            client_type = str(data.get("client", "all"))
            configs = generate_mcp_client_config(client_type)
            self._send_json_response(configs)
            return

        if path == "/api/shamir/split":
            from envguard_secrets_vault.shamir_quorum import split_secret_into_shares

            secret = data.get("secret", "")
            if not isinstance(secret, str) or not secret:
                self._send_json_response({"error": "Missing 'secret' parameter"}, status=HTTPStatus.BAD_REQUEST)
                return
            try:
                threshold = _parse_int_param(data.get("threshold"), "threshold", default=3, min_val=2, max_val=255)
                raw_total = data.get("total_shares", data.get("shares"))
                total_shares = _parse_int_param(raw_total, "total_shares", default=5, min_val=2, max_val=255)
                label = str(data.get("label", "master-key"))
                res = split_secret_into_shares(
                    secret=secret, threshold=threshold, total_shares=total_shares, label=label
                )
                self._send_json_response(res)
            except ValueError as e:
                self._send_json_response({"error": str(e)}, status=HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/shamir/combine":
            from envguard_secrets_vault.shamir_quorum import combine_shares_to_secret

            shares = data.get("shares", [])
            if not isinstance(shares, list) or not shares:
                self._send_json_response({"error": "Missing 'shares' list parameter"}, status=HTTPStatus.BAD_REQUEST)
                return
            try:
                res = combine_shares_to_secret(shares)
                self._send_json_response(res)
            except ValueError as e:
                self._send_json_response({"error": str(e)}, status=HTTPStatus.BAD_REQUEST)
            return

        if path == "/api/rotation/audit":
            from envguard_secrets_vault.secret_rotation_sentinel import audit_rotation

            if data.get("path") or data.get("target_path"):
                self._send_json_response(
                    {"error": "Filesystem path access is disabled over HTTP API; supply inline content instead."},
                    status=HTTPStatus.FORBIDDEN,
                )
                return
            raw_content = data.get("content", data.get("env_content", ""))
            if not isinstance(raw_content, str):
                self._send_json_response({"error": "'content' must be a string."}, status=HTTPStatus.BAD_REQUEST)
                return
            ref_date_str = data.get("reference_date")
            reference_date = None
            if ref_date_str:
                try:
                    reference_date = datetime.datetime.fromisoformat(str(ref_date_str))
                except ValueError:
                    self._send_json_response(
                        {"error": "Invalid 'reference_date' ISO-8601 format."},
                        status=HTTPStatus.BAD_REQUEST,
                    )
                    return
            try:
                max_age_days = _parse_int_param(
                    data.get("max_age_days", data.get("rotation_days")),
                    "max_age_days",
                    default=90,
                    min_val=1,
                    max_val=3650,
                )
            except ValueError as e:
                self._send_json_response({"error": str(e)}, status=HTTPStatus.BAD_REQUEST)
                return
            report = audit_rotation(
                raw_content,
                filename=".env",
                reference_date=reference_date,
                default_policy_days=max_age_days,
            )
            self._send_json_response(report.to_dict())
            return

        if path == "/api/rotation/execute":
            from envguard_secrets_vault.secret_rotation_sentinel import rotate_secrets_in_content

            if data.get("path") or data.get("target_path") or data.get("write_back"):
                self._send_json_response(
                    {"error": "Filesystem path access is disabled over HTTP API; supply inline content instead."},
                    status=HTTPStatus.FORBIDDEN,
                )
                return
            raw_content = data.get("content", data.get("env_content", ""))
            if not isinstance(raw_content, str):
                self._send_json_response({"error": "'content' must be a string."}, status=HTTPStatus.BAD_REQUEST)
                return
            target_keys = data.get("target_keys")
            if target_keys is not None and not isinstance(target_keys, list):
                self._send_json_response({"error": "'target_keys' must be a list of strings."}, status=HTTPStatus.BAD_REQUEST)
                return
            try:
                rotation_days = _parse_int_param(
                    data.get("rotation_days", data.get("max_age_days")),
                    "rotation_days",
                    default=90,
                    min_val=1,
                    max_val=3650,
                )
                result = rotate_secrets_in_content(
                    content=raw_content,
                    target_keys=target_keys,
                    rotation_days=rotation_days,
                    filename=".env",
                )
                self._send_json_response(result.to_dict())
            except ValueError as e:
                self._send_json_response({"error": str(e)}, status=HTTPStatus.BAD_REQUEST)
            return

        if path in ("/api/export-zip", "/api/export/zip"):
            raw_content = data.get("content", "PORT=8088\n")
            if not isinstance(raw_content, str):
                self._send_json_response({"error": "'content' must be a string."}, status=HTTPStatus.BAD_REQUEST)
                return
            zip_buffer = io.BytesIO()

            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                example_res = generate_env_example(raw_content)
                zf.writestr(".env.example", example_res["example_content"])

                masked_res = mask_env_content(raw_content, mode="partial")
                zf.writestr(".env.masked", masked_res["masked_content"])

                audit_res = scan_secrets(raw_content, source=".env")
                zf.writestr("audit-report.json", json.dumps(audit_res, indent=2))

                mcp_configs = generate_mcp_client_config("all")
                zf.writestr("mcp-configs/claude_desktop.json", json.dumps(mcp_configs["claude_desktop"], indent=2))
                zf.writestr("mcp-configs/cursor_mcp.json", json.dumps(mcp_configs["cursor"], indent=2))
                zf.writestr("mcp-configs/cline_mcp.json", json.dumps(mcp_configs["cline"], indent=2))
                zf.writestr("mcp-configs/zed_settings.json", json.dumps(mcp_configs["zed"], indent=2))

                readme_text = (
                    f"# EnvGuard Hardened Secrets Bundle (v{SERVER_VERSION})\n\n"
                    "Generated locally by EnvGuard Secrets Vault Studio.\n\n"
                    "## Contents\n"
                    "- `.env.example`: Sanitized template safe for version control.\n"
                    "- `.env.masked`: Partially redacted environment snapshot.\n"
                    "- `audit-report.json`: Full security posture and finding logs.\n"
                    "- `mcp-configs/`: Ready-to-use Model Context Protocol server configurations.\n"
                )
                zf.writestr("README.md", readme_text)

            zip_bytes = zip_buffer.getvalue()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", 'attachment; filename="envguard-hardened-bundle.zip"')
            self.send_header("Content-Length", str(len(zip_bytes)))
            self.end_headers()
            self.wfile.write(zip_bytes)
            return

        self._send_json_response({"error": f"Endpoint not found: {path}"}, status=HTTPStatus.NOT_FOUND)


def create_server(host: str = "127.0.0.1", port: int = 8088, public_dir: Optional[str] = None) -> ThreadingHTTPServer:
    """Creates a ThreadingHTTPServer instance for EnvGuard Studio (loopback default)."""
    handler = lambda *args, **kwargs: StudioHTTPRequestHandler(*args, directory=public_dir, **kwargs)
    return ThreadingHTTPServer((host, port), handler)


def start_server(host: str = "127.0.0.1", port: int = 8088, public_dir: Optional[str] = None) -> None:
    """Starts the EnvGuard Secrets Studio hardened loopback HTTP Server."""
    server = create_server(host=host, port=port, public_dir=public_dir)
    print(f"[EnvGuard Studio v{SERVER_VERSION}] Server listening on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[EnvGuard Studio] Server stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    start_server()
