# frame.md — design truth for the concept preview

Concept angle: a calm instrument panel in deep space. Human words in a geometric sans, machine readouts in a monospace, so the film itself shows "the person reads the machine".

## Palette (tinted toward a cold blue hue)
- --ground: #0A0F1C (deep space blue-black)
- --panel: #111A2E, --panel-2: #17223A, --line: #2A3A5C
- --ink: #E8EEF9, --ink-dim: #9AA8C4
- --accent: #8FA8FF (periwinkle interaction accent, used for focus, links and the brand mark)
- status: --nominal: #46C38B · --watch: #F2B13C · --act: #F0565C · --stale: #7A869A

## Type
- Display / UI: Montserrat 700 / 900 (headlines), 400 (body). Tracking -0.03em on display.
- Readouts / labels: IBM Plex Mono 400 / 700, tabular numerals.
- Sizes: headline 72–120px, body 30–40px, labels 20–24px.

## Recurring furniture
- Top mission bar: "DAY 120 · MARS TRANSIT · COMM DELAY 12 MIN" + amber "SIMULATED DEMO DATA" pill.
- Corner label (all frames): "CONCEPT PREVIEW · SIMULATED DATA".
- Status chips always show shape + word + colour.

## Background
Solid --ground, one soft radial glow in the accent hue (15–20%), a faint star field (seeded, static positions) and hairline grid lines. Slow drift only.

## Don'ts
No gradient text, no neon cyan, no full-screen linear gradients, no pure #000/#fff, no flashing red.
