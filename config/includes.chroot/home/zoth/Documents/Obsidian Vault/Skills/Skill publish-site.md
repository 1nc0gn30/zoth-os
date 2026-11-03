---
title: "publish-site"
tags: [skill, hermes]
aliases: ["publish-site"]
---

# publish-site

Versioned static site and Single Page Application (SPA) deployment workflow for user-owned infrastructure across GitHub Pages, Cloudflare Pages, and Netlify.

- **Origin:** Hermes skill (`optional-skills/web-development/publish-site`)
- **Category:** `web-development`
- **Platforms:** Linux, macOS, Windows
- **Nature:** Workstation skill from Hermes, not a Zoth product.

## When to Load
Load this skill when the user requests to:
- Publish or host a static site, web dashboard, prototype, or documentation directory.
- Deploy build artifacts (`dist/` or `build/` folders from Vite, Astro, Next export, etc.).
- Update an existing deployed site with version tagging.
- Roll back a failed deployment to a previous git tag.

## Deployment Pipeline
The skill defines a standardized five-stage deployment sequence:
1. **Local Preview:** Serve artifacts locally (`python3 -m http.server 8080`) or share previews via `cloudflared tunnel`.
2. **Version Control:** Commit and tag every release before deployment (`git tag deploy-YYYYMMDD-HHMM`).
3. **Provider Ladder:**
   - **GitHub Pages (Default):** Deploys via `git subtree push` or `gh api` to `gh-pages`.
   - **Cloudflare Pages:** Deploys via `npx wrangler@latest pages deploy` for custom domains and redirects.
   - **Netlify (Fallback):** Deploys production or draft builds via `netlify deploy`.
4. **Verification:** Live HTTP check using `curl -sS -o /dev/null -w '%{http_code}' <url>` expecting HTTP 200.
5. **Rollback:** Checkout previous tags (`git checkout deploy-<previous> -- .`) and redeploy.

## Key Operational Notes
- Covers static output and SPAs; dynamic serverless runtimes are handled by separate skills.
- SPAs require a fallback (copy `index.html` to `404.html` on GitHub Pages, or `_redirects` on Cloudflare/Netlify).
- Never commit `.env` or secrets to static hosting repositories.

## See also

[[MOC Skills]] · [[Zoth OS]]