---
title: "create-skill"
tags: [skill, grok]
aliases: ["create-skill"]
---
# create-skill

`create-skill` is a **Grok bundled** skill that guides agents through an interactive workflow to scaffold, configure, and write new Grok agent skills.

- **Origin:** Grok bundled (`~/.grok/bundled/skills/create-skill/SKILL.md`)
- **When to load:** Load when the user requests creating a new skill, wants to scaffold an automation recipe, or invokes the `/create-skill` slash command.

### Interactive Creation Workflow
- **Step 1: Requirements Gathering:** Prompts the user step-by-step for the skill name (2–64 characters, lowercase alphanumeric with hyphens), intended scope, and core workflow description.
- **Step 2: Scope Resolution:** Configures the target directory based on project context:
  - *Project Scope (default in git repos):* `<repo-root>/.grok/skills/<name>/`
  - *User Scope:* `<grok-home>/skills/<name>/` (resolving `$GROK_HOME` or `~/.grok`).
- **Step 3: Frontmatter & Description Drafting:** Formulates the YAML frontmatter containing `name`, `description`, trigger keywords, argument hints, and slash command bindings for user review.
- **Step 4: Directory & Asset Scaffolding:** Creates the target directory and optional subdirectories for helper utilities (`scripts/`) and documentation (`references/`).
- **Step 5: SKILL.md Generation:** Writes the complete instructional markdown document adhering to Grok skill standards.

## See also

[[MOC Skills]] · [[Zoth OS]]