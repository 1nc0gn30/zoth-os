---
title: "VoiceStationPage"
tags: [studio, page]
---

# VoiceStationPage

React cockpit page for the **Sovereign Real-Time Voice Station** in Zoth Studio.

- **File:** `zoth-studio-v2/src/pages/VoiceStationPage.jsx`
- **Route:** [[Route voice|/voice]]

## What It Renders

`VoiceStationPage` renders a zero-latency interactive voice calling interface for conversing with sovereign Pantheon agent personas.

Key components and functionality:
- **Voice Personas Selector:** Selectable agent personas including Azoth (Prime Architect), Ghostbyte (Imperator), Athena (Socratic Arbiter), Mercury (Tactical Recon), Kitsune (Adaptive Synthesis), and Chronos (Temporal Order).
- **Interactive Call Cockpit:** Call initiation/termination controls, microphone toggle, call duration timer, and Web Audio API canvas frequency visualizer orb.
- **Local Daemon Integration:** Connects to the local voice daemon on `http://127.0.0.1:8114` (`/health` and `/api/call/session`) to retrieve session tokens.
- **Transcript & Debrief Stream:** Real-time dialogue log tracking speaker turns, timing, and latency, with one-click Markdown debrief export.
- **Text Chat Input:** Text prompt submission supporting hybrid voice/text interaction.
- **Pro License Gate:** Client-side license key validation and payment modal integration.

## See also

[[Zoth Studio]] · [[MOC Pages]] · [[Route voice|/voice]]