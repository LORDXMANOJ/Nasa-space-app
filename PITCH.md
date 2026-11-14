# Pitch: Astronaut Health Monitor

## 60-second pitch

> **"On Mars, a message to Earth takes up to 22 minutes each way. If an astronaut gets sick, can they afford to wait for the answer?"**

Today, flight surgeons on Earth look after astronauts' health. On the way to Mars that help is an hour away, and during solar conjunction it is two weeks away. The crew has first-aid training, not medical degrees.

Astronaut Health Monitor is a one-minute daily check-in. Wearables fill in sleep, heart rate and temperature; the astronaut adds blood pressure, oxygen, glucose and mood. Three explainable checks compare each day with *that astronaut's own normal*:
- safety rules;
- an "unusual day" detector;
- a slow-drift detector with a forecast.

For every alert, the app answers one question: **can this wait for Earth?** It compares how long the problem can safely wait with how long Earth's reply really takes. If Earth would answer too late, it says **act on board now** and hands the crew a plain-English, drug-free checklist, with the Crew Medical Officer in charge. Either way, it builds a Consult Packet for the flight surgeon that queues offline until contact returns.

We tested the method on 300 simulated astronauts:
- under 1% false "unusual day" flags;
- every full fever caught on day one;
- 99% of slow blood-pressure climbs caught.

> **"Everything runs on board. Nothing waits for Earth."**

## 90-second demo walkthrough

Use presenter controls (`Ctrl+Shift+D`).

| Time | On screen | Say |
|---|---|---|
| 0:00 | Dashboard, Ines Okafor, day 22, Mars transit, "Earth reply 64 min" in the top bar | "Ines is our commander, 22 days out. The bar shows how long Earth takes to answer: 64 minutes." |
| 0:12 | "Unusual day for you" alert, Decision Panel shows **Ask Earth** | "No single reading is alarming. But temperature, heart rate and sleep are each a bit off *for her*. The unusual-day detector flags it a day before any fixed rule. It can safely wait 12 hours, so: ask Earth, start the steps anyway." |
| 0:30 | Presenter → next day (23). Fever card, **Act on board now**, red bar longer than reply bar | "Next day: fever and a racing heart. The safe wait is 60 minutes; Earth needs 64. The app says act on board now." |
| 0:45 | Presenter → Where are we? = Space station | "Same fever on the ISS: reply in 20 minutes. Now it can wait for Earth. Same data, different answer, because distance changes the decision." |
| 0:55 | Recovery screen: red flags, checklist, CMO escalation | "The crew gets red-flag signs anyone can recognise, drug-free steps, and the Crew Medical Officer decides. No doses, no diagnosis." |
| 1:05 | Consult → Send; toggle Solar conjunction → packet stays Queued | "One complete message to the flight surgeon, with privacy toggles. During solar conjunction it waits on board until contact returns." |
| 1:15 | Switch crew to Mikael (HR 52), then Hana (BP drift) | "Mikael's heart rate of 52 is normal for him, so it's never flagged. Hana's pressure creeps up a millimetre a day; only the drift detector sees it, and the forecast says two weeks, so it can wait." |
| 1:25 | How it decides → measured results | "300 simulated astronauts, measured live: under 1% false alarms. Everything runs on board. Nothing waits for Earth." |

## Q&A

- **Is this a diagnosis tool?** No. It flags, explains, and decides whether something can wait. The Crew Medical Officer decides treatment.
- **Where do the limits come from?** AHA, ADA, MedlinePlus and AASM references, and NASA-STD-3001 for the radiation career limit. Everything else is labelled ASSUMPTION, including all safe-wait times.
- **Is the data real?** No. All crew and readings are simulated and seeded, so the demo is identical every time.
- **Why not deep learning?** Ten days of baseline data per person is far too little. Classical statistics are explainable: every alert says which check fired and why.
- **How accurate is it?** On simulated people: unusual-day false alarms 0.92% per day, 100% of fevers on day one, 73% of early mild fevers, 99% of slow BP climbs (median 12 days). That checks the method, not clinical accuracy.
- **What's the weak spot?** About 7% of normal days still get some alert, mostly single readings past a clinical limit. Real data would be needed to tune this.
- **Does the ISS do daily checks like this?** No. ISS crews have regular private medical conferences and scheduled exams. A daily check-in is our proposal for missions where help is delayed.
- **Does it need the internet?** No. It runs fully offline; packets queue until contact.
- **Is there AI?** The on-board assistant gives pre-written answers built from the condition cards. No model runs. An AI coding assistant helped write the code.

## Do / Don't

| Do say | Don't say |
|---|---|
| prototype, simulated data | real astronaut data |
| flags, explains, decides whether it can wait | diagnoses, AI doctor |
| measured on simulated people | 100% accurate, clinically validated |
| limits from public references; assumptions labelled | medically approved limits |
| the Crew Medical Officer decides | the app treats / prescribes |
| an AI coding assistant helped build it | fully hand-written |
