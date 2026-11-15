# NASA Space Apps 2026: submission text for Team Spades

Ready to paste into the Project page fields, in the order the form asks. Everything is in English. Check every link in a private browser window before pressing **Submit for Judging**.

**Team:** Spades · Sanjith S, Manoj S, Alan Jacob Sam S, Aiswarya S
**Challenge:** Create Health Monitoring Software for Astronauts on Space Missions (2026 NASA Space Apps Challenge)

## Project Name
Astronaut Health Monitor

## High-Level Project Summary
Astronaut Health Monitor is a one-minute daily health check-in for astronauts far from Earth. On a Mars mission a message takes up to 22 minutes each way, and during solar conjunction there is no contact for about two weeks, so the crew must judge their own health. The app records nine health indicators (blood pressure, heart rate, glucose, temperature, sleep, mood, oxygen, body mass, radiation), compares each reading with the astronaut's own normal from readings taken on Earth before launch, and answers one question: can this wait for Earth? If Earth's reply would come after the problem becomes dangerous, it says ACT ON BOARD NOW and gives a plain-language, drug-free checklist; otherwise it says ASK EARTH and builds a report for the flight surgeon. Results appear on a clickable 3D body. It works offline, with touch, as a desktop app for Windows, macOS and Linux. All crew and readings are simulated; it does not diagnose.

## Link to Project Demo
Use one of these (all public, no login):
- **7-slide deck (web):** https://lordxmanoj.github.io/Nasa-space-app/deck/
- 7-slide deck (PDF): https://lordxmanoj.github.io/Nasa-space-app/deck/Spades-AstronautHealthMonitor.pdf
- 30-second video: https://lordxmanoj.github.io/Nasa-space-app/video/
- Live demo that clicks and types by itself: https://lordxmanoj.github.io/Nasa-space-app/app/?demo=1

The form takes one link; the deck is the one to submit, because its last slide links to the video, the live demo and the app.

## Link to Final Project
https://lordxmanoj.github.io/Nasa-space-app/ (download page for the desktop app, plus the live web version at `/app/`)
Source code: https://github.com/LORDXMANOJ/Nasa-space-app

## Detailed Project Description
**Links:** Deck: https://lordxmanoj.github.io/Nasa-space-app/deck/ · 30-second video: https://lordxmanoj.github.io/Nasa-space-app/video/ · Live demo (clicks and types by itself, with voice): https://lordxmanoj.github.io/Nasa-space-app/app/?demo=1 · Source: https://github.com/LORDXMANOJ/Nasa-space-app

**The problem we started with.** We began by reading NASA's Human Research Program material on the Five Hazards of Human Spaceflight and on how crews are monitored today. One fact kept coming back: on a Mars mission a message takes up to 22 minutes each way, and during solar conjunction there is no contact for about two weeks. On the ISS a flight surgeon is minutes away. On Mars the crew has to decide alone. We asked what a health tool must do when Earth cannot answer in time.

**Our first version, and what we did not like.** Our first idea was a dashboard of health numbers, plus a concept video made from mock-ups. Looking at it honestly, a wall of numbers does not tell a tired astronaut what to do, and a number means nothing without knowing what is normal for that person. So we changed the question the app asks. It no longer says "here are your readings". It says "can this wait for Earth?".

**Before launch versus after launch.** A healthy heart rate of 58 is normal for one astronaut and a warning for another, so the comparison has to be personal. Before launch, on Earth, we record 10 days of readings per crew member (blood pressure, heart rate, glucose, temperature, sleep, mood, oxygen, body mass, radiation). That becomes their own baseline. After launch, every daily check-in is compared with that baseline, not with a population average. The decision rule then compares Earth's reply time (ISS about 20 minutes, Mars transit 64 minutes, conjunction no contact) with how long the problem can safely wait. If Earth would answer too late, the app says ACT ON BOARD NOW and gives a drug-free checklist; otherwise it says ASK EARTH and builds a Consult Packet for the flight surgeon that queues offline until contact returns.

**What the research changed.** The NASA Five Hazards (gravity, isolation, radiation, distance from Earth, closed environments) decided which hazards each of the nine indicators is linked to. Every safety rule sits on a condition card that cites its source, so nothing is a guess. The NASA flight-surgeon material and the NASA Technical Reports Server papers on Earth-independent medical care and the rHEALTH ONE ISS demonstration showed that crews are monitored with a doctor on the ground. That is why the app prepares a report for the flight surgeon instead of pretending to replace one. The Canadian Space Agency Bio-Monitor wearable shaped the check-in: wearable values arrive filled in and one tap on Measure fills the device readings.

**Three explainable checks.** (1) Safety rules written as data. (2) An "unusual day" detector (Mahalanobis distance with shrinkage, solved by Cholesky factorisation) that notices several readings that are each a little off. (3) A slow-drift detector (CUSUM) with a Theil-Sen forecast of when a reading will reach its limit. We checked the method on 300 simulated astronauts: every full fever was caught on day one and false "unusual day" alarms were 1.3 % per normal day. This tests the method only; it says nothing about clinical accuracy.

**Making it usable in space.** Crews may wear gloves or use a touch panel, so we designed for touch first: 56 px targets, an on-screen number pad, and status shown with colour, shape and word together. We applied UX principles (Fitts's law, Tesler's law, progressive disclosure) and cut the Recovery and Hazards pages when they showed too much at once. Results appear on a clickable 3D body with real organ models and a 2D line drawing. The first look was too playful for a medical tool, so we redesigned the type and colours to be calm and professional. It runs offline as a desktop app for Windows, macOS and Linux.

**Then we worried that users would not know what to do.** So we added a plain-language verdict at the top of every result, a "How it decides" page, an on-board assistant, and Demo mode, which plays a full voiced check-in with a cursor that clicks and types by itself. The assistant works offline and uses no AI model. It answers from the same cited condition cards, shows what each answer was built from, and refuses medicine doses and diagnoses in code. We chose this on purpose: a made-up answer in a medical setting is a risk we did not want to take. The Crew Medical Officer decides on any treatment.

**What is simulated, and what is next.** All crew and readings are simulated, and the app does not diagnose. A crew can now be set up for real: launch date, any number of members and roles, one recorder who enters every member's Earth records (10 days of readings, allergies, daily medicines), wearable pairing by device ID, a 4-digit PIN per person, a read-only Crew tab with alerts to everyone, and reports to Earth on a schedule set by the reply time. The wearable connection is still simulated. Next: connect a real wearable, and a medical-kit reference built only from cited NASA sources.

**Tools.** TypeScript, React, Vite, Zustand, Dexie (IndexedDB), Recharts, three.js with React Three Fiber, Zod, Vitest (66 tests), Electron and electron-builder, GitHub Actions. Fonts Archivo and IBM Plex; Phosphor icons; Hairline engine for the 2D body; HyperFrames for the video.

**Use of Super Intelligence.** The idea, the problem framing and the product decisions are by Team Spades. Code and documentation were written with Claude (Anthropic) through Claude Code, directed and reviewed by the team. The narration in the 30-second video is AI-generated with Kokoro-82M text-to-speech, labelled on screen and in the file metadata. Demo mode narration uses the viewer's browser text-to-speech. The logo and icon were drawn as SVG code with AI assistance. All screenshots are real captures of the app, and the 3D organ models are by Sketchfab authors (CC-BY 4.0). No NASA logos, flags or mission identifiers are used.

## Use of Super Intelligence (SI)
The idea, the problem framing and every product decision were directed by Team Spades. [Team: please confirm this sentence is true before submitting.] We used SI tools as assistants:
- **Code and documentation:** written with Claude (Anthropic) through Claude Code, directed and reviewed by the team. Disclosed in the README, REFERENCES.md and inside the app (How it decides).
- **Audio:** the narration in the 30-second video is generated by Kokoro-82M text-to-speech (voice am_michael), run locally. It is labelled on screen throughout ("AI-generated voice · Kokoro TTS"), named in the video description, and recorded in the file's metadata.
- **Images:** all screenshots are real captures of the app, not generated images. The logo and icon were drawn as SVG code with AI assistance. The 3D organ models are by Sketchfab authors (CC-BY 4.0), not generated.
- No NASA logos, flags or mission identifiers are used or modified anywhere.

## NASA Data
- NASA Human Research Program, **Five Hazards of Human Spaceflight**: https://www.nasa.gov/hrp/hazards/. Each of the nine indicators is mapped to the hazards that affect it, and the hazards page and condition cards cite it.
- NASA flight surgeon and ISS medical-monitoring material: https://www.nasa.gov/directorates/esdmd/hhp/flight-surgeons and NASA Technical Reports Server papers (rHEALTH ONE ISS demonstration, https://ntrs.nasa.gov/citations/20230001079; Russell et al. 2023, clinical decision support for Earth-independent medical operations).
- NASA statement: NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. We comply with the data-use terms of each website we cite.
- Honest note: the health readings in the app are simulated; we do not use a NASA dataset of real crew data.

## Space Agency Partner Data and Other References
- Canadian Space Agency, **Bio-Monitor** (wearable readings): https://www.asc-csa.gc.ca/eng/multimedia/search/image/8166
- Full list with licences: https://github.com/LORDXMANOJ/Nasa-space-app/blob/main/REFERENCES.md. Includes 3D models from Sketchfab (CC-BY 4.0: Tidominer, Pigcraft, prasanth.k, Kent MORI, Suyanto, aandp), the Hairline drawing engine by Lucas Marques (MIT), fonts Archivo and IBM Plex (OFL), Phosphor icons (MIT), and all code libraries.

## Before pressing "Submit for Judging"
- [ ] Every team member is a confirmed participant at the **same Local Event**.
- [ ] Open each link above in a private browser window (no login).
- [ ] Nobody under 18 appears in the deck, video or screenshots (none do: crew are simulated adults and no real people appear).
- [ ] Tick **Terms and Conditions** and **Confirm All Work is Original**.
- [ ] Deadline: Sunday, November 15, 11:59 p.m. local time of your Local Event. Only the last saved submission is reviewed.
