# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Astronauts on long-duration missions (Mars transit, Moon, Mars base, space station) who have first-aid level training, not medical degrees. They take a one-minute daily health check-in and act on the result. The Crew Medical Officer (CMO) is the crewmate who decides treatment. Secondary audience: NASA Space Apps 2026 judges evaluating the prototype.

## Product Purpose

An offline health check-in that flags changes against each astronaut's own normal, explains them in plain English, and decides whether a problem can wait for Earth. Success: a crew member with basic training knows within seconds whether they are fine, what to do now, and whether waiting for the flight surgeon is safe.

## Positioning

It compares how long a problem can safely wait (T_harm) with how long Earth's reply really takes (T_reply). If Earth would answer too late, it says "act on board now". Everything runs on board; nothing waits for Earth.

## Operating Context

- A laptop in a spacecraft or habitat. Fully offline; Earth replies take minutes to weeks (solar conjunction means no contact for about two weeks).
- Daily routine: wearables auto-fill sleep, heart rate, temperature, radiation; the astronaut takes blood pressure, SpO₂, glucose, body mass; enters mood, symptoms, pain.
- Output goes to the CMO on board and to the flight surgeon as a Consult Packet that queues offline.

## Capabilities and Constraints

- Screens: Dashboard, Check-in, guided Measure, Body (3D + 2D), Recovery, Trends, Hazards, Assistant, Consult Packet, How it decides, Settings. All keep their content and behaviour through any redesign.
- Must keep: left icon navigation; status always as shape + word + colour (Nominal circle, Watch triangle, Act octagon, Stale dashed); the two-bar "Can this wait for Earth?" panel.
- Rules + personal baseline + three detectors (unusual day, slow drift, forecast); seeded crew stories; Monte Carlo validation.
- Never diagnoses, never gives medicine doses; the CMO decides.
- Desktop-first (later packaged with Electron); no network calls; CSP-restricted.

## Brand Commitments

- Name: Astronaut Health Monitor.
- Persistent "SIMULATED DEMO DATA" disclosure and the footer "Prototype with simulated data. It flags and explains; it does not diagnose."
- No NASA or agency logos, no real people.
- Requested by the user (2026-11-14): light theme, a real colour scheme, no card-grid look, must not read as an AI-generated app.

## Evidence on Hand

- Measured Monte Carlo results on 300 simulated astronauts (HOW_IT_DECIDES.md).
- Simulated crew and data only. No real astronaut data, testimonials or clinical validation exist; do not fabricate any.

## Product Principles

1. Three-second answer: am I OK, and what do I do next?
2. Can it wait for Earth is the product's one decision; make it unmissable.
3. Plain language for people with basic training; explain every flag.
4. Honest by design: simulated, assumptions labelled, no diagnosis.
5. Calm under stress: status is clear without alarm.

## Accessibility & Inclusion

WCAG 2.2 AA: contrast, keyboard navigation, never colour alone, large-text and high-contrast modes, reduced motion, readable at arm's length.
