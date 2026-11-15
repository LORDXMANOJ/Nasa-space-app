---
name: Astronaut Health Monitor
description: A crew procedure page for daily astronaut health checks, in the crew's sage-and-pine palette. Paper sheet, rules, a guided 4-step check-in, and standard WARNING / CAUTION blocks.
colors:
  dust-grey: "#dad7cd"
  dry-sage: "#a3b18a"
  fern: "#588157"
  hunter-green: "#3a5a40"
  pine-teal: "#344e41"
  paper: "#f6f5f0"
  on-fill: "#ffffff"
  paper-2: "#eceae2"
  rule: "#cfcbbf"
  pine-dim: "#4e5f55"
  pine-deep: "#263a30"
  nominal: "#2e6b3f"
  watch-text: "#8a5300"
  caution-amber: "#e0a33a"
  warning-red: "#b3261e"
  stale: "#767b70"
typography:
  page-title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 600
  section-heading:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
  block-label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0.12em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  status-mark:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
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
    backgroundColor: "{colors.hunter-green}"
    textColor: "{colors.dust-grey}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.pine-teal}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.pine-teal}"
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
    textColor: "{colors.pine-deep}"
    typography: "{typography.block-label}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.pine-teal}"
    rounded: "{rounded.sm}"
    height: "44px"
  rail:
    backgroundColor: "{colors.pine-teal}"
    textColor: "{colors.dust-grey}"
---

# Design System: Astronaut Health Monitor

## Overview

The app is a crew procedure page, not a dashboard. Every screen is one paper sheet (`#f6f5f0`, 16px corners) on a Dust Grey ground, organised by rules, tables and steps instead of cards. The left rail is Pine Teal with Dust Grey links; the active link sits on Hunter Green with a Dry Sage edge.

The app opens with **Who are you?**: pick yourself, see the readings you took on Earth before launch, then the dashboard walks you through a 4-step strip (You, Earth readings, Today's readings, Your results). Results land on the 3D body, then the most urgent alert comes first as a WARNING (Act) or CAUTION (Watch) block with the "Can this wait for Earth?" timing table.

## Colors

The palette is the user's (2026-11-14): Dust Grey, Dry Sage, Fern, Hunter Green, Pine Teal.

### Primary
- **Hunter Green** `#3a5a40`: primary buttons, links, selected values, the "now" step. **Pine Teal** `#344e41` on hover and for text.
- **Fern** `#588157`: focus rings and the 3D floor ring. **Dry Sage** `#a3b18a`: the 3D body skin and the rail's active edge.

### Neutral
- **Pine Teal** `#344e41` for text, **pine dim** `#4e5f55` for secondary text.
- **Paper** `#f6f5f0` for the sheet, **Dust Grey** `#dad7cd` behind it, **paper 2** `#eceae2` for hover and wells, **rule** `#cfcbbf` between rows.

### Status (semantic only)
Nominal `#2e6b3f`; Watch text `#8a5300` with caution-amber `#e0a33a` fills; Act and WARNING `#b3261e`; Stale `#767b70`.

### Named Rules
- **The status-only rule.** Red and amber appear only in status marks, WARNING / CAUTION blocks, the safe-wait bar and the 3D hotspots, never as decoration.
- **The arrows-not-colour rule (2D body).** The Hairline 2D body stays in the green line palette. Damage is drawn as arrows: a doubled arrow with a double head for Act, a dashed arrow with a single head for Watch. The status words in colour sit in the box under the drawing.
- **The simulation strip rule.** The title block always ends with the amber SIMULATED DEMO DATA cell.

## Typography

One typeface: **Geist** (OFL, bundled), with **Geist Mono** for the packet preview and formulas. Chosen in the 2026-11-15 audit to replace Shantell Sans and DynaPuff, which read as cartoonish. Hierarchy comes from weight (400, 500, 600, 700; nothing heavier) and tracking, not from a second family. No italics. Tabular figures everywhere. Sizes sit on one scale: 12, 14, 16, 18, 20, 24, 30, 36, 48 px.

### Hierarchy
- **Page title:** 30px, weight 600, tracking -0.025em, balanced wrapping.
- **Section heading:** 20px, weight 600, tracking -0.015em.
- **Block label:** 14px, weight 600, caps, tracked (WARNING / CAUTION only).
- **Body:** 16px, weight 400, line height 1.5, measure under 65ch, pretty wrapping.
- **Status mark:** 12px, weight 700, caps, always beside its shape.

## Icons

Phosphor, regular weight, one family for the whole app, imported through `src/components/icons.tsx`.

## Motion

Base curve `cubic-bezier(0.22, 1, 0.36, 1)`. 200 ms for presses, 300 ms for colour and opacity, 500 ms for movement. Everything is off under reduced motion.

## Shape

Soft corners on one scale: inputs and chips 6px, buttons 8px, blocks and tables 12px, the sheet 16px; bars, meters and toggles are pills.

## Layout

One sheet per screen (max 1320px), 40px inner padding, on the Dust Grey ground.
- **Left tab rail:** Pine Teal, icon + label; the active tab is a rounded Hunter Green tile (no one-sided borders).
- **Title-block strip** across the top: Health check, day, environment, Earth reply, crew, SIMULATED.
- **Document footer** carrying the safety line.

Sections are separated by 2px Pine Teal rules, with more space above each heading than below it. Two-column screens keep a fixed side column (300 to 380px) and stack below 1100 to 1280px.

## Elevation & Depth

Flat. Depth comes from rules and the sheet edge, not shadows. The one shadow is the pop shadow on modals, popovers and the presenter panel: `0 18px 48px rgba(16,19,24,0.18)`.

## Components

### Buttons
10px corners, a 2px border, 44px tall (52px for the primary daily action).
- **Primary:** Hunter Green fill, Dust Grey text.
- **Secondary:** paper with a Pine Teal border.
- **Danger:** warning-red fill, used only for "Open the plan" on an Act alert.
- **Ghost:** underlined Hunter Green text link.

### WARNING / CAUTION / NOTE blocks
12px corners, a 2px border in the status colour, a full-width caps label strip (red WARNING, amber CAUTION with ink text, grey NOTE), then a padded body. These replace cards for anything urgent.

### Tables
Header row in bold dim 14px over a 2px ink rule, 1px light rules between rows; Act rows get a pale red wash. The readings log is a table, not a tile grid.

### Check-in step strip
Four numbered cells (You, Earth readings, Today's readings, Your results); done steps show a tick, the current step is filled Hunter Green.

### Check-in (touch first)
Three short steps with their own strip: Your wearable, Measure, How you feel. Each reading is a card with its Earth value and a number field (− value +, 56px). Tapping the value opens an on-screen number pad (bottom sheet, 64px keys). Mood is a 1 to 10 row of 64px buttons; symptoms are whole-row toggles. A sticky bar at the bottom holds Back, how many are still to fill, and Next / See my results. Missing fields get a red outline, a message under them and a short jiggle.

### Empty, error and loading states
- **All clear** (goal empty state): a flat light-sage panel (no gradients anywhere) with an orbit scene (planet, dashed orbit, a dot that circles, a check that draws itself; still with reduced motion), a green kicker, a semibold title, why it is empty and one next action.
- **Empty hint**: dashed rounded box, Fern icon, what the section is for and how to start.
- **Plan complete**: Hunter Green strip with a sage tick.
- **Save notice**: Watch banner pinned to the top of the screen with a Try again button.
- **Crash screen**: a CAUTION block ("This screen stopped") with what happened, that data is safe, Reload this screen and Go to the dashboard.
- **Progress**: 5px Dry Sage bar along the bottom of a working button; 10px rounded bar for longer checks.

### Feedback
Buttons scale to 0.96 when pressed. Working: spinner + words, colour kept (never greyed). Done: tick + word on a Nominal-green button for 1.6 s. Toasts (Pine Teal, bottom centre, 56px, dismissable) confirm saves and sends. Touch targets: 56px minimum, 64px for the main action, 48px for small buttons.

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
