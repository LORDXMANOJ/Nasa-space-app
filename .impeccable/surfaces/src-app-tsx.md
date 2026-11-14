---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/screens"]
---

Scope: the whole Astronaut Health Monitor app shell and every screen. Visitor mode: Operate.

Audience and job: astronaut with first-aid training, daily one-minute check-in; must see in seconds whether they are fine, what to do, and whether it can wait for Earth. Judges evaluate the prototype.

Constraints: keep all screens and behaviour, the left icon navigation, the two-bar "Can this wait for Earth?" panel, status as shape + word + colour. Light theme. No card-grid look. Offline, bundled fonts.

## Direction contract

seed: 42ba0054 (kind: pick)

THESIS: The app is a crew procedure page, not a dashboard. It refuses the card-grid SaaS dashboard: content lives on ruled paper, in tables, numbered steps and standard WARNING / CAUTION / NOTE blocks that astronauts already trust.

OWN-WORLD: White paper on a light grey binder ground. Near-black ink, one procedure-blue for actions and links. Status colours appear only inside status marks and WARNING (red) / CAUTION (amber) blocks. Public Sans throughout with tabular figures; bold caps for section headings. Zero corner radius. Rules, not boxes: 2px black section rules, 1px grey table rules.

STORY: open the page and read the warning block first, then today's line, then the readings log; every flagged reading leads to numbered steps with checkboxes.

FIRST VIEWPORT: a title-block strip (mission, day, crew, SIMULATED), the page title, then the top alert as a full-width WARNING or CAUTION block containing the two timing bars and the verdict in caps; beside it today's line and the primary "Start daily check-in" button.

SIGNATURE: the timing comparison drawn like a procedure timing table: two ruled bars on one tick scale, the verdict boxed in caps.

RISK: can read as a static document; interaction states must be crisp (focus, hover, pressed) so it still feels like a live tool.

Raises: from the spectrogram rail, state also carried by line form (dashed limits, solid readings); from the gate board, alerts always ordered by how soon they need action.
