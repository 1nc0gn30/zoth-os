---
title: "neuroskill-bci"
tags: [skill, hermes]
aliases: ["neuroskill-bci"]
---

# neuroskill-bci

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/health/neuroskill-bci/SKILL.md`
- **Category:** Health / BCI
- **Platforms:** Linux, macOS, Windows

## Overview

The `neuroskill-bci` workstation skill connects Hermes to a running NeuroSkill instance to ingest real-time brain and biometrics data from BCI wearables (such as Muse 2, Muse S, or OpenBCI via BLE). It provides cognitively-aware agent interaction, session retrospectives, protocol suggestions, and mental performance tracking.

> **Note:** Open-source research tool only; not a certified medical device.

## When to Load

Load this skill when:
- The user is wearing a supported BCI device with the NeuroSkill desktop app running.
- Inquiring about current cognitive state, focus levels, relaxation, fatigue, or mood.
- Analyzing deep-work sessions, comparing historical focus trends, or reviewing sleep stages.
- Timestamping flow states, breakthroughs, or state transitions for historical ANN search.

## Key Capabilities

- **State Monitoring:** Inspect real-time scores via `npx neuroskill status --json` (focus, relaxation, engagement, cognitive load, drowsiness, heart rate, FAA, TBR).
- **Session Trends:** Review epoch metrics and first-half vs. second-half progression with `npx neuroskill session [N]`.
- **Historical & Semantic Search:** Query neurally similar sessions via HNSW search over 128-D embeddings (`npx neuroskill search`) or search tagged labels (`npx neuroskill search-labels`).
- **A/B Comparison:** Compare sessions with `npx neuroskill compare` to highlight metric deltas and trend shifts.
- **Sleep Staging:** Inspect 5-second epoch sleep staging and sleep efficiency metrics (`npx neuroskill sleep`).
- **Focus Timer & Calibration:** Launch presets with `npx neuroskill timer` or calibrate electrode baselines via `npx neuroskill calibrate`.

## See also

[[MOC Skills]] · [[Zoth OS]]