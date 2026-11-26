#!/opt/zothos-ai-env/bin/python3
import os
import sys
import argparse
from pathlib import Path

# Ensure root directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from engine.config import load_settings, save_settings

def resolve_bind(args, settings):
    """CLI flags win, then saved settings, then safe localhost defaults."""
    host = args.host or settings.get("web_host") or "127.0.0.1"
    port = args.port or int(settings.get("web_port") or 7890)
    return host, port

def main():
    parser = argparse.ArgumentParser(description="Anderson Sentinel // Autonomous Security & Face Recognition Daemon")
    parser.add_argument("--host", type=str, default=None, help="Web dashboard host (default: settings web_host, 127.0.0.1). Use 0.0.0.0 only on trusted networks: the dashboard streams the camera.")
    parser.add_argument("--port", type=int, default=None, help="Web dashboard port (default: settings web_port, 7890)")
    parser.add_argument("--headless", action="store_true", help="Run headless without web server")
    parser.add_argument("--camera", type=int, default=None, help="Camera device index (default 0)")
    parser.add_argument("--disarm", action="store_true", help="Start in disarmed state")

    args = parser.parse_args()

    settings = load_settings()
    changed = False
    if args.camera is not None:
        settings["camera_index"] = args.camera
        changed = True
    if args.disarm:
        settings["armed"] = False
        changed = True
    if changed:
        save_settings(settings)
    host, port = resolve_bind(args, settings)

    if args.headless:
        print("[Anderson Sentinel] Running in Headless Daemon Mode...")
        from engine.sentinel import AndersonSentinel
        sentinel = AndersonSentinel()
        sentinel.start()
        try:
            import time
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down Sentinel...")
            sentinel.stop()
    else:
        if host not in ("127.0.0.1", "localhost", "::1"):
            print(f"[Anderson Sentinel] WARNING: dashboard (live camera feed) is exposed on {host}. Anyone on this network can reach it.")
        print(f"[Anderson Sentinel] Starting Web Dashboard & Security Core on http://{host}:{port}...")
        import uvicorn
        uvicorn.run("web.server:app", host=host, port=port, log_level="info")

if __name__ == "__main__":
    main()
