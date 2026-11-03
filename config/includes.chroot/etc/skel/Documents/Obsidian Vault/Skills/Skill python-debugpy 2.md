---
title: "python-debugpy"
tags: [skill, hermes]
aliases: ["python-debugpy"]
---

# python-debugpy

Interactive Python debugging workflows utilizing local `pdb` REPL and `debugpy` remote Debug Adapter Protocol (DAP).

- **Origin:** Hermes skill (`software-development/python-debugpy`)
- **Path:** `~/.hermes/skills/software-development/python-debugpy/SKILL.md`
- **Platforms:** Linux, macOS
- **Nature:** Workstation skill from Hermes, not a Zoth product.

## When to Load
Load this skill when:
- Investigating failing tests where tracebacks do not explain mutated data structures or unexpected values.
- Step-debugging functions and tracking collections in real time.
- Performing post-mortem diagnostics on uncaught runtime exceptions.
- Attaching to running background processes, daemons, or persistent worker subprocesses.

## Debugging Modalities
1. **Interactive `breakpoint()`:** Add `breakpoint()` in code for immediate interactive inspection via `(Pdb)` prompt.
2. **CLI Invocation:** Run `python -m pdb path/to/script.py` to step through execution without editing source files.
3. **Remote DAP via `debugpy`:**
   - Listen and wait: `debugpy.listen(("127.0.0.1", 5678))` paired with `debugpy.wait_for_client()`.
   - CLI launcher: `python -m debugpy --listen 127.0.0.1:5678 --wait-for-client script.py`.
   - Process injection: `python -m debugpy --listen 127.0.0.1:5678 --pid <PID>`.
4. **Terminal Remote PDB:** Use `remote-pdb` (`set_trace(host="127.0.0.1", port=4444)`) and connect via `nc 127.0.0.1 4444`.
5. **Post-Mortem Analysis:** Trap crashes using `pdb.post_mortem(sys.exc_info()[2])` or `python -m pdb -c continue script.py`.

## Key Precautions
- Verify `PYTHONBREAKPOINT` is not set to `0`.
- Do not leave `breakpoint()` or `debugpy` statements in committed production code.
- Interactive pdb requires running single tests directly rather than under parallel output-capturing runners.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill systematic-debugging|systematic-debugging]] · [[Skill node-inspect-debugger|node-inspect-debugger]]