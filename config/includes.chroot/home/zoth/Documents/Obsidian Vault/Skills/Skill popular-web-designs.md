---
title: "popular-web-designs"
tags: [skill, hermes]
aliases: ["popular-web-designs"]
---

# popular-web-designs

- **Origin:** Hermes (Workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/hermes-agent/skills/creative/popular-web-designs/SKILL.md`
- **Category:** Creative / Design

## Overview
`popular-web-designs` provides 54 real-world design systems (such as Stripe, Linear, Vercel, Apple, Anthropic Claude, PostHog, Supabase, and Raycast) formatted for generating HTML and CSS. Each template captures a site's complete visual language: color palette, typography hierarchy, component styling, spacing, shadows, and responsive behavior.

## When to Load
Triggered when generating or designing web pages styled after known brand aesthetics (e.g., requests like "build a page that looks like Stripe", "design like Linear", "Vercel style", or general landing page and dashboard creation).

## Key Capabilities & Structure
- **Design Catalog**: 54 templates covering AI & Machine Learning, Developer Tools, Infrastructure, Fintech, Design & Productivity, and Enterprise/Consumer.
- **Font Substitution Reference**: Maps proprietary fonts (e.g., sohne-var, Geist, Berkeley Mono, Circular) to Google Fonts equivalents (such as Source Sans 3, JetBrains Mono, DM Sans).
- **Implementation Templates**: Sourced templates in `templates/<site>.md` provide CSS custom properties, Google Fonts links, component specifications, and agent prompts.
- **Workflow Pairing**: Designed to pair with `claude-design` (for design process and taste) and `generative-widgets` (for previewing HTML outputs).

## See also

[[MOC Skills]] · [[Zoth OS]]