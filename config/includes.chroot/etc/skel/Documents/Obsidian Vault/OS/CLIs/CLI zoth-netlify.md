---
title: "zoth-netlify"
tags: [os, cli]
aliases: ["zoth-netlify"]
---

# zoth-netlify

`file`: Bourne-Again shell script.

`zoth-netlify` is a Bash-based CLI hub and interactive menu console for managing serverless web projects and Netlify deployments in ZothOS. Located at `/usr/local/bin/zoth-netlify`.

## Behavior & Passthrough
- **Direct Passthrough**: When invoked with command-line arguments (e.g. `zoth-netlify deploy --prod`), it executes `exec netlify "$@"` directly.
- **Interactive Control Console**: Invoked without arguments, it clears the terminal and presents a status banner displaying CLI version, Node version, working directory, and current Git branch status.

## Menu Operations
The interactive menu exposes numbered shortcuts for common Netlify CLI workflows:
1. **Status**: Runs `netlify status` to check account and linked site info.
2. **Login**: Runs `netlify login` for browser/token authentication.
3. **Local Dev**: Starts local emulation via `netlify dev` (ports, functions, environment).
4. **Deploy Preview**: Uploads a draft preview build via `netlify deploy`.
5. **Deploy Production**: Deploys live with `netlify deploy --prod`.
6. **Link / Init**: Connects a repository with `netlify link` or `netlify init`.
7. **Environment Variables**: Inspects project configuration with `netlify env:list`.
8. **Open Dashboard / Site**: Launches `netlify open` or `netlify open:site` in the browser.
9. **Scaffold Project**: Generates a starter template containing `netlify.toml`, a sample serverless endpoint (`netlify/functions/hello.js`), and a test `index.html`.
10. **Cheatsheet**: Displays reference documentation for commands and `netlify.toml` structure.
11. **Interactive Shell**: Spawns a subshell in the current environment.

## See also

[[Zoth OS]] · [[MOC CLIs]]