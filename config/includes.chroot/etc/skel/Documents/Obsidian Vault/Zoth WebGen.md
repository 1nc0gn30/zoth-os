# Zoth WebGen

Local full-stack site foundry. Feels like Studio + OS gold, not a generic Bolt clone.

## Repos

| What | Where |
|---|---|
| Foundry (this app) | GitHub `1nc0gn30/zoth-webgen` (renamed from `bolt.diy`) |
| Local folder | `~/NullAITech/bolt.diy` (name kept) |
| Python engine | `NullAITech/zoth-webgen` |
| OS launcher | `zoth-os/scripts/bolt-diy.sh` → `/usr/local/bin/bolt-diy` and `zoth-webgen` |

Clone URL for launchers: `https://github.com/1nc0gn30/zoth-webgen.git` into `NullAITech/bolt.diy`.

## Run

- Dev: `127.0.0.1:5173` (`npx remix vite:dev` after `node pre-start.cjs`).
- Menu via `bolt-diy`: 1=dev :5173, 2=ollama :11434, 3=electron:dev, 4=edit `.env.local`, 5=git pull.
- Studio routes: `/webgen` showcase, `/webgen/docs` Python engine.
- Do not deploy WebGen.

## Related

- [[Zoth OS]]
- [[Zoth Studio]]
- [[Zoth Memory]]
