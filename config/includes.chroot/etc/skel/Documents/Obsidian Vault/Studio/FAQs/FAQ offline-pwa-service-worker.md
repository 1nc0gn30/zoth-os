---
title: "Can Zoth Studio run completely offline without an internet connection?"
tags: [studio, faq]
---

# Can Zoth Studio run completely offline without an internet connection?

**Category:** CLI & Deployment

100% offline-first architecture with local asset caching, zero CDN dependencies, and air-gapped readiness.

Yes. Zoth Studio is built from the ground up for sovereign, offline-first reliability. Once loaded or saved locally: • All 30 micro-tools, WGSL shaders, UI icons, and CSS stylesheets are bundled directly into static assets without third-party CDN links. • Static routing and state persistence rely entirely on browser-native storage (IndexedDB, Web Crypto, and local caches). • No remote API tokens or internet connections are required to run security audits, compile regexes, test WCAG contrast, or simulate multi-agent consensus.

## See also

[[Zoth Studio]] · [[MOC FAQs]]