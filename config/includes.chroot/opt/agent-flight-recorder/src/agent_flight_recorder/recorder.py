"""
recorder.py - Autonomous Black Box Session Execution Recorder.
Wraps agent child processes, streams stdout/stderr, measures real CPU/RSS metrics, and logs timeline events.
Zero external dependencies (Python 3.10+ standard library).
Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
"""

import os
import resource
import subprocess
import threading
import time
from typing import List, Optional, Dict, Union, Tuple

from .storage import FlightStorage
from .ingestion import IngestionEngine


def _read_proc_metrics(pid: int) -> Tuple[Optional[float], Optional[float]]:
    """Read Linux /proc/<pid> cumulative CPU ticks (seconds) and VmRSS (MB).
    Returns (cpu_seconds, rss_mb) or (None, None) if unavailable."""
    cpu_sec: Optional[float] = None
    rss_mb: Optional[float] = None
    try:
        clk_tck = os.sysconf(os.sysconf_names["SC_CLK_TCK"])
        with open(f"/proc/{pid}/stat", "r", encoding="utf-8") as f:
            stat_text = f.read()
        rparen = stat_text.rfind(")")
        if rparen != -1:
            fields = stat_text[rparen + 2 :].split()
            if len(fields) >= 13:
                utime = int(fields[11])
                stime = int(fields[12])
                cpu_sec = (utime + stime) / float(clk_tck)
    except Exception:
        pass

    try:
        with open(f"/proc/{pid}/status", "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("VmRSS:"):
                    parts = line.split()
                    if len(parts) >= 2:
                        rss_mb = round(int(parts[1]) / 1024.0, 2)
                    break
    except Exception:
        pass

    return cpu_sec, rss_mb


class SessionRecorder:
    def __init__(
        self,
        storage: FlightStorage,
        session_id: Optional[str] = None,
        title: str = "Agent Flight Run",
        with_proxy: bool = False,
    ):
        self.storage = storage
        self.session_id = session_id
        self.title = title
        self.with_proxy = with_proxy
        self.ingestion = IngestionEngine(storage)
        self._stop_metrics = threading.Event()

    def record_command(
        self,
        cmd: Union[List[str], str],
        custom_env: Optional[Dict[str, str]] = None,
        with_proxy: Optional[bool] = None,
    ) -> int:
        cmd_str = " ".join(cmd) if isinstance(cmd, list) else cmd
        use_proxy = self.with_proxy if with_proxy is None else with_proxy

        sid = self.storage.create_session(
            session_id=self.session_id,
            title=self.title,
            command=cmd_str,
            metadata={"type": "cli_wrap", "pid": os.getpid(), "with_proxy": use_proxy},
        )
        self.session_id = sid

        env = os.environ.copy()
        if custom_env:
            env.update(custom_env)

        # Opt-in sovereign proxy interceptor pointers (never hijack child networking unexpectedly)
        if use_proxy:
            if "OPENAI_BASE_URL" not in env:
                env["OPENAI_BASE_URL"] = "http://127.0.0.1:8099/v1"
            if "ANTHROPIC_BASE_URL" not in env:
                env["ANTHROPIC_BASE_URL"] = "http://127.0.0.1:8099"
            if "HTTP_PROXY" not in env and "http_proxy" not in env:
                env["HTTP_PROXY"] = "http://127.0.0.1:8096"
                env["http_proxy"] = "http://127.0.0.1:8096"

        # Log session start marker
        self.storage.append_event(
            sid,
            "marker",
            {"message": f"Flight recorder initialized for: {cmd_str}"},
            severity="INFO",
            offset_ms=0.0,
        )

        self._stop_metrics.clear()
        exit_code = 0
        metric_thread: Optional[threading.Thread] = None
        wall_start = time.monotonic()

        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                shell=isinstance(cmd, str),
                env=env,
            )

            # Background metric sampler measuring real child /proc CPU delta & RSS
            def metric_sampler():
                prev_cpu, _ = _read_proc_metrics(proc.pid)
                prev_wall = time.monotonic()
                while not self._stop_metrics.wait(0.25):
                    now_wall = time.monotonic()
                    dt = max(1e-6, now_wall - prev_wall)
                    cur_cpu, cur_rss = _read_proc_metrics(proc.pid)
                    if cur_cpu is not None and prev_cpu is not None:
                        cpu_pct = round(max(0.0, (cur_cpu - prev_cpu) / dt * 100.0), 2)
                        prev_cpu = cur_cpu
                        prev_wall = now_wall
                    else:
                        cpu_pct = 0.0
                    if cur_rss is None:
                        usage = resource.getrusage(resource.RUSAGE_SELF)
                        cur_rss = round(usage.ru_maxrss / 1024.0, 2)
                    self.storage.append_event(
                        sid,
                        "system_metric",
                        {"cpu_percent": cpu_pct, "memory_mb": cur_rss, "pid": proc.pid},
                        severity="INFO",
                    )

            metric_thread = threading.Thread(target=metric_sampler, daemon=True)
            metric_thread.start()

            def read_stream(stream, event_type, severity):
                if stream is None:
                    return
                for line in iter(stream.readline, ""):
                    clean_line = line.rstrip("\r\n")
                    print(line, end="", flush=True)
                    self.storage.append_event(
                        sid,
                        event_type,
                        {"text": clean_line},
                        severity=severity,
                    )
                stream.close()

            t_out = threading.Thread(
                target=read_stream, args=(proc.stdout, "terminal_stdout", "INFO"), daemon=True
            )
            t_err = threading.Thread(
                target=read_stream, args=(proc.stderr, "terminal_stderr", "WARN"), daemon=True
            )

            t_out.start()
            t_err.start()

            # Poll external bridges once during execution
            time.sleep(0.1)
            self.ingestion.poll_active_bridges(sid)

            # Collect exact per-child rusage via os.wait4 on POSIX
            child_rusage = None
            if hasattr(os, "wait4"):
                _, wait_status, child_rusage = os.wait4(proc.pid, 0)
                if os.WIFEXITED(wait_status):
                    exit_code = os.WEXITSTATUS(wait_status)
                elif os.WIFSIGNALED(wait_status):
                    exit_code = -os.WTERMSIG(wait_status)
                else:
                    exit_code = 1
                proc.returncode = exit_code
            else:
                exit_code = proc.wait()

            t_out.join(timeout=1.0)
            t_err.join(timeout=1.0)

            wall_elapsed = max(1e-6, time.monotonic() - wall_start)
            if child_rusage is not None:
                total_cpu_s = float(child_rusage.ru_utime) + float(child_rusage.ru_stime)
                avg_cpu_pct = round((total_cpu_s / wall_elapsed) * 100.0, 2)
                peak_rss_mb = round(float(child_rusage.ru_maxrss) / 1024.0, 2)
                self.storage.append_event(
                    sid,
                    "system_metric",
                    {
                        "cpu_percent": avg_cpu_pct,
                        "cpu_user_s": round(float(child_rusage.ru_utime), 4),
                        "cpu_system_s": round(float(child_rusage.ru_stime), 4),
                        "memory_mb": peak_rss_mb,
                        "wall_seconds": round(wall_elapsed, 4),
                        "source": "os.wait4",
                    },
                    severity="INFO",
                )

        except Exception as e:
            self.storage.append_event(
                sid,
                "terminal_stderr",
                {"text": f"Recorder Execution Exception: {str(e)}"},
                severity="ERROR",
            )
            exit_code = 1
        finally:
            self._stop_metrics.set()
            if metric_thread is not None:
                metric_thread.join(timeout=1.0)
            status = "completed" if exit_code == 0 else "failed"
            self.storage.end_session(sid, exit_code=exit_code, status=status)

        return exit_code
