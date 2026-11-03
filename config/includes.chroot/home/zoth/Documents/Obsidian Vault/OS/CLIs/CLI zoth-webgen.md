---
title: "zoth-webgen"
tags: [os, cli]
aliases: ["zoth-webgen"]
---

# zoth-webgen

`file`: Bourne-Again shell script.

`zoth-webgen` is the CLI entrypoint for the Zoth WebGen Foundry (autonomous website generator and AST engine), located at `/usr/local/bin/zoth-webgen`.

### Operational Flow

- **Repository Discovery**: Checks candidate locations for `webgen_engine.py`:
  - `/home/zoth/NullAITech/zoth-webgen`
  - `~/NullAITech/zoth-webgen`
  - `/opt/zoth-webgen`
  - `~/zoth-webgen`
- **Auto-Provisioning**: If not found in candidate paths, automatically clones `https://github.com/NullAITech/zoth-webgen.git` into `~/NullAITech/zoth-webgen`.
- **Execution Modes**:
  - `zoth-webgen` (no arguments): Starts the web server via `python3 server.py --port 8092`.
  - `zoth-webgen web [port]`: Starts the web server on the specified port (defaults to `8092`).
  - `zoth-webgen <args>`: Invokes the generator engine CLI via `python3 webgen_engine.py "$@"`.

## See also

[[Zoth OS]] · [[MOC CLIs]] · [[Studio zoth-webgen|Zoth WebGen Foundry]] · [[Studio bolt.diy|Zoth WebGen]] · [[Desktop zoth-webgen|zoth-webgen]]