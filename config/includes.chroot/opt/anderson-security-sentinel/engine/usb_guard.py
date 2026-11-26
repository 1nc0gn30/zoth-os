"""
Anderson Sentinel // USB Hardware Guard & BadUSB / Rubber Ducky Tripwire
Monitors the Linux sysfs USB subsystem (/sys/bus/usb/devices/) in real-time.
Baselines existing hardware and instantly trips Defcon 1 upon unauthorized
device insertion (e.g. BadUSB keystroke injection, flash drives) while armed.
"""

import os
import time
import threading
from pathlib import Path
from datetime import datetime

USB_SYSFS_PATH = Path("/sys/bus/usb/devices")

class UsbTripwireGuard:
    def __init__(self, poll_interval=0.5):
        self.poll_interval = poll_interval
        self.running = False
        self.thread = None
        self.lock = threading.Lock()
        
        self.baseline_devices = {}
        self.current_devices = {}
        self.recent_events = []
        self.callbacks = []
        
        # Take initial hardware baseline
        self._refresh_device_map()
        self.baseline_devices = dict(self.current_devices)

    def add_callback(self, cb):
        self.callbacks.append(cb)

    def _notify(self, event_type, data):
        for cb in list(self.callbacks):
            try:
                cb(event_type, data)
            except Exception:
                pass

    def _read_sysfs_attr(self, dev_dir, attr_name):
        try:
            p = dev_dir / attr_name
            if p.exists():
                with open(p, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read().strip()
        except Exception:
            pass
        return ""

    def _refresh_device_map(self):
        new_map = {}
        if not USB_SYSFS_PATH.exists():
            return new_map

        for entry in USB_SYSFS_PATH.iterdir():
            # Filter device nodes like 1-1, 1-2, 2-1 (skip interfaces like 1-1:1.0)
            name = entry.name
            if ":" in name or not (name.startswith("usb") or "-" in name):
                continue

            id_vendor = self._read_sysfs_attr(entry, "idVendor")
            id_product = self._read_sysfs_attr(entry, "idProduct")
            manufacturer = self._read_sysfs_attr(entry, "manufacturer")
            product = self._read_sysfs_attr(entry, "product")
            serial = self._read_sysfs_attr(entry, "serial")
            speed = self._read_sysfs_attr(entry, "speed")
            dev_class = self._read_sysfs_attr(entry, "bDeviceClass")

            if id_vendor or id_product:
                key = f"{name}_{id_vendor}:{id_product}"
                new_map[key] = {
                    "sys_name": name,
                    "id_vendor": id_vendor,
                    "id_product": id_product,
                    "manufacturer": manufacturer or "Unknown Manufacturer",
                    "product": product or "USB Peripheral",
                    "serial": serial,
                    "speed": speed,
                    "class": dev_class,
                    "discovered_at": time.time()
                }

        self.current_devices = new_map
        return new_map

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        print(f"[USB Guard] Hardware Tripwire active. Baseline: {len(self.baseline_devices)} authorized USB nodes.")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1.0)
            self.thread = None
        print("[USB Guard] Hardware Tripwire stopped.")

    def reset_baseline(self):
        """Authorize all currently plugged USB devices."""
        with self.lock:
            self._refresh_device_map()
            self.baseline_devices = dict(self.current_devices)
            print(f"[USB Guard] Baseline re-calibrated. {len(self.baseline_devices)} devices trusted.")

    def _monitor_loop(self):
        while self.running:
            try:
                with self.lock:
                    previous_keys = set(self.current_devices.keys())
                    self._refresh_device_map()
                    current_keys = set(self.current_devices.keys())

                    # Detect newly inserted devices
                    inserted_keys = current_keys - set(self.baseline_devices.keys())
                    if inserted_keys:
                        for k in inserted_keys:
                            dev = self.current_devices[k]
                            # Avoid duplicate triggers
                            if k not in previous_keys:
                                evt = {
                                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                    "device": dev,
                                    "action": "INSERTION",
                                    "type": "ROGUE_USB_DETECTED"
                                }
                                self.recent_events.insert(0, evt)
                                if len(self.recent_events) > 50:
                                    self.recent_events.pop()
                                print(f"[USB Guard] ⚠️ ROGUE USB HARDWARE DETECTED: {dev['manufacturer']} - {dev['product']} (VID:{dev['id_vendor']} PID:{dev['id_product']})")
                                self._notify("usb_breach", evt)

                    # Detect removed devices
                    removed_keys = previous_keys - current_keys
                    for k in removed_keys:
                        print(f"[USB Guard] USB Device disconnected: {k}")
            except Exception as e:
                print(f"[USB Guard] Polling exception: {e}")

            time.sleep(self.poll_interval)

    def get_status(self):
        with self.lock:
            return {
                "active": self.running,
                "trusted_count": len(self.baseline_devices),
                "current_count": len(self.current_devices),
                "untrusted_devices": [
                    dev for k, dev in self.current_devices.items()
                    if k not in self.baseline_devices
                ],
                "recent_events": self.recent_events[:10]
            }
