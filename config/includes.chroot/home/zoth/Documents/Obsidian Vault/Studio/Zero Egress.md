---
title: "Zero egress"
tags: [studio, security]
---

# Zero egress

Invariants from `public/assets/OWASP_ZERO_EGRESS_AUDIT.md` (2026-09-15, @Lycan), listed in `src/data/zeroEgress.js`.

- No eval() or new Function()
- No innerHTML / outerHTML / document.write
- No localStorage, sessionStorage, or cookie leaks
- No hardcoded external http(s) URLs in audited assets
- No analytics or tracking SDK calls
- No __proto__ prototype pollution
- No javascript: URI injection
- No postMessage cross-origin bridges
- No window.location exfiltration
- No _blank tab-napping vectors
- No dynamic createElement / importScripts injection
- Fetches restricted to relative paths or loopback

Loopback binds below are **not** public listeners.

## See also

[[Zoth Studio]] · [[Maps/Loopback.canvas|Loopback canvas]]
