# Demo walkthrough (~78 s)

Real app screens (captured at 1920×1080 from the running app, Ines Okafor's story, Mars transit, day 23),
local Kokoro narration (`am_michael`), captions, palette and fonts of the app (DynaPuff + Shantell Sans).

| # | Screen | Narration |
|---|---|---|
| 1 | Title card: Earth to Mars signal | On Mars, Earth's answer takes up to twenty-two minutes each way. In solar conjunction, there is no answer for weeks. |
| 2 | Welcome → crew pick | So the check-up has to happen on board. The app opens with one question: who are you? |
| 3 | Earth readings | Ines picks herself, and sees the readings she took on Earth before launch. That is her normal. |
| 4 | Today's readings → filled | Next, today's readings. Her wearable has filled most of them. She measures the rest, and rates her mood. |
| 5 | 3D results → Hairline 2D | Her results light up the body. Heart and skin turn red: a fever, with a fast heart rate. The line drawing marks the same places with arrows. |
| 6 | WARNING + timing table | Can it wait for Earth? This fever is safe for about an hour. Earth's reply takes sixty-four minutes. So: act on board now. |
| 7 | Recovery checklist | The crew follows a short, drug-free checklist, and the medical officer decides. |
| 8 | Consult packet → queued | Then one tap sends a consult packet to the flight surgeon. In solar conjunction, it simply waits in the queue. |
| 9 | Closing card | Everything runs on board. Nothing waits for Earth. |

Rebuild: regenerate shots/voice if the app changes, then `npm run check` and `npm run render`.
GSAP is loaded from jsDelivr at render time only (the app itself stays offline).
