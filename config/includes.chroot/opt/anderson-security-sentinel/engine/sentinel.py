import os
import cv2
import time
import socket
import ipaddress
import subprocess
import threading
from urllib.parse import urlparse
import numpy as np
from datetime import datetime

from .config import (
    DEFAULT_INTRUDER_PHRASE,
    load_settings,
    save_settings,
    INTRUDERS_DIR,
)
from .detector import FaceSecurityEngine
from .camera_stream import CameraStream
from .voice_synth import VoiceSynthesizer
from .wifi_xray import WifiXrayEngine
from .usb_guard import UsbTripwireGuard
from .bluetooth_scanner import BluetoothPerimeterGuard
from .forensic_dossier import ForensicDossierGenerator

VISION_MODE_ALIASES = {
    "normal": "normal",
    "optical": "normal",
    "thermal": "thermal",
    "predator": "predator",
}


def validate_public_https_webhook(url: str) -> str:
    """Validate an optional webhook URL against SSRF targets (loopback, RFC1918, link-local, non-HTTPS)."""
    clean = (url or "").strip()
    if not clean:
        return ""
    if len(clean) > 512:
        raise ValueError("webhook_url exceeds 512 characters")
    parsed = urlparse(clean)
    if parsed.scheme != "https":
        raise ValueError("webhook_url must use https://")
    if parsed.username or parsed.password:
        raise ValueError("webhook_url must not embed credentials")
    host = (parsed.hostname or "").strip().lower()
    if not host or host in ("localhost", "ip6-localhost") or host.endswith((".local", ".internal", ".localhost")):
        raise ValueError("webhook_url host is not a public endpoint")

    def _check_ip(ip_obj):
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_multicast
            or ip_obj.is_reserved
            or ip_obj.is_unspecified
        ):
            raise ValueError("webhook_url must target a public IP address")

    try:
        _check_ip(ipaddress.ip_address(host))
    except ValueError as exc:
        if "public IP" in str(exc):
            raise
        # Hostname — if DNS resolves locally, verify none of the resolved IPs are private/link-local
        if "." not in host:
            raise ValueError("webhook_url must specify a fully qualified public domain")
        try:
            infos = socket.getaddrinfo(host, parsed.port or 443, type=socket.SOCK_STREAM)
            for info in infos:
                addr = info[4][0]
                _check_ip(ipaddress.ip_address(addr))
        except socket.gaierror:
            # Offline/test environments cannot resolve DNS; syntax + non-private literal checks already passed
            pass
    return clean


def normalize_vision_mode(mode: str) -> str:
    key = str(mode or "").strip().lower()
    if key not in VISION_MODE_ALIASES:
        raise ValueError("Invalid vision_mode. Allowed: normal, optical, thermal, predator.")
    return VISION_MODE_ALIASES[key]


class AndersonSentinel:
    def __init__(self):
        self.settings = load_settings()
        env_cam = os.environ.get("ANDERSON_CAMERA_INDEX")
        cam_index = int(env_cam) if env_cam is not None and env_cam.strip() != "" else self.settings.get("camera_index", 0)

        self.detector = FaceSecurityEngine(
            score_threshold=0.6,
            nms_threshold=0.3
        )
        self.camera = CameraStream(camera_index=cam_index)
        self.synth = VoiceSynthesizer(settings=self.settings, precache=False)
        self.wifi_xray = WifiXrayEngine(
            scan_interval=max(1.0, float(self.settings.get("wifi_scan_interval_sec", 3.0))),
            path_loss_exponent=float(self.settings.get("wifi_path_loss_n", 2.6))
        )
        self.usb_guard = UsbTripwireGuard()
        self.ble_guard = BluetoothPerimeterGuard(
            trusted_macs=self.settings.get("trusted_bluetooth_macs", [])
        )
        self.dossier_gen = ForensicDossierGenerator(INTRUDERS_DIR)
        try:
            self.vision_mode = normalize_vision_mode(self.settings.get("vision_mode", "normal"))
        except ValueError:
            self.vision_mode = "normal"

        self.running = False
        self.loop_thread = None
        self.lock = threading.Lock()

        # State
        self.last_welcome_time = 0
        self.last_intruder_alert_time = 0
        self.last_shoulder_alert_time = 0
        self.last_anderson_seen_time = 0
        self.last_rf_alert_time = 0
        self.last_usb_alert_time = 0
        self.last_ble_alert_time = 0
        self.was_anderson_present = False
        self.last_processed_frame = None
        self.last_hud_frame = None
        self.current_targets = []
        self.security_status = "ARMED" if self.settings.get("armed", True) else "DISARMED"

        # Event log
        self.events = []
        self.listeners = []  # websocket callbacks

    def start(self):
        if self.running:
            return
        self.running = True
        self.synth.precache_standard_phrases()
        self.camera.start()
        if self.settings.get("wifi_xray_enabled", True):
            self.wifi_xray.add_callback(self._on_wifi_xray_event)
            self.wifi_xray.start()
        if self.settings.get("usb_guard_enabled", True):
            self.usb_guard.add_callback(self._on_usb_event)
            self.usb_guard.start()
        if self.settings.get("ble_guard_enabled", True):
            self.ble_guard.add_callback(self._on_ble_event)
            self.ble_guard.start()
        self.loop_thread = threading.Thread(target=self._sentinel_loop, daemon=True)
        self.loop_thread.start()
        self._log_event("SYSTEM", "Anderson Sentinel Daemon Online.")

    def stop(self):
        self.running = False
        if self.loop_thread:
            self.loop_thread.join(timeout=1.0)
            self.loop_thread = None
        self.camera.stop()
        self.wifi_xray.stop()
        self.usb_guard.stop()
        self.ble_guard.stop()
        self._log_event("SYSTEM", "Anderson Sentinel Daemon Offline.")

    def add_listener(self, callback):
        self.listeners.append(callback)

    def remove_listener(self, callback):
        if callback in self.listeners:
            self.listeners.remove(callback)

    def _broadcast(self, event_type, data):
        for cb in list(self.listeners):
            try:
                cb(event_type, data)
            except Exception:
                pass

    def _log_event(self, category, message, details=None):
        evt = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "category": category,  # SYSTEM, AUTHORIZED, BREACH, ENROLL
            "message": message,
            "details": details or {}
        }
        self.events.insert(0, evt)
        if len(self.events) > 100:
            self.events.pop()
        self._broadcast("log", evt)
        print(f"[{evt['timestamp']}] [{category}] {message}")

    def arm(self):
        self.settings["armed"] = True
        self.security_status = "ARMED"
        save_settings(self.settings)
        self._log_event("SYSTEM", "Perimeter Armed. Sentinel actively monitoring camera stream.")
        self._broadcast("status", {"armed": True, "status": "ARMED"})

    def disarm(self):
        self.settings["armed"] = False
        self.security_status = "DISARMED"
        save_settings(self.settings)
        self._log_event("SYSTEM", "Perimeter Disarmed. Standby mode active.")
        self._broadcast("status", {"armed": False, "status": "DISARMED"})

    def update_settings(self, new_settings):
        clean = dict(new_settings)
        if "vision_mode" in clean and clean["vision_mode"] is not None:
            clean["vision_mode"] = normalize_vision_mode(clean["vision_mode"])
            self.vision_mode = clean["vision_mode"]
        if "webhook_url" in clean and clean["webhook_url"] is not None:
            clean["webhook_url"] = validate_public_https_webhook(clean["webhook_url"])
        self.settings.update(clean)
        save_settings(self.settings)
        self.synth.update_settings(self.settings)
        if "wifi_scan_interval_sec" in clean:
            self.wifi_xray.scan_interval = max(1.0, float(clean["wifi_scan_interval_sec"]))
        if "wifi_path_loss_n" in clean:
            self.wifi_xray.path_loss_n = float(clean["wifi_path_loss_n"])
        self._log_event("SYSTEM", "Configuration settings updated.")
        self._broadcast("settings", self.settings)

    def _on_wifi_xray_event(self, event_type, data):
        if event_type == "wifi_xray_update":
            self._broadcast("wifi_xray", data)
        elif event_type == "rf_disturbance":
            self._broadcast("rf_disturbance", data)
            if self.security_status == "ARMED" and self.settings.get("rf_presence_alerts", True):
                now = time.time()
                cooldown = float(self.settings.get("rf_alert_cooldown_sec", 12.0))
                if (now - self.last_rf_alert_time) > cooldown:
                    self.last_rf_alert_time = now
                    node = data.get("node", {})
                    ssid = node.get("ssid", "Unknown Device")
                    zone = node.get("zone", "adjacent_room")
                    dist = node.get("distance_m", 0.0)
                    deg = node.get("angle_deg", 0.0)
                    zone_desc = "Immediate Room" if zone == "immediate_room" else "Through Wall / Adjacent Space"
                    msg = f"THROUGH-WALL MOTION DETECTED: RF field anomaly near '{ssid}' in {zone_desc} ({dist}m, {deg}°)."
                    self._log_event("RF_PRESENCE", msg, data)

                    if self.settings.get("play_sound_effects", True) and self.settings.get("rf_audio_ping", True):
                        self.synth.play_sfx("sonar_ping")

                    self._send_desktop_notification(
                        "RF TOMOGRAPHY // MOTION DETECTED",
                        f"Through-wall motion near {ssid} ({dist}m)",
                        urgency="normal"
                    )

    def _on_usb_event(self, event_type, data):
        self._broadcast("usb_event", data)
        if self.security_status == "ARMED":
            dev = data.get("device", {})
            mfg = dev.get("manufacturer", "Unknown")
            prod = dev.get("product", "Device")
            vid = dev.get("id_vendor", "")
            pid = dev.get("id_product", "")
            msg = f"HARDWARE BREACH: Rogue USB hardware plugged in! {mfg} {prod} (VID:{vid} PID:{pid})"
            self._log_event("HARDWARE_BREACH", msg, data)

            raw_frame = self.camera.get_frame()
            snap_name = self._save_intruder_snapshot(raw_frame, 0.99) if raw_frame is not None else None

            phrase = "Warning. Rogue USB hardware detected. Workstation locked down."
            self.synth.speak(phrase, alert_type="intruder")
            self._send_desktop_notification("DEFCON 1 // ROGUE USB DETECTED", msg, urgency="critical")
            self._dispatch_webhook("ROGUE_USB_BREACH", msg, snap_name)

            if self.settings.get("auto_lockdown_on_usb_breach", True):
                self._lock_system_screen()

    def _on_ble_event(self, event_type, data):
        if event_type == "ble_proximity_alert":
            now = time.time()
            if (now - self.last_ble_alert_time) > 20.0 and self.security_status == "ARMED":
                self.last_ble_alert_time = now
                dev = data.get("device", {})
                name = dev.get("name", "Unknown Bluetooth")
                dist = dev.get("distance_m", 0.0)
                msg = f"BLE PROXIMITY ALERT: Unknown device '{name}' hovering within {dist}m."
                self._log_event("BLE_PROXIMITY", msg, data)
                self._broadcast("ble_alert", data)
        elif event_type == "bluetooth_update":
            self._broadcast("bluetooth_update", data)

    def set_vision_mode(self, mode):
        normalized = normalize_vision_mode(mode)
        self.vision_mode = normalized
        self.settings["vision_mode"] = normalized
        save_settings(self.settings)
        self._log_event("SYSTEM", f"Optics Sensor switched to: {normalized.upper()}")
        self._broadcast("vision_mode", {"mode": normalized})
        return normalized

    def enroll_current_face(self):
        """Enroll the currently visible face as Mr. Anderson."""
        raw_frame = self.camera.get_frame()
        if raw_frame is None:
            return False, "Camera stream not available. Cannot enroll."

        success, msg = self.detector.enroll_face_from_frame(raw_frame)
        if success:
            self._log_event("ENROLL", f"Mr. Anderson facial vector registered. {msg}")
            self.synth.speak("Mr. Anderson biometric profile registered and armed.", alert_type="custom")
        return success, msg

    def clear_enrolled_faces(self):
        res, msg = self.detector.clear_enrolled_faces()
        self._log_event("ENROLL", "All enrolled face vectors purged.")
        return res, msg

    def test_voice(self, alert_type="welcome"):
        if alert_type == "welcome":
            phrase = self.settings.get("welcome_phrase", "Welcome back, Mr. Anderson.")
            self.synth.speak(phrase, alert_type="welcome")
            self._log_event("TEST", f"Testing Welcome Voice: '{phrase}'")
        elif alert_type == "intruder":
            phrase = self.settings.get("intruder_phrase", DEFAULT_INTRUDER_PHRASE)
            self.synth.speak(phrase, alert_type="intruder")
            self._log_event("TEST", f"Testing Intruder Warning Voice: '{phrase}'")

    def _save_intruder_snapshot(self, frame, sim):
        try:
            timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"intruder_{timestamp_str}_{int(sim*100)}pct.jpg"
            filepath = INTRUDERS_DIR / filename
            cv2.imwrite(str(filepath), frame)
            return filename
        except Exception as e:
            print(f"[Sentinel] Error saving intruder photo: {e}")
            return None

    def _send_desktop_notification(self, title, message, urgency="normal"):
        if not self.settings.get("desktop_notifications", True):
            return
        if os.environ.get("ANDERSON_OFFLINE", "").strip().lower() in ("1", "true", "yes"):
            return
        try:
            subprocess.Popen(
                ["/usr/bin/notify-send", "-u", urgency, "-a", "Anderson Sentinel", title, message],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
        except Exception:
            pass

    def _lock_system_screen(self):
        if os.environ.get("ANDERSON_DISABLE_LOCKDOWN", "").strip().lower() in ("1", "true", "yes"):
            self._log_event("SYSTEM", "Lockdown suppressed by ANDERSON_DISABLE_LOCKDOWN.")
            return
        try:
            subprocess.Popen(["/usr/bin/loginctl", "lock-session"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            try:
                subprocess.Popen(["/usr/bin/xdg-screensaver", "lock"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                pass

    def _dispatch_webhook(self, event_type, message, snap_name=None):
        raw_url = self.settings.get("webhook_url", "").strip()
        if not raw_url:
            return
        try:
            url = validate_public_https_webhook(raw_url)
        except ValueError as exc:
            print(f"[Sentinel] Blocked unsafe webhook URL: {exc}")
            return

        snap_path = str(INTRUDERS_DIR / snap_name) if snap_name else None

        def _sender():
            try:
                import httpx
                if "discord.com/api/webhooks" in url:
                    content = f"🛡️ **ANDERSON SENTINEL // {event_type}**\n{message}\nTimestamp: `{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`"
                    files = {}
                    if snap_path and os.path.exists(snap_path):
                        with open(snap_path, "rb") as f:
                            files = {"file": (os.path.basename(snap_path), f.read(), "image/jpeg")}
                        httpx.post(url, data={"content": content}, files=files, timeout=6.0)
                    else:
                        httpx.post(url, json={"content": content}, timeout=6.0)
                else:
                    payload = {
                        "event": event_type,
                        "message": message,
                        "timestamp": datetime.now().isoformat(),
                        "snapshot": snap_name
                    }
                    httpx.post(url, json=payload, timeout=6.0)
            except Exception as e:
                print(f"[Sentinel] Webhook notification error: {e}")

        threading.Thread(target=_sender, daemon=True).start()

    def _fuse_optical_to_rf(self, results, raw_frame):
        """Project primary optical face detection into RF ground-truth coordinates."""
        if not results or not hasattr(self, "wifi_xray") or not self.wifi_xray.running:
            return False
        try:
            primary = results[0]
            bbox = primary.get("box") or primary.get("bbox")
            if bbox and len(bbox) == 4:
                bx, by, bw, bh = bbox
                fh, fw = raw_frame.shape[:2]
                focal_length = fw * 0.92
                real_face_width_m = 0.16
                z_m = (focal_length * real_face_width_m) / max(1, bw)
                x_m = ((bx + bw / 2.0) - (fw / 2.0)) * (z_m / focal_length)
                y_m = ((by + bh / 2.0) - (fh / 2.0)) * (z_m / focal_length)
                self.wifi_xray.calibrate_optical_ground_truth(round(x_m, 2), round(y_m, 2), round(z_m, 2))
                return True
        except Exception:
            pass
        return False

    def _sentinel_loop(self):
        while self.running:
            raw_frame = self.camera.get_frame()
            if raw_frame is None:
                time.sleep(0.03)
                continue

            threshold = float(self.settings.get("similarity_threshold", 0.363))
            welcome_cd = float(self.settings.get("welcome_cooldown_sec", 18.0))
            intruder_cd = float(self.settings.get("intruder_cooldown_sec", 7.0))
            shoulder_cd = float(self.settings.get("shoulder_cooldown_sec", 10.0))
            walk_away_cd = float(self.settings.get("walk_away_lock_sec", 0.0))
            armed = bool(self.settings.get("armed", True))

            results = self.detector.detect_and_recognize(raw_frame, threshold=threshold)
            now = time.time()

            # Optical-to-RF ground-truth sensor fusion (reads "box" or "bbox")
            self._fuse_optical_to_rf(results, raw_frame)

            hud_frame = self.detector.draw_hud(raw_frame, results, armed=armed, vision_mode=self.vision_mode)

            with self.lock:
                self.last_processed_frame = raw_frame
                self.last_hud_frame = hud_frame
                self.current_targets = results

            if armed:
                anderson_found = any(r["is_anderson"] for r in results) if results else False
                strangers = [r for r in results if r["has_templates"] and not r["is_anderson"]] if results else []

                if anderson_found:
                    self.last_anderson_seen_time = now
                    self.was_anderson_present = True
                elif walk_away_cd > 0 and self.was_anderson_present:
                    if (now - self.last_anderson_seen_time) > walk_away_cd:
                        self.was_anderson_present = False
                        self._log_event("SYSTEM", f"Presence timeout ({int(walk_away_cd)}s). Locking workstation.")
                        self.synth.speak("User departed. Locking terminal.", alert_type="walk_away")
                        self._send_desktop_notification("Anderson Sentinel", "Walk-away lock activated. Session locked.", urgency="normal")
                        self._lock_system_screen()

                if results:
                    if anderson_found and strangers and self.settings.get("shoulder_surfer_alert", True):
                        if (now - self.last_shoulder_alert_time) > shoulder_cd:
                            self.last_shoulder_alert_time = now
                            shoulder_text = self.settings.get("shoulder_phrase", "Warning. Someone is looking over your shoulder.")
                            max_sim = max([s["similarity"] for s in strangers])
                            snap_name = self._save_intruder_snapshot(raw_frame, max_sim) if self.settings.get("save_intruder_snapshots", True) else None

                            self._log_event("SHOULDER", "SHOULDER SURFER DETECTED: Secondary face observed behind operator.", {"snapshot": snap_name})
                            self.synth.speak(shoulder_text, alert_type="shoulder")
                            self._send_desktop_notification(
                                "SHOULDER SURFER ALERT",
                                "Secondary face detected looking at your screen!",
                                urgency="critical"
                            )
                            self._dispatch_webhook("SHOULDER_SURFER", shoulder_text, snap_name)
                            self._broadcast("alert", {"type": "shoulder", "message": shoulder_text, "snapshot": snap_name})

                    elif anderson_found and not strangers:
                        if (now - self.last_welcome_time) > welcome_cd:
                            self.last_welcome_time = now
                            welcome_text = self.settings.get("welcome_phrase", "Welcome back, Mr. Anderson.")
                            self._log_event("AUTHORIZED", "Mr. Anderson recognized! Dispatching welcome greeting.")
                            self.synth.speak(welcome_text, alert_type="welcome")
                            self._send_desktop_notification("Anderson Sentinel // Authorized", "Welcome back, Mr. Anderson.", urgency="normal")
                            self._broadcast("alert", {"type": "welcome", "message": welcome_text})

                    elif strangers and not anderson_found:
                        if (now - self.last_intruder_alert_time) > intruder_cd:
                            self.last_intruder_alert_time = now
                            intruder_text = self.settings.get("intruder_phrase", DEFAULT_INTRUDER_PHRASE)
                            max_sim = max([s["similarity"] for s in strangers])
                            snap_name = self._save_intruder_snapshot(raw_frame, max_sim) if self.settings.get("save_intruder_snapshots", True) else None

                            self._log_event(
                                "BREACH",
                                "SECURITY ALERT: Unauthorized target detected! Warning triggered.",
                                {"similarity": f"{max_sim:.2f}", "snapshot": snap_name}
                            )
                            self.synth.speak(intruder_text, alert_type="intruder")
                            self._send_desktop_notification(
                                "SECURITY BREACH // INTRUDER DETECTED",
                                "Unauthorized target spotted at console. Defenses active.",
                                urgency="critical"
                            )
                            self._dispatch_webhook("SECURITY_BREACH", intruder_text, snap_name)

                            if self.settings.get("auto_lockdown_on_breach", False):
                                self._lock_system_screen()
                                self._log_event("SYSTEM", "Auto-Lockdown executed: session locked.")

                            self._broadcast("alert", {
                                "type": "intruder",
                                "message": intruder_text,
                                "snapshot": snap_name
                            })

            time.sleep(0.03)  # ~30 FPS loop rate

    def get_latest_jpeg(self, use_hud=True):
        with self.lock:
            frame = self.last_hud_frame if (use_hud and self.last_hud_frame is not None) else self.last_processed_frame

        if frame is None:
            blank = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(blank, "ANDERSON SENTINEL // CAMERA STANDBY", (85, 225),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.72, (0, 255, 120), 2, cv2.LINE_AA)
            cv2.putText(blank, "RF TOMOGRAPHY & USB/BLE PERIMETER ACTIVE", (80, 260),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.52, (0, 229, 255), 1, cv2.LINE_AA)
            ret, jpeg = cv2.imencode(".jpg", blank, [cv2.IMWRITE_JPEG_QUALITY, 75])
            return jpeg.tobytes()

        ret, jpeg = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        return jpeg.tobytes()
