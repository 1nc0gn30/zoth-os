---
title: "inference-sh-cli"
tags: [skill, hermes]
aliases: ["inference-sh-cli"]
---

# inference-sh-cli

`inference-sh-cli` is a Hermes workstation skill that enables interaction with 150+ cloud AI applications across image, video, LLM, search, audio, and 3D generation through the `infsh` command-line tool.

- **Origin:** Hermes workstation skill (not a Zoth product)
- **Source Path:** `~/.hermes/hermes-agent/optional-skills/devops/inference-sh-cli/SKILL.md`
- **Platforms:** Linux, macOS, Windows

## When to Load

Load this skill when:
- Generating images using models such as FLUX Dev, Gemini Image, ByteDance Seedream, or Grok Imagine.
- Generating videos using Google Veo, Wan 2.5, Seedance, or OmniHuman.
- Running AI web search via Tavily or Exa without configuring standalone provider credentials.
- Automating media workflows such as local file upscaling, image-to-video conversion, or avatar lipsyncing.

## Key Capabilities & Workflow

- **App Discovery:** Requires discovering valid app identifiers first with `infsh app list --search <term>` rather than guessing IDs.
- **Execution:** Runs apps using `infsh app run <app-id> --input '<json>' --json` for structured output.
- **Automatic Asset Uploads:** Automatically handles uploading local image or audio paths specified in the input payload.
- **Authentication:** Requires prior installation and authentication via `infsh login` or `INFSH_API_KEY`.

## See also

[[MOC Skills]] · [[Zoth OS]]