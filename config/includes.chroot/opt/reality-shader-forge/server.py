#!/usr/bin/env python3
"""
Zoth Reality Shader & Theme Forge Server (Port :8134)
Engineered by 1nc0gn30 (@1nc0gn30) • NullAI Platform
"""

import argparse
import http.server
import json
import os
import socketserver
import urllib.parse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(SCRIPT_DIR, "public")

REALITIES = [
    {
        "id": "gold",
        "name": "Aurum Gold",
        "primary": "#D4AF37",
        "secondary": "#F59E0B",
        "bgVoid": "#05060A",
        "surface": "#0E121D",
        "text": "#F5E6AB",
    },
    {
        "id": "emerald",
        "name": "Sovereign Emerald",
        "primary": "#10B981",
        "secondary": "#059669",
        "bgVoid": "#040806",
        "surface": "#07160E",
        "text": "#A7F3D0",
    },
    {
        "id": "cyan",
        "name": "Cyber Cyan",
        "primary": "#38BDF8",
        "secondary": "#0284C7",
        "bgVoid": "#04070B",
        "surface": "#0A1322",
        "text": "#BAE6FD",
    },
    {
        "id": "crimson",
        "name": "Ghost Crimson",
        "primary": "#F43F5E",
        "secondary": "#BE123C",
        "bgVoid": "#0A0406",
        "surface": "#1A080E",
        "text": "#FECDD3",
    },
    {
        "id": "purple",
        "name": "Void Obsidian",
        "primary": "#8B5CF6",
        "secondary": "#6D28D9",
        "bgVoid": "#06040A",
        "surface": "#12091F",
        "text": "#DDD6FE",
    },
]


def hex_to_rgb(hex_str: str) -> dict:
    clean = hex_str.lstrip("#")
    num = int(clean, 16)
    return {"r": (num >> 16) & 255, "g": (num >> 8) & 255, "b": num & 255}


def compile_theme(reality_id: str, format_type: str) -> str:
    r = next((item for item in REALITIES if item["id"] == reality_id), REALITIES[0])
    rgb_p = hex_to_rgb(r["primary"])
    rgb_v = hex_to_rgb(r["bgVoid"])
    rgb_t = hex_to_rgb(r["text"])

    if format_type == "kde":
        return f"""[General]
Name=ZothOS {r['name']}
ColorScheme=ZothOS-{r['id']}

[Colors:Window]
BackgroundNormal={rgb_v['r']},{rgb_v['g']},{rgb_v['b']}
ForegroundNormal={rgb_t['r']},{rgb_t['g']},{rgb_t['b']}

[Colors:Selection]
BackgroundNormal={rgb_p['r']},{rgb_p['g']},{rgb_p['b']}
ForegroundNormal=5,6,10

[Colors:Button]
BackgroundNormal={rgb_v['r'] + 12},{rgb_v['g'] + 12},{rgb_v['b'] + 12}
ForegroundNormal={rgb_t['r']},{rgb_t['g']},{rgb_t['b']}"""

    if format_type == "alacritty":
        return f"""[colors.primary]
background = "{r['bgVoid']}"
foreground = "{r['text']}"

[colors.cursor]
text = "{r['bgVoid']}"
cursor = "{r['primary']}"

[colors.selection]
text = "{r['bgVoid']}"
background = "{r['primary']}"

[colors.normal]
black   = "{r['bgVoid']}"
red     = "#F43F5E"
green   = "#10B981"
yellow  = "{r['primary']}"
blue    = "#38BDF8"
magenta = "#8B5CF6"
cyan    = "#06B6D4"
white   = "{r['text']}" """.strip()

    if format_type == "css":
        return f""":root {{
  --zoth-reality-name: "{r['name']}";
  --zoth-reality-primary: {r['primary']};
  --zoth-reality-secondary: {r['secondary']};
  --zoth-reality-void: {r['bgVoid']};
  --zoth-reality-surface: {r['surface']};
  --zoth-reality-text: {r['text']};
  --zoth-border-accent: {r['primary']}3D;
  --zoth-shadow-glow: 0 0 24px {r['primary']}33;
}}"""

    return json.dumps(
        {
            "schema": "zothos/reality/v3",
            "id": r["id"],
            "name": r["name"],
            "palette": r,
        },
        indent=2,
    )


class RealityForgeHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("/health", "/api/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(
                json.dumps(
                    {
                        "status": "ok",
                        "service": "reality-shader-forge",
                        "version": "3.3.0",
                        "port": getattr(self.server, "port", 8134),
                        "mode": "standalone-sovereign",
                        "realities": [r["id"] for r in REALITIES],
                    }
                ).encode("utf-8")
            )
            return

        if path == "/api/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(
                json.dumps(
                    {
                        "status": "online",
                        "service": "reality-shader-forge",
                        "formats": ["kde", "alacritty", "css", "json"],
                        "realities": [r["name"] for r in REALITIES],
                        "free_open_access": True,
                    }
                ).encode("utf-8")
            )
            return

        if path == "/api/realities":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({"realities": REALITIES}).encode("utf-8"))
            return

        if path == "/api/compile":
            reality_id = query.get("reality", ["gold"])[0]
            fmt = query.get("format", ["kde"])[0]
            compiled = compile_theme(reality_id, fmt)

            self.send_response(200)
            if fmt == "json":
                self.send_header("Content-Type", "application/json")
            elif fmt == "css":
                self.send_header("Content-Type", "text/css")
            else:
                self.send_header("Content-Type", "text/plain")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(compiled.encode("utf-8"))
            return

        return super().do_GET()


class ThreadingTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True


def main():
    parser = argparse.ArgumentParser(description="Zoth Reality Shader & Theme Forge Daemon")
    parser.add_argument("--port", type=int, default=8134, help="Port to bind (default: 8134)")
    args = parser.parse_args()

    server = ThreadingTCPServer(("127.0.0.1", args.port), RealityForgeHandler)
    server.port = args.port
    print(f"⚡ Reality Shader & Theme Forge running on http://127.0.0.1:{args.port} (serving {PUBLIC_DIR})")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Reality Shader Forge...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
