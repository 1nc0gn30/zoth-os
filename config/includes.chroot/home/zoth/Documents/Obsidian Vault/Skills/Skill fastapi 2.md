---
title: "fastapi"
tags: [skill, hermes]
aliases: ["fastapi"]
---

# fastapi

Official FastAPI engineering conventions and best practices for modern Python web APIs and Pydantic models.

- **Origin:** Hermes skill (Workstation skill, not a Zoth product)
- **Path:** `/home/zoth/.hermes/installs/76fe6b73b96f244c/environments/28a00ad4f7744cebb92e209294188c43/venv/lib/python3.14/site-packages/fastapi/.agents/skills/fastapi/SKILL.md`
- **Tags:** API, FastAPI, Python, Web, Pydantic, REST

## When to Load

Load when developing, refactoring, or modernizing FastAPI services and Pydantic schemas. Enforces clean parameter declarations, dependency injection patterns, async concurrency correctness, and high-performance serialization.

## Core Best Practices & Patterns

- **CLI Execution:** Uses `fastapi dev` and `fastapi run` driven by `[tool.fastapi] entrypoint` in `pyproject.toml`.
- **`typing.Annotated`:** Strictly requires `Annotated` for `Path`, `Query`, and `Depends()`, discouraging legacy default-value parameter signatures.
- **No Ellipsis (`...`):** Eliminates `...` defaults in Pydantic models and path parameters.
- **Response Models & Typing:** Enforces standard Python return type hints or `response_model` for Rust-backed Pydantic serialization and data filtering (deprecating `ORJSONResponse`).
- **Router Configuration:** Defines `prefix` and `tags` directly on `APIRouter()` rather than during `app.include_router()`.
- **Async Concurrency:** Restricts `async def` to non-blocking or genuinely awaited code; uses regular `def` or `asyncer` (`asyncify`/`syncify`) for blocking I/O to avoid event loop stalls.
- **Dependency Scoping:** Uses generator dependencies with `yield` and explicit `scope` (`request` or `function`).

## See also

[[MOC Skills]] · [[Zoth OS]]