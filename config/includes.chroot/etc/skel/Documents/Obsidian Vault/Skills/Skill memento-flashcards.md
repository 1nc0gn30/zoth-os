---
title: "memento-flashcards"
tags: [skill, hermes]
aliases: ["memento-flashcards"]
---

# memento-flashcards

Spaced-repetition flashcards: create, review, quiz, export.

- **Origin:** Hermes skill (workstation skill, not a Zoth product)
- **Path:** `~/.hermes/hermes-agent/optional-skills/productivity/memento-flashcards/SKILL.md`

## Overview & When to Load

Load when saving facts for later study, reviewing active flashcards with spaced repetition, generating quizzes from YouTube video transcripts, or importing/exporting card decks.

## Key Features & Workflow

- **Local Storage:** Cards reside in a local JSON file at `~/.hermes/skills/productivity/memento-flashcards/data/cards.json`, updated via atomic operations using `memento_cards.py`.
- **Card Creation:** Converts explicit statements or user requests into Q/A front-back pairs, organized by collections (defaults to `"General"`).
- **Spaced-Repetition Review:**
  - Evaluates due cards using `memento_cards.py due`.
  - The agent evaluates free-text answers as correct, partial, or incorrect.
  - Follows strict plain-text feedback revealing the correct answer before assigning ratings: `hard` (+1 day), `good` (+3 days), `easy` (+7 days), or `retire`.
  - Cards reaching an ease streak of 3 are automatically retired from rotation.
- **YouTube Quizzing:**
  - Fetches transcripts via `youtube_quiz.py fetch <VIDEO_ID>` (using `youtube-transcript-api`).
  - Synthesizes 5 focused recall questions and adds them to a dedicated deck via `memento_cards.py add-quiz`.
- **Deck Management:** Supports 3-column CSV export/import (`question,answer,collection`) and progress tracking via `memento_cards.py stats`.

## See also

[[MOC Skills]] · [[Zoth OS]]