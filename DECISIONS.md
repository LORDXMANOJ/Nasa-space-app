# Decisions

Short log of choices made during the build, newest first. Each line says what we chose and why.

## LightLag merge (2026-11-14)

The teammate's source wasn't available, so all logic was re-implemented from the add-on brief in TypeScript and re-measured on our code.
- **Earth reply:** default mission is Mars transit at 22 min one-way (64 min reply). The user's "Earth takes weeks" case is **solar conjunction** (no contact for about 2 weeks, so everything is handled on board and packets queue). Environment modes map to presets: station→ISS, rover→Moon, spacecraft→Mars transit, base→Mars base.
- **No Ollama:** the assistant gives pre-written answers only. That keeps the CSP strict, needs no model download, and the "pre-written" label is honest.
- **Alert engine:** for the 7 core readings, the z-score/trend rules are replaced by the three detectors. A core *Watch* limit only fires if the value is also ≥ 2 sd from the person's own normal; *Act* limits always fire. Without this gate, 28 % of normal days were flagged in the Monte Carlo check.
- **Tuning (measured):**
  - covariance inflation ×1.35;
  - CUSUM z uses sd ×1.3, k = 0.75, h = 6;
  - sd floors per metric.

  Results (baseline from 10 pre-flight Earth days): unusual-day false alarms 1.28 %/day, steady false drift 1.7 %, mild fevers 76 %, slow climbs 99 % (median 12 d).
- **Heart rate** is an automatic wearable feed (Bio-Monitor). **Sleep Watch** is < 6 h (demo assumption); < 7 h flagged steady crew too often.
- **Crew:** the brief's four crew (Okafor, Lindqvist, Raman, Sato) replace my three invented ones; Day 120 stays as story 5 (Mira Vega). Priya's story text was corrected to what the system actually does: the personal-gated sleep rule fires on day 22, and detectors confirm by day 24.
- **Ground Link → Consult Packet.** PDF is the browser's print-to-PDF (no extra library).
- **Recovery steps are drug-free.** Two indicator escalations that mentioned medicine were rewritten as "the CMO decides".

## Product

- **Earth is weeks away, and the crew has basic medical training only** (user direction, 2026-11-14). Escalation is now an on-board protocol:
  - red-flag symptoms anyone can recognise ("any one → act now"),
  - then the Crew Medical Officer (CMO) and the on-board medical guide,
  - then a Ground Link report to Earth, which is only a record: "never wait for it".
  
  Report turnaround is set per environment in days (`commDelayDays`: 14 in Mars transit, which covers relay scheduling and blackouts such as solar conjunction). The data model's `escalationRule` became `{ afterHours, redFlags[], onboard, earth }`. The footer still says "Consult the flight surgeon", plus the CMO.
- **Body mass added as a 9th indicator** (user direction). Shown as kg plus % change since launch. Watch at ±5 %, Act at ±10 % (clinical rule of thumb for unintended weight change). Weekly cadence. Maps to gut/metabolism and bones & muscles, which also covers the nutrition and muscle/bone-loss hazards the court pointed out. The device name is generic until the ISS device name (SLAMMD) is verified.
- **Web first, Electron later** (user direction). Vite `base: "./"` and a hash router keep the build loadable from `file://`, so wrapping it later is a packaging task, not a rewrite.
- **3D body with real organs (2026-11-15).** The user downloaded free CC-BY 4.0 models from Sketchfab (body, heart, lungs, skull, stomach and intestines, spine). Each was simplified to 4k to 9k triangles with glTF-Transform and meshoptimizer, textures dropped (organs are coloured by status), about 550 KB in total, uncompressed so no WASM decoders are needed under the CSP. Each organ lights up in its status colour and is clickable; eyes, skin and whole body keep a glowing hotspot. Originals are kept out of the build in `models-src/` (git-ignored). The UMCG thorax model was left out: CC-BY-NC-ND forbids changes. The earlier "Rigged Figure" was removed.
- **2D body in the Hairline style** (user direction): drawn with the unmodified Hairline kernel (`public/hairline/kernel.js`). Damage is shown with **arrows, not colour**, at the user's request: a doubled arrow for Act, a dashed arrow for Watch. This overrides Hairline's own "no words, no arrows" rule. The status words in colour sit in the box under the drawing.
- **Fonts and palette (user choice, 2026-11-14):** Shantell Sans for all text, DynaPuff for big headings, IBM Plex Mono for the JSON preview, via `@fontsource` (OFL, bundled). Palette: Dust Grey #DAD7CD, Dry Sage #A3B18A, Fern #588157, Hunter Green #3A5A40, Pine Teal #344E41. Amber (Watch) and red (Act) stay for status. Soft radii (6–16 px). Icons: lucide-react (ISC), bundled.
- **Touch first, complexity on our side (user direction, 2026-11-15).** Crew use a touch panel, not a mouse and keyboard.
  - *Tesler's law:* the app does the work. Wearable readings arrive filled in, one tap on Measure fills a device reading, units and dates are never asked, everything saves by itself.
  - *Fitts's law:* every target is at least 56 px (64 px for the main action), checkboxes are whole-row toggles, the main button sits in a sticky bar at the bottom, numbers change with − / + or an on-screen number pad, so the system keyboard only appears for free text (the note to the flight surgeon).
  - *Progressive disclosure:* the check-in is 3 short steps (your wearable, measure, how you feel; the measure step is skipped when nothing is due). Results show only flagged regions, the verdict and what to do; all readings, other alerts, detector details and the packet JSON are one tap away.
  - *Feedback:* every button presses in; long actions show a spinner and words ("Measuring…", "Checking your readings…", "Sending…") then a tick ("Measured", "Sent"); toasts confirm saves, ticks and packets. Pressing Next or See my results with a gap scrolls to the first missing field, jiggles it and says what is needed (no jiggle with reduced motion).
  - The layout now works down to 760 px wide (portrait tablets).
- **Empty, error and loading states (user's UX notes, 2026-11-15).**
  - *Empty states say why and what next.* A day with no alerts is the goal, so it is shown as an achievement ("All clear today", a calm orbit animation, next check-in). Recovery with nothing to do explains what the page is for. The empty outbox says what will appear there and how to send. A finished checklist shows "Plan complete".
  - *Toast, block or inline.* Toasts only confirm things that are fine to miss (saved, sent, step done), and "Saved" only shows after the save really worked. Important states are never toasts: alerts are WARNING / CAUTION blocks; a failed save is a pinned notice with Try again; a crashed screen shows a full message with a way forward. Field errors sit right under the field.
  - *Error messages say what happened, why, and what to do*, never code or a stack trace (a crash is logged to the developer console only).
  - *No silent failures.* Storage write failures and a failed Monte Carlo run are reported; buttons that fail say so beside the button.
  - *Loading timing.* No spinner for work under about 0.4 s (Send is instant: it goes straight to a tick). Longer work shows words that change ("Cuff filling… hold still", "Almost done…") and a progress bar; the Monte Carlo check reports real progress.
  - *Forms.* Values are checked the moment the number pad closes; mood is marked Required; the note to the flight surgeon has a 400-character limit with a live count. The Assistant's no-match answer repeats the question and offers the closest questions as buttons (tolerant of typos).
- **Baseline comes from Earth** (user direction): each astronaut's normal is learned from 10 pre-flight days on the ground (days −9 to 0). The app opens with "Who are you?", shows that person's Earth readings, then asks for today's readings on the dashboard and shows the result on the 3D body. Detectors run from mission day 1.
- **Redesign (2026-11-14):** light "crew procedure sheet" world chosen by the user from an impeccable seeded direction round; see DESIGN.md and PRODUCT.md.
- **Status vocabulary:** Nominal / Watch / Act / Stale, each with its own shape (circle / triangle / octagon / dashed circle) so colour is never the only signal.

## Court verdict (11–1 GUILTY: "idea sound, plan overloaded"), adopted as the build order

**Must-ship slice** (built first, protected): the Day 120 Mars-transit scenario end to end in the offline browser app.
Dashboard tiles → one reusable measure-flow template (all indicators) → body report (2D always works; 3D on top) → recovery plan with on-board escalation → Ground Link.

**Cut order** (first to go when time runs short):
1. Electron packaging (already deferred).
2. Per-indicator how-to MP4s. Animated step cards are the fallback and ship by default.
3. 3D body (2D body stays).
4. Streaks and badges.
5. Trends extras (overlay, table toggle).
6. Onboarding tour (profile picker stays in Settings).

Open item from the court: **team size and hours per milestone** are still unknown. Ask the user.

## Engineering

- Alert-engine threshold semantics: a band's `high` triggers at `value >= high`; its `low` triggers at `value < low`. Stale = last reading older than cadence + 1 day.
- Baseline z-score limit 2.0, trend rule = 3-reading least-squares slope ≥ 0.5 sd/day in the bad direction while already 1 sd off baseline. Cumulative metrics (radiation) skip both.
- Readiness = 100 − Σ(weightᵢ/Σweights × 100 × penalty[status]); penalties: Nominal 0, Watch 0.5, Act 1, Stale 0.25 (all in `indicators.json`).
- Persistence: zustand `persist` → Dexie (IndexedDB) key–value table. No network calls anywhere; CSP `default-src 'self'`.
- Simulation is deterministic (hash-seeded PRNG), so every reload and every machine shows the same Day 120.
