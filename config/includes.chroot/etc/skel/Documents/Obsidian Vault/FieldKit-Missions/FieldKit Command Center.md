---
title: "FieldKit Command Center"
mission_id: "command-center"
goal: "Hackathon build log mirror"
status: "active"
provider_plan: muse-wonder
provider_vision: muse-spark
steps_total: 0
steps_done: 0
spark_p50_ms: null
tags: [fieldkit, meta-hackathon, command-center]
---

# FieldKit Command Center

Pipeline: [[FieldKit Architecture & Mission Flow]]

## Build log milestones

# HACKATHON-LOG.md — Zoth Relay Live (indie track)

## 2026-10-25 (PRE-KICKOFF, ~11pm ET)

Done:
- Day identity pinned: now Oct 25 ~11:00 PM EDT; kickoff Oct 26 (livestream).
  PRE-KICKOFF rules in effect: prep only, no entry features.
- Located repos on this machine (no `/workspace` here — aZoth-box only):
  - `zoth-relay` @ `e0b9034` (`feat/mobile-api`, clean, no tags) — main entry codebase.
  - `zela-glasses-guide` @ `03d3d01` (`main`, dirty) — demo/site, not the app.
  - `zoth-bot` @ `d12615f` — NOT entry (watch app separate per roadmap).
- Official Rules: NOT yet published. Event page states rules "will be published
  before the Hackathon begins on October 26, 2026 and must be accepted by the
  selected participants." Confirmed: submissions due Nov 4 9:00 PM ET, judging
  Nov 4–8, finals Nov 9; approval notifications by Oct 26 9:00 AM ET.
- Drafted `PRIOR-WORK.md` skeleton in `meta-hackathon-2026/` (this dir).
- Baseline relay tests: **129 passed, 2 failed** (`test_install.py::test_detect`
  debian/fedora cases — host detects as `zothos (fedora)`; pre-existing,
  unrelated to entry; not touching pre-kickoff).
- Research round (Meta API + relay seams), all read-only:
  - Meta Model API = `https://api.meta.ai/v1`, OpenAI-compatible chat/streaming;
    key `META_API_KEY`; Spark 1.1–1.3 multimodal (1M ctx, prompt caching,
    `reasoning_effort`); vision via `image_url`. D1 Spark stub ≈ new
    `AskTarget` + thin provider interface + smoke test.
  - `ask.py` already streams OpenAI-compatible targets w/ env-key auth;
    `build_messages` puts system+mission first (prefix-cache friendly) but keeps
    20 text turns (D2 bounds this). `guide_stream.py` already implements the
    proactive-coach pattern (SILENT-unless-meaningful, TICK nudges,
    pause/resume, barge-in gens, rolling sessions) — Sessions API mirrors it.
  - MCP = FastMCP `_register` pattern; D5 `see_now`/`say`/`mission_*` slot in.
  - Verdict: no further research useful tonight. Unknowns left (participant
    keys/credits, hackathon-only endpoints, Official Rules) unlock on D1.
- Key sourcing (Neal asked pre-kickoff): Meta Model API key comes from
  dev.meta.ai (account → API keys); hackathon participant keys/credits
  expected via Oct 26 9am approval notice / kickoff / Discord. Until it
  lands, D1–D2 proceed against fixtures + local Ollama/AGY path; Spark is a
  config swap once `META_API_KEY` exists. Muse Code session is the builder,
  not a runtime inference endpoint.
- ADOPTED "next level with Muse" direction (Neal said go, pre-kickoff):
  two-tier cognition (Wonder `muse-wonder-1.0` plans/reviews, Spark reacts w/
  minimal reasoning) + video clips on scene-change + full-mission 1M-context
  memory w/ cached prefix. Folds into D1–D4, no new days. Wonder Full rejected
  (no API). Open: event Spark model id, credits, judge PWA key scoping (D7).
- Positioning (Neal, pre-kickoff): "Zoth x Meta toolkit" narrative — relay as
  backbone, many tools (glasses coach, X streaming, agent eyes, PWA) — but the
  ENTRY stays one sharp demo (Mission Mode flagship). Toolkit = architecture
  story for README/judges; MVP-first, D7 freeze still holds.
- Design decision w/ Neal (pre-kickoff): D1 provider interface will be
  protocol-agnostic, NOT OpenAI-only. Common Provider ABC (vision turn in →
  streamed text/events out); transports: OpenAI-compatible (Spark default via
  `api.meta.ai/v1`, + Grok/OpenRouter/Ollama), Anthropic Messages (Meta
  `/v1/messages` passthrough incl. thinking blocks), existing Gemini Live +
  AGY paths kept as adapters. No litellm dependency — two thin transports.

Blockers / needs from Neal:
- Guide Android DAT app source (`zoth-guide`), esp. 0.5.0 source deployed from
  another machine — not on this box. Same for `zoth-live`/`zoth-relay-live`
  and `/workspace/*` plan files.
- Discord/calendar/credits invites; glasses + Pixel + OBS/X-RTMP access checks
  (physical — Neal's side).
- Application deadline is TONIGHT 11:59 PM ET (assume already applied — flagging).

Next (D1, after kickoff + rules):
1. Read/accept Official Rules → `RULES-NOTES.md` (≤20 lines).
2. Tag PRE-EVENT baselines; finish PRIOR-WORK.md; open `hackathon/2026-10-26`.
3. Scaffold provider interface + Muse Spark provider stub (env auth); smoke test.

## 2026-10-26 (D1 — KICKOFF, 12:52 PM ET start)

Done:
- Neal provided participant guide + FIELDKIT roadmap (`Desktop/Zoth-Meta-Hackathon/`).
  Rules captured in `RULES-NOTES.md` (15 lines): public repo, new-work-only demo,
  prior/new split or DQ, judging Impact 30 / Meta tooling 25 / Depth 20 / Demo 25.
- Working copies in `Desktop/Zoth-Meta-Hackathon/`: `zoth-relay/`, `zela-glasses-guide/`,
  docs. Originals untouched (zela's pre-existing dirty files preserved).
- Baselines tagged `baseline/pre-event-2026-10-26`: relay `778cb33`, demo `ad37ac2`.
- Branch `hackathon/2026-10-26` in relay copy. Commits:
  - `8900af8` Provider layer: `zoth_relay/providers.py` (OpenAI-compat + Anthropic
    Messages transports; presets spark/wonder/spark-messages/wonder-messages/local),
    `tests/test_providers.py` (5 tests), `scripts/smoke_provider.py`.
  - `8326557` Stubs: `WS /v1/sessions` + `POST /v1/missions` (auth-gated, honest
    not-implemented until D2/D3), `tests/test_sessions_stub.py` (3 tests).
- Full suite in copy: **137 passed, 2 failed** — only the 2 pre-existing
  `test_install` env-detection failures from baseline. Smoke script verified:
  no key → guidance + exit 2 (live turn pending Neal's key).

Blockers / Neal:
- [DONE per Neal] Claim $150 Meta credits (Google Form).
- [DONE] Live smoke PASSED end-to-end (key from zoth-vault, host-network run):
  text turn → "No camera frame coming through yet..." (ms 2228, first_ms 2119,
  cold); vision turn w/ synthetic red PNG → "Solid bright red fills the entire
  frame." (ms 1392, first_ms 1333, warm). Meta Spark path is LIVE. Earlier
  failure was a 7-char placeholder in the vault; Neal re-stored the real key.
- [OPEN] Guide Android 0.5.0 + Live app sources: wider search of this box found
  NONE (only unrelated Android projects). Documented as prior work; if on aZoth
  box, copy over before D3. Does not block D2.
- [DEFERRED per Neal] Submission repo must be PUBLIC by Nov 4; `gh auth login` (stale token).
- [DONE per Neal] Discord #intros as NullAI / FIELDKIT.

Next (D2, Oct 27): real Sessions API WS (frame diff + bounded context + Spark),
latency metrics per turn, 10-min soak. MVP risk: GREEN.

## 2026-10-26 (D1 late / D2 start) — White-space plan adopted (Neal: go)

- Fill 1 (D3): Wonder structured step events replace regex step tracking.
- Fill 2 (D4–D5): confirm-gated agent actions via trust layer (aims Best Agentic).
- Fill 3 (D6, MVP-gated): open-weight preset soak (aims Best Open Weights).
- Verified white space: NO OBS/RTMP plumbing in relay (D5 is real new work).
- Live Spark smoke PASSED (see Blockers). D2 sessions tests written first
  (`tests/test_sessions.py`); implementation follows test-first.

## 2026-10-26 (D2 — Sessions API, built early)

Done (commit `c1ebdb9` on `hackathon/2026-10-26`):
- `WS /v1/sessions` REPLACED the D1 stub with the real API (`zoth_relay/sessions.py`):
  hello handshake w/ provider routing, speech/text turns, frame diff (SHA-256,
  changed-only, consumed once), clip attach, mission prefix update, barge
  (cancels active turn, partial reply dropped), state events after each turn.
- Bounded context: cached prefix (system+mission) + char-capped transcript
  (default 24000, hello-tunable 500–200k). New `sessions` cap on mobile profile;
  `Relay.check_sessions`; audit open/close (counts only).
- Metrics: every turn records kind/first_ms/ms; provider done-events carry both.
- `scripts/soak_sessions.py` (live soak harness, prints p50).
- Tests: `tests/test_sessions.py` (7) replace `test_sessions_stub.py`:
  auth 4401/4403, unknown/unconfigured provider, streamed turn + metrics,
  frame-diff-only-changed, 30-turn bounded-context soak, barge unit test.
  Missions stays an honest 501 until D3.
- Verification: focused 7 passed; FULL suite **141 passed, 2 failed** (only the
  2 pre-existing baseline `test_install` env failures).
- LIVE soak vs Spark (`muse-spark-1.1`): 60 turns, first_ms p50 **1274 ms**
  (min 826, max 2404), history 7026 chars after 60 turns (bounded), turn 60 as
  fast as turn 10 — no context drift. Watch item: warm first-token ~0.8–1.7 s
  is Meta-side latency; D7 60-min soak + cache-hit measurement will quantify.

Blockers unchanged: Guide 0.5.0 source absent (D3 workaround ready), public repo
deferred to Nov 4 window. Next: D3 Missions API + Wonder structured planner.

## 2026-10-26 (D3 — Missions API, built early)

Done (commit `9565afb` on `hackathon/2026-10-26`):
- `zoth_relay/missions.py`: MissionStore (in-memory), Wonder structured planner
  (one sentence -> JSON checklist; tolerant parse w/ line fallback, cap 12),
  typed step tracker (`assess_step` -> step_done/off_track/unsafe/none + say).
  No regex over prose anywhere downstream (Fill 1 delivered).
- REST: `POST /v1/missions` (201, plans via provider, default wonder),
  `GET /v1/missions/{id}`, `POST /v1/missions/{id}/events`
  (advance/skip/assess). New `missions` cap + `check_missions`; audit ids/counts.
- Sessions: hello `mission_id` attaches a mission; ready/state carry
  {id,current,total,step}; turn system prefix = goal + current step (live
  lookup, so REST advances show up in the next turn).
- Tests: `tests/test_missions.py` (6): parse variants, store transitions,
  REST auth/create/get/events/404/400, tracker typed event, session surfacing.
  FULL suite **147 passed, 2 failed** (baseline `test_install` only).
- UNVERIFIED (flagged, not hidden): live Wonder planner call — vault session
  expired from this shell (`VAULT_EMPTY`). Harness ready:
  `scripts/plan_mission.py`. Needs Neal: `zoth-vault unlock`, then I re-run.

Next: D4 proactive coach (step done/off-track/idle triggers, rate limit + shh,
barge-in reuse, session event types for overlay). Guide-app wiring stays
blocked on the missing 0.5.0 source; PWA (D6) is the judge-facing client.

## 2026-10-26 (Relay LIVE + end-to-end verified)

- FieldKit relay RUNNING from Desktop copy on `100.64.0.10:8770` (+ loopback),
  detached, health OK. Old mobile relay on :8766 untouched. Config/token/audit
  in `relay-runtime/` (0600 token `pixel`, mobile profile).
- Live Wonder planner VERIFIED (was flagged unverified): 8-step mower plan,
  4.6 s. REST mission create w/ phone token VERIFIED (7 steps, current=1).
- Live WS session VERIFIED: hello+mission attach -> ready carries step 1/7 ->
  Spark turn answered on-step (ms 1390, first_ms 1247) -> state w/ mission.
- Remaining first-run step is Neal-side: `pair_qr.py` -> scan in app (phone on
  Tailscale) -> Talk/Start mission. PWA (D6) is the judge-facing client.

## 2026-10-26 (Meta glasses via DAT + push)

- Researched first (no faking): original glasses path = Meta Wearables DAT.
  Public SDK `com.meta.wearable:mwdat-{core,camera,mockdevice}:1.0.1` (Maven
  Central). Inspected real AAR class signatures (javap) before coding.
- App v0.2.0: Kotlin bridge `DatGlasses.kt` (initialize, Meta AI registration,
  AutoDeviceSelector session, camera photos -> relay frames), compileSdk 35
  (installed platform), Kotlin 2.2.20 (DAT metadata requirement), manifest
  APPLICATION_ID placeholder + analytics/crash opt-outs. BUILD SUCCESSFUL
  (41 MB w/ DAT native libs). Docs: `android/DAT-SETUP.md`.
- Pushed to https://github.com/NullAITech/nullai-fieldkit (`f55d581`, also
  carries the earlier local redesign commit `f4512f5`).
- UNVERIFIED (flagged): on-glasses session (needs Wearables Developer Center
  APPLICATION_ID via -PmwdatAppId + Developer Mode + physical glasses) and
  reinstall to phone (device was off USB at build time).

## 2026-10-26 (Spotter + guide trio + braille eyes view)

- Relay `zoth_relay/trio.py` (commit `a3e2acf`, mirrored + pushed `46fa057`):
  Eyes (deduped observations, NOCHANGE/similarity silence), Advisor (typed
  prioritized suggestions), Director (only speak decision; safety always
  speaks, preset chattiness gates, pause mutes). Presets: safety-first,
  get-it-done, teach-me, social + custom_preset(). 4 trio tests green.
  NOT yet wired as an auto-loop in WS sessions (next: hello preset + loop).
- App renamed **Spotter** (label/title; FieldKit stays the platform name).
  Live braille eyes-view (luminance -> Bayer 4x4 ordered dither -> braille
  2x4 cells, animated from phone + glasses frames), real compass heading
  (accel+magnetometer). Rebuilt + reinstalled to Pixel, running.
- Phone PROVED able to open relay sessions (audit: pixel @100.64.0.20).
  Glasses still gated on APPLICATION_ID registration (Neal) — "no eligible
  device" is that gate, not a code bug. Spatial audio: compass is real now;
  voice-focus/DoA honestly staged (wearer push-to-talk today; DAT audio
  frames future). Teknium site = technique reference only (Bayer/text-mode).

## 2026-10-26 (Trio wired into live sessions; Spotter controls)

- NullAI FieldKit commit/push `2c67626`: WS hello accepts `guide`, `preset`,
  `preset_custom`, `allow_outside`; Sessions run a 2.5s proactive
  Eyes -> Advisor -> Director loop over changed frames. `say` decisions are
  Director-owned; pause/resume and `shh` gate output; safety remains rule-first
  inside Director. State carries guide/preset/paused/ignored_outside/heading.
- Voice focus v1 is protocol-real: `speaker: "wearer"|"other"`; bystanders are
  counted as `ignored_outside` and never sent to models. Spotter marks its own
  phone mic as wearer. Sound direction propagation is compass-based now
  (`heading`, `heading_source=phone|glasses`); audio direction-of-arrival is
  not faked and remains future DAT-audio work.
- Spotter app: preset cycling (Get It Done/Safety First/Teach Me/Social),
  Shh pause, observation/say rendering and speech, compass streamed once/sec.
  Android build succeeded. Runtime repo mirror committed `f9dd037`.
- Tests: new `tests/test_trio_sessions.py` covers proactive say, pause/quiet
  preset gating, bystander ignore (zero model calls), compass/shh, and WS
  guide/preset/compass/voice-gate integration. Full nullai-fieldkit suite:
  156 passed, 2 pre-existing baseline `test_install` failures.
- Verification gap: latest APK was built but not reinstalled because ADB
  reported no device at install time. Running :8770 relay still has pre-trio
  code until deliberately restarted. On-glasses verification remains blocked
  concretely on a real Wearables Developer Center APPLICATION_ID
  (`-PmwdatAppId=<id>`) plus Meta AI registration/Developer Mode.

## 2026-10-26 (Sound direction + render polish; pushed dd98d5e)

- True-ish sound direction v1 (honest estimate): Android `SoundField`
  (48 kHz stereo, UNPROCESSED->VOICE_RECOGNITION->mono fallbacks) estimates
  relative bearing via cross-correlation (+/-24 samples) + level, smoothed;
  app shows `Sound NNN deg near/far` and streams `{type:sound}` (world
  bearing = compass + relative) once/sec. Relay stores sound_heading/
  relative/source/level_db in state; unlabelled speech from >75 deg off-axis
  is treated as bystander (ignored, zero model calls). Mic-layout variance
  documented in code; DAT audio DoA still future.
- Eyes-view polish: Photo -> Braille (Bayer + edge boost) -> ASCII (Bayer +
  char ramp) cycle, from phone and glasses frames.
- Tests: +1 sound test (6 trio-session tests), 17 passed focused; runtime
  mirror committed `dbffec5` (6 passed). APK rebuilt OK (41.5 MB).
- STILL BLOCKED (checked again): vault locked -> :8770 restart held (will not
  kill the healthy pre-trio relay without its key); APPLICATION_ID still
  placeholder -> on-glasses unverified.
- UPDATE: latest APK (SoundField + ASCII/braille polish build) reinstalled to
  Pixel 59230DLCH003XU after reconnect; install Success, app launched PID
  13830, no FATAL in its logcat. Version label still reads 0.2.0.

## 2026-10-26 (Camera/DAT correction; pushed 8f04f71)

- Neal corrected the design intent: ASCII/braille/dither belongs in the app
  DESIGN, not rendered over the camera/glasses stream. Removed the stream
  text-render overlay/button and its frame-render calls. Added a design-only
  animated `DitherStripView` dot motif to the header and current-step card.
- Phone camera stabilization: supported preview-size selection, center-crop
  TextureView transform for display rotation (fixes skew), continuous AF/AE,
  open guards, capture-session cleanup, deterministic close/reopen when
  switching Phone <-> Glasses, and throttled QR decode. Not yet device-verified.
- Meta glasses correction: original Zoth Guide Android source is confirmed
  absent on this machine (only scripts/site assets found). Following the
  working long-lived-session pattern, `DatGlasses` now explicitly starts the
  DAT video stream (`Stream.start()` was missing), collects state/errors, and
  only reports streaming after the first decoded frame. Frames convert
  (planar YUV420/RGBA/RGB) to JPEG, display on the phone, and forward to the
  relay. Previously it only polled photos and falsely said connected.
- Build: Android `assembleDebug` and `testDebugUnitTest` (no unit tests)
  succeeded. Install of this correction build was not completed in-session:
  sandboxed ADB sees the Pixel as `unauthorized`, and unsandboxed execution
  approval was unavailable. Needs Neal to allow the current ADB prompt or
  install the APK from `nullai-fieldkit/android/app/build/outputs/apk/debug/`.
- Fit pass (pushed `2a2e400`): full suite 157 passed / 2 baseline failures;
  Spotter bumped to v0.2.1 (versionCode 3), APK rebuilt and badging-verified;
  README status refreshed. Android lint unavailable: lint itself crashes
  analyzing DatGlasses.kt (Kotlin-analysis tooling bug) — compile + tests are
  the gate. Relay restart still vault-gated; glasses still app-ID-gated.
- v0.2.1 correction build INSTALLED to Pixel + screenshot-inspected: camera
  preview shows a real frame (no white screen, no visible skew), compass live
  (139 deg SE), dither strips subtle, paired relay/token prefilled, app alive
  (no FATAL). Motion/freeze can only be fully judged interactively by Neal.

## 2026-10-26 — Public repo + rebrand start (Neal direction)

- Created NEW local repo `Desktop/Zoth-Meta-Hackathon/nullai-fieldkit` with a
  clean curated history. Existing relay history was NOT rewritten or deleted.
- New history: import frozen pre-hackathon baseline -> D1 provider layer -> D1
  API stubs -> D2 Sessions API -> D3 Missions API -> rebrand docs.
- Public name: **FieldKit by NullAI**. README rewritten for regular users
  (hands-free mission coach, plain example, safety/control, NullAI/ZothOS/
  Zoth Studio links). Added `BRAND.md` (public names, voice, translation table,
  visual direction) and public `PRIOR-WORK.md` (honest prior/new split).
- Verification in new repo: focused provider/session/mission tests = 18 passed.
- PUBLISHED: https://github.com/NullAITech/nullai-fieldkit (PUBLIC, `main`
  tracks origin). Neal logged in `gh` (account NullAITech). Secret scan of
  tracked files before push: clean. Later hackathon commits push to this repo.
- FieldKit Android v0.1.0 BUILT (`android/` in nullai-fieldkit, commit `7a27ed8`):
  debug APK at `android/app/build/outputs/apk/debug/app-debug.apk` (3.5 MB,
  package tech.nullai.fieldkit, minSdk 30). Sessions WS + Camera2 frames +
  speech in + TTS out + mission create/advance. No adb device attached at
  build time — install pending Neal. Unverified on-device (flagged).
  UPDATE: installed via adb to Pixel (59230DLCH003XU) after Neal authorized
  USB debugging; launched clean (PID alive, permission dialog shown, no
  crash). End-to-end still unverified until relay + token are entered.
  REDESIGN (Neal feedback, commit `f4512f5` in nullai-fieldkit): white
  Meta-style UI; Phone camera / Meta glasses source toggle (hello carries
  `source`; glasses POV streaming awaits glasses/DAT side); QR pairing —
  ZXing scan in app + `scripts/pair_qr.py` relay-side (syntax-checked only,
  never run here: it displays the token). Rebuilt (7.6 MB) + reinstalled to
  Pixel, launches clean. Relay start on :8770 still pending vault unlock.

- 2026-10-26 late (ET): vault unlocked by operator. Relay :8770 restarted on current FieldKit code (nullai-fieldkit .venv, runtime config/token/audit unchanged). Scratch-port proof first, then swap. Verified: health on 127.0.0.1 + 100.64.0.10, live WS guide session (trio safety-first, real Spark answer), audit session open/closed. MCP tools shipped 513178c; Spotter APK carries DAT APPLICATION_ID=0 (Developer Mode) — awaiting operator glasses taps.

## 2026-10-27 (D2) — stopping point
- MCP agent tools live: see_now / say / mission_status / advance_step (nullai-fieldkit 513178c); shared mission store across REST/WS/MCP.
- Spotter v0.2.3 built (APK in android/app/build/outputs/apk/debug/app-debug.apk, APPLICATION_ID=0 Dev Mode): DAT camera->microphone permission via Meta AI before session; DAT self-diagnostics (reg/devMode/devices); pushed c953fe4 + 6afdc6b.
- Missions: plan-review-Begin (no default plan); AUTO step advance in proactive loop (typed assessor: step_done -> speak next, unsafe -> speak now); Next = manual override only.
- Relay suite 164 passed (2 pre-existing baseline test_install failures). Test env: nullai-fieldkit/.venv (pinned mcp==1.30.0; system mcp 2.2.0 breaks old test helper).
- BLOCKER: relay :8770 DOWN — vault auto-locked mid-restart. FIRST tomorrow: Neal `zoth-vault unlock` -> relaunch (nullai-fieldkit .venv, relay-runtime config, setsid -f) -> health + WS probe -> install v0.2.3 (phone was off ADB) -> glasses test: Connect glasses -> approve cam -> approve mic -> first frame diagnostics.
- Then: D5 OBS overlay + X RTMP confirm gate; D6 PWA/SAM 3.1/Muse Image recap; D7 zoth-relay bench 60-min soak + scopes docs; D8 film; D9 submit Nov 4 6PM ET.

## 2026-10-27 (D2) — Jot + Second Brain integration
- jot_bridge.py: real worker protocol via Node subprocess (no Hermes host APIs); mission->Jot checklist create, revision-safe auto-checkoff (retry once), voice "jot down" appends, AGENT_DISABLED/unavailable degrade gracefully (mission loop never breaks). Tests use tests/fake_jot_worker.cjs (same wire protocol); conftest isolates JOT/VAULT dirs so real stores stay clean (4 stray test notes + 6 test engrams from the pre-isolation run were removed).
- second_brain.py: Obsidian engrams (frontmatter incl. spark_p50_ms, [!warning]/[!tip] callouts, wikilinks), FieldKit Missions.base (table+cards) + Architecture & Mission Flow.canvas generated in real vault; prior_hints recall feeds the Wonder planner (prior_notes in create response).
- Wiring: POST /v1/missions creates Jot note + engram; step_done (REST assess/events, proactive loop, MCP advance_step) ticks Jot + refreshes engram; WS {"type":"jot"} + spoken "jot down:" append field notes; MCP tools jot_field_note / jot_mission_sync / recall_second_brain. Spark Open preset (meta-models/muse-spark-open-1026, env-gated) for Best Open Weights.
- Verified: 13 new bridge tests; full suite 178 passed (2 baseline test_install). REAL engine smoke vs actual Hermes Jot worker: create/read/checkoff/append/recall shapes all match; smoke note trashed + engram removed after.
- STILL BLOCKED: :8770 restart + full live Mission->Jot->Obsidian smoke needs Neal `zoth-vault unlock` (vault locked) and Spotter v0.2.3 install (phone off ADB). SAM 3.1 highlight + Muse Image recap + PWA remain D5/D6 work.

## 2026-10-27 (D2 cont.) — prize-coverage alignment
- Diff vs prior directive implemented: Baseten/Modal first-class presets (BASETEN_API_KEY; MUSE_OPEN_MODAL_URL/MODAL_API_KEY), Jot tasks numbered (1. ...), engram frontmatter planner_model/vision_model/jot_note_id, scripts/smoke_jot_obsidian.py.
- recap.py: SAM 3.1 highlight boxes (SAM_API_URL-gated, drawn by clients) + Muse Image recap on completion (MUSE_IMAGE_MODEL, /images/generations) embedded in Obsidian + noted in Jot; honest local SVG fallback. grounding wired into proactive observation events.
- PWA judge client at /pwa (shell + manifest + SW): phone camera frames, talk, Wonder plan with prior_notes, review-then-Begin, live checklist, Jot/Obsidian badges, SAM overlay canvas, Shh/presets. WS accepts ?token= for browsers (same scopes).
- Suite: 186 passed, 2 baseline test_install failures.
- ENV STATUS: vault daemon restarted with 10-day TTL but still LOCKED (needs one manual unlock) -> :8770 still down; Pixel off ADB -> Spotter v0.2.3 install pending. Next on unlock: relaunch relay, run scripts/smoke_jot_obsidian.py live, install APK, glasses permission/first-frame test.

## 2026-10-27 (D2 cont.) — relay live + PWA brand + Live gate
- Vault keepalive confirmed working: key read directly (no daemon restart), :8770 relaunched detached on latest code; health OK on Tailscale + loopback.
- LIVE SMOKE PASS (scripts/smoke_jot_obsidian.py): Wonder 7-step mission -> real Jot note created -> 7x advance with jot_set_task ticks -> Obsidian engram -> prior recall -> cleanup. WS probe: session attach + spoken "Jot down: housing bolt is stripped" -> "Jotted." + note verified. ADB: Pixel not attached; Spotter v0.2.3 install still pending plug-in.
- PWA restyled to BRAND: dark obsidian #06070a, gold #e5c058 next-step, "Watches what changed / Asks before it acts", synthetic test scenes for camera-less judges, Jot down quick input, Hermes Jot + Obsidian badges.
- D5/D6: POST /v1/missions/{id}/recap (force; Muse Image or labelled local SVG); Mission.last_event drives overlay safety badge; GET /overlay OBS browser source (step/progress/LIVE/safety); confirm-gated stream_start/stream_stop (one-time token challenge, audited; REST /v1/live/* + MCP tools). Suite 189 passed, 2 baseline failures.


## Prior vs new (honesty split)

# PRIOR-WORK.md — ZOTH FIELDKIT (Meta Global AI Developer Hackathon, indie, solo)

Event window: Oct 26 12:00 PM ET → Nov 4 9:00 PM ET. Submit target Nov 4, 6:00 PM ET.
All entry features are NEW commits AFTER kickoff on branch `hackathon/2026-10-26`.
Pre-event state is frozen at git tag **`baseline/pre-event-2026-10-26`**.

## Tagged baselines (frozen Oct 26, 2026)

| Piece | Working copy (this folder) | Original | HEAD at tag |
|---|---|---|---|
| zoth-relay core (incl. Zoth Live / Relay Live module) | `zoth-relay/` | `~/NullAITech/zoth-relay` | `778cb33` (`feat/mobile-api`) |
| zela-glasses-guide (demo/site) | `zela-glasses-guide/` | `~/NullAITech/zela-glasses-guide` | `ad37ac2` (`main`) |

Note: Guide app imports are partially embedded in the relay repo (see below); where
standalone app checkouts were not recoverable, this note + the tag are the record.

## Existed BEFORE the hackathon (do NOT demo as new)

- **zoth-relay REST/MCP server**: HTTP REST (`/v1` NDJSON), MCP (HTTP + stdio bridge),
  GPT Actions, read-only dashboard; per-agent tokens + scopes; path sandbox + Landlock;
  command blocklist; rate limits; JSON audit log; systemd hardening (`zoth_relay/`, `install.sh`).
- **Mobile ask API**: `POST /v1/ask` image+text → OpenAI-compatible targets with streamed
  replies; operator health/voices/reachability; Gemini Live ephemeral-token minting
  (`ask.py`, `live.py`, `MOBILE.md`).
- **Guide streaming**: 0.4.0 `WS /v1/guide/stream` (GUIDE.md) + 0.5.0 full-duplex
  Zoth Guide stream w/ AGY rolling prewarm + Kokoro/Piper TTS (`guide.py`, `guide_stream.py`,
  `agy_session.py`, `tts.py`, `scripts/zoth-guide`); proactive-coach prompt patterns
  (speak-on-meaningful-change, idle TICK nudges, pause/resume, barge-in generations).
- **Providers before event**: AGY subprocess, local Ollama vision, Gemini targets,
  local AGY/local-TTS path; `guide.config.example.yaml`, `config.mobile.yaml.example`.
- **Zoth Live / Relay Live code inside relay**: mobile `/v1/ask`, Gemini Live token
  minting, X RTMP stream path proven pre-event (no standalone `zoth-live` repo here).
- **DAT glasses app (Guide)**: existed as Zoth Guide 0.4.0/0.5.0 on-device; Android
  source not recovered onto this box — treated as prior work; hackathon Guide work
  is the NEW server-side path + any NEW client code committed after kickoff.
- **Relay-mobile deployment**: `~/.local/share/zoth-relay-mobile/app` (+ bak-0.2/0.4),
  deployed copy, not a repo; no baseline tag (recorded here instead).
- **Demo/site**: `zela-glasses-guide` static Netlify site (tagged above; tree had
  uncommitted `public/` changes at tag time, left untouched).
- **zoth-bot** (`~/NullAITech/zoth-bot` @ `d12615f`): watch app etc. NOT the
  entry; out of scope per roadmap.
- **Tests**: `tests/test_{relay,guide,stream,live,mobile,sanitizer,install,dev_profile}.py`
  (baseline run Oct 25: 129 passed, 2 pre-existing `test_install` env failures).

## Built AT the hackathon (NEW — this is what the demo shows)

- Protocol-agnostic **Provider** layer: OpenAI-compatible + Anthropic Messages
  transports; **Muse Spark** (default) + **Muse Wonder** (planner) via Meta Model API;
  Gemini/Hermes/AGY/local kept as fallback providers behind the same interface.
- **Sessions API** (`WS /v1/sessions`) + **Missions API** (`/v1/missions`) with
  frame-diff, bounded context (cached prefix + full mission transcript), latency metrics.
- **Mission Mode** proactive next-step speech through the NEW path; **Live** OBS/X
  output w/ confirm gate + audit; MCP tools `see_now`/`say`/`mission_*`/`obs_*`.
- Stretch (only if MVP holds): SAM 3.1 step highlight, Muse Image recap card, PWA
  client, `zoth-relay bench` 60-min flat-latency graph, open-weight Spark path.

## Process guarantees

- Baselines tagged BEFORE feature work; entry features = post-kickoff commits only.
- No secrets in git (keys in shell env / gitignored files). Public stream / hands
  actions are confirmation-gated + audited (roadmap hard rules).

