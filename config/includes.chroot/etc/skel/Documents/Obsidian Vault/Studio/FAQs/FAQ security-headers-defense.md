---
title: "Which production security headers protect Zoth Studio against web vulnerabiliti\u2026"
tags: [studio, faq]
---

# Which production security headers protect Zoth Studio against web vulnerabiliti…

**Category:** Security

Strict CSP, SAMEORIGIN, nosniff, and zero sensor permissions ensure a hardened, tamper-proof runtime environment.

In netlify.toml, production builds enforce strict defense-in-depth HTTP response headers: • Content-Security-Policy: Restricts frame ancestors to verified origins and eliminates external script injection. • X-Frame-Options: SAMEORIGIN (prevents clickjacking attacks). • X-Content-Type-Options: nosniff (mitigates MIME-type sniffing). • Referrer-Policy: strict-origin-when-cross-origin (prevents URL parameter leakage). • Permissions-Policy: camera=(), microphone=(), geolocation=() (disables invasive sensor APIs). • Static assets receive immutable caching headers for instant repeat visits.

## See also

[[Zoth Studio]] · [[MOC FAQs]]