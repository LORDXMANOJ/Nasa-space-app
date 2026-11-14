# Astronaut Health Monitor: what the finished app looks like and how it's used

> Concept preview. The app isn't built yet. This describes the target from [PROMPT.md](PROMPT.md). All health data in the app is simulated.

## The look
A dark, calm mission-control desktop app that runs fully offline.

- **Left rail:** nine screens, each an icon with a label.
- **Top mission bar:** mission day ("Day 120 · Mars transit"), environment, comm delay to Earth (e.g. "12 min"), and a permanent amber **SIMULATED DEMO DATA** badge.
- **Footer on every screen:** "Decision-support tool, not a medical diagnosis. Consult the flight surgeon."
- **Status vocabulary:** status appears as a coloured shape plus a word, never as colour alone.
  - Green circle: **Nominal**
  - Amber triangle: **Watch**
  - Red octagon: **Act**
  - Grey dashed circle: **Stale**
- **Type:** a clean sans-serif for text and a monospace face for vitals, with big numbers that can be read from arm's length.

## The five moments of a check-in

1. **Dashboard: "Am I OK?"** A one-line brief sits on top, e.g. "2 measurements due. Your sleep has dropped 3 nights in a row." Next to it is the **Readiness Score** ring (e.g. 72/100) with "Why 72?". Below are eight vital-sign tiles, each with its value, a trend arrow, a 7-day sparkline and a status badge.
2. **Measure: "How do I check?"** A 4-step guide.
   1. Why this matters in space, with hazard chips such as *Isolation* or *Altered gravity*.
   2. A 30-second animated how-to video with captions.
   3. A simulated reading from the named device, shown live (a pressure gauge filling, an ECG trace drawing).
   4. A result card: "138/88 mmHg · **Watch** · +12 vs your baseline", what that means in plain English, and the next step.
3. **3D Body: "Where is it?"** A translucent, rotatable body. The heart glows amber and the brain glows red. Clicking a region opens a side panel with what that region does, its latest values, a trend chart, the likely space hazard behind it, and its recovery plan. A keyboard-friendly region list mirrors the 3D view, and a 2D body replaces it in low-power mode.
4. **Recovery Plan: "What do I do?"** A checklist (sleep hygiene, light exercise, crew check-in), a re-measure countdown timer, and an escalation rule: "Contact the flight surgeon if still Act after 12 h." Every card shows its source or says "Demo assumption".
5. **Ground Link: "Tell Earth."** One click builds a one-page report (PDF + JSON). It moves through Queued → In transit (a countdown that accounts for the light-time delay) → Delivered.

There are also screens for **Trends** (charts with your personal baseline band and event markers), the **Hazards** overview (the five NASA hazards and the indicators each one affects), **Sources & About**, and **Settings** (large text, high contrast, low-power mode, units).

## The demo story (under 3 minutes)
In the scripted scenario "Day 120, Mars transit", the astronaut's sleep slips for five nights and their mood dips. Then heart rate and blood pressure creep up: first a **Watch**, then an **Act**. The app catches it, explains it, guides recovery and sends a report to Earth. A few simulated days later, everything is back to **Nominal**.
