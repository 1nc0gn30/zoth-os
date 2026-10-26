"""
exporter.py - Single-File Self-Contained HTML Incident Bundle Exporter.
Embeds session events into a zero-server interactive flight replay deck.
Zero external dependencies (Python 3.10+ standard library).
"""

import json
import os
import time
from typing import Dict, Any
from .storage import FlightStorage


def generate_single_file_html(session_data: Dict[str, Any], timeline_events: list) -> str:
    session_json = json.dumps(session_data, indent=2)
    events_json = json.dumps(timeline_events, indent=2)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Flight Recorder Incident Bundle • {session_data.get('session_id', 'Session')}</title>
  <style>
    :root {{
      --bg: #08080B;
      --card-bg: #121217;
      --card-surface: #181820;
      --border: #272733;
      --gold: #D4AF37;
      --gold-glow: rgba(212, 175, 55, 0.25);
      --telemetry-blue: #38BDF8;
      --emerald: #10B981;
      --ruby: #EF4444;
      --text: #F3F4F6;
      --text-muted: #9CA3AF;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
    .title {{ font-size: 1.4rem; font-weight: 800; color: var(--gold); }}
    .badge {{
      background: rgba(212, 175, 55, 0.15);
      color: var(--gold);
      border: 1px solid var(--gold);
      padding: 4px 10px;
      border-radius: 9999px;
      font-family: var(--font-mono);
      font-size: 0.75rem;
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
      height: 8px;
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
      color: #000;
      border: none;
      padding: 6px 14px;
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
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .terminal {{
      background: #000;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: #10B981;
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
    .meta-box li {{ margin-bottom: 6px; list-style: none; }}
    @media (max-width: 768px) {{ .grid {{ grid-template-columns: 1fr; }} }}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">AGENT FLIGHT RECORDER • STANDALONE FORENSIC BUNDLE</div>
      <div style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono);">
        Session ID: {session_data.get('session_id')} • Command: {session_data.get('command')}
      </div>
    </div>
    <span class="badge">OFFLINE VERIFIED</span>
  </div>

  <div class="scrubber-card">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 0.85rem; font-weight: 700; color: var(--gold);">TIME SCRUBBER FORENSICS</span>
      <span class="time-display" id="timeDisp">00:00.000 / 00:00.000</span>
    </div>
    <div class="scrubber-row">
      <button class="btn" id="btnPlay">Play ▶</button>
      <input type="range" class="scrub-slider" id="scrubber" min="0" max="100" value="0">
    </div>
  </div>

  <div class="grid">
    <div class="pane">
      <div class="pane-title">Synchronized Terminal Output Stream</div>
      <div class="terminal" id="terminalOut">No events yet.</div>
    </div>

    <div class="pane">
      <div class="pane-title">Active Forensic State & Engrams</div>
      <div class="meta-box" id="stateOut">
        <div><strong>Endpoints Contacted:</strong> <span id="networkCount">0</span></div>
        <div style="margin-top: 8px;"><strong>Timeline Events at T:</strong></div>
        <ul id="eventsList" style="margin-top: 4px;"></ul>
      </div>
    </div>
  </div>

  <script>
    const SESSION = {session_json};
    const EVENTS = {events_json};

    const maxOffset = EVENTS.length > 0 ? Math.max(...EVENTS.map(e => e.offset_ms), (SESSION.duration_seconds || 1) * 1000) : 1000;
    const scrubber = document.getElementById('scrubber');
    const timeDisp = document.getElementById('timeDisp');
    const terminalOut = document.getElementById('terminalOut');
    const eventsList = document.getElementById('eventsList');
    const networkCount = document.getElementById('networkCount');
    const btnPlay = document.getElementById('btnPlay');

    scrubber.max = maxOffset;

    function formatTime(ms) {{
      const totalS = ms / 1000;
      const m = Math.floor(totalS / 60);
      const s = (totalS % 60).toFixed(3);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(6, '0');
    }}

    function render(targetMs) {{
      timeDisp.innerText = formatTime(targetMs) + ' / ' + formatTime(maxOffset);
      const filtered = EVENTS.filter(e => e.offset_ms <= targetMs);
      
      const termLines = filtered
        .filter(e => ['terminal_stdout', 'terminal_stderr', 'terminal'].includes(e.event_type))
        .map(e => e.payload.text || '');
      terminalOut.innerText = termLines.join('\\n') || '[Waiting for process output...]';
      terminalOut.scrollTop = terminalOut.scrollHeight;

      eventsList.innerHTML = '';
      const recent = filtered.slice(-6);
      recent.forEach(e => {{
        const li = document.createElement('li');
        li.innerText = `[T+${{(e.offset_ms/1000).toFixed(2)}}s] ${{e.event_type}}: ${{JSON.stringify(e.payload).slice(0, 70)}}`;
        eventsList.appendChild(li);
      }});

      const netSet = new Set();
      filtered.filter(e => e.event_type === 'network_egress').forEach(e => {{
        netSet.add(e.payload.destination || e.payload.url || 'endpoint');
      }});
      networkCount.innerText = netSet.size;
    }}

    scrubber.addEventListener('input', (e) => {{
      render(parseFloat(e.target.value));
    }});

    let isPlaying = false;
    let timer = null;
    btnPlay.addEventListener('click', () => {{
      if (!isPlaying) {{
        isPlaying = true;
        btnPlay.innerText = 'Pause ⏸';
        timer = setInterval(() => {{
          let val = parseFloat(scrubber.value) + 150;
          if (val >= maxOffset) {{
            val = maxOffset;
            clearInterval(timer);
            isPlaying = false;
            btnPlay.innerText = 'Play ▶';
          }}
          scrubber.value = val;
          render(val);
        }}, 100);
      }} else {{
        isPlaying = false;
        btnPlay.innerText = 'Play ▶';
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
    html_content = generate_single_file_html(session, events)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    return os.path.abspath(output_path)
