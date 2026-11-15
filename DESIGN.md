---
name: Astronaut Health Monitor
description: A crew procedure page for daily astronaut health checks, in the crew's sage-and-pine palette. Paper sheet, rules, a guided 4-step check-in, and standard WARNING / CAUTION blocks.
colors:
  ground: "#e3edea"
  light-teal: "#9fcfc4"
  mid-teal: "#2a8f7f"
  primary-teal: "#1a7568"
  deep-teal: "#123631"
  paper: "#f8fbfa"
  on-fill: "#ffffff"
  paper-2: "#ecf3f1"
  rule: "#cfdcd8"
  ink-dim: "#4f625d"
  ink: "#111d1b"
  nominal: "#2e6b3f"
  watch-text: "#8a5300"
  caution-amber: "#e0a33a"
  warning-red: "#b3261e"
  stale: "#767b70"
typography:
  page-title:
    fontFamily: "Archivo, IBM Plex Sans, sans-serif"
    fontSize: "30px"
    fontWeight: 600
  section-heading:
    fontFamily: "Archivo, IBM Plex Sans, sans-serif"
    fontSize: "20px"
    fontWeight: 600
  block-label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0.12em"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  status-mark:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "13px"
    fontWeight: 400
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary-teal}"
    textColor: "{colors.ground}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.deep-teal}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.deep-teal}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.warning-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  block-warning-head:
    backgroundColor: "{colors.warning-red}"
    textColor: "{colors.paper}"
    typography: "{typography.block-label}"
  block-caution-head:
    backgroundColor: "{colors.caution-amber}"
    textColor: "{colors.ink}"
    typography: "{typography.block-label}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.deep-teal}"
    rounded: "{rounded.sm}"
    height: "44px"
  rail:
    backgroundColor: "{colors.deep-teal}"
    textColor: "{colors.ground}"
---

# Design System: Astronaut Health Monitor

## Overview

The app is a crew procedure page, not a dashboard. Every screen is one paper sheet (`#f8fbfa`, 16px corners) on a cool teal-grey ground, organised by rules, tables and steps instead of cards. The left rail is deep teal with light links; the active link is a rounded primary-teal tile.

The app opens with **Who are you?**: pick yourself, see the readings you took on Earth before launch, then the dashboard walks you through a 4-step strip (You, Earth readings, Today's readings, Your results). Results land on the 3D body, then the most urgent alert comes first as a WARNING (Act) or CAUTION (Watch) block with the "Can this wait for Earth?" timing table.

## Colors

A cool teal family generated with tastemaker (technical mood, seed 3) on 2026-11-15, replacing the earlier sage palette at the user's invitation ("feel free to change the colors"). Every text pairing was checked with tastemaker's contrast matrix (all >= 4.5:1). One accent only; amber and red stay reserved for health status.

- **Ink** `#111d1b` text; **ink dim** `#4f625d` (6.2:1 on paper); **soft** `#2c3d39`.
- **Paper** `#f8fbfa` sheet, **ground** `#e3edea` behind it, **paper 2** `#ecf3f1` wells and hover, **rule** `#cfdcd8`.
- **Primary teal** `#1a7568`: buttons, links, selected (white on it 5.5:1). **Deep teal** `#123631`: the menu rail. **Mid teal** `#2a8f7f`: icons, focus, the 3D floor. **Light teal** `#9fcfc4`: the 3D skin and soft fills.
- **Status:** Nominal `#2e6b3f`, Watch `#8a5300` text with `#e0a33a` fills, Act `#b3261e`, Stale `#6c7774`. Always with shape and word.

## Typography

Three voices, each with a job, so the page never reads as one flat setting:

| Occasion | Font | Setting |
|---|---|---|
| Welcome title | Archivo | 48px, weight 800, width 125% |
| Page titles | Archivo | 32px, weight 700, width 112%, tracking -0.02em |
| Section and alert titles | Archivo | 20 to 22px, weight 600 to 700, width 100% |
| Verdict (ACT ON BOARD NOW / ASK EARTH) | Archivo | weight 800, width 115%, caps: the loudest voice, used nowhere else |
| Big figures (readiness, number pad) | Archivo | 44 to 52px, weight 300, width 88% |
| Reading text, rows, buttons | IBM Plex Sans | 16px, 400 body, 500 rows, 600 buttons |
| Big primary button | Archivo | weight 650, width 105% |
| Readings, status marks, labels, codes, title bar | IBM Plex Mono | 12px caps tracked 0.06em for labels; 500 to 600 for values; tabular figures |

Light weights only at 28px and up; nothing under 16px lighter than 400 (Jakub Krehel, better-typography).

## Motion

Emil Kowalski's curves: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`. Press 140ms (scale 0.97), colour and fades 200ms, panels 280ms; UI motion stays under 300ms. Toasts use transitions with `@starting-style` so rapid toasts retarget instead of restarting. Lists that arrive together cascade 40ms apart. Opening panels enter from 6px above. A reading that arrives from a device settles in from below. Progress bars are linear. Reduced motion keeps fades and drops movement.

## Elevation

Layered shadows tinted toward the ink (Meng To's beautiful-shadows): `--shadow-sm` on cards, number fields and plan rows; `--shadow-md` on alert blocks and the All clear panel; `--shadow-lg` on toasts and the number pad.

## Shape

Soft corners on one scale: inputs and chips 6px, buttons 8px, blocks and tables 12px, the sheet 16px; bars, meters and toggles are pills.

## Layout

One sheet per screen (max 1320px), 40px inner padding, on the teal-grey ground.
- **Left tab rail:** Deep teal, icon + label; the active tab is a rounded primary-teal tile (no one-sided borders).
- **Title-block strip** across the top: Health check, day, environment, Earth reply, crew, SIMULATED.
- **Document footer** carrying the safety line.

Sections are separated by 2px ink rules, with more space above each heading than below it. Two-column screens keep a fixed side column (300 to 380px) and stack below 1100 to 1280px.

## Elevation & Depth

Flat. Depth comes from rules and the sheet edge, not shadows. The one shadow is the pop shadow on modals, popovers and the presenter panel: `0 18px 48px rgba(16,19,24,0.18)`.

## Components

### Buttons
10px corners, a 2px border, 44px tall (52px for the primary daily action).
- **Primary:** primary-teal fill, white text.
- **Secondary:** paper with a ink border.
- **Danger:** warning-red fill, used only for "Open the plan" on an Act alert.
- **Ghost:** underlined primary-teal text link.

### WARNING / CAUTION / NOTE blocks
12px corners, a 2px border in the status colour, a full-width caps label strip (red WARNING, amber CAUTION with ink text, grey NOTE), then a padded body. These replace cards for anything urgent.

### Tables
Header row in bold dim 14px over a 2px ink rule, 1px light rules between rows; Act rows get a pale red wash. The readings log is a table, not a tile grid.

### Check-in step strip
Four numbered cells (You, Earth readings, Today's readings, Your results); done steps show a tick, the current step is filled primary teal.

### Check-in (touch first)
Three short steps with their own strip: Your wearable, Measure, How you feel. Each reading is a card with its Earth value and a number field (− value +, 56px). Tapping the value opens an on-screen number pad (bottom sheet, 64px keys). Mood is a 1 to 10 row of 64px buttons; symptoms are whole-row toggles. A sticky bar at the bottom holds Back, how many are still to fill, and Next / See my results. Missing fields get a red outline, a message under them and a short jiggle.

### Empty, error and loading states
- **All clear** (goal empty state): a flat light-sage panel (no gradients anywhere) with an orbit scene (planet, dashed orbit, a dot that circles, a check that draws itself; still with reduced motion), a green kicker, a semibold title, why it is empty and one next action.
- **Empty hint**: dashed rounded box, Fern icon, what the section is for and how to start.
- **Plan complete**: primary-teal strip with a light-teal tick.
- **Save notice**: Watch banner pinned to the top of the screen with a Try again button.
- **Crash screen**: a CAUTION block ("This screen stopped") with what happened, that data is safe, Reload this screen and Go to the dashboard.
- **Progress**: 5px Dry Sage bar along the bottom of a working button; 10px rounded bar for longer checks.

### Feedback
Buttons scale to 0.97 when pressed (140ms). Working: spinner + words, colour kept (never greyed). Done: tick + word on a Nominal-green button for 1.6 s. Toasts (deep teal, bottom centre, 56px, dismissable) confirm saves and sends. Touch targets: 56px minimum, 64px for the main action, 48px for small buttons.

### Body views
3D: a translucent Dry Sage body with real organ models inside (heart, lungs, skull, stomach, intestines, spine), each in its status colour; eyes, skin and whole body use status-coloured hotspots. 2D: a Hairline line drawing in the green palette; damage is marked with arrows, and the coloured status words sit in the box beneath it.

### Procedure steps
Ordered list: bold step number, step text, dotted leader, checkbox at the right. Checked steps are struck through.

### Index grids
Where a grid is needed (measurement index, crew picker), cells share 1px rules like a form, never floating cards.

### Inputs / Fields
6px corners, 1px dim border, Pine Teal on hover, 2px red when invalid. Segmented controls are an ink-bordered strip; the pressed segment is filled Pine Teal.

### Navigation
Left tab rail; the current screen is a rounded Hunter Green tile with a semibold label.

### Timing table (signature)
Two bars on one log tick scale (1 min, 1 h, 1 day, 30 days): the safe wait in its status colour, Earth's reply in ink. The verdict is boxed in caps: white on red for ACT ON BOARD NOW, ink outline for ASK EARTH.

## Do's and Don'ts

### Do:
- Lead every screen with the most urgent block, then the task, then the log.
- Use tables, rules and numbered steps to structure content.
- Pair every status colour with its shape and word.

### Don't:
- Don't use floating cards, gradients or glows; corners stay on the one soft scale.
- Don't use red, amber or green outside status.
- Don't put a small label above a page title; the title stands alone.
