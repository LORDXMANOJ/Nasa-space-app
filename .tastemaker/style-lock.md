# Style lock (tastemaker)

The full design system lives in [DESIGN.md](../DESIGN.md); this file records the tastemaker inputs so a later pass reuses them instead of re-deriving.

- **Surface type:** app shell (touch panel), data views, transactional form (check-in), empty/loading/success states. Not a marketing page, so no macrostructure rotation.
- **Mood:** technical / professional, health context.
- **Palette:** `generate_palette.py --mood technical --mode light --seed 3`, adapted: text `#111d1b`, bg `#e3edea`, surface `#f8fbfa`, primary `#1a7568`, on-primary `#ffffff`, deep `#123631`, border `#b4c8c2`. Accent from the generator (rose) dropped: red and amber are reserved for status.
- **Color contract** (`check_contrast.py --matrix`): text-safe text/surface 16.6, text/bg 14.5, primary/on-primary 5.5, surface/primary 5.3, bg/primary 4.6, deep/ground 11.0; ink-dim `#4f625d` on paper 6.2. UI-safe only: primary/border 3.2, text/primary 3.1. Do not put primary text on light-teal tints (4.45).
- **Type:** Archivo (display, variable width) + IBM Plex Sans (body) + IBM Plex Mono (data). Occasion table in DESIGN.md.
- **Motion:** app-shell track; Emil Kowalski curves; under 300ms; see DESIGN.md.
- **Assets:** Phosphor icons; 3D organ models from Sketchfab (CC-BY 4.0); Hairline 2D body (MIT).
