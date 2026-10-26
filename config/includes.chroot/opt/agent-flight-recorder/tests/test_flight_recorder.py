"""
test_flight_recorder.py - Unit and Integration Test Suite for Agent Flight Recorder.
Zero external pip dependencies (pytest standard runner only).
"""

import json
import os
import tempfile
import time
import urllib.request
import urllib.error
import pytest

from agent_flight_recorder.storage import FlightStorage
from agent_flight_recorder.ingestion import IngestionEngine
from agent_flight_recorder.recorder import SessionRecorder
from agent_flight_recorder.exporter import export_bundle, generate_single_file_html
from agent_flight_recorder.server import FlightDeckServer


class TestFlightStorage:
    def setup_method(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
        self.storage = FlightStorage(db_path=self.temp_db)

    def teardown_method(self):
        if os.path.exists(self.temp_db):
            os.remove(self.temp_db)

    def test_session_lifecycle(self):
        sid = self.storage.create_session(title="Unit Test Flight", command="echo 42")
        assert sid.startswith("flt-")

        # Append events
        ev1 = self.storage.append_event(sid, "terminal_stdout", {"text": "booting..."}, offset_ms=100.0)
        ev2 = self.storage.append_event(sid, "network_egress", {"destination": "api.openai.com"}, offset_ms=250.0)
        ev3 = self.storage.append_event(sid, "prompt_scan", {"threat_type": "CLEAN", "score": 0.05}, offset_ms=300.0)
        assert ev1 > 0
        assert ev2 > ev1

        self.storage.end_session(sid, exit_code=0, status="completed")

        sess = self.storage.get_session(sid)
        assert sess is not None
        assert sess["status"] == "completed"
        assert sess["event_count"] == 3

        timeline = self.storage.get_timeline(sid)
        assert len(timeline) == 3
        assert timeline[0]["offset_ms"] == 100.0
        assert timeline[1]["offset_ms"] == 250.0

    def test_forensics_snapshot(self):
        sid = self.storage.create_session(title="Snapshot Test")
        self.storage.append_event(sid, "terminal_stdout", {"text": "line 1"}, offset_ms=100.0)
        self.storage.append_event(sid, "terminal_stdout", {"text": "line 2"}, offset_ms=500.0)
        self.storage.append_event(sid, "network_egress", {"destination": "api.anthropic.com"}, offset_ms=200.0)
        self.storage.append_event(sid, "mock_replay", {"tokens_saved": 40}, offset_ms=300.0)

        # Snapshot at 250ms
        snap_early = self.storage.get_session_forensics(sid, up_to_offset_ms=250.0)
        assert snap_early["events_count"] == 2
        assert "line 1" in snap_early["terminal_text"]
        assert "line 2" not in snap_early["terminal_text"]
        assert "api.anthropic.com" in snap_early["network_nodes"]
        assert snap_early["tokens_saved"] == 0

        # Snapshot at 600ms
        snap_late = self.storage.get_session_forensics(sid, up_to_offset_ms=600.0)
        assert snap_late["events_count"] == 4
        assert "line 2" in snap_late["terminal_text"]
        assert snap_late["tokens_saved"] == 40


class TestSessionRecorder:
    def setup_method(self):
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
        self.storage = FlightStorage(db_path=self.temp_db)

    def teardown_method(self):
        if os.path.exists(self.temp_db):
            os.remove(self.temp_db)

    def test_record_child_process(self):
        recorder = SessionRecorder(storage=self.storage, title="Echo Test")
        cmd = ["python3", "-c", "import sys; print('Flight test stdout line'); sys.stderr.write('Flight test stderr line\\n')"]
        exit_code = recorder.record_command(cmd)

        assert exit_code == 0
        sid = recorder.session_id
        session = self.storage.get_session(sid)
        assert session["status"] == "completed"

        timeline = self.storage.get_timeline(sid)
        types = [e["event_type"] for e in timeline]
        assert "terminal_stdout" in types
        assert "terminal_stderr" in types


class TestExporter:
    def test_html_bundle_export(self):
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
            db_path = tf.name
        with tempfile.NamedTemporaryFile(suffix=".html", delete=False) as tf_html:
            html_path = tf_html.name

        try:
            store = FlightStorage(db_path=db_path)
            sid = store.create_session(title="Bundle Export Test", command="test-cmd")
            store.append_event(sid, "terminal_stdout", {"text": "hello offline bundle"}, offset_ms=10.0)
            store.end_session(sid)

            out = export_bundle(sid, store, html_path)
            assert os.path.exists(out)

            with open(out, "r", encoding="utf-8") as f:
                content = f.read()

            assert "<!DOCTYPE html>" in content
            assert "hello offline bundle" in content
            assert "TIME SCRUBBER FORENSICS" in content
        finally:
            if os.path.exists(db_path):
                os.remove(db_path)
            if os.path.exists(html_path):
                os.remove(html_path)


class TestFlightDeckServerIntegration:
    @classmethod
    def setup_class(cls):
        cls.port = 8194
        cls.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False).name
        cls.storage = FlightStorage(db_path=cls.temp_db)
        
        # Seed test session
        cls.test_sid = cls.storage.create_session(title="Integration Test Session", command="run-agent")
        cls.storage.append_event(cls.test_sid, "terminal_stdout", {"text": "agent initialized"}, offset_ms=50.0)
        cls.storage.append_event(cls.test_sid, "prompt_scan", {"threat_type": "CRITICAL", "score": 0.95, "blocked": True}, offset_ms=120.0)
        cls.storage.append_event(cls.test_sid, "mock_replay", {"tokens_saved": 35}, offset_ms=200.0)
        cls.storage.end_session(cls.test_sid, exit_code=0)

        cls.server = FlightDeckServer(host="127.0.0.1", port=cls.port, storage=cls.storage)
        cls.server.start()
        time.sleep(0.4)

    @classmethod
    def teardown_class(cls):
        cls.server.stop()
        if os.path.exists(cls.temp_db):
            os.remove(cls.temp_db)

    def test_health_and_head(self):
        req = urllib.request.Request(f"http://127.0.0.1:{self.port}/api/health", method="HEAD")
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200

        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}/api/health") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert data["status"] == "online"
            assert data["port"] == 8104

    def test_sessions_and_timeline(self):
        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}/api/sessions") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert len(data["sessions"]) >= 1

        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}/api/timeline/{self.test_sid}") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert len(data["events"]) == 3

    def test_scrub_snapshot(self):
        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}/api/scrub/{self.test_sid}?offset_ms=100") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert data["events_count"] == 1
            assert "agent initialized" in data["terminal_text"]

    def test_briefing_generation(self):
        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}/api/briefing/{self.test_sid}") as resp:
            data = json.loads(resp.read().decode("utf-8"))
            assert "briefing_text" in data
            assert "prompt injection attack" in data["briefing_text"]
            assert data["event_stats"]["threats_blocked"] == 1

    def test_bundle_download(self):
        with urllib.request.urlopen(f"http://127.0.0.1:{self.port}/api/export/bundle?session_id={self.test_sid}") as resp:
            assert resp.status == 200
            assert "text/html" in resp.headers.get("Content-Type")
            body = resp.read().decode("utf-8")
            assert "<!DOCTYPE html>" in body
            assert self.test_sid in body
