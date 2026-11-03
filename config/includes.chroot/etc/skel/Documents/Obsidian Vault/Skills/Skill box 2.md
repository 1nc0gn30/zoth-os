---
title: "box"
tags: [skill, hermes]
aliases: ["box"]
---

# box

Hermes workstation skill authored by Chris Kim (iskysun96) and Hermes Agent. Labeled as origin, not a Zoth product.

## Overview

Manages enterprise cloud file operations, collaboration, metadata, and document analysis using the Box CLI (`@box/cli`) and Box AI APIs.

## When to Load

Load when uploading, organizing, sharing, versioning, or collaborating on files in Box, searching content and metadata, executing Box AI document analysis, or integrating with Box SDKs.

## Capabilities & Tooling

- **CLI Operations**: Uses the official Box CLI via terminal execution for file/folder hierarchies, permissions, and REST API fallbacks (`box request`).
- **Box AI Integration**: Enables grounded analysis without local downloads via `ai:ask` (summaries/Q&A), `ai:extract-structured` (metadata templates), and `ai:text-gen` (file-grounded generation).
- **Box Hubs**: Leverages accessible Box Hubs for curated semantic queries over large collections (>25 files).
- **Authentication**: Supports standard OAuth (`box login`) for local setups and code exchange (`box login --code`) for remote/headless runtimes.

## Operational Safety

- Scopes actions strictly to authorized Box account permissions; requires user confirmation before deletions, shared link creation, or permission modifications.
- Prefers item IDs to paths; verifies write operations by re-reading objects or metadata instances.

## See also

[[MOC Skills]] · [[Zoth OS]] · [[Skill google-workspace|google-workspace]]