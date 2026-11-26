"""
Anderson Sentinel // Bluetooth BLE Counter-Surveillance & Proximity Guard
Monitors nearby Bluetooth Low Energy (BLE) beacons and mobile devices via bluetoothctl.
Tracks configured owner beacon proximity for secondary cryptographic trust,
and detects unauthorized rogue devices lingering in close range.
"""

import re
import math
import time
import subprocess
import threading
from datetime import datetime


class BluetoothPerimeterGuard:
    def __init__(self, scan_interval=6.0, trusted_macs=None):
        self.scan_interval = max(1.0, float(scan_interval))
        self.trusted_macs = set(mac.upper() for mac in (trusted_macs or []) if isinstance(mac, str) and mac.strip())
        self.running = False
        self.thread = None
        self.lock = threading.Lock()
        self._stop_event = threading.Event()

        self.devices = {}  # MAC -> dict
        self.owner_device_near = False
        self.last_scan_time = 0
        self.callbacks = []

    def add_callback(self, cb):
        self.callbacks.append(cb)

    def _notify(self, event_type, data):
        for cb in list(self.callbacks):
            try:
                cb(event_type, data)
            except Exception:
                pass

    def _rssi_to_distance(self, rssi_dbm, tx_power=-59.0, n=2.4):
        """Estimate Bluetooth beacon distance using indoor log-distance model."""
        if rssi_dbm == 0:
            return 10.0
        try:
            ratio = (tx_power - rssi_dbm) / (10.0 * n)
            dist = math.pow(10.0, ratio)
            return max(0.3, round(dist, 1))
        except Exception:
            return 5.0

    def _query_bluetoothctl_devices(self):
        """Extract all discovered and paired devices from bluetoothctl."""
        devices = []
        try:
            cmd = ["/usr/bin/bluetoothctl", "devices"]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5.0)
            if res.returncode != 0:
                return devices

            for line in res.stdout.strip().split("\n"):
                # Line format: "Device AA:BB:CC:DD:EE:FF Operator Beacon"
                match = re.match(r"^Device\s+([0-9A-Fa-f:]{17})\s+(.*)$", line.strip())
                if match:
                    mac = match.group(1).upper()
                    name = match.group(2).strip() or "Unnamed Beacon"
                    devices.append({"mac": mac, "name": name})

            for dev in devices[:8]:
                try:
                    info_cmd = ["/usr/bin/bluetoothctl", "info", dev["mac"]]
                    info_res = subprocess.run(info_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2.0)
                    rssi_match = re.search(r"RSSI:\s+(-?\d+)", info_res.stdout)
                    connected_match = re.search(r"Connected:\s+(yes|no)", info_res.stdout, re.IGNORECASE)
                    paired_match = re.search(r"Paired:\s+(yes|no)", info_res.stdout, re.IGNORECASE)

                    dev["rssi"] = int(rssi_match.group(1)) if rssi_match else -65
                    dev["connected"] = (connected_match.group(1).lower() == "yes") if connected_match else False
                    dev["paired"] = (paired_match.group(1).lower() == "yes") if paired_match else False
                except Exception:
                    dev["rssi"] = -70
                    dev["connected"] = False
                    dev["paired"] = False

            return devices
        except Exception as e:
            print(f"[Bluetooth Guard] Scan error: {e}")
            return devices

    def start(self):
        if self.running:
            return
        self.running = True
        self._stop_event.clear()
        self.thread = threading.Thread(target=self._scan_loop, daemon=True)
        self.thread.start()
        print("[Bluetooth Guard] BLE Counter-Surveillance & Proximity Guard started.")

    def stop(self):
        self.running = False
        self._stop_event.set()
        if self.thread:
            self.thread.join(timeout=1.0)
            self.thread = None
        print("[Bluetooth Guard] BLE Guard stopped.")

    def _scan_loop(self):
        while self.running:
            raw_devices = self._query_bluetoothctl_devices()
            now = time.time()
            updated = {}
            owner_present = False

            for dev in raw_devices:
                mac = dev["mac"]
                name = dev["name"]
                rssi = dev.get("rssi", -70)
                dist_m = self._rssi_to_distance(rssi)
                is_owner = mac in self.trusted_macs
                is_paired = dev.get("paired", False)

                if is_owner:
                    owner_present = True
                    trust_label = "OWNER_DEVICE"
                elif is_paired:
                    trust_label = "TRUSTED_PERIPHERAL"
                else:
                    trust_label = "UNKNOWN_LINGERING"

                is_rogue_close = (trust_label == "UNKNOWN_LINGERING" and dist_m < 2.5)

                node = {
                    "mac": mac,
                    "name": name,
                    "rssi": rssi,
                    "distance_m": dist_m,
                    "trust_label": trust_label,
                    "is_owner": is_owner,
                    "is_paired": is_paired,
                    "is_rogue_close": is_rogue_close,
                    "last_seen": now
                }
                updated[mac] = node

                if is_rogue_close:
                    self._notify("ble_proximity_alert", {
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "device": node
                    })

            with self.lock:
                self.devices = updated
                self.owner_device_near = owner_present
                self.last_scan_time = now

            self._notify("bluetooth_update", self.get_status())
            self._stop_event.wait(self.scan_interval)

    def get_status(self):
        with self.lock:
            dev_list = sorted(self.devices.values(), key=lambda d: d["distance_m"])
            owner_dev = next((d for d in dev_list if d.get("is_owner")), None)
            return {
                "active": self.running,
                "owner_present": self.owner_device_near,
                "owner_device": owner_dev,
                "trusted_macs_count": len(self.trusted_macs),
                "total_devices": len(dev_list),
                "devices": dev_list,
                "last_scan_time": self.last_scan_time
            }
