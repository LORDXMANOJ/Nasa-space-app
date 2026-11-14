# PROMPT FOR CLAUDE CODE — "Astronaut Health Monitor" (NASA Space Apps 2026) — v2

You are my senior engineer AND design engineer for a 48-hour hackathon build. Read this whole brief, reply with a SHORT plan (max 15 lines), the skills you will load per milestone, and any blocking questions, then wait for my "go". After my go, work milestone by milestone, commit after each one, and give me a 5-line status at every milestone. Do not add features or change scope beyond this brief without asking me first.

Priority tags: **[P1]** = must ship. **[P2]** = do it if the milestone time box allows, otherwise list it under "what's next". Untagged items are P1.

---------------------------------------------------------------------
## 0. How to work: skills to load
Load the matching skill (Skill tool) before starting each kind of work. Don't load them all at once; load each one when its milestone starts.

| Work | Skills |
|---|---|
| Plan and execute milestones | `writing-plans`, `executing-plans`, `verification-before-completion` |
| Visual direction, tokens, components | `frontend-design-engineering`, `ui-ux-pro-max:design-system`, `interface-design` |
| UX review, polish, critique | `impeccable` (critique / polish / harden / clarify), `make-interfaces-feel-better`, `typography-audit` |
| Motion | `ui-animation`, `framer-motion`, `fixing-motion-performance` |
| Charts and stat tiles | `dataviz` |
| 3D body | `threejs-react-three-fiber`, `threejs-asset-pipeline`, `threejs-performance`, `threejs-interaction` |
| State and tests | `zustand-state-management`, `vitest`, `test-driven-development` (alert engine only) |
| Accessibility | `accessibility` (WCAG 2.2 AA) |
| Code-generated videos and captions | `hyperframes`, `hyperframes-core`, `embedded-captions` |
| Check the rendered UI | `ui-verification`, `webapp-testing` / `playwright`, `browser-automation` |
| App icon | `logo-design` |
| Docs and story | `readme-best-practices`, `humanizer` (on all prose the judges will read) |
| Demo video | `showcase-video` or `hyperframes` (title cards + screen capture) |
| Before each commit at M3 and M6 | `code-review` (medium) |

If a skill's advice conflicts with this brief, this brief wins. Note the conflict in `DECISIONS.md`.

---------------------------------------------------------------------
## 1. The challenge (NASA Space Apps 2026: "The Next Frontier")
Long-duration missions expose astronauts to space radiation, isolation and confinement, altered gravity, distance from Earth and hostile closed environments. These cause immune changes, bone loss, cardiovascular problems, poor nutrition and behavioural-health issues. On long missions astronauts must spot these changes in themselves.

GOAL: build a VISUAL health-monitoring software tool that gathers health indicators and lets an astronaut evaluate and act on their own health status, with guidance on treatment and improvement.

The challenge suggests (optional): dynamic charts over time, colour coding for at-a-glance status, prompts to take measurements as mission routine, gamification, simple explanations because astronauts may not know how to assess themselves, support for different environments (spacecraft, station, rover, Moon/Mars base), and a clickable human body showing function and health status of each part.

## 2. How we will be judged (design for this)
Five criteria: Impact, Creativity, Validity, Relevance, Presentation.
- **Validity:** thresholds and advice must trace to cited sources. Simulated data must be clearly labelled. Never present the tool as a diagnosis. Every status must be explainable ("Why this status?").
- **Relevance:** must clearly answer THIS challenge and cover all five NASA hazards.
- **Presentation:** a strong story, a demo video, clean docs, and polished screenshots in the README.
- **Creativity:** the 3D body, the mission-control visual language and the communication-delay Ground Link are our signature moments. Make them feel deliberate, not templated.
- Everything in English. All external resources listed in `REFERENCES.md`. Work must be original.

## 3. Non-negotiable product decisions (already made, do not revisit)
1. DESKTOP APP, OFFLINE-FIRST. It must run with ZERO network access at runtime (spacecraft, communication delay). No CDN links, no web fonts from the internet, no analytics, no remote API calls. Bundle every asset locally. Enforce it:
   - a strict Content-Security-Policy (`default-src 'self'`; no remote origins);
   - in the Electron main process, cancel every `webRequest` that is not `file:`, `app:` or the dev server, and log it in development so leaks are caught early;
   - fonts through `@fontsource/*` packages and icons through `lucide-react`, both bundled.
2. Stack: Electron + Vite + React + TypeScript. 3D with three.js via @react-three/fiber and @react-three/drei. State with Zustand. Charts with Recharts (or visx). Local persistence with IndexedDB (Dexie). No native modules that are hard to build. Motion with `motion` (Framer Motion) or CSS only.
3. Cross-platform packaging with electron-builder: Windows (.exe), Linux (AppImage + .deb), macOS if possible. Linux must work because space-station laptops commonly run Linux. Keep the app light: low RAM/CPU, no heavy GPU effects, and a "low-power mode" that disables animations and 3D. [P2] Suggest low-power mode automatically when Electron `powerMonitor` reports battery power.
4. All data is SIMULATED. Show a persistent "SIMULATED DEMO DATA" badge in the top bar. Show a footer on every screen: "Decision-support tool, not a medical diagnosis. Consult the flight surgeon."
5. Device names: only use real device names where a source confirms them, and never claim real specifications.
   - Confirmed in sources: ISS "Ultrasound 2" (modified GE Vivid-q), "Bio-Monitor" smart shirt (heart rate, temperature, blood pressure; tested on ISS), "rHEALTH ONE" (in-flight blood analysis demo).
   - Everything else: generic names with "(simulated)", e.g. "Blood-pressure monitor (simulated)", "Pulse oximeter (simulated)", "Personal dosimeter (simulated)". Put a TODO in REFERENCES.md to verify other ISS device names before final submission.
6. Videos are animated explainers generated with code (section 11). They are stylised illustrations, NOT live-action footage. No real people's photos, no copyrighted NASA/CSA/third-party footage unless its licence is checked and recorded.
7. Do not copy text, images or video from CSA or any non-U.S. Government site. Link and paraphrase only, and record the data-use terms.

---------------------------------------------------------------------
## 4. Experience principles (every screen must pass these)
1. **Three-second answer.** Any screen answers "Am I OK, and what do I do next?" within three seconds of looking at it. One primary action per screen, visually dominant.
2. **Calm, not alarming.** Mission-control calm: dark, low-glare, restrained colour. Colour is reserved for status. Red is rare and earned. No flashing, no sirens, no modal spam.
3. **Explain, then act.** Every number comes with what it means in plain English, how it compares to *my* baseline, and one next step. Medical terms get a one-tap glossary popover.
4. **Never colour alone.** Status is always colour + icon shape + word.
5. **Progressive disclosure.** First-timers get the explainer, video and steps. After 3 completed measurements of an indicator, offer a "Quick measure" path that skips straight to capture (explainer stays one click away).
6. **Honest by design.** Simulated data, demo assumptions and confidence are visible, never buried.

### Status vocabulary (use everywhere, including JSON, UI, docs)
| Status | Label | Icon shape | Meaning shown to user |
|---|---|---|---|
| green | **Nominal** | circle with check | Within your normal range |
| amber | **Watch** | triangle | Drifting from your baseline; re-measure and follow the plan |
| red | **Act** | octagon | Outside safe range; do the steps now and follow the escalation rule |
| grey | **Stale / No data** | dashed circle | Not measured recently; measure to update |

Show a "last measured X h ago" timestamp on every value. Treat data older than the indicator's cadence as **Stale**.

### Alert fatigue rules
- One alert per indicator per episode. Don't re-alert until the status changes or the user's acknowledgement expires.
- Alerts appear as an inline banner and a tile highlight, plus a toast for **Act** only. No blocking modals except the escalation prompt.
- The user can acknowledge an alert ("I'm on it"). It stays visible in the Recovery Plan until resolved.

### Gamification (light, ethical)
Reward *routine adherence* (measurement streaks, "full check-in" days, completing recovery steps), never health outcomes. Being sick must never cost the user points. 3–5 badges max, with a mission-patch visual style. No leaderboards.

---------------------------------------------------------------------
## 5. Design system (build in M0.5, document in `DESIGN.md`)
Use `frontend-design-engineering` + `ui-ux-pro-max:design-system` to produce a coherent, non-generic system. Constraints:

- **Tokens** as CSS custom properties in three layers (primitive → semantic → component): colour, type scale, spacing (4px base), radius, elevation/borders, motion durations/easings, z-index. No hard-coded hex values in components.
- **Themes:** `dark` (default), `high-contrast` (WCAG AAA text, thicker borders, no translucency). `large-text` is a separate toggle that scales the root type size by 125%.
- **Colour:** near-black blue-grey surfaces (no pure #000). One accent colour for interaction, distinct from the status colours. Status colours must stay distinguishable under deuteranopia/protanopia simulation. Text contrast ≥ 4.5:1, UI components and chart lines ≥ 3:1. Check every pair and record the ratios in DESIGN.md.
- **Typography:** one humanist sans for UI and one monospace for readouts and telemetry (e.g. Inter or IBM Plex Sans + JetBrains Mono or IBM Plex Mono; OFL-licensed, bundled locally, listed in REFERENCES.md). Use tabular numerals for every vital sign. Vitals hero numbers are readable at arm's length (≥ 48px at the default scale).
- **Layout:** desktop-first. Minimum window 1280×720, designed for 1920×1080, and nothing breaks at 1024×700 (panels stack). Left navigation rail (icon + label) for the 9 screens. Top mission bar: mission day, environment, comm delay to ground, SIMULATED badge, low-power indicator. Persistent footer disclaimer.
- **Components** (each with every state: default, hover, focus-visible, active, disabled, loading, empty, error, and Nominal/Watch/Act/Stale where relevant): Button (primary/secondary/ghost/danger), StatusBadge, IndicatorTile, Sparkline, StatCard, HazardChip, Stepper, VideoPlayer with captions, CaptureMeter, ResultCard, RecoveryCard (checklist + timer), EscalationBanner, Panel/Drawer, Tooltip/GlossaryPopover, Toast, Tabs, Toggle, SegmentedControl, EmptyState, Skeleton.
- **Component gallery:** a dev-only `/#/dev/components` route that renders every component in every state. It is our visual regression target; no Storybook (too heavy).
- **Motion:** 120–240 ms, ease-out for entrances, no bounce on data. Motion never carries meaning on its own. `prefers-reduced-motion` and low-power mode reduce everything to instant or fade-only. Animate only `transform`/`opacity`.
- **Iconography:** lucide-react only, one stroke width, plus a small custom SVG set (body regions, hazards, mission patches) drawn in the same style.
- **App icon:** a simple, original mark (no NASA meatball, no agency logos) made with `logo-design`, exported for Windows/Linux/macOS.

---------------------------------------------------------------------
## 6. Information architecture / screens
Global: keyboard shortcuts `1`–`9` jump to screens, `M` starts the next due measurement, `?` opens a shortcut sheet, `Esc` closes any panel or drawer. Every screen has loading, empty and error states designed, not defaulted.

0. **First-run onboarding** [P1, ≤ 60 s]: choose a fictional demo crew member (3 profiles with different baselines), choose the environment, then a 3-stop coach-mark tour (Dashboard brief → Measure → 3D Body). Skippable, and can be replayed from Settings.
1. **Mission Dashboard**
   - Hero: **Today's brief**, a generated one-sentence summary, e.g. "2 measurements due. Sleep has dropped 3 nights in a row; see your recovery plan."
   - **Crew Readiness Score** (0–100) as a ring with a "Why 72?" breakdown listing the indicators that pulled it down.
   - **Due now** list (routine prompts) with a primary "Start next measurement" button.
   - Indicator tiles in a grid: name, value + unit, StatusBadge, trend arrow, 7-day sparkline, last-measured time. Clicking a tile opens that indicator's Trends view; the tile's "Measure" button opens the Measure flow.
   - Mission day counter, environment mode (Spacecraft / Space Station / Rover / Lunar-Mars Base), streaks and badges (compact, not dominant).
   - Environment mode changes hazard weighting and copy (e.g. radiation emphasis in transit, dust/CO₂ on a base). It does not restyle the whole UI.
2. **Measure flow** (one per indicator, as a 4-step Stepper with progress, back and cancel):
   (a) **Why this matters in space**: 1–2 lines + hazard chips.
   (b) **How to**: video with captions + numbered steps, synced to the video when possible. "Skip video" is always available.
   (c) **Capture**: "Start measurement" streams a SIMULATED reading from the named device, with a small animated capture (cuff pressure gauge, ECG trace, SpO₂ pleth wave, dosimeter counter, reaction-time game). The user can cancel, retry, and choose a **manual entry** fallback with input validation and units.
   (d) **Result card**: big number + unit, StatusBadge, comparison to baseline ("+8 bpm vs your baseline"), plain-English meaning, next action button(s), and an expandable **Why this status?** showing which rule fired (threshold / z-score / trend), the confidence, the threshold source label and a link to the source.
3. **Hazards Overview**: the five NASA hazards as five large cards (illustrated icon, one-line plain explanation, affected indicators with live status, affected body regions, source link). Selecting a hazard highlights the related tiles and regions.
4. **3D Body Report** (hero screen, see section 10).
5. **Recovery Plan**: one card per flagged region/indicator. Immediate steps as a checklist, countermeasures (exercise, sleep, nutrition, crew check-in), a **re-measure timer** with countdown, and an **EscalationBanner** ("Contact flight surgeon if still Act after N hours or if X occurs", with a one-click "Prepare Ground Link report"). Each card shows its source or "Demo assumption". Resolved cards collapse into a "Resolved this mission" history.
6. **Trends**: dynamic charts over mission days (follow `dataviz`). Personal baseline band, labelled amber/red threshold lines, event markers (scenario events, alerts, recovery actions) with tooltips, range selector (7 / 30 / mission), indicator picker, and an accessible data-table toggle for every chart. [P2] Overlay two indicators on twin axes (e.g. sleep vs mood).
7. **Ground Link**: an outbox. "Send summary to flight surgeon" first shows a **preview** of the one-page report, then builds JSON + a printable PDF (generated locally). Simulates delayed delivery with a configurable comm delay (4–24 min, with a demo speed-up control). States: Draft → Queued → In transit (countdown + light-time illustration) → Delivered. Works fully offline; the queue persists across restarts.
8. **Sources & About**: references grouped by use (thresholds, hazards, devices, assets, libraries), each with what we used it for and its licence. Also: the simulated-data disclosure, how the Readiness Score and alert engine work (with a small diagram), limits, and "what we would do next".
9. **Settings**: astronaut profile and baselines, environment mode, units (mg/dL ↔ mmol/L, °C ↔ °F), low-power mode, large text, high contrast, reduced motion, replay onboarding, reset demo data. Changes preview live.

**Presenter controls** (for the demo, hidden behind `Ctrl+Shift+D`): scenario timeline scrubber, "Skip to day N", "Replay scenario", playback speed, comm-delay speed-up. This is a floating panel, never shown in screenshots by default.

---------------------------------------------------------------------
## 7. Indicators (MVP = first 8; stretch = rest)
MVP: 1 Blood pressure, 2 Heart rate + HRV (ECG-style trace), 3 SpO₂, 4 Body temperature, 5 Sleep (hours + quality), 6 Mood/stress (+ 30-second reaction-time mini-test), 7 Blood glucose (mg/dL), 8 Radiation dose (cumulative, mSv).
Stretch: exercise/bone-load log, vision self-test (SANS), hydration/nutrition, rash photo upload (simulated analysis), ultrasound image viewer (ISS Ultrasound 2 demo), blood panel (rHEALTH ONE demo), cabin CO₂/O₂.

Region mapping: Brain/head (mood, stress, cognition, sleep, headache), Eyes (vision), Heart & vessels (HR, HRV, BP, SpO₂), Lungs (SpO₂, CO₂/O₂), Bones/spine/muscles (exercise, pain), Gut/metabolism (glucose, hydration, nutrition), Skin/immune (temperature, rash, symptoms), Whole body (radiation).

## 8. Data model (single source of truth: `src/data/indicators.json`)
For every indicator store: id, name, `shortName` (for tiles), unit, `altUnit` + conversion, hazards[], bodyRegions[], deviceName (+ `deviceVerified: true/false`), inputType (manual | sensor-sim | camera-sim | file), `cadenceHours` (drives "due" prompts and Stale status), `captureDurationSec`, normalRange, amberThreshold, redThreshold, thresholdSource (`NASA` | `clinical-reference` | `demo-assumption`), whyItMatters, `plainMeaning` (per status: what it means in one sentence), howToSteps[] (each with optional `videoTimestampSec`), videoFile, `captionsFile`, recoveryActions[], escalationRule, `glossary` (term → plain definition), sources[]{title, url, usedFor}.
Validate the JSON with a Zod schema at build time and in tests, so a typo breaks the build, not the demo.
IMPORTANT: do NOT invent NASA thresholds. Use standard clinical reference ranges, label `thresholdSource` honestly, and add a `// TODO verify` (as a `todo` field, since JSON has no comments) for anything uncertain. Keep all advice rules in JSON so I can tune them quickly.
Copy rules for all text fields: plain English, about a grade 6–8 reading level, second person ("your"), no blame, no diagnosis words ("you have…"). Use "may", "consider", "contact".

## 9. Logic
- **Simulation engine:** seeded RNG; per-astronaut baseline; daily noise; hazard-driven drifts; scripted scenario "Day 120, Mars transit": sleep declines for ~5 days → mood dips → resting HR and BP creep up → one **Watch** and one **Act** event, so the demo shows detection → guidance → recovery. "Skip to day N" and "Replay scenario" live in Presenter controls.
- **Alert engine:** status = threshold check + personal-baseline z-score + 3-day trend slope. Returns `{status, reason, rule, confidence}`. `reason` is a plain-English sentence the UI shows verbatim in "Why this status?". Unit-test it (TDD), including edge cases: no baseline yet, a single reading, stale data, values exactly on a threshold, unit conversion.
- **Readiness score:** weighted from indicator statuses (weights in JSON). Show the breakdown in the UI and explain the method on the Sources page.
- **Offline queue + delayed Ground Link** as above, persisted in Dexie.

## 10. 3D body (hero screen)
- Find a free human-anatomy GLB whose licence allows this use (CC0/CC-BY preferred); record author, licence and URL in REFERENCES.md and attribute it in the app. Bundle it locally and compress it with gltf-transform (Draco or meshopt, follow `threejs-asset-pipeline`), with a budget of ≤ 3 MB and ≤ 100k triangles. If the model can't be split into organs, use invisible hotspot meshes over regions with a soft fresnel/rim glow shader. If no suitable licensed model is found within 30 minutes, build a stylised procedural body (capsules and spheres, holographic look) and tell me.
- **Look:** a holographic, translucent body on a subtle grid floor with a single key light. Healthy regions get a faint neutral glow. Watch and Act regions glow in their status colour, and only Act regions pulse slowly (no pulsing in reduced-motion mode).
- **Interaction:** drag to rotate (damped, with limited vertical tilt), scroll to zoom within bounds, camera presets Front / Back / Side, auto-frame the selected region with a smooth camera move, hover highlight + label, click to select. Render on demand (`frameloop="demand"`) so the GPU idles when nothing changes.
- **Accessible twin:** a region list beside the canvas (name + StatusBadge) that is fully keyboard-navigable and mirrors selection both ways. The canvas is never the only way in.
- **Region panel** (right drawer): function of the region in one sentence, related indicators with latest values and badges, trend mini-chart, likely hazard cause (hazard chips), the recovery plan summary, and an "Open full plan" button.
- **Legend** overlay: Nominal / Watch / Act / Stale with shapes.
- **Low-power / 2D fallback:** a clean front/back SVG body with the same regions, colours, list and panel. It also kicks in automatically if WebGL fails to initialise.

## 11. Videos (animated explainers, generated with code)
Build 20–40 second animated how-to clips, one per MVP indicator, starting with blood pressure (cuff placement → inflate → read → record). Use **HyperFrames** (HTML → MP4, load `hyperframes` + `hyperframes-core`). Use Remotion only as a fallback, and record its licence terms in DECISIONS.md. Stylised vector illustrations in the app's own visual language (same palette, same icon style). Captions are required, as separate `.vtt` files shown by the player (toggleable, large-text aware); voice-over is optional. Store in `assets/videos/` (compressed H.264, ≤ 3 MB each) and play with a local `<video>` element. If a video isn't ready, show the same steps as animated step cards so nothing is blocked. Create a placeholder for every indicator on day one.

## 12. Accessibility and ergonomics (WCAG 2.2 AA, load `accessibility`)
- Full keyboard navigation in a logical order, visible focus rings (≥ 2px, accent colour, never removed), skip-to-content link.
- Targets ≥ 44×44px, ≥ 56px for primary measurement actions (gloved hands, arm's length, possible vibration).
- Semantic landmarks, labelled controls, `aria-live="polite"` for new readings and Ground Link status, `assertive` only for Act alerts.
- Charts: text summary + data table alternative. 3D: the region list twin.
- Run axe-core (`@axe-core/playwright`, dev dependency) on every screen with zero serious/critical violations, in both dark and high-contrast themes.

## 13. UI verification loop (after every UI milestone)
Don't report a UI milestone done until you've looked at it. Load `ui-verification` / `webapp-testing`:
1. Run the renderer (Vite dev server, or Playwright's `_electron` launcher).
2. Screenshot every screen touched at 1280×720 and 1920×1080, plus high-contrast and low-power variants of the Dashboard and 3D Body. Look at each screenshot, fix what's off, then re-shoot.
3. Check the console for zero errors and warnings, the network log for zero external requests, and axe for zero serious violations.
4. Save the final shots to `docs/screenshots/` (they feed the README and submission).
5. At M5, run a full `impeccable` critique + polish pass and a `typography-audit`, then fix the top 10 findings.

---------------------------------------------------------------------
## 14. Milestones and time boxes (hackathon is ~48h; I will tell you the real deadline)
- **M0 (≤ 45 min)** Scaffold Electron+Vite+React+TS, folder structure, ESLint + Prettier, routing (hash router), CSP + network block, offline check, Zod-validated `indicators.json` skeleton for all 8 MVP indicators.
- **M0.5 (≤ 1.5 h)** Design system: tokens, themes, bundled fonts/icons, app shell (nav rail, mission bar, footer, SIMULATED badge), core components with all states, `/dev/components` gallery, `DESIGN.md`. First screenshot check.
- **M1 (≤ 3 h)** Simulation engine + alert engine (TDD) + readiness score; Dashboard with brief, score ring, due list, tiles, sparklines; basic Trends.
- **M2 (≤ 4 h)** Measure flow for all 8 indicators: Stepper, placeholder videos/step cards, simulated capture animations, manual entry fallback, result card with "Why this status?".
- **M3 (≤ 4 h)** 3D Body Report with hotspots, region list twin, region panel, 2D fallback; Recovery Plan cards with checklists, timers, escalation rules.
- **M4 (≤ 3 h)** Hazards Overview, Ground Link (preview + queue + delay + JSON/PDF export), Settings, Sources & About, onboarding, Presenter controls.
- **M5 (≤ 4 h)** Real animated videos (BP first) with captions; motion polish; accessibility pass; low-power mode; performance pass (cold start < 4 s, idle CPU < 3%, idle RAM < 300 MB; record actual numbers); `impeccable` critique and fixes.
- **M6 (≤ 3 h)** Packaging (Win/Linux), offline test with the network adapter disabled, README with screenshots, REFERENCES.md, DESIGN.md, DECISIONS.md, DEMO_SCRIPT.md (2–3 minute story beat by beat, with the matching presenter-control action for each beat), SUBMISSION_CHECKLIST.md, demo video assembly.

Feature freeze 6 hours before the deadline. After freeze: bug fixes and copy fixes only.

## 15. Definition of done
- App launches offline from the packaged build on Windows and Linux with no console errors and zero external network requests.
- All 8 MVP indicators work end-to-end: how-to → simulated reading → status (with "Why this status?") → 3D body → recovery plan → trend.
- The demo scenario plays in under 3 minutes and shows one Watch and one Act event, detection → guidance → recovery.
- Every threshold and advice card shows a source or an honest "Demo assumption" label.
- Every screen passes the experience principles (section 4), has designed empty/loading/error states, and passes axe with zero serious violations in dark and high-contrast themes.
- Status is never conveyed by colour alone. Everything works by keyboard. Low-power mode turns off 3D and animation.
- REFERENCES.md lists every source, asset, model, font, icon set and library with its licence.
- Alert engine has unit tests; `npm run build`, `npm test` and the packaged build succeed.
- `docs/screenshots/` holds current screenshots of every screen.

## 16. Working rules
- Ask me only when truly blocked; otherwise choose sensible defaults and note them in `DECISIONS.md`.
- Small commits with clear messages (Conventional Commits). Never commit large raw assets; keep them compressed.
- No telemetry, no network calls, no secrets.
- Keep the code simple enough that teammates can pick up any module quickly; document each module in 3–5 lines at the top of its main file.
- Never put hex colours, pixel sizes or durations inline in components: use tokens.
- At every milestone give me: **what works, what is mocked, what is risky, what's next**, plus the screenshot paths for anything visual.

Now: reply with your short plan, the skills you'll load per milestone, and any blocking questions. Do not write code until I say "go".
