---
title: "What client-side fallback tiers exist when WebGPU is unavailable in the browser?"
tags: [studio, faq]
---

# What client-side fallback tiers exist when WebGPU is unavailable in the browser?

**Category:** WebGPU & Tools

Seamless three-tier fallback: WebGPU WGSL → WASM SIMD 128-bit → CPU Web Workers.

If a browser or platform lacks native WebGPU support, Zoth Studio seamlessly drops into an autonomous fallback hierarchy: 1. Primary: Hardware WebGPU via WGSL compute shaders. 2. Secondary: WebAssembly (WASM) with 128-bit SIMD vector instructions and multi-threaded Web Workers. 3. Tertiary: Optimized pure JavaScript numerical routines. All three computational tiers produce bit-identical deterministic outputs, ensuring uninterrupted offline capability across modern browsers and legacy hardware.

## See also

[[Zoth Studio]] · [[MOC FAQs]]