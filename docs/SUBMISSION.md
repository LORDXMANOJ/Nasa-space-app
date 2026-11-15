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
**What it does.** Each day a crew member picks who they are, sees the 10 days of readings recorded on Earth before launch (their normal), then checks in: wearable values arrive filled in, one tap on Measure fills the device readings, and they say how they feel. The result lights up a 3D body with real organ models in the colour, shape and word of each region's status (Nominal, Watch, Act). The most urgent alert comes first with a timing panel, "Can this wait for Earth?", comparing the safe wait with Earth's reply time, then a short drug-free recovery plan and a Consult Packet for the flight surgeon that queues offline until contact returns.

**How it works.** Three explainable checks run on the daily readings: (1) safety rules, written as data on condition cards with sources; (2) an "unusual day" detector (Mahalanobis distance with shrinkage, solved by Cholesky factorisation) that notices several readings that are each a little off; (3) a slow-drift detector (CUSUM) with a Theil-Sen forecast of when a reading will reach its limit. The decision rule is T_reply versus T_harm: if Earth's reply takes longer than the problem can safely wait, act on board. Reply time depends on the mission (ISS about 20 minutes, Mars transit 64 minutes, solar conjunction no contact). We checked the method on 300 simulated astronauts: every full fever caught on day one, 1.3 % false "unusual day" alarms per normal day. This checks the method only; it says nothing about clinical accuracy.

**Benefits.** The crew sees the answer in plain words and always knows what to do next. It is touch-first (56 px targets, on-screen number pad), works fully offline, and shows status with colour, shape and word together. Four environments are built in: ISS, Moon rover, Mars transit and Mars base.

**What we hope to achieve.** A starting point for on-board health decision support for missions where help is minutes to weeks away. Next: set up a whole crew (roles, and every member's Earth records), pair a real wearable before launch, a crew tab with alerts to everyone, and reports to Earth on a schedule set by the reply time.

**Tools.** TypeScript, React, Vite, Zustand, Dexie (IndexedDB), Recharts, three.js with React Three Fiber, Zod, Vitest (66 tests), Electron and electron-builder (desktop installers), GitHub Actions. Fonts Archivo and IBM Plex; Phosphor icons; Hairline engine for the 2D body; HyperFrames for the video.

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
