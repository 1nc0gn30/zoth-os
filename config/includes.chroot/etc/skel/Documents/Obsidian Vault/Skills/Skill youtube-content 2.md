---
title: "youtube-content"
tags: [skill, hermes]
aliases: ["youtube-content"]
---

# youtube-content

Extracts YouTube video transcripts and transforms them into structured text formats.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/skills/media/youtube-content/SKILL.md`
- **Dependencies:** `youtube_transcript_api` (via Hermes PM `youtube` extra)

## When to load
Load this skill when the user provides a YouTube link (standard video, Shorts, live link, or video ID) and asks to:
- Retrieve or inspect a video transcript
- Generate a summary or chapter breakdown
- Repurpose video content into a Twitter/X thread or blog post
- Extract notable quotes with timestamps

## Capabilities & Workflows
- **Transcript Extraction:** Uses `fetch_transcript.py` with flags for plain text (`--text-only`), timestamps (`--timestamps`), and language fallbacks (`--language`).
- **Formatting Options:**
  - *Summary*: 5–10 sentence video overview
  - *Chapters / Chapter Summaries*: Timestamped outlines and section summaries
  - *Threads*: Numbered social posts under 280 characters
  - *Blog Post*: Full structured article with headings and key takeaways
  - *Quotes*: Timestamped notable excerpts
- Automatically chunks transcripts exceeding ~50K characters before synthesis.

## See also

[[MOC Skills]] · [[Zoth OS]]