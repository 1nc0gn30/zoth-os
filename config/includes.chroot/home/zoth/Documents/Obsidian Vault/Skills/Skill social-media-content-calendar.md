---
title: "social-media-content-calendar"
tags: [skill, hermes]
aliases: ["social-media-content-calendar"]
---

# social-media-content-calendar

Workstation skill from Hermes (not a Zoth product). Authored by Ben Barclay / Hermes Agent.

- **Origin:** Hermes skill
- **Path:** `/home/zoth/.hermes/hermes-agent/optional-skills/creative/social-media-content-calendar/SKILL.md`

## Overview

Plans and organizes multi-platform social media campaigns across platforms like X (Twitter), LinkedIn, Instagram, and TikTok—governing campaign constraints, post briefs, editorial reviews, and scheduling handoffs.

## When to Load

- Building recurring or monthly multi-platform content calendars.
- Adapting a major product launch or feature announcement into tailored social posts across channels.
- Repurposing articles, research notes, or videos into social campaign sequences.
- Drafting, reviewing, and scheduling structured social campaigns.
- *Note:* Do not use for one-off single posts (use direct platform skills like `xurl` instead).

## Campaign Procedure

1. **Constraints & Inventory:** Records audience, message, date range, cadence, tracking parameters, and verifies source assets.
2. **Themes & Slots:** Distributes a balanced content mix (education, proof, product, community, behind-the-scenes).
3. **Platform Briefs & Drafting:** Drafts channel-native copy with distinct hooks and CTAs (optionally loading [[Skill humanizer|humanizer]] for voice).
4. **Editorial Review:** Gates posts through `draft`, `needs review`, and `approved` stages.
5. **Publishing / Handoff:** Publishes to connected platforms (e.g. X via [[Skill xurl|xurl]]) or outputs verified draft packages for manual schedulers.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill xurl|xurl]] · [[Skill humanizer|humanizer]]