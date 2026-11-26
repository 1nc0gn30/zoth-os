import os
import json
from pathlib import Path

HOME = Path.home()
CACHE_DIR = HOME / ".cache" / "anderson_security"
CONFIG_DIR = HOME / ".config" / "anderson_security"
MODELS_DIR = CACHE_DIR / "models"
AUDIO_DIR = CACHE_DIR / "audio"
INTRUDERS_DIR = CONFIG_DIR / "intruders"

CACHE_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)
INTRUDERS_DIR.mkdir(parents=True, exist_ok=True)

YUNET_MODEL_PATH = str(MODELS_DIR / "face_detection_yunet.onnx")
SFACE_MODEL_PATH = str(MODELS_DIR / "face_recognition_sface.onnx")
ENROLLED_FACES_PATH = str(CONFIG_DIR / "enrolled_faces.npz")
SETTINGS_FILE = str(CONFIG_DIR / "settings.json")

DEFAULT_INTRUDER_PHRASE = "Security alert. Unauthorized presence detected. Perimeter logging active."

DEFAULT_SETTINGS = {
    "armed": True,
    "similarity_threshold": 0.363,
    "welcome_cooldown_sec": 18.0,
    "intruder_cooldown_sec": 7.0,
    "welcome_phrase": "Welcome back, Mr. Anderson.",
    "intruder_phrase": DEFAULT_INTRUDER_PHRASE,
    "tts_engine": "edge",  # "edge" or "espeak"
    "tts_voice": "en-US-ChristopherNeural",
    "tts_volume": 100,
    "camera_index": 0,
    "save_intruder_snapshots": True,
    "draw_hud_on_stream": True,
    "auto_lockdown_on_breach": False,
    "desktop_notifications": True,
    "shoulder_surfer_alert": True,
    "shoulder_phrase": "Warning. Someone is looking over your shoulder.",
    "shoulder_cooldown_sec": 10.0,
    "walk_away_lock_sec": 0,  # 0 to disable, or seconds like 20
    "webhook_url": "",
    "play_sound_effects": True,
    "wifi_xray_enabled": True,
    "wifi_scan_interval_sec": 3.0,
    "wifi_path_loss_n": 2.6,
    "rf_presence_alerts": True,
    "rf_alert_cooldown_sec": 12.0,
    "rf_audio_ping": True,
    "vision_mode": "normal",  # "normal" (alias "optical"), "thermal", "predator"
    "usb_guard_enabled": True,
    "auto_lockdown_on_usb_breach": True,
    "ble_guard_enabled": True,
    "trusted_bluetooth_macs": [],
    "web_host": "127.0.0.1",
    "web_port": 7890
}


def load_settings():
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                if not isinstance(saved, dict):
                    raise ValueError("settings.json must contain a JSON object")
                settings = dict(DEFAULT_SETTINGS)
                settings.update(saved)
                return settings
        except Exception as e:
            print(f"[Config] Error loading settings: {e}")
    return dict(DEFAULT_SETTINGS)


def save_settings(settings):
    try:
        tmp = SETTINGS_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(settings, f, indent=2)
        os.replace(tmp, SETTINGS_FILE)  # atomic: a crash mid-write can't corrupt settings
    except Exception as e:
        print(f"[Config] Error saving settings: {e}")
