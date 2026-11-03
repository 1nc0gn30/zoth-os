---
title: "code-review"
tags: [skill, grok]
aliases: ["code-review"]
---
# code-review

`code-review` is a **Grok bundled** skill designed for rigorous, uncompromising code quality audits focusing on architectural simplicity, abstraction hygiene, and long-term maintainability.

- **Origin:** Grok bundled (`~/.grok/bundled/skills/code-review/SKILL.md`)
- **When to load:** Load when conducting deep code quality audits, pull request reviews, or refactoring assessments where harsh maintainability standards must be enforced.

### Review Rules & Standards
- **Structural Simplification ("Code Judo"):** Encourages high-leverage refactoring to eliminate unnecessary abstractions, redundant branches, or wrapper layers while preserving exact runtime behavior.
- **1,000-Line File Threshold:** Flags any change that pushes a file over 1,000 lines, requiring decomposition into focused subcomponents, modules, or helpers.
- **Spaghetti Condition Guard:** Rejects ad-hoc conditionals, scattered special cases, and one-off edge-case flags in unrelated code paths, mandating dedicated state machines or policy objects instead.
- **Design Quality Over Mere Functionality:** Refuses to rubber-stamp implementations simply because they pass tests; demands clean architectural boundaries and the deletion of incidental complexity.
- **Boring, Predictable Code:** Prohibits magical or brittle indirection, identity wrappers, and leaky pass-through helpers that obscure data flow.
- **Type Boundary Rigor:** Enforces explicit contracts and schemas while rejecting gratuitous `any`, unchecked type assertions, and silent fallback logic.

## See also

[[MOC Skills]] · [[Zoth OS]]