---
title: "canvas"
tags: [skill, hermes]
aliases: ["canvas"]
---

# canvas

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/productivity/canvas/SKILL.md`

## Overview
`canvas` provides read-only integration with the Canvas Learning Management System (LMS), allowing agents to query enrolled courses and assignments using personal API access tokens.

## When to Load
Load this skill when:
- Querying active or historical courses in an educational Canvas LMS account.
- Retrieving assignments, upcoming deadlines, point values, or submission types for a specific course.
- Checking coursework status and linking back to online assignment URLs.

## Key Features & Workflow
- **Read-Only Access**: Strictly queries information without modifying courses, submissions, or user data.
- **Python CLI Tool**: Interacts via `scripts/canvas_api.py` with commands such as:
  - `list_courses` (supports `--enrollment-state active`).
  - `list_assignments <course_id>` (supports sorting with `--order-by due_at`).
- **Pagination & Rate Handling**: Handles Canvas `Link` header pagination automatically and tracks rate limits (~700 requests per 10 minutes).
- **Environment Configuration**: Requires `CANVAS_API_TOKEN` and `CANVAS_BASE_URL` (pointing to the institution's Instructure domain) set in the Hermes environment.

## See also

[[MOC Skills]] · [[Zoth OS]]