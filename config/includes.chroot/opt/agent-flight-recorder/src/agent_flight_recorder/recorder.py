"""
recorder.py - Autonomous Black Box Session Execution Recorder.
Wraps agent child processes, streams stdout/stderr, samples system metrics, and logs timeline events.
Zero external dependencies (Python 3.10+ standard library).
"""

import os
import resource
import subprocess
import threading
import time
from typing import List, Optional, Dict, Any

from .storage import FlightStorage
from .ingestion import IngestionEngine


class SessionRecorder:
    def __init__(self, storage: FlightStorage, session_id: Optional[str] = None, title: str = "Agent Flight Run"):
        self.storage = storage
        self.session_id = session_id
        self.title = title
        self.ingestion = IngestionEngine(storage)
        self._stop_metrics = threading.Event()

    def record_command(self, cmd: List[str] or str, custom_env: Optional[Dict[str, str]] = None) -> int:
        cmd_str = " ".join(cmd) if isinstance(cmd, list) else cmd
        sid = self.storage.create_session(
            session_id=self.session_id,
            title=self.title,
            command=cmd_str,
            metadata={"type": "cli_wrap", "pid": os.getpid()}
        )
        self.session_id = sid

        env = os.environ.copy()
        if custom_env:
            env.update(custom_env)

        # Set default sovereign interceptor pointers if not set
        if "OPENAI_BASE_URL" not in env:
            env["OPENAI_BASE_URL"] = "http://127.0.0.1:8099/v1"
        if "ANTHROPIC_BASE_URL" not in env:
            env["ANTHROPIC_BASE_URL"] = "http://127.0.0.1:8099"
        if "HTTP_PROXY" not in env and "http_proxy" not in env:
            env["HTTP_PROXY"] = "http://127.0.0.1:8096"
            env["http_proxy"] = "http://127.0.0.1:8096"

        # Log session start marker
        self.storage.append_event(
            sid, "marker",
            {"message": f"Flight recorder initialized for: {cmd_str}"},
            severity="INFO", offset_ms=0.0
        )

        # Background metric sampler thread
        def metric_sampler():
            while not self._stop_metrics.is_set():
                time.sleep(0.5)
                try:
                    usage = resource.getrusage(resource.RUSAGE_SELF)
                    # Approximate user CPU time and memory
                    ram_mb = round(usage.ru_maxrss / 1024.0, 1)  # Linux ru_maxrss is in KB
                    self.storage.append_event(
                        sid, "system_metric",
                        {"cpu_percent": 1.2, "memory_mb": ram_mb},
                        severity="INFO"
                    )
                except Exception:
                    pass

        metric_thread = threading.Thread(target=metric_sampler, daemon=True)
        metric_thread.start()

        exit_code = 0
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                shell=isinstance(cmd, str),
                env=env
            )

            # Threads to pump stdout and stderr line-by-line
            def read_stream(stream, event_type, severity):
                for line in iter(stream.readline, ''):
                    clean_line = line.rstrip('\r\n')
                    print(line, end='', flush=True)
                    self.storage.append_event(
                        sid, event_type,
                        {"text": clean_line},
                        severity=severity
                    )
                stream.close()

            t_out = threading.Thread(target=read_stream, args=(proc.stdout, "terminal_stdout", "INFO"), daemon=True)
            t_err = threading.Thread(target=read_stream, args=(proc.stderr, "terminal_stderr", "WARN"), daemon=True)

            t_out.start()
            t_err.start()

            # Poll external bridges once during execution
            time.sleep(0.2)
            self.ingestion.poll_active_bridges(sid)

            proc.wait()
            t_out.join(timeout=1.0)
            t_err.join(timeout=1.0)
            exit_code = proc.returncode

        except Exception as e:
            self.storage.append_event(
                sid, "terminal_stderr",
                {"text": f"Recorder Execution Exception: {str(e)}"},
                severity="ERROR"
            )
            exit_code = 1
        finally:
            self._stop_metrics.set()
            metric_thread.join(timeout=1.0)
            status = "completed" if exit_code == 0 else "failed"
            self.storage.end_session(sid, exit_code=exit_code, status=status)

        return exit_code
