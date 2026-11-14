# How it decides

Astronaut Health Monitor is a **prototype with simulated data**. It flags health changes, explains them in plain English, and decides one thing: **can this wait for Earth?** It never diagnoses, never gives medicine doses, and never acts by itself. The Crew Medical Officer (CMO) decides.

The same content is in the app under **How it decides**. The numbers there are re-measured live in your browser.

## Pipeline

```
Daily check-in ─► Safety rules (condition cards) ─┐
                  Personal baseline (days 1–10) ──┼─► Unusual day · Slow drift · Forecast ─► T_harm vs T_reply ─► Act on board / Ask Earth
```

Every alert returns `{ status, reason, detector, confidence, T_harm }`. Skipped readings count as **no evidence**, never as bad results.

Inputs (one check-in a day, about a minute):

| Mode | Readings |
|---|---|
| Automatic (wearables) | sleep, heart rate (+HRV), temperature, radiation dose |
| Semi-automatic (you start it, the device sends it) | blood pressure, SpO₂, glucose, body mass |
| Manual | mood (+30 s reaction test), symptoms, pain |

All devices are simulated. "Bio-Monitor" is named only because public sources confirm it was tested on the ISS.

## 1. Can this wait for Earth?

```
T_reply = signal out + flight-surgeon review + signal back   (+ relay-pass waits on a Mars base)
if T_reply > T_harm  →  ACT ON BOARD NOW   else  →  ASK EARTH
```

| Mission | One-way signal | T_reply |
|---|---|---|
| Space station (ISS) | < 1 s | ≈ 20 min |
| Moon | 1.3 s | ≈ 20 min |
| Mars transit | 3–22 min (slider, default 22) | 26–64 min |
| Mars base | as transit + relay passes | 240 + 22 + 20 + 22 + 240 = 544 min (worst case) |
| Mars, solar conjunction | no contact ≈ 2 weeks | ∞: everything on board, packet queued |

**ASSUMPTIONS** (one constant each in `src/engine/missions.ts`):
- review time is 20 min;
- a relay pass comes every 4 h and lasts 20 min (store-and-forward, worst case);
- every T_harm on the condition cards.

**Worked example (unit-tested):** fever with a fast heart rate can safely wait 60 min.
- On the ISS, T_reply ≈ 20 min, so the verdict is **Ask Earth**.
- In Mars transit at 22 min one-way, T_reply = 22 + 20 + 22 = 64 min > 60, so the verdict is **Act on board now**.

"Act on board" means: start the checklist, still send the Consult Packet, and let the CMO decide.

## 2. Safety rules: condition cards are data

`src/data/conditions.json` holds the cards. Each card has an id, limits (`all` / `any` clauses), T_harm, body regions, hazards, a plain explanation, drug-free steps, red flags, an escalation rule and sources. A small interpreter (`src/engine/conditions.ts`) reads them, so a medic can change a limit without touching code. A card can supersede a weaker one; for example, fever + fast HR hides plain fever.

Indicator limits live in `src/data/indicators.json`. **Act** limits always fire. For the seven daily readings, a **Watch** limit fires only when the value is also ≥ 2 sd from that person's own normal. That's why Mikael's resting heart rate of 52 is never flagged.

## 3. Personal baseline + three detectors (`src/engine/detectors.ts`)

Mission days 1–10 teach each astronaut's own normal for the 7 core readings: systolic BP, diastolic BP, heart rate, glucose, temperature, sleep hours, mood.

**Unusual day (multivariate).**
`D² = (x − μ)ᵀ Σ⁻¹ (x − μ)`, flagged when `D² > χ²(0.99, k)` (18.475 for all 7 readings; k = readings present).
- Σ uses Schäfer–Strimmer shrinkage of the correlation matrix toward the identity, with the intensity estimated from the data.
- Standard deviations have minimum floors (e.g. temperature 0.15 °C, HR 3 bpm).
- Σ is inflated ×1.35 for estimation error from only 10 days.
- Σ is solved with a Cholesky factorisation Σ = L Lᵀ, never inverted.

**Slow drift.** Two-sided CUSUM on standardised values: `S⁺ = max(0, S⁺ + z − k)`, `S⁻ = max(0, S⁻ − z − k)`, alarm when either exceeds h.
- z uses sd ×1.3.
- **k = 0.75, h = 6**, chosen with the Monte Carlo check below.

**Forecast.** When drift alarms, a Theil–Sen line (the median of all pairwise slopes, robust to a wild reading) is projected to the Act limit. The days until it gets there become T_harm. Example: Hana's systolic pressure rises ~1 mmHg/day, from 127 to 140 in ~13 days. It can wait for Earth.

SpO₂, HRV, radiation and body mass use rules plus single-metric baseline and trend checks. Radiation is cumulative, so it uses rules only.

## 4. Measured results (this implementation)

`npm test` runs `src/engine/validate.test.ts`: 300 simulated astronauts with random baselines, seed 2026, 6,000 normal days.

| Measure | Result |
|---|---|
| Unusual-day false alarms per normal day | **0.92 %** |
| Any alert on a normal day (rules + detectors) | **7.1 %** (known weakness) |
| Full fevers caught on day one | **100 %** |
| Early mild fevers caught (a day before rules could fire) | **73 %** |
| Slow BP climbs (+1 mmHg/day) caught within 20 days | **99 %**, median **12 days** |
| Steady astronauts with a false drift flag within 20 days | **1.3 %** |

These numbers check the **method on simulated people**. They say nothing about clinical accuracy.

Tuning trade-offs we measured:
- Covariance inflation ×1.0 gives 3.4% false unusual days but catches 92% of mild fevers; ×1.5 gives 0.5% but catches 67%.
- CUSUM k = 0.5, h = 6 gives 37% false drift flags; k = 0.75, h = 6 with sd ×1.3 gives 1%.

## 5. Crew stories (seeded, unit-tested)

| Crew | Story | What it shows |
|---|---|---|
| Ines Okafor, Commander | Fever with fast HR | Unusual day flagged on day 22, a day before any rule; on day 23 the fever card fires: Ask Earth on the ISS, act on board in Mars transit |
| Mikael Lindqvist, Flight engineer | HR 52 is his normal | Nothing flagged on any day; a fixed 60–100 rule would flag 15+ of 20 days |
| Priya Raman, Mission specialist | Sleep and mood slip (isolation) | Sleep Watch on day 22, both detectors by day 24, sleep-loss Act on day 25 |
| Hana Sato, CMO | Slow BP creep | Only the drift detector catches it; forecast ~13 days |
| Mira Vega, Pilot | Day 120, Mars transit | Sleep Act + several Watches, recovery by day 124 |

## 6. Readiness score

`score = 100 − Σ (weightᵢ / Σweights × 100) × penalty(statusᵢ)`

Penalties are Nominal 0, Watch 0.5, Act 1, Stale 0.25. The weights live in `indicators.json`.

## 7. On-board assistant

Answers are pre-written, built only from the condition cards and today's detector output. No AI model runs in the app.
- Dose and diagnosis questions are blocked in code before anything else runs (`isBlocked`).
- Every answer is checked again afterwards (`passesPostCheck`).
- Both checks are unit-tested.

## Honesty

- Prototype, simulated data, no real astronaut data.
- Flags and explains; decides only whether something can wait. Not a medical device.
- Limits come from public clinical references or a NASA standard where stated. Everything else is labelled ASSUMPTION or demo assumption.
- An AI coding assistant (Claude) helped write this code and documentation.
