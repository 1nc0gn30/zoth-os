#!/usr/bin/env python3
"""anderson thermal watch — stdlib only.

Samples package/core temperature, fans, load and the top CPU consumers and
appends one JSON line per sample, so the machine's heat can be watched over
time (the user's standing request) without a heavy monitoring stack.

  therm-watch.py --once            # print one sample, exit
  therm-watch.py --interval 30     # loop (systemd-friendly, low CPU)
  therm-watch.py --tail 20         # show the last samples

Reads /sys + /proc directly; `sensors` is only called when /sys gives
nothing, so a sample costs a few ms.
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import subprocess
import sys
import time
from datetime import datetime

LOG = os.path.expanduser("~/.config/anderson_security/thermal.jsonl")
WARN_C = 85.0
CRIT_C = 95.0
MAX_LINES = 6000


def read_text(path: str) -> str | None:
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            return fh.read().strip()
    except OSError:
        return None


def zones() -> dict[str, float]:
    out: dict[str, float] = {}
    for zdir in sorted(glob.glob("/sys/class/thermal/thermal_zone*")):
        t = read_text(os.path.join(zdir, "type"))
        v = read_text(os.path.join(zdir, "temp"))
        if not t or not v:
            continue
        try:
            val = float(v)
        except ValueError:
            continue
        if abs(val) > 1000:  # millidegrees
            val /= 1000.0
        out[t] = round(val, 1)
    return out


def fans() -> dict[str, int]:
    out: dict[str, int] = {}
    for hdir in sorted(glob.glob("/sys/class/hwmon/hwmon*")):
        name = read_text(os.path.join(hdir, "name")) or os.path.basename(hdir)
        for f in sorted(glob.glob(os.path.join(hdir, "fan*_input"))):
            v = read_text(f)
            if v and v.isdigit():
                out[f"{name}:{os.path.basename(f).split('_')[0]}"] = int(v)
    return out


def cores() -> dict[str, float]:
    """Per-core package temperature from `sensors` (cache-friendly fallback)."""
    try:
        res = subprocess.run(["sensors"], capture_output=True, text=True, timeout=8)
    except (OSError, subprocess.SubprocessError):
        return {}
    out: dict[str, float] = {}
    for line in res.stdout.splitlines():
        if ":" not in line or "°C" not in line:
            continue
        label = line.split(":", 1)[0].strip()
        try:
            val = float(line.split("+", 1)[1].split("°", 1)[0])
        except (IndexError, ValueError):
            continue
        if label.startswith("Package") or label.startswith("Core"):
            out[label] = val
    return out


def top_procs(n: int = 4) -> list[dict]:
    try:
        res = subprocess.run(
            ["ps", "-eo", "pcpu,pid,etimes,comm", "--sort=-pcpu", "--no-headers"],
            capture_output=True, text=True, timeout=8)
    except (OSError, subprocess.SubprocessError):
        return []
    rows = []
    for line in res.stdout.splitlines()[:n]:
        parts = line.split()
        if len(parts) >= 4:
            rows.append({"cpu": float(parts[0]), "pid": int(parts[1]),
                         "age_s": int(parts[2]), "comm": parts[3]})
    return rows


def sample() -> dict:
    z = zones()
    c = cores()
    pkg = next((v for k, v in c.items() if k.startswith("Package")), None)
    if pkg is None:
        pkg = z.get("x86_pkg_temp")
    try:
        load1 = float(read_text("/proc/loadavg").split()[0])  # type: ignore[union-attr]
    except (AttributeError, IndexError, ValueError):
        load1 = None
    return {
        "ts": datetime.now().isoformat(timespec="seconds"),
        "pkg_c": pkg,
        "cores": c,
        "zones": {k: v for k, v in z.items() if k in ("x86_pkg_temp", "acpitz", "pch_cannonlake", "SEN1", "SEN2")},
        "fans": fans(),
        "load1": load1,
        "top": top_procs(),
    }


def levels(s: dict) -> tuple[float | None, float | None, float | None]:
    pkg = s.get("pkg_c")
    f = list(s.get("fans", {}).values()) or [None]
    return pkg, max(v for v in f if v is not None) if any(v is not None for v in f) else None, s.get("load1")


def fmt(s: dict) -> str:
    pkg, fan, load = levels(s)
    bits = [f"{s['ts']} pkg={pkg}°C"]
    if fan:
        bits.append(f"fan={fan}rpm")
    if load is not None:
        bits.append(f"load1={load:.2f}")
    if s.get("top"):
        bits.append("top=" + ", ".join(f"{t['comm']}:{t['cpu']:.0f}%" for t in s["top"][:3]))
    flag = ""
    if pkg is not None and pkg >= CRIT_C:
        flag = "  *** CRITICAL — throttling risk ***"
    elif pkg is not None and pkg >= WARN_C:
        flag = "  ** hot **"
    return "  ".join(bits) + flag


def append(s: dict) -> None:
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(s) + "\n")
    try:
        if os.path.getsize(LOG) > 400_000:
            with open(LOG, encoding="utf-8") as fh:
                keep = fh.readlines()[-MAX_LINES:]
            with open(LOG, "w", encoding="utf-8") as fh:
                fh.writelines(keep)
    except OSError:
        pass


def tail(n: int) -> int:
    try:
        with open(LOG, encoding="utf-8") as fh:
            for line in fh.readlines()[-n:]:
                s = json.loads(line)
                print(fmt(s))
    except OSError as exc:
        print(f"no thermal log yet ({exc})")
    return 0


def main() -> int:
    global LOG
    ap = argparse.ArgumentParser(description="Anderson thermal watch")
    ap.add_argument("--interval", type=int, default=30)
    ap.add_argument("--log", default=LOG)
    ap.add_argument("--oneshot", "--once", dest="oneshot", action="store_true")
    ap.add_argument("--tail", type=int, default=0)
    ap.add_argument("--pretty", action="store_true", help="human line instead of JSON")
    args = ap.parse_args()

    LOG = os.path.expanduser(args.log)

    if args.tail:
        return tail(args.tail)

    if args.oneshot or args.pretty:
        s = sample()
        print(fmt(s) if args.pretty or args.oneshot else json.dumps(s))
        return 0

    print(f"[therm-watch] logging to {LOG} every {args.interval}s (warn>={WARN_C}°C crit>={CRIT_C}°C)", flush=True)
    while True:
        s = sample()
        append(s)
        print(fmt(s), flush=True)
        time.sleep(max(5, args.interval))


if __name__ == "__main__":
    sys.exit(main())
