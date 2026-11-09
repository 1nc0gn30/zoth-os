---
title: "WCAG & APCA Contrast Guard Studio"
tags: [studio, tool, verified, open-access, accessibility]
aliases: ["wcag-contrast-guard", "WCAG & APCA Contrast Guard Studio"]
pillar: "Pillar IV: AST Verification & Web Architecture"
category: "Accessibility & Design"
runs: "browser"
monetized: false
price: "$0 (100% Free & Open-Access)"
status: "active"
verified: true
tested_at: "2026-11-08"
test_status: "PASS (59 Tests Passed)"
local_port: 8099
cli_binary: "wcag-contrast-guard"
overflow_px: 0
console_errors: 0
github: "https://github.com/1nc0gn30/wcag-contrast-guard"
live_url: "http://127.0.0.1:8099"
studio_url: "http://127.0.0.1:3000/tools/wcag-contrast-guard"
braille_archetype: "Dual-Ring APCA Contrast L_c Field"
version: "2.5.0"
---

# 👁️ WCAG & APCA Contrast Guard Studio (`wcag-contrast-guard`)

> **100% Free & Open-Access Sovereign Tool**: Zero paywalls, zero frosted-glass blur locks, and zero license modals. Optional patronage supported via [☕ Buy Us a Coffee (Stripe)](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X) or Solana Tip (`GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK`).

---

## 1. Executive Summary & Capabilities

**WCAG & APCA Contrast Guard Studio (`wcag-contrast-guard`)** is a sovereign perceptual contrast engineering platform running locally on port **`:8099`** and integrated into [[Zoth Studio|Zoth Studio v2]] at `/tools/wcag-contrast-guard`. It eliminates contrast accessibility guesswork by providing real-time evaluation across both traditional **WCAG 2.1 / 2.2** standards and the modern **APCA-W3 0.98G-4g** perceptual contrast algorithm.

- **WCAG 2.2 AA & AAA Evaluation**: Evaluates relative luminance ratios ($R \ge 4.5:1$ for normal text, $R \ge 3:1$ for large text and UI components, $R \ge 7:1$ for AAA).
- **APCA Perceptual Lightness Contrast ($L_c$)**: Computes directional perceptual contrast taking into account polarity (dark-on-light vs. light-on-dark), ambient spatial frequency, and recommended minimum font weights.
- **8-Deficiency Color Vision Deficiency (CVD) Simulation**: Machado (2009) and Brettel (1997) matrices for Protanopia, Deuteranopia, Tritanopia, Protanomaly, Deuteranomaly, Tritanomaly, Achromatopsia, and Achromatomaly.
- **CIEDE2000 Auto-Remediation Solver**: Automatically shifts offending foreground/background hex codes to the nearest compliant color with minimal perceptual delta-E ($\Delta E_{00} \le 2.0$).
- **Harmonic Accessible Palette Generator**: Synthesizes 10-step accessible palettes and exports directly to CSS variables, Tailwind tokens, and JSON schemas.
- **Focus Appearance (SC 2.4.13) & Target Size (SC 2.5.8) Evaluators**: Verifies focus outline contrast ($\ge 3:1$) and minimum touch target bounds ($44 \times 44\text{px}$).

---

## 2. Technical Invariants & Mathematical Formulations

### 1. Relative Luminance & WCAG 2.2 Contrast Ratio
For sRGB color channels $c \in \{R, G, B\}$ normalized to $[0, 1]$:
$$C_{\text{linear}} = \begin{cases} \frac{c}{12.92} & \text{if } c \le 0.04045 \\ \left(\frac{c + 0.055}{1.055}\right)^{2.4} & \text{otherwise} \end{cases}$$
Relative luminance is given by:
$$L = 0.2126 \cdot R_{\text{linear}} + 0.7152 \cdot G_{\text{linear}} + 0.0722 \cdot B_{\text{linear}}$$
The contrast ratio between lighter luminance $L_1$ and darker luminance $L_2$ satisfies:
$$\text{Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05} \in [1.0, 21.0]$$

### 2. APCA 0.98G-4g Perceptual Lightness Contrast ($L_c$)
With background luminance $Y_{\text{bg}}$ and text luminance $Y_{\text{txt}}$ clamped and soft-clipped:
$$L_c = (Y_{\text{txt}}^{0.56} - Y_{\text{bg}}^{0.65}) \cdot 1.1415 \quad (\text{for } Y_{\text{bg}} > Y_{\text{txt}})$$

---

## 3. Endpoints & ZothOS CLI Usage

- **Local Workstation**: `http://127.0.0.1:8099/` (`python3 -m wcag_contrast_guard.ui_server --port 8099`)
- **Zoth Studio God-Mode**: `http://127.0.0.1:3000/tools/wcag-contrast-guard` (`WcagContrastGuard.jsx`)
- **Global ZothOS CLI**: `/usr/local/bin/wcag-contrast-guard` & `~/.local/bin/wcag-contrast-guard`

### Example CLI Commands
```bash
# Check WCAG 2.2 contrast ratio between two hex colors
wcag-contrast-guard check "#000000" "#FFFFFF" --json

# Calculate APCA L_c score and polarity
wcag-contrast-guard apca "#38bdf8" "#090a0f" --json

# Evaluate touch target size against SC 2.5.8 (44x44px minimum)
wcag-contrast-guard target --width 44 --height 44 --json

# Check server daemon status
wcag-contrast-guard --status
```

---

## 4. Verification & Testing

- **Pytest Suite**: `59 passed in 1.15s` (`tests/test_ui_server.py`, `tests/test_wcag.py`)
- **Guardrail Viewport Inspection**: `capture.mjs` triple-viewport still verification:
  - Mobile (375px): `overflowPx: 0`, `errors: 0`
  - Tablet (768px): `overflowPx: 0`, `errors: 0`
  - Desktop (1280px): `overflowPx: 0`, `errors: 0`
- **Git Commit**: `44ba9a8` (`feat(port): migrate default server port to 8099 to avoid conflict with firewall`)
