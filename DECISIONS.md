# Decisions

Short log of choices made during the build, newest first. Each line says what we chose and why.

## Product

- **Earth is weeks away, and the crew has basic medical training only** (user direction, 2026-11-14). Escalation is now an on-board protocol:
  - red-flag symptoms anyone can recognise ("any one → act now"),
  - then the Crew Medical Officer (CMO) and the on-board medical guide,
  - then a Ground Link report to Earth, which is only a record: "never wait for it".
  
  Report turnaround is set per environment in days (`commDelayDays`: 14 in Mars transit, which covers relay scheduling and blackouts such as solar conjunction). The data model's `escalationRule` became `{ afterHours, redFlags[], onboard, earth }`. The footer still says "Consult the flight surgeon", plus the CMO.
- **Body mass added as a 9th indicator** (user direction). Shown as kg plus % change since launch. Watch at ±5 %, Act at ±10 % (clinical rule of thumb for unintended weight change). Weekly cadence. Maps to gut/metabolism and bones & muscles, which also covers the nutrition and muscle/bone-loss hazards the court pointed out. The device name is generic until the ISS device name (SLAMMD) is verified.
- **Web first, Electron later** (user direction). Vite `base: "./"` and a hash router keep the build loadable from `file://`, so wrapping it later is a packaging task, not a rewrite.
- **3D body is procedural** (capsules and spheres), not a downloaded anatomy model. There's no licence risk, nothing to attribute, it stays light, and the brief allows this fallback. A licensed GLB can replace it later.
- **Fonts:** IBM Plex Sans + IBM Plex Mono via `@fontsource` (OFL, bundled locally). Icons: lucide-react (ISC), bundled.
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
