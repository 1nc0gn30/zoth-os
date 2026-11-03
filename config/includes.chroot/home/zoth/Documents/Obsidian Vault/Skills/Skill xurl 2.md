---
title: "xurl"
tags: [skill, hermes]
aliases: ["xurl"]
---

# xurl

Official CLI integration for interacting with the X (Twitter) API v2 using `xurl`.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/skills/social-media/xurl/SKILL.md`
- **Prerequisites:** `xurl` CLI binary

## When to load
Load this skill when the user or agent needs to interact with X/Twitter:
- Searching raw posts (returning real post IDs and JSON structures)
- Reading timelines, mentions, or user profiles (`xurl timeline`, `xurl user`)
- Creating posts, replies, quotes, or deleting posts (`xurl post`, `xurl reply`)
- Engaging via likes, reposts, bookmarks, follows, blocks, and mutes
- Sending and listing direct messages (`xurl dm`, `xurl dms`)
- Uploading media (images and video) via `xurl media upload`
- Executing raw curl-style calls against any X API v2 endpoint

## Safety & Configuration
- **Secret Safety:** The agent must never read, print, or summarize `~/.xurl` tokens.
- Authentication (`xurl auth oauth2`) and app registration must be configured by the user outside the agent session.
- Token status can be checked safely via `xurl auth status`.

## See also

[[MOC Skills]] · [[Zoth OS]]