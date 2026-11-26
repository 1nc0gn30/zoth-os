"""
exporter.py - Self-Contained Incident Bundle & Multi-Format Telemetry Exporter (HTML, JSON, CSV, Markdown).
Zero external dependencies (Python 3.10+ standard library).
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
"""

import csv
import html
import io
import json
import os
import time
from typing import Dict, Any, List, Optional

from . import __version__
from .storage import FlightStorage, GENESIS_HASH


def safe_json_for_script(obj: Any) -> str:
    """Serialize JSON safely for embedding inside an HTML <script> block.
    Prevents </script> breakout XSS and JS line-terminator injection."""
    raw = json.dumps(obj, indent=2, ensure_ascii=False)
    return (
        raw.replace("&", "\\u0026")
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("\u2028", "\\u2028")
        .replace("\u2029", "\\u2029")
    )


def neutralize_csv_cell(value: Any) -> str:
    """Prevent CSV/spreadsheet formula injection (=, +, -, @, tab, CR)."""
    text = "" if value is None else str(value)
    if text and text[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + text
    return text


def generate_json_export(
    session_data: Dict[str, Any],
    timeline_events: List[Dict[str, Any]],
    verification: Optional[Dict[str, Any]] = None,
) -> str:
    payload = {
        "schema": "agent-flight-recorder/v2.6.0",
        "exported_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "session": session_data,
        "hash_chain": verification
        or {
            "valid": False,
            "event_count": len(timeline_events),
            "head_hash": GENESIS_HASH,
            "broken_at_event_id": None,
        },
        "events": timeline_events,
    }
    return json.dumps(payload, indent=2, ensure_ascii=False)


def generate_csv_export(
    session_data: Dict[str, Any],
    timeline_events: List[Dict[str, Any]],
) -> str:
    buf = io.StringIO()
    writer = csv.writer(buf, lineterminator="\n")
    writer.writerow(
        [
            "session_id",
            "event_id",
            "seq",
            "offset_ms",
            "timestamp",
            "event_type",
            "severity",
            "prev_hash",
            "event_hash",
            "payload_json",
        ]
    )
    sid = session_data.get("session_id", "")
    for ev in timeline_events:
        writer.writerow(
            [
                neutralize_csv_cell(sid),
                neutralize_csv_cell(ev.get("id", "")),
                neutralize_csv_cell(ev.get("seq", "")),
                neutralize_csv_cell(ev.get("offset_ms", 0.0)),
                neutralize_csv_cell(ev.get("timestamp", 0.0)),
                neutralize_csv_cell(ev.get("event_type", "")),
                neutralize_csv_cell(ev.get("severity", "INFO")),
                neutralize_csv_cell(ev.get("prev_hash", "")),
                neutralize_csv_cell(ev.get("event_hash", "")),
                neutralize_csv_cell(json.dumps(ev.get("payload", {}), ensure_ascii=False)),
            ]
        )
    return buf.getvalue()


def generate_markdown_export(
    session_data: Dict[str, Any],
    timeline_events: List[Dict[str, Any]],
    verification: Optional[Dict[str, Any]] = None,
) -> str:
    sid = session_data.get("session_id", "unknown")
    title = session_data.get("title", "Agent Flight Session")
    cmd = session_data.get("command", "") or "N/A"
    dur = session_data.get("duration_seconds", 0.0)
    chain_valid = bool(verification.get("valid")) if verification else False
    head_hash = (verification or {}).get("head_hash", GENESIS_HASH)

    lines = [
        f"# Agent Flight Recorder Incident Report — `{sid}`",
        "",
        f"- **Title:** {title}",
        f"- **Command:** `{cmd}`",
        f"- **Status:** `{session_data.get('status', 'unknown')}` (exit `{session_data.get('exit_code', 0)}`)",
        f"- **Duration:** `{dur}s` • **Events:** `{len(timeline_events)}`",
        f"- **SHA-256 Chain Status:** `{'VALID' if chain_valid else 'UNVERIFIED / BROKEN'}`",
        f"- **Chain Head Hash:** `{head_hash}`",
        f"- **Generator:** `agent-flight-recorder v{__version__}` (Engineered by Neal Frazier Tech `@1nc0gn30` • NullAI Platform)",
        "",
        "## Timeline Events",
        "",
        "| Seq | Offset (ms) | Type | Severity | SHA-256 Prefix | Payload |",
        "| :-: | --: | :--- | :---: | :--- | :--- |",
    ]
    for idx, ev in enumerate(timeline_events, start=1):
        seq = ev.get("seq") or idx
        offset = ev.get("offset_ms", 0.0)
        etype = str(ev.get("event_type", "")).replace("|", "\\|")
        sev = str(ev.get("severity", "INFO")).replace("|", "\\|")
        ehash = str(ev.get("event_hash", ""))[:12] or "—"
        p_str = json.dumps(ev.get("payload", {}), ensure_ascii=False).replace("|", "\\|").replace("\n", " ")
        if len(p_str) > 160:
            p_str = p_str[:157] + "..."
        lines.append(f"| {seq} | {offset} | `{etype}` | `{sev}` | `{ehash}` | `{p_str}` |")

    lines.append("")
    return "\n".join(lines)


def generate_single_file_html(
    session_data: Dict[str, Any],
    timeline_events: list,
    verification: Optional[Dict[str, Any]] = None,
) -> str:
    session_data = session_data or {}
    timeline_events = timeline_events or []
    verification = verification or {
        "valid": False,
        "event_count": len(timeline_events),
        "head_hash": timeline_events[-1].get("event_hash", GENESIS_HASH) if timeline_events else GENESIS_HASH,
        "broken_at_event_id": None,
    }

    safe_sid = html.escape(str(session_data.get("session_id", "Session")), quote=True)
    safe_title = html.escape(str(session_data.get("title", "Agent Session")), quote=True)
    safe_cmd = html.escape(str(session_data.get("command") or "N/A"), quote=True)
    chain_valid = bool(verification.get("valid"))
    head_hash = str(verification.get("head_hash") or GENESIS_HASH)
    safe_head_short = html.escape(head_hash[:16], quote=True)
    badge_label = f"SHA-256 CHAIN VERIFIED • {safe_head_short}" if chain_valid else f"SHA-256 UNVERIFIED • {safe_head_short}"
    badge_class = "badge badge-ok" if chain_valid else "badge badge-warn"

    session_json = safe_json_for_script(session_data)
    events_json = safe_json_for_script(timeline_events)
    verify_json = safe_json_for_script(verification)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Flight Recorder Incident Bundle • {safe_sid}</title>
  <style>
    :root {{
      --bg: #08080B;
      --card-bg: #121217;
      --card-surface: #181820;
      --border: #272733;
      --gold: #D4AF37;
      --telemetry-blue: #38BDF8;
      --emerald: #10B981;
      --ruby: #EF4444;
      --text: #F3F4F6;
      --text-muted: #9CA3AF;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }}
    @media (prefers-color-scheme: light) {{
      :root {{
        --bg: #FAF7F0;
        --card-bg: #FFFFFF;
        --card-surface: #F3EFE6;
        --border: rgba(28, 25, 23, 0.14);
        --gold: #9A7209;
        --telemetry-blue: #0369A1;
        --emerald: #047857;
        --ruby: #BE123C;
        --text: #1C1917;
        --text-muted: #57534E;
      }}
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-sans);
      padding: 1.5rem;
      min-height: 100vh;
    }}
    .header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 12px;
    }}
    .title {{ font-size: 1.35rem; font-weight: 800; color: var(--gold); }}
    .badge {{
      padding: 5px 12px;
      border-radius: 9999px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
    }}
    .badge-ok {{
      background: rgba(16, 185, 129, 0.14);
      color: var(--emerald);
      border: 1px solid var(--emerald);
    }}
    .badge-warn {{
      background: rgba(239, 68, 68, 0.14);
      color: var(--ruby);
      border: 1px solid var(--ruby);
    }}
    .scrubber-card {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }}
    .scrubber-row {{ display: flex; align-items: center; gap: 1rem; margin-top: 0.75rem; }}
    .scrub-slider {{
      flex: 1;
      accent-color: var(--gold);
      cursor: pointer;
      height: 24px;
    }}
    .time-display {{
      font-family: var(--font-mono);
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--telemetry-blue);
      min-width: 140px;
    }}
    .btn {{
      background: var(--gold);
      color: #08080B;
      border: none;
      padding: 10px 16px;
      min-height: 44px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
    }}
    .grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }}
    .pane {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }}
    .pane-title {{
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .terminal {{
      background: var(--card-surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--emerald);
      height: 280px;
      overflow-y: auto;
      white-space: pre-wrap;
    }}
    .meta-box {{
      background: var(--card-surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      max-height: 280px;
      overflow-y: auto;
    }}
    .meta-box li {{ margin-bottom: 6px; list-style: none; word-break: break-word; }}
    .footer {{
      margin-top: 1.5rem;
      font-size: 0.78rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
      border-top: 1px solid var(--border);
      padding-top: 1rem;
    }}
    @media (max-width: 768px) {{ .grid {{ grid-template-columns: 1fr; }} }}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">AGENT FLIGHT RECORDER v{__version__} • OFFLINE FORENSIC BUNDLE</div>
      <div style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">
        Session: {safe_sid} • {safe_title} • Command: {safe_cmd}
      </div>
    </div>
    <span class="{badge_class}">{badge_label}</span>
  </div>

  <div class="scrubber-card">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
      <span style="font-size: 0.85rem; font-weight: 700; color: var(--gold);">TIME SCRUBBER FORENSICS</span>
      <span class="time-display" id="timeDisp">00:00.000 / 00:00.000</span>
    </div>
    <div class="scrubber-row">
      <button class="btn" id="btnPlay">Play ▶</button>
      <input type="range" class="scrub-slider" id="scrubber" min="0" max="100" value="0" aria-label="Timeline scrubber">
    </div>
  </div>

  <div class="grid">
    <div class="pane">
      <div class="pane-title">Synchronized Terminal Output Stream</div>
      <div class="terminal" id="terminalOut">No events yet.</div>
    </div>

    <div class="pane">
      <div class="pane-title">Active Forensic State &amp; SHA-256 Chain</div>
      <div class="meta-box" id="stateOut">
        <div><strong>Endpoints Contacted:</strong> <span id="networkCount">0</span></div>
        <div><strong>Chain Head SHA-256:</strong> <span id="chainHead"></span></div>
        <div style="margin-top: 8px;"><strong>Timeline Events at T:</strong></div>
        <ul id="eventsList" style="margin-top: 4px;"></ul>
      </div>
    </div>
  </div>

  <div class="footer">
    Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform • Offline Single-File Bundle
  </div>

  <script>
    const SESSION = {session_json};
    const EVENTS = {events_json};
    const HASH_CHAIN = {verify_json};

    const maxOffset = EVENTS.length > 0 ? Math.max(...EVENTS.map(e => Number(e.offset_ms) || 0), (Number(SESSION.duration_seconds) || 1) * 1000) : 1000;
    const scrubber = document.getElementById('scrubber');
    const timeDisp = document.getElementById('timeDisp');
    const terminalOut = document.getElementById('terminalOut');
    const eventsList = document.getElementById('eventsList');
    const networkCount = document.getElementById('networkCount');
    const chainHead = document.getElementById('chainHead');
    const btnPlay = document.getElementById('btnPlay');

    scrubber.max = maxOffset;
    if (chainHead) chainHead.textContent = HASH_CHAIN.head_hash || 'none';

    function formatTime(ms) {{
      const totalS = ms / 1000;
      const m = Math.floor(totalS / 60);
      const s = (totalS % 60).toFixed(3);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(6, '0');
    }}

    function render(targetMs) {{
      timeDisp.textContent = formatTime(targetMs) + ' / ' + formatTime(maxOffset);
      const filtered = EVENTS.filter(e => (Number(e.offset_ms) || 0) <= targetMs);

      const termLines = filtered
        .filter(e => ['terminal_stdout', 'terminal_stderr', 'terminal'].includes(e.event_type))
        .map(e => (e.payload && e.payload.text) || '');
      terminalOut.textContent = termLines.join('\\n') || '[Waiting for process output...]';
      terminalOut.scrollTop = terminalOut.scrollHeight;

      eventsList.textContent = '';
      const recent = filtered.slice(-12);
      recent.forEach(e => {{
        const li = document.createElement('li');
        const h = e.event_hash ? ` [${{String(e.event_hash).slice(0, 8)}}]` : '';
        li.textContent = `[T+${{((Number(e.offset_ms)||0)/1000).toFixed(2)}}s] ${{e.event_type}}${{h}}: ${{JSON.stringify(e.payload).slice(0, 90)}}`;
        eventsList.appendChild(li);
      }});

      const netSet = new Set();
      filtered.filter(e => e.event_type === 'network_egress').forEach(e => {{
        netSet.add((e.payload && (e.payload.destination || e.payload.host || e.payload.url)) || 'endpoint');
      }});
      networkCount.textContent = String(netSet.size);
    }}

    scrubber.addEventListener('input', (e) => {{
      render(parseFloat(e.target.value));
    }});

    let isPlaying = false;
    let timer = null;
    btnPlay.addEventListener('click', () => {{
      if (!isPlaying) {{
        if (parseFloat(scrubber.value) >= maxOffset) {{
          scrubber.value = 0;
          render(0);
        }}
        isPlaying = true;
        btnPlay.textContent = 'Pause ⏸';
        timer = setInterval(() => {{
          let val = parseFloat(scrubber.value) + 150;
          if (val >= maxOffset) {{
            val = maxOffset;
            clearInterval(timer);
            isPlaying = false;
            btnPlay.textContent = 'Play ▶';
          }}
          scrubber.value = val;
          render(val);
        }}, 100);
      }} else {{
        isPlaying = false;
        btnPlay.textContent = 'Play ▶';
        clearInterval(timer);
      }}
    }});

    render(0);
  </script>
</body>
</html>
"""


def export_bundle(session_id: str, storage: FlightStorage, output_path: str) -> str:
    session = storage.get_session(session_id)
    if not session:
        raise ValueError(f"Session '{session_id}' not found in flight storage.")

    events = storage.get_timeline(session_id)
    verification = storage.verify_session_chain(session_id)
    html_content = generate_single_file_html(session, events, verification=verification)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    return os.path.abspath(output_path)
