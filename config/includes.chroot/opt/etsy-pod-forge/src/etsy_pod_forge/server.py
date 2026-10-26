"""Multi-Threaded HTTP Server & REST API for Etsy POD Forge.

Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform.
100% Python Standard Library (`http.server`, `urllib`, `json`, `threading`, `time`).
Serves live on Port 8107 and forwards events to Agent Flight Recorder (:8104)
and engrams to Neuro-Memory Daemon (:8094).
"""

from __future__ import annotations

import io
import json
import mimetypes
import os
import posixpath
import socket
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from typing import Any, Dict, List, Optional

from .canvas_generator import CanvasGenerator, CanvasConfig
from .listing_synthesizer import synthesize_listing, CADRE_SPECS
from .mockup_engine import MockupEngine, MockupConfig
from .prompt_vault import get_all_prompts, get_prompts_by_cadre, search_prompts


def _is_local_origin(origin) -> bool:
    """Browser Origin check. No Origin header = non-browser client (CLI/agent): allowed.
    Otherwise only http(s)://localhost / 127.0.0.1 / [::1] pages may call this API, so a
    random website can't drive the local server from the user's browser (CSRF)."""
    if not origin:
        return True
    from urllib.parse import urlparse
    try:
        u = urlparse(origin)
    except ValueError:
        return False
    return u.scheme in ("http", "https") and u.hostname in ("localhost", "127.0.0.1", "::1")


def _cors_origin(handler) -> str:
    origin = handler.headers.get("Origin")
    return origin if origin and _is_local_origin(origin) else "http://127.0.0.1"



class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class ForgeTelemetry:
    """Thread-safe telemetry accumulator for storefront operations."""

    def __init__(self):
        self.lock = threading.Lock()
        self.start_time = time.time()
        self.canvases_generated = 0
        self.mockups_generated = 0
        self.listings_synthesized = 0
        self.kits_exported = 0
        self.projected_revenue = 0.0
        self.flight_recorder_events = 0
        self.neuro_memories_saved = 0

    def record_canvas(self) -> None:
        with self.lock:
            self.canvases_generated += 1

    def record_mockup(self) -> None:
        with self.lock:
            self.mockups_generated += 1

    def record_listing(self, retail_price: float) -> None:
        with self.lock:
            self.listings_synthesized += 1
            self.projected_revenue += retail_price

    def record_export(self) -> None:
        with self.lock:
            self.kits_exported += 1

    def get_stats(self) -> Dict[str, Any]:
        with self.lock:
            uptime = round(time.time() - self.start_time, 1)
            return {
                "service": "etsy-pod-forge",
                "status": "healthy",
                "port": 8107,
                "uptime_seconds": uptime,
                "canvases_generated": self.canvases_generated,
                "mockups_generated": self.mockups_generated,
                "listings_synthesized": self.listings_synthesized,
                "kits_exported": self.kits_exported,
                "projected_revenue": round(self.projected_revenue, 2),
                "flight_recorder_events": self.flight_recorder_events,
                "neuro_memories_saved": self.neuro_memories_saved,
            }

    def dispatch_flight_event(self, event_type: str, data: Dict[str, Any]) -> None:
        """Asynchronously dispatch telemetry event to agent-flight-recorder (:8104)."""
        def _send():
            try:
                url = "http://127.0.0.1:8104/api/ingest"
                payload = {
                    "source": "etsy-pod-forge",
                    "event_type": event_type,
                    "timestamp": time.time(),
                    "data": data,
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=1.0) as resp:
                    if resp.status in (200, 201):
                        with self.lock:
                            self.flight_recorder_events += 1
            except Exception:
                pass  # Graceful fallback if flight recorder offline

        threading.Thread(target=_send, daemon=True).start()

    def dispatch_neuro_memory(self, content: str, tags: List[str]) -> None:
        """Asynchronously store strategic insight into neuro-memory-daemon (:8094)."""
        def _send():
            try:
                url = "http://127.0.0.1:8094/api/memories"
                payload = {
                    "content": content,
                    "importance": 0.92,
                    "category": "commerce_pod",
                    "tags": tags + ["etsy", "pod", "55_plus_women", "revenue_day7"],
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=1.0) as resp:
                    if resp.status in (200, 201):
                        with self.lock:
                            self.neuro_memories_saved += 1
            except Exception:
                pass

        threading.Thread(target=_send, daemon=True).start()


GLOBAL_TELEMETRY = ForgeTelemetry()


class ForgeRequestHandler(SimpleHTTPRequestHandler):
    """HTTP request handler supporting REST API endpoints and static files."""

    server_version = "EtsyPODForge/0.1.0"

    def __init__(self, *args, directory=None, **kwargs):
        if directory is None:
            # Resolve public directory relative to this file
            cur_dir = os.path.dirname(os.path.abspath(__file__))
            pkg_root = os.path.dirname(os.path.dirname(cur_dir))
            directory = os.path.join(pkg_root, "public")
        super().__init__(*args, directory=directory, **kwargs)

    def _send_json(self, status_code: int, data: Any) -> None:
        raw = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Access-Control-Allow-Origin", _cors_origin(self))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(raw)

    def _read_json_body(self) -> Dict[str, Any]:
        content_len = int(self.headers.get("Content-Length", 0))
        if content_len <= 0:
            return {}
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            return json.loads(body)
        except Exception:
            return {}

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", _cors_origin(self))
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)

        # 1. Health Endpoints
        if path in ("/api/health", "/health"):
            self._send_json(200, {
                "status": "healthy",
                "service": "etsy-pod-forge",
                "port": 8107,
                "version": "0.1.0",
                "engine": "autonomous-pod-studio",
                "target_demographic": "women_50_75_plus",
                "uptime_seconds": round(time.time() - GLOBAL_TELEMETRY.start_time, 1),
            })
            return

        # 2. Telemetry Stats
        if path == "/api/stats":
            self._send_json(200, GLOBAL_TELEMETRY.get_stats())
            return

        # 3. Cadre Catalog
        if path == "/api/cadres":
            self._send_json(200, {
                "cadres": CADRE_SPECS,
                "count": len(CADRE_SPECS),
            })
            return

        # 4. Prompt Vault Catalog
        if path == "/api/prompts":
            cadre_filter = qs.get("cadre", [None])[0]
            search_query = qs.get("q", [None])[0]

            if search_query:
                prompts = search_prompts(search_query)
            elif cadre_filter:
                prompts = get_prompts_by_cadre(cadre_filter)
            else:
                prompts = get_all_prompts()

            self._send_json(200, {
                "prompts": [p.to_dict() for p in prompts],
                "count": len(prompts),
                "total_available": len(get_all_prompts()),
            })
            return

        # 5. Default Static File Handling (public/ directory)
        super().do_GET()

    def do_POST(self) -> None:
        if not _is_local_origin(self.headers.get("Origin")):
            _body = b'{"error": "cross-origin request blocked"}'
            self.send_response(403)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(_body)))
            self.end_headers()
            self.wfile.write(_body)
            return
        path = urllib.parse.urlparse(self.path).path
        payload = self._read_json_body()

        # 1. Generate Print-Ready Canvas
        if path == "/api/generate-canvas":
            cadre = payload.get("cadre", "apparel")
            preview = bool(payload.get("preview", True))
            title = payload.get("title", "")
            subtitle = payload.get("subtitle", "")
            names = payload.get("names", None)
            if isinstance(names, str):
                names = [n.strip() for n in names.split(",") if n.strip()]

            cfg = CanvasConfig.default_for_cadre(cadre, preview=preview)
            if title:
                cfg.title_text = title
            if subtitle:
                cfg.subtitle_text = subtitle
            if names:
                cfg.custom_names = names

            gen = CanvasGenerator(cfg)
            b64 = gen.generate_base64()
            GLOBAL_TELEMETRY.record_canvas()
            GLOBAL_TELEMETRY.dispatch_flight_event("canvas.generated", {
                "cadre": cadre,
                "preview": preview,
                "title": title,
                "width": cfg.width,
                "height": cfg.height,
            })

            self._send_json(200, {
                "success": True,
                "image_b64": b64,
                "width": cfg.width,
                "height": cfg.height,
                "dpi": cfg.dpi,
                "cadre": cadre,
                "is_preview": preview,
            })
            return

        # 2. Generate Product Mockup
        if path == "/api/generate-mockup":
            cadre = payload.get("cadre", "apparel")
            color = payload.get("color", "sand")
            title = payload.get("title", "")
            subtitle = payload.get("subtitle", "")
            names = payload.get("names", None)
            if isinstance(names, str):
                names = [n.strip() for n in names.split(",") if n.strip()]

            # Build artwork first
            canvas_cfg = CanvasConfig.default_for_cadre(cadre, preview=True)
            if title:
                canvas_cfg.title_text = title
            if subtitle:
                canvas_cfg.subtitle_text = subtitle
            if names:
                canvas_cfg.custom_names = names

            art = CanvasGenerator(canvas_cfg).generate()

            mockup_cfg = MockupConfig.default_for_cadre(cadre)
            mockup_cfg.product_color = color
            mockup_engine = MockupEngine(mockup_cfg)
            mockup_b64 = mockup_engine.composite_base64(art)

            GLOBAL_TELEMETRY.record_mockup()
            GLOBAL_TELEMETRY.dispatch_flight_event("mockup.generated", {
                "cadre": cadre,
                "color": color,
                "width": mockup_cfg.width,
                "height": mockup_cfg.height,
            })

            self._send_json(200, {
                "success": True,
                "mockup_b64": mockup_b64,
                "width": mockup_cfg.width,
                "height": mockup_cfg.height,
                "cadre": cadre,
                "color": color,
            })
            return

        # 3. Generate Complete Listing Kit
        if path == "/api/generate-listing":
            cadre = payload.get("cadre", "apparel")
            title_hook = payload.get("title_hook", None)
            custom_names = payload.get("custom_names", None)
            retail = payload.get("retail_price", None)
            prod = payload.get("production_cost", None)

            if retail is not None:
                try:
                    retail = float(retail)
                except ValueError:
                    retail = None
            if prod is not None:
                try:
                    prod = float(prod)
                except ValueError:
                    prod = None

            kit = synthesize_listing(
                cadre=cadre,
                custom_title_hook=title_hook,
                custom_names=custom_names,
                retail_price=retail,
                production_cost=prod,
            )

            errors = kit.validate_invariants()
            GLOBAL_TELEMETRY.record_listing(kit.profit.retail_price)
            GLOBAL_TELEMETRY.dispatch_flight_event("listing.synthesized", {
                "cadre": cadre,
                "title": kit.title,
                "retail": kit.profit.retail_price,
                "net_profit": kit.profit.net_profit,
            })
            GLOBAL_TELEMETRY.dispatch_neuro_memory(
                f"Synthesized Etsy POD listing kit for cadre '{cadre}': '{kit.title}'. Retail ${kit.profit.retail_price}, Net ${kit.profit.net_profit} ({kit.profit.margin_percent}% margin).",
                tags=["etsy_listing", cadre, "sovereign_commerce"]
            )

            self._send_json(200, {
                "success": True,
                "listing": kit.to_dict(),
                "invariant_errors": errors,
            })
            return

        # 4. Export Complete Listing ZIP Package
        if path == "/api/export-kit":
            cadre = payload.get("cadre", "apparel")
            title = payload.get("title", "")
            names = payload.get("names", "Emma, Liam, Olivia, Noah")
            if isinstance(names, list):
                names = ", ".join(names)

            # Generate listing
            kit = synthesize_listing(cadre=cadre, custom_title_hook=title, custom_names=names)

            # Generate artwork canvas
            canvas_cfg = CanvasConfig.default_for_cadre(cadre, preview=True)
            if title:
                canvas_cfg.title_text = title
            canvas_bytes = CanvasGenerator(canvas_cfg).generate_bytes(format="PNG")

            # Generate mockup
            mock_cfg = MockupConfig.default_for_cadre(cadre)
            mock_engine = MockupEngine(mock_cfg)
            art = CanvasGenerator(canvas_cfg).generate()
            mockup_bytes = mock_engine.composite_bytes(art, format="JPEG")

            # Create in-memory zip
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
                zf.writestr(f"{cadre}_print_canvas.png", canvas_bytes)
                zf.writestr(f"{cadre}_lifestyle_mockup.jpg", mockup_bytes)
                # Formatted listing text
                listing_doc = (
                    f"===========================================================\n"
                    f"🌸 ETSY STORE LISTING ASSET KIT — {kit.product_type.upper()}\n"
                    f"Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform\n"
                    f"===========================================================\n\n"
                    f"TITLE (Length: {len(kit.title)} chars <= 140):\n"
                    f"{kit.title}\n\n"
                    f"13 SEARCH TAGS (All <= 20 chars):\n"
                    f"{', '.join(kit.tags)}\n\n"
                    f"FINANCIAL ECONOMICS:\n"
                    f"• Retail Price:       ${kit.profit.retail_price:.2f}\n"
                    f"• Production Cost:    ${kit.profit.production_cost:.2f}\n"
                    f"• Etsy Fees:          ${kit.profit.total_fees:.2f}\n"
                    f"• Net Profit / Sale:  ${kit.profit.net_profit:.2f} ({kit.profit.margin_percent:.1f}% Margin)\n\n"
                    f"FULL DESCRIPTION:\n"
                    f"-----------------------------------------------------------\n"
                    f"{kit.description}\n"
                )
                zf.writestr("listing_details.txt", listing_doc)
                zf.writestr("listing_data.json", json.dumps(kit.to_dict(), indent=2))

            GLOBAL_TELEMETRY.record_export()
            zip_bytes = zip_buffer.getvalue()

            self.send_response(200)
            self.send_header("Content-Type", "application/zip")
            self.send_header("Content-Disposition", f'attachment; filename="etsy_kit_{cadre}.zip"')
            self.send_header("Content-Length", str(len(zip_bytes)))
            self.send_header("Access-Control-Allow-Origin", _cors_origin(self))
            self.end_headers()
            self.wfile.write(zip_bytes)
            return

        self._send_json(404, {"error": "Endpoint not found", "path": path})


class ForgeServer:
    """Manages the lifecycle of the Etsy POD Forge HTTP server."""

    def __init__(self, host: str = "127.0.0.1", port: int = 8107, public_dir: Optional[str] = None):
        self.host = host
        self.port = port
        self.public_dir = public_dir
        self.server: Optional[ThreadingHTTPServer] = None
        self.thread: Optional[threading.Thread] = None

    def start(self, block: bool = True) -> None:
        handler = lambda *args, **kwargs: ForgeRequestHandler(*args, directory=self.public_dir, **kwargs)
        self.server = ThreadingHTTPServer((self.host, self.port), handler)
        print(f"● Etsy POD Forge Server listening on http://{self.host}:{self.port}")

        if block:
            try:
                self.server.serve_forever()
            except KeyboardInterrupt:
                self.stop()
        else:
            self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
            self.thread.start()

    def stop(self) -> None:
        if self.server:
            self.server.shutdown()
            self.server.server_close()
            print("● Etsy POD Forge Server stopped.")
