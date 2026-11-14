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

  Results: unusual-day false alarms 0.92 %/day, steady false drift 1.3 %, mild fevers 73 %, slow climbs 99 % (median 12 d).
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
- **3D body is procedural** (capsules and spheres), not a downloaded anatomy model. There's no licence risk, nothing to attribute, it stays light, and the brief allows this fallback. A licensed GLB can replace it later.
- **Fonts:** Public Sans (UI, the U.S. government document typeface) + IBM Plex Mono (JSON preview only) via `@fontsource` (OFL, bundled locally). Icons: lucide-react (ISC), bundled.
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
