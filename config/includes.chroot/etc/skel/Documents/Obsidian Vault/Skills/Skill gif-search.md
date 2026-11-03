---
title: "gif-search"
tags: [skill, hermes]
aliases: ["gif-search"]
---

# GIF Search (Tenor API)

A workstation skill from Hermes for searching and downloading GIFs and short video clips directly from Google's Tenor API using standard command-line tools.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Source:** `~/.hermes/hermes-agent/skills/media/gif-search/SKILL.md`

## When to load
Load this skill when an agent or user needs to discover or fetch animated GIFs:
- Finding reaction GIFs or visual media for chat integrations and markdown previews.
- Searching Tenor by keyword queries with filtering for content safety or locale.
- Extracting lightweight preview URLs (`tinygif`, `tinymp4`) or full-resolution GIF URLs.
- Downloading media files locally via bash commands.

## Key capabilities & workflows
- **Tenor v2 API queries:** Sends requests via `curl` to `https://tenor.googleapis.com/v2/search` with URL-encoded query strings and `TENOR_API_KEY`.
- **JSON parsing with jq:** Parses `.results[].media_formats` to retrieve target formats including full `gif`, `tinygif`, `mp4`, and `webm`.
- **Direct file downloads:** Streams selected media assets to local storage using `curl -sL`.
- **Prerequisites:** Requires `curl`, `jq`, and the `TENOR_API_KEY` environment variable configured in `${HERMES_HOME}/.env`.

## See also

[[MOC Skills]] · [[Zoth OS]]