"""
Anderson Sentinel // Surveillance Camera & RF Spectrum Intelligence Engine
Discovers and classifies surveillance cameras, CCTV devices, IP video streams,
and IoT optical sensors via ambient WiFi beacon signatures and local network probes.
"""

import re
import socket
import subprocess
from datetime import datetime

# Known Surveillance Camera & IoT Video Manufacturer OUI Prefixes
CAMERA_OUI_DATABASE = {
    # Hikvision
    "44:19:b6": "Hikvision Digital Technology",
    "c4:2f:90": "Hikvision Digital Technology",
    "bc:ad:28": "Hikvision Digital Technology",
    "54:c4:15": "Hikvision Digital Technology",
    "e0:50:8b": "Hikvision Digital Technology",
    "cc:81:da": "Hikvision Digital Technology",
    # Dahua
    "38:af:29": "Dahua Technology",
    "4c:11:bf": "Dahua Technology / Amcrest",
    "e4:24:6c": "Dahua Technology",
    "90:02:a9": "Dahua Technology",
    "b4:a3:82": "Dahua Technology",
    # Ring (Amazon)
    "34:3e:a4": "Ring LLC (Amazon Doorbell/Cam)",
    "9c:76:13": "Ring LLC (Amazon Doorbell/Cam)",
    "cc:f4:11": "Ring LLC (Amazon Doorbell/Cam)",
    "a0:9f:10": "Ring LLC (Amazon Doorbell/Cam)",
    # Wyze Labs
    "2c:aa:8e": "Wyze Labs Inc (WyzeCam)",
    "7c:78:b2": "Wyze Labs Inc (WyzeCam)",
    "a4:da:22": "Wyze Labs Inc (WyzeCam)",
    # Arlo (Netgear)
    "28:80:88": "Arlo Technologies",
    "94:10:3e": "Arlo Technologies",
    "00:43:ff": "Arlo Technologies",
    # Nest / Google
    "18:b4:30": "Google Nest Cam",
    "64:16:66": "Google Nest Cam",
    "d8:6c:63": "Google Nest Cam",
    # Reolink
    "ec:71:db": "Reolink Innovation",
    "bc:32:53": "Reolink Innovation",
    # Eufy (Anker)
    "70:d3:79": "Anker EufyCam",
    "60:74:f4": "Anker EufyCam",
    # Amcrest
    "9c:8e:cd": "Amcrest Technologies",
    # Axis Communications
    "00:40:8c": "Axis Communications (Enterprise CCTV)",
    "ac:cc:8e": "Axis Communications (Enterprise CCTV)",
    "b8:a4:4f": "Axis Communications (Enterprise CCTV)",
    # TP-Link Tapo / Kasa Cam
    "50:c7:bf": "TP-Link Tapo Cam",
    "68:ff:7b": "TP-Link Tapo Cam",
    "34:60:f9": "TP-Link Tapo Cam",
    "80:ea:07": "TP-Link Kasa Cam",
    # Tuya Smart Cam Modules
    "10:2c:6b": "Tuya Smart Cam",
    "70:89:71": "Tuya Smart Cam",
    "d4:d2:d6": "Tuya Smart Cam",
    "84:f3:eb": "Tuya Smart Cam",
    # Espressif ESP32-CAM Modules
    "24:6f:28": "Espressif ESP32-CAM",
    "30:ae:a4": "Espressif ESP32-CAM",
    "3c:61:05": "Espressif ESP32-CAM",
    "24:0a:c4": "Espressif ESP32-CAM",
    "84:0d:8e": "Espressif ESP32-CAM",
    "a0:20:a6": "Espressif ESP32-CAM",
    # Hanwha / Samsung Techwin
    "00:16:6c": "Hanwha Techwin (Samsung CCTV)",
    "00:09:18": "Hanwha Techwin (Samsung CCTV)",
    # Foscam
    "00:62:6e": "Foscam Intelligent Technology",
    "e8:ab:fa": "Foscam Intelligent Technology",
    # Blink (Amazon)
    "00:03:7f": "Blink Home Video (Amazon)",
    "3c:5a:37": "Blink Home Video (Amazon)",
    # GoPro / DJI
    "d4:32:60": "GoPro Wireless Camera",
    "60:60:1f": "DJI Action/Drone Camera"
}

# Major Networking & AP OUI Database for Real Facts Inspector
VENDOR_OUI_DATABASE = {
    "e0:63:da": "Ubiquiti Inc. (UniFi Enterprise AP)",
    "e6:63:da": "Ubiquiti Inc. (UniFi Enterprise AP)",
    "ea:63:da": "Ubiquiti Inc. (UniFi Enterprise AP)",
    "f0:9f:c2": "Ubiquiti Inc. (UniFi)",
    "74:83:c2": "Ubiquiti Inc. (UniFi)",
    "62:7f:f0": "Cisco Meraki Systems",
    "66:7f:f0": "Cisco Meraki Systems",
    "00:1b:2a": "Cisco Systems",
    "00:27:0d": "Cisco Systems",
    "ca:9c:3e": "Ruckus Wireless / CommScope",
    "cc:9c:3e": "Ruckus Wireless / CommScope",
    "ce:9c:2e": "Ruckus Wireless / CommScope",
    "ca:9c:2e": "Ruckus Wireless / CommScope",
    "f2:9c:2e": "Ruckus Wireless / CommScope",
    "02:8d:cb": "Fortinet Inc. / FortiAP",
    "1e:8d:cb": "Fortinet Inc. / FortiAP",
    "1a:8d:cb": "Fortinet Inc. / FortiAP",
    "32:8d:cb": "Fortinet Inc. / FortiAP",
    "00:09:b0": "Fortinet Inc.",
    "c4:ad:34": "Mist Systems (Juniper AI)",
    "70:69:79": "Mist Systems (Juniper AI)",
    "00:18:0a": "Cisco Meraki",
    "ac:17:02": "Apple Inc.",
    "f0:18:98": "Apple Inc.",
    "3c:22:fb": "Apple Inc.",
    "a4:83:e7": "Apple Inc.",
    "9c:20:7b": "Apple Inc.",
    "bc:d0:74": "Intel Corporation",
    "ec:2e:98": "Intel Corporation",
    "98:af:65": "Intel Corporation",
    "4a:ea:62": "Hewlett-Packard (WiFi Direct)",
    "48:21:0b": "Hewlett-Packard",
    "00:0e:c6": "ASUSTeK Computer",
    "04:d9:f5": "ASUSTeK Computer",
    "20:76:93": "Netgear Inc.",
    "a0:04:60": "Netgear Inc.",
    "c0:ff:d4": "Netgear Inc.",
    "98:de:d0": "TP-Link Technologies",
    "50:d4:f7": "TP-Link Technologies"
}

# Regex for detecting camera names in SSID broadcast
CAMERA_SSID_REGEX = re.compile(
    r"(camera|cam|ipcam|cctv|surveillance|dashcam|doorbell|webcam|nvr|dvr|ring|wyze|arlo|reolink|eufy|nest|amcrest|blink|tapo|foscam|yi[-_ ]|dahua|hikvision|gopro|dji)",
    re.IGNORECASE
)

class SurveillanceScanner:
    """
    Scans ambient WiFi beacons and local IP neighbors to discover,
    triangulate, and categorize surveillance cameras and optical sensors.
    """
    def __init__(self):
        self.detected_cameras = {}
        self.last_scan_time = 0.0

    def resolve_vendor(self, mac_address):
        """Resolves hardware vendor from MAC address OUI (first 3 bytes)."""
        clean = mac_address.replace("-", ":").lower()
        parts = clean.split(":")
        if len(parts) >= 3:
            oui = f"{parts[0]}:{parts[1]}:{parts[2]}"
            if oui in CAMERA_OUI_DATABASE:
                return CAMERA_OUI_DATABASE[oui], True
            if oui in VENDOR_OUI_DATABASE:
                return VENDOR_OUI_DATABASE[oui], False
        return "Standard IEEE 802.11 Transceiver", False

    def scan_rf_beacons_for_cameras(self, nodes_list):
        """
        Analyzes the list of detected WiFi nodes to identify surveillance cameras.
        """
        cameras = []
        for node in nodes_list:
            bssid = node.get("bssid", "")
            ssid = node.get("ssid", "")
            vendor, is_cam_oui = self.resolve_vendor(bssid)
            
            is_cam_ssid = bool(CAMERA_SSID_REGEX.search(ssid))
            is_direct = ssid.upper().startswith("DIRECT-")
            
            if is_cam_oui or is_cam_ssid:
                if is_cam_oui:
                    brand = vendor.split(" ")[0]
                    category = "SURVEILLANCE CAMERA (OUI MATCH)"
                elif is_cam_ssid:
                    match = CAMERA_SSID_REGEX.search(ssid)
                    brand = match.group(1).upper() if match else "GENERIC CAMERA"
                    category = "SURVEILLANCE CAMERA (SSID IDENTIFIER)"
                else:
                    brand = "UNKNOWN CAMERA"
                    category = "SUSPECT OPTICAL SENSOR"

                dist = node.get("distance_m", 5.0)
                if dist < 4.0:
                    threat = "HIGH PROXIMITY [IMMEDIATE AREA]"
                    threat_level = 3
                elif dist < 9.0:
                    threat = "LOCAL PERIMETER [ADJACENT]"
                    threat_level = 2
                else:
                    threat = "EXTERNAL MONITOR"
                    threat_level = 1

                cam_entry = {
                    "id": bssid,
                    "type": "wifi_beacon",
                    "brand": brand,
                    "model_or_ssid": ssid,
                    "category": category,
                    "vendor": vendor,
                    "bssid": bssid,
                    "channel": node.get("channel", "?"),
                    "freq_mhz": node.get("freq_mhz", 2412),
                    "band": node.get("band", "2.4GHz"),
                    "distance_m": dist,
                    "signal_pct": node.get("signal_pct", 50),
                    "rssi_dbm": node.get("rssi_dbm", -70.0),
                    "security": node.get("security", "WPA2"),
                    "threat": threat,
                    "threat_level": threat_level,
                    "x_m": node.get("x_m", 0.0),
                    "y_m": node.get("y_m", 0.0),
                    "first_seen": node.get("last_seen", datetime.now().strftime("%H:%M:%S")),
                    "is_disturbed": node.get("is_disturbed", False)
                }
                cameras.append(cam_entry)

        self.detected_cameras = {c["bssid"]: c for c in cameras}
        return cameras

    def get_summary(self):
        cams = list(self.detected_cameras.values())
        cams.sort(key=lambda c: c["distance_m"])
        high_prox = [c for c in cams if c["distance_m"] < 4.5]
        return {
            "total_cameras": len(cams),
            "high_proximity_count": len(high_prox),
            "cameras": cams
        }
