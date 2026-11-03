---
title: "VaultConsole"
tags: [studio, component]
---

# VaultConsole

- **File:** `zoth-studio-v2/src/components/VaultConsole.jsx`
- **Parent / Route:** [[Page HexStrikePage]] (`/hexstrike`)

## Overview

`VaultConsole` provides an in-browser cryptographic workbench titled "Zero-Cloud Hardware Vault & Entropy Auditor", enabling client-side key derivation, secret payload encryption, and real-time token randomness analysis.

## What It Renders

- **Secret Credential Inputs:** Text inputs for Secret Key Identifier (`OPENAI_API_KEY`), masked Master Passphrase, and a multi-line field for raw secret payload text.
- **Shannon Entropy Gauge:** Calculates character-level Shannon entropy (bits per char) in real time and renders a colored `LinearProgress` bar indicating randomness health (safe above 4.5 bits/char).
- **Token Generator:** A "Generate High-Entropy Token" button that produces random 32-byte hexadecimal tokens prefixed with `zk_live_`.
- **Sealing & Encryption:** An "Encrypt & Derive Key" action that simulates client-side Argon2id key derivation and AES-256-GCM sealed payload generation with generated salt and IV.
- **Sealed Output Box:** Displays the resulting JSON structure (including salt, IV, entropy score, and ciphertext) with a copy-to-clipboard button and derived key display.

## See also

[[Zoth Studio]] · [[MOC Components]] · [[Page HexStrikePage]]