---
name: Astronaut Health Monitor
description: A crew procedure page for daily astronaut health checks. Paper, ink, rules and standard WARNING / CAUTION blocks.
colors:
  ink: "#101318"
  ink-soft: "#2b313a"
  ink-dim: "#4d5562"
  paper: "#ffffff"
  binder: "#e9ecef"
  surface-2: "#f4f6f8"
  rule-light: "#dde1e6"
  rule-strong: "#c7ccd3"
  procedure-blue: "#0b4f9c"
  procedure-blue-deep: "#083d7a"
  nominal: "#1d6b43"
  watch-text: "#8a5300"
  caution-amber: "#f2b13c"
  warning-red: "#b3261e"
  stale: "#6b7380"
typography:
  page-title:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  section-heading:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "0.02em"
  block-label:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.18em"
  body:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  status-mark:
    fontFamily: "Public Sans, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.06em"
  data:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  none: "0"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.procedure-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.procedure-blue-deep}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 20px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.warning-red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
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
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "44px"
---

# Design System: Astronaut Health Monitor

## Overview

The app is a crew procedure page, not a dashboard. Astronauts already trust the format of an onboard procedure: white paper, black ink, numbered steps, and standard WARNING and CAUTION blocks. Every screen is one white sheet on a light grey binder ground, organised by rules, tables and steps instead of cards.

The most urgent alert always comes first as a WARNING (Act) or CAUTION (Watch) block. Inside it, the "Can this wait for Earth?" timing table compares the safe wait with Earth's reply on one tick scale, and the verdict is boxed in caps. The tone is calm and exact: colour is reserved for status, and the page reads top to bottom like a checklist.

## Colors

### Primary
- **Procedure blue** `#0b4f9c`: primary actions, links, focus rings, selected values. Deep `#083d7a` on hover.

### Neutral
- **Ink** `#101318` for text, section rules, title-block rules and the Earth-reply bar. **Ink soft** `#2b313a` and **ink dim** `#4d5562` for secondary text.
- **Paper** `#ffffff` for the sheet, **binder** `#e9ecef` behind it, **surface 2** `#f4f6f8` for hover and wells.
- **Rules:** light `#dde1e6` between table rows, strong `#c7ccd3` around the sheet and grid cells.

### Status (semantic only)
Nominal `#1d6b43`; Watch text `#8a5300` with caution-amber `#f2b13c` fills; Act and WARNING `#b3261e`; Stale `#6b7380`.

### Named Rules
- **The status-only rule.** Red, amber and green appear only in status marks, WARNING / CAUTION blocks and the safe-wait bar, never as decoration.
- **The simulation strip rule.** The title block always ends with the amber SIMULATED DEMO DATA cell.

## Typography

Public Sans (the U.S. government's document typeface, OFL, bundled locally) carries everything, with tabular figures on globally. IBM Plex Mono appears only in the Consult Packet JSON preview and in formulas.

### Hierarchy
- **Page title:** 32px, weight 800, sentence case.
- **Section heading:** 18px, weight 800, caps, under a 2px ink rule.
- **Block label:** 14px, weight 800, caps, tracked 0.18em, centred in the WARNING / CAUTION head.
- **Body:** 16px, weight 400, line height 1.5, measure under 72ch.
- **Status mark:** 13px, weight 800, caps, tracked 0.06em, always beside its shape.

## Layout

One sheet per screen (max 1320px), 40px inner padding, on the binder ground.
- **Left tab rail:** icon + label; the active tab is marked by a 4px ink edge.
- **Title-block strip** across the top: Health check, day, environment, Earth reply, crew, SIMULATED.
- **Document footer** carrying the safety line.

Sections are separated by 2px ink rules, with more space above each heading than below it. Two-column screens keep a fixed side column (300 to 380px) and stack below 1100 to 1280px.

## Elevation & Depth

Flat. Depth comes from rules and the sheet edge, not shadows. The one shadow is the pop shadow on modals, popovers and the presenter panel: `0 18px 48px rgba(16,19,24,0.18)`.

## Shapes

Zero radius everywhere. Paper has no rounded corners.

## Components

### Buttons
Rectangular, with a 2px border, 44px tall (52px for the primary daily action).
- **Primary:** procedure-blue fill.
- **Secondary:** paper with an ink border.
- **Danger:** warning-red fill, used only for "Open the plan" on an Act alert.
- **Ghost:** underlined blue text link.

### WARNING / CAUTION / NOTE blocks
A 2px border in the status colour, a full-width caps label strip (red WARNING, amber CAUTION with ink text, grey NOTE), then a padded body. These replace cards for anything urgent.

### Tables
Header row in bold dim 14px over a 2px ink rule, 1px light rules between rows; Act rows get a pale red wash. The readings log is a table, not a tile grid.

### Procedure steps
Ordered list: bold step number, step text, dotted leader, checkbox at the right. Checked steps are struck through.

### Index grids
Where a grid is needed (measurement index, crew picker), cells share 1px rules like a form, never floating cards.

### Inputs / Fields
Square, 1px dim border, ink on hover, 2px red when invalid. Segmented controls are an ink-bordered strip; the pressed segment is filled ink.

### Navigation
Left tab rail; the current screen is marked by a 4px ink edge and a bold label.

### Timing table (signature)
Two bars on one log tick scale (1 min, 1 h, 1 day, 30 days): the safe wait in its status colour, Earth's reply in ink. The verdict is boxed in caps: white on red for ACT ON BOARD NOW, ink outline for ASK EARTH.

## Do's and Don'ts

### Do:
- Lead every screen with the most urgent block, then the task, then the log.
- Use tables, rules and numbered steps to structure content.
- Pair every status colour with its shape and word.

### Don't:
- Don't use cards, rounded corners, gradients or glows.
- Don't use red, amber or green outside status.
- Don't put a small label above a page title; the title stands alone.
