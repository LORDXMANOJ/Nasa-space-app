# UX decisions: designing for a crew far from Earth

This page explains how the Astronaut Health Monitor is meant to feel to use, and **why** each choice was made. Most choices come from one question: *what is it like to check your health on a spacecraft, with no doctor on board and Earth minutes or weeks away?*

> Prototype for NASA Space Apps 2026. All crew, readings and stories are simulated. Where something is our assumption rather than a known fact, it says so.

---

## 1. The situation we design for

| What is true out there | What it means for the app |
|---|---|
| On a Mars mission, a message takes **3 to 22 minutes each way**. During solar conjunction there is **no contact for about two weeks**. | The app must work fully on board, offline, and decide whether a problem can wait for Earth. |
| Most of the crew have **basic medical training**, and one is the Crew Medical Officer. | Plain words, no jargon, no diagnoses, and a clear "tell your Crew Medical Officer" path. |
| The check-in happens **every day**, between other tasks. | It has to be quick (about a minute) and always look the same. |
| **Assumption:** the app runs on a fixed **touch panel or tablet**. In weightlessness a mouse needs a surface and a free hand to steady it, a keyboard is one more loose object, and hands may be in gloves. | **Touch first.** A keyboard is only needed for free text. |

---

## 2. Touch first (Fitts's law)

*Fitts's law: the bigger and closer a target is, the faster and more accurately you can hit it.*

| What we did | Why |
|---|---|
| Every tap target is at least **56 px**, and the main action is **64 px**. Common guidelines say 44 to 48 px; we went bigger. | A floating body, a moving spacecraft or a gloved finger all make small targets easy to miss. |
| Checkboxes are **whole-row toggles**: tap anywhere on "Feeling hot or shivery". | A 20 px box is a hard target; the whole row is an easy one. |
| The main button (**Next** / **See my results**) stays in a **bar pinned to the bottom** of the screen. | It is always in the same place, near the thumb, without scrolling to find it. |
| Numbers change with **− / +** buttons, or an **on-screen number pad** (64 px keys) that opens when you tap the value. The system keyboard never pops up for numbers. | No hunting for a keyboard, and no full keyboard covering half the screen for a 2-digit number. |
| Every button **presses in** when touched. | On glass there is no click; the movement tells you the tap landed. |
| The layout works on screens **760 px wide and up** (portrait tablets). | The panel on board may be a tablet held upright. |

---

## 3. We take the complexity, not the crew (Tesler's law)

*Tesler's law: some complexity can never be removed; you can only decide who deals with it. We decided the app does.*

| The complex part | Who handles it now |
|---|---|
| Heart rate, temperature, sleep and radiation | The **wearable** sends them; the crew only confirms. |
| Blood pressure, oxygen, glucose, body mass | **One tap on Measure** fills the value from the device. |
| Units, dates, mission day, which readings are due today | Decided by the app; never asked. |
| "Is this normal for **me**?" | The app learns each person's normal from **10 days of readings on Earth before launch** and compares every reading with it. |
| "Can this wait for Earth?" | The app compares how long the problem can safely wait with how long Earth's reply takes, and says **Act on board now** or **Ask Earth**. |
| Saving | Automatic. There is no Save button to forget. |

---

## 4. Show only what is needed now (progressive disclosure)

| Screen | Shown first | One tap away |
|---|---|---|
| Opening the app | **"Who are you?"** | Then your Earth readings, then today's check-in. |
| Check-in | **Three short steps:** your wearable, measure, how you feel. The measure step is skipped when nothing is due. | Previous steps (Back). |
| Results | The **body**, the **flagged regions**, the **verdict** and **What to do now**. | All 7 regions, all readings, other alerts, how the alert was found. |
| Recovery | Only the **most urgent plan**: warning signs, steps, who to tell, can it wait. | Other plans (one line each), why the alert fired, sources. |
| Hazards | Five rows: one sentence each and how your readings look today. | Effects, the readings, body areas, source. |
| Consult Packet | What to include, and **Send**. | The exact packet that will be sent. |

**Why:** a crew member in the middle of a busy day should see the answer first and the detail only if they want it.

---

## 5. Every action answers back (feedback and success states)

| Action | What the crew sees |
|---|---|
| Any button | It presses in. |
| Measure | Words that change as it works ("Cuff filling… hold still" → "Reading your pulse…" → "Almost done…") and a progress bar, then **✓ Measured**. |
| See my results | **"Checking your readings…"** with a progress bar, then the results slide in, with a short "Check-in saved" message. |
| Send to the flight surgeon | **✓ Sent** (or **✓ Queued** during conjunction) and a message saying where the packet is. |
| Ticking a recovery step | "Step 1 done. 2 to go." The last tick shows **Plan complete**. |
| Changing a setting | "Saved", shown **only after** the save really worked. |

---

## 6. Loading: honest about time

Based on research on how long people wait (about 1 s and 10 s are the key limits):

- **Under ~0.4 s: no spinner.** A spinner that flashes for a split second feels like a glitch. Sending a packet is instant, so it goes straight to the tick.
- **Longer: a spinner with words**, never a bare spinner.
- **Long work: words that change, plus a progress bar.** A real blood-pressure cuff takes 30 to 40 seconds (shortened in the demo).
- **Long checks report real progress.** The Monte Carlo check on "How it decides" shows what it is doing and a percentage.
- **If something fails, say so at once**, never after a long wait.
- While the 3D body loads, the 2D body is shown, so the space is never blank.

---

## 7. Errors: what happened, why, and what to do

| Kind | When we use it | Example |
|---|---|---|
| **Inline**, next to the field | A value is missing or impossible. | A red outline, a short jiggle and a message under the field: "400 bpm can't be right: a person reads 25 to 220 bpm. Check the number and enter it again." |
| **Pinned notice** | Something important that does not stop the crew working. | "Your last change could not be saved on this device…" with **Try again**. It stays until it is fixed. |
| **Full block** | A screen fails, or a health alert needs action. | "This screen hit a problem and could not be shown… Your readings are safe." with **Reload this screen** and **Go to the dashboard**. Health alerts are always a WARNING or CAUTION block, never a toast. |
| **Toast** (short message that leaves on its own) | Only for things that are fine to miss. | "Saved", "Sent", "Step done". |

Rules we follow:
- Never show code, database text or a stack trace. It means nothing to the crew and can expose how the app works inside.
- Never fail silently. A failed save, a failed check or a failed send always says so.
- Pressing **Next** or **See my results** with something missing does not just sit there: the screen moves to the first missing field, jiggles it and says what is needed. A counter beside the button says how many are still to fill. (We keep the button active instead of greying it out, because a grey button does not tell you why.)
- Required fields are marked **Required**; optional ones say *(optional)*.
- Values are checked **the moment** they are entered, not after submitting.
- The note to the flight surgeon shows **how many characters are left** (400 maximum, to keep packets small for a slow link).

---

## 8. Empty states: never a blank screen

| Where | What it says |
|---|---|
| A day with **no alerts** | Treated as an achievement, because it is the goal: "All clear today, Mikael", a calm orbit animation, and when the next check-in is. |
| **Recovery** with nothing to do | What this page is for, and that today nothing needs a plan. |
| **Empty outbox** | What will appear there and how to send a packet. |
| **Assistant** with no match | It repeats the question, says what it can answer, and offers the closest questions as buttons. It understands small typos ("presure" → blood pressure). |

---

## 9. Reading status at a glance

- **Colour + shape + word, always together:** Nominal (green circle), Watch (amber triangle), Act (red octagon), Stale (grey dashed circle). Colour alone is never the only signal, for colour-blind users and harsh lighting.
- **3D body:** a see-through body with real organ models (heart, lungs, skull, stomach, intestines, spine) that light up in their status colour. Tap an organ to see what it does and its readings.
- **2D body (line drawing):** damage is shown with **arrows instead of colour**: a double arrow for Act, a dashed arrow for Watch. The status words in colour sit in the box beneath. It still works on screens without 3D.

---

## 10. Look and feel

- **Palette:** Dust Grey `#DAD7CD`, Dry Sage `#A3B18A`, Fern `#588157`, Hunter Green `#3A5A40`, Pine Teal `#344E41`: calm greens that keep red and amber free for health status.
- **Font:** **Geist** for everything, with Geist Mono for data. We first tried rounder, hand-drawn fonts, but they looked cartoonish for a medical tool, so we moved to one clean, professional typeface. It is bundled, so nothing loads from the internet.
- **Icons:** Phosphor, one family and one weight.
- **Soft corners** on one scale (6 to 16 px), and sheets of paper instead of floating cards, like a crew procedure page.

---

## 11. Accessibility

- **Reduce motion** (in Settings, or the system setting): no jiggle, pulsing, sliding or orbit animation.
- **Large text** (+25 %) and **high contrast** modes.
- Everything still works with a **keyboard**; status changes, toasts and errors are announced to **screen readers**.

---

## 12. Not tested yet

We have not tested this with astronauts or on a real flight panel. The touch sizes, timings and the "touch panel" itself are our assumptions. A real system would need testing with crew, gloves and the actual hardware.

---

### Where the ideas come from

- **Fitts's law:** Fitts, P. M. (1954). *The information capacity of the human motor system in controlling the amplitude of movement.* Journal of Experimental Psychology, 47(6), 381–391.
- **Tesler's law** (law of conservation of complexity): Larry Tesler, Xerox PARC and Apple.
- **Response-time limits (0.1 s, 1 s, 10 s):** Jakob Nielsen, *Response Times: The 3 Important Limits*, Nielsen Norman Group: https://www.nngroup.com/articles/response-times-3-important-limits/
- **Skeleton screens:** Luke Wroblewski (2013).
- Team notes on empty states, error messages, forms and loading states.

See also: [DECISIONS.md](../../DECISIONS.md) (every product decision), [DESIGN.md](../../DESIGN.md) (the design system), [HOW_IT_DECIDES.md](../../HOW_IT_DECIDES.md) (the health logic).
