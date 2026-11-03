---
title: "What is the Zoth CLI (`npx @nullaitech/zoth`) and how do developers use it loca\u2026"
tags: [studio, faq]
---

# What is the Zoth CLI (`npx @nullaitech/zoth`) and how do developers use it loca…

**Category:** CLI & Deployment

npx @nullaitech/zoth provides local CLI control to scaffold sovereign tool repositories, verify environment readiness, and run tools in standalone micro-app isolation.

The Zoth CLI provides command-line control for developers building with or extending Zoth Studio. It can be invoked directly via npx without global installation: • npx @nullaitech/zoth status: Checks which Zoth services are up on 127.0.0.1 and whether /dev/kvm is available. • npx @nullaitech/zoth up: Clones Zoth Studio, installs it, and runs it at http://127.0.0.1:3000. • npx @nullaitech/zoth pull <tool>: Clones any of the 53 public tool repositories (59 in the catalog) from the @NullAITech ecosystem into an isolated ./tools/<tool> directory with independent package configs. This allows developers to inspect, modify, or embed individual tools into custom pipelines or run them as dedicated local micro-apps.

## See also

[[Zoth Studio]] · [[MOC FAQs]]