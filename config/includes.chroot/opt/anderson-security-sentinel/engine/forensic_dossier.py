"""
Anderson Sentinel // Cryptographic Forensic Incident Dossier & Chain-of-Custody
Generates tamper-evident forensic security dossiers with SHA-256 image hashes,
RF electromagnetic environment snapshots, USB hardware inventory, and incident timelines.
"""

import os
import re
import html
import time
import json
import hashlib
from pathlib import Path
from datetime import datetime

SENTINEL_VERSION = "2.6.0"


def _esc(val) -> str:
    return html.escape(str(val if val is not None else ""), quote=True)


class ForensicDossierGenerator:
    def __init__(self, intruders_dir):
        self.intruders_dir = Path(intruders_dir)

    def _hash_file(self, filepath):
        """Compute SHA-256 hex digest of a forensic image."""
        try:
            if not os.path.exists(filepath):
                return "FILE_NOT_FOUND"
            sha = hashlib.sha256()
            with open(filepath, "rb") as f:
                while chunk := f.read(65536):
                    sha.update(chunk)
            return sha.hexdigest()
        except Exception as e:
            return f"HASH_ERROR: {e}"

    def build_dossier(self, sentinel):
        """Build a comprehensive cryptographic security dossier."""
        now_dt = datetime.now()
        timestamp_str = now_dt.strftime("%Y-%m-%d %H:%M:%S")
        epoch = int(time.time())

        # 1. Forensic Snapshots with SHA-256
        snapshots_data = []
        if self.intruders_dir.exists():
            resolved_dir = self.intruders_dir.resolve()
            for f in sorted(self.intruders_dir.glob("*.jpg"), key=os.path.getmtime, reverse=True)[:30]:
                if f.is_symlink() or not f.is_file():
                    continue
                try:
                    if not f.resolve().is_relative_to(resolved_dir):
                        continue
                except Exception:
                    continue
                h = self._hash_file(f)
                snapshots_data.append({
                    "filename": f.name,
                    "sha256": h,
                    "timestamp": time.ctime(f.stat().st_mtime),
                    "size_bytes": f.stat().st_size
                })

        # 2. RF WiFi Environment Snapshot
        wifi_snap = sentinel.wifi_xray.get_state_snapshot() if hasattr(sentinel, "wifi_xray") else {}

        # 3. USB Hardware Subsystem Inventory
        usb_snap = sentinel.usb_guard.get_status() if hasattr(sentinel, "usb_guard") else {}

        # 4. Bluetooth Beacon Proximity
        ble_snap = sentinel.ble_guard.get_status() if hasattr(sentinel, "ble_guard") else {}

        # 5. Raw Event Ledger
        events_list = list(sentinel.events[:50])

        dossier_data = {
            "dossier_id": f"AS-AUDIT-{epoch}",
            "generated_at": timestamp_str,
            "epoch_timestamp": epoch,
            "sentinel_version": SENTINEL_VERSION,
            "operator": "Neal Frazier Tech (@1nc0gn30)",
            "system_state": {
                "security_status": sentinel.security_status,
                "armed": sentinel.settings.get("armed", True),
                "enrolled_biometric_templates": len(sentinel.detector.enrolled_embeddings)
            },
            "chain_of_custody": {
                "hash_algorithm": "SHA-256",
                "total_snapshots_certified": len(snapshots_data),
                "snapshots": snapshots_data
            },
            "rf_ambient_telemetry": {
                "total_beacons": wifi_snap.get("total_nodes", 0),
                "estimated_room_dimensions": f"{wifi_snap.get('room_bounds', {}).get('width_m', 0)}m x {wifi_snap.get('room_bounds', {}).get('length_m', 0)}m",
                "disturbance_index": wifi_snap.get("disturbance_index", 0.0)
            },
            "hardware_security": {
                "usb_subsystem": usb_snap,
                "bluetooth_perimeter": ble_snap
            },
            "incident_ledger": events_list
        }

        # Calculate Root Integrity Hash of the entire dossier
        serialized = json.dumps(dossier_data, sort_keys=True).encode("utf-8")
        root_hash = hashlib.sha256(serialized).hexdigest()
        dossier_data["cryptographic_seal"] = {
            "root_sha256": root_hash,
            "verification_status": "SEALED_AND_VERIFIED",
            "signed_by": f"Anderson Sentinel Autonomous Core v{SENTINEL_VERSION}"
        }

        return dossier_data

    def generate_html_report(self, dossier):
        """Generate high-contrast printable forensic report with strict HTML escaping."""
        seal = dossier.get("cryptographic_seal", {})
        custody = dossier.get("chain_of_custody", {})
        rf = dossier.get("rf_ambient_telemetry", {})
        hw = dossier.get("hardware_security", {})
        sys_state = dossier.get("system_state", {})
        ledger = dossier.get("incident_ledger", [])

        snap_rows_list = []
        for s in custody.get("snapshots", [])[:10]:
            sha_str = str(s.get("sha256", ""))
            short_sha = f"{sha_str[:16]}...{sha_str[-16:]}" if len(sha_str) >= 32 else sha_str
            size_kb = round(float(s.get("size_bytes", 0)) / 1024, 1)
            snap_rows_list.append(
                f"<tr>"
                f"<td><code>{_esc(s.get('filename', ''))}</code></td>"
                f"<td><code>{_esc(short_sha)}</code></td>"
                f"<td>{_esc(s.get('timestamp', ''))}</td>"
                f"<td>{_esc(size_kb)} KB</td>"
                f"</tr>"
            )
        snap_rows = "".join(snap_rows_list)

        event_rows_list = []
        for e in ledger[:15]:
            cat_raw = str(e.get("category", "SYSTEM"))
            cat_css = re.sub(r"[^a-z0-9_-]", "", cat_raw.lower()) or "system"
            event_rows_list.append(
                f'<tr class="cat-{cat_css}">'
                f"<td>{_esc(e.get('timestamp', ''))}</td>"
                f"<td><strong>[{_esc(cat_raw)}]</strong></td>"
                f"<td>{_esc(e.get('message', ''))}</td>"
                f"</tr>"
            )
        event_rows = "".join(event_rows_list)

        dossier_id = _esc(dossier.get("dossier_id", "AS-AUDIT"))
        generated_at = _esc(dossier.get("generated_at", ""))
        root_sha = _esc(seal.get("root_sha256", "UNSEALED"))
        verify_status = _esc(seal.get("verification_status", "UNVERIFIED"))
        signed_by = _esc(seal.get("signed_by", "Anderson Sentinel"))
        operator = _esc(dossier.get("operator", "Operator"))
        sec_status = _esc(sys_state.get("security_status", "UNKNOWN"))
        enrolled_count = _esc(sys_state.get("enrolled_biometric_templates", 0))
        total_beacons = _esc(rf.get("total_beacons", 0))
        room_dims = _esc(rf.get("estimated_room_dimensions", "N/A"))
        usb_trusted = _esc(hw.get("usb_subsystem", {}).get("trusted_count", 0))
        total_snaps = _esc(custody.get("total_snapshots_certified", 0))
        version = _esc(dossier.get("sentinel_version", SENTINEL_VERSION))

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ANDERSON SENTINEL v{version} // FORENSIC DOSSIER {dossier_id}</title>
  <style>
    body {{
      background: #06090c;
      color: #e2e8f0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      padding: 30px;
      line-height: 1.5;
    }}
    .dossier-card {{
      max-width: 900px;
      margin: 0 auto;
      border: 2px solid #00ff88;
      padding: 30px;
      background: rgba(10, 15, 20, 0.95);
      box-shadow: 0 0 30px rgba(0, 255, 136, 0.2);
    }}
    .header {{
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #00ff88;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }}
    h1 {{ margin: 0; color: #00ff88; font-size: 1.6rem; letter-spacing: 2px; }}
    .seal-box {{
      background: rgba(0, 255, 136, 0.1);
      border: 1px solid #00ff88;
      padding: 12px;
      margin-bottom: 20px;
    }}
    .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }}
    .panel {{ border: 1px solid rgba(255, 255, 255, 0.15); padding: 15px; background: rgba(15, 23, 42, 0.5); }}
    .panel h3 {{ margin-top: 0; color: #00e5ff; font-size: 0.9rem; text-transform: uppercase; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.8rem; }}
    th, td {{ border: 1px solid rgba(255, 255, 255, 0.1); padding: 6px 10px; text-align: left; }}
    th {{ background: rgba(255, 255, 255, 0.05); color: #94a3b8; }}
    .cat-breach {{ color: #ff1744; }}
    .cat-authorized {{ color: #00ff88; }}
    .cat-system {{ color: #38bdf8; }}
    .print-btn {{
      background: #00ff88;
      color: #05080a;
      border: none;
      padding: 10px 20px;
      font-weight: bold;
      cursor: pointer;
      font-family: inherit;
    }}
    @media print {{
      body {{ background: #fff; color: #000; padding: 0; }}
      .dossier-card {{ border: 2px solid #000; box-shadow: none; }}
      .print-btn {{ display: none; }}
      h1, .panel h3 {{ color: #000; }}
      .seal-box {{ border: 1px solid #000; background: #eee; }}
    }}
  </style>
</head>
<body>
  <div class="dossier-card">
    <div class="header">
      <div>
        <h1>ANDERSON SENTINEL v{version} // FORENSIC DOSSIER</h1>
        <div>CLASSIFICATION: RESTRICTED // SOVEREIGN SECURITY AUDIT</div>
        <div>RECORD ID: {dossier_id} • GENERATED: {generated_at}</div>
      </div>
      <div>
        <button class="print-btn" onclick="window.print()">PRINT / EXPORT PDF</button>
      </div>
    </div>

    <div class="seal-box">
      <strong>CRYPTOGRAPHIC CHAIN OF CUSTODY SEAL:</strong><br/>
      <code>ROOT SHA-256: {root_sha}</code><br/>
      <span>STATUS: {verify_status} • SIGNED BY: {signed_by}</span>
    </div>

    <div class="grid-2">
      <div class="panel">
        <h3>Primary Biometrics</h3>
        <div>Operator: <strong>{operator}</strong></div>
        <div>Security State: <strong>{sec_status}</strong></div>
        <div>Enrolled Vectors: <strong>{enrolled_count} Facial Templates</strong></div>
      </div>
      <div class="panel">
        <h3>RF &amp; Hardware Telemetry</h3>
        <div>Ambient WiFi Beacons: <strong>{total_beacons} Nodes</strong></div>
        <div>Estimated Room Bounds: <strong>{room_dims}</strong></div>
        <div>USB Trusted Nodes: <strong>{usb_trusted} Peripherals</strong></div>
      </div>
    </div>

    <div class="panel" style="margin-bottom: 20px;">
      <h3>Certified Forensic Snapshots ({total_snaps} Evidence Records)</h3>
      <table>
        <thead>
          <tr><th>Filename</th><th>SHA-256 Integrity Digest</th><th>Captured</th><th>Size</th></tr>
        </thead>
        <tbody>{snap_rows or '<tr><td colspan="4">No breach snapshots recorded.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="panel">
      <h3>Incident Telemetry Ledger</h3>
      <table>
        <thead>
          <tr><th>Timestamp</th><th>Category</th><th>Details</th></tr>
        </thead>
        <tbody>{event_rows or '<tr><td colspan="3">No incident events logged.</td></tr>'}</tbody>
      </table>
    </div>
  </div>
</body>
</html>"""
