/**
 * Builds the PowerPoint version of the 7-slide deck from the web deck (site/deck/index.html).
 * Each slide is a full-size image of the web slide, so the PowerPoint looks exactly like the deck judges see,
 * with alt text and speaker notes carrying the words. Rebuild: capture site/deck at 1920x1080 into
 * <shots>/final-1.png ... final-7.png, then `node docs/deck/build-pptx.cjs <shots>`.
 */
const path = require("node:path");
const fs = require("node:fs");
const pptxgen = require("pptxgenjs");

const shots = process.argv[2];
const SLIDES = [
  ["Can this wait for Earth? Astronaut Health Monitor answers that every day, on board, for every astronaut. Team Spades: Sanjith S, Manoj S, Alan Jacob Sam S, Aiswarya S. Challenge: Create Health Monitoring Software for Astronauts on Space Missions, 2026 NASA Space Apps Challenge.",
    "Title. The question the whole app answers. Image: a fever on the way to Mars; Earth would reply too late, so the app says act on board now."],
  ["01 What we saw: far from Earth, nobody can answer in time. 22 minutes one way from Mars, 14 days of silence in solar conjunction, 1 medic on board who is not a doctor. NASA's five hazards every day: radiation, isolation, altered gravity, distance from Earth, closed environment.",
    "The problem, from NASA's Human Research Program hazards and mission communication delays."],
  ["02 What we got wrong first: our first idea was a dashboard of numbers. A tired astronaut can't read a wall of numbers, and 58 bpm is normal for one person, a warning for another. So we asked one question: can this wait for Earth?",
    "Our first version and why we changed it."],
  ["03 The idea: learn each person's normal on Earth, compare every day in space. Before launch, a doctor records 10 days of readings, allergies and daily medicines for each crew member. After launch, a one-minute check-in: sign in with a PIN, the wearable fills in the rest. Touch-first, works fully offline. We decided: your own normal, not an average; one doctor records for the whole crew; allergies and medicines on record; 5 Earth days minimum, 10 is the goal; a PIN for each person; skip a reading once, never two days running.",
    "The user experience: before launch and after launch."],
  ["04 How it decides: if Earth would answer too late, act on board now. Fever with a fast heart rate on Mars transit: safe wait 60 minutes, Earth reply 64 minutes, ACT ON BOARD NOW. The same fever on the ISS says ASK EARTH. Three checks: safety rules (cited limits, e.g. fever at or above 38 °C with heart rate above 100: MedlinePlus, American Heart Association), unusual day, slow drift. 300 simulated astronauts: every full fever caught on day one, 1.3 % false alarms on normal days; a check of the method, not of clinical accuracy. Earth reply 64 min = 22 min out + 20 min flight-surgeon review (our estimate) + 22 min back; safe wait 60 min is our estimate, written on the fever condition card. We decided: no AI model makes the call; every alert explains why; drug-free steps, the Crew Medical Officer decides; colour, shape and word together.",
    "The decision rule and the three explainable checks."],
  ["05 What NASA research changed: we read first, then built. NASA Human Research Program Five Hazards: every reading is linked to the hazard behind it. NASA flight surgeons and NASA Technical Reports: it prepares a report for the flight surgeon and never replaces one. Canadian Space Agency Bio-Monitor: the wearable sends heart rate, temperature and sleep (simulated in the prototype). Next, with NASA: test in analog missions (HERA, CHAPEA) with flight surgeons setting every limit; check baselines against NASA's Open Science Data Repository; align limits with NASA-STD-3001. All data in the prototype is simulated; it does not diagnose.",
    "How NASA and space agency resources made the project possible."],
  ["06 Nobody left guessing: the whole crew sees every alert, Earth gets the report. Emergencies go at once; routine reports follow a schedule set by Earth's reply time. We decided: wearables stream live and danger alerts everyone; everyone sees everyone, nobody edits another's record; with no contact, reports wait in a queue. Live demo: lordxmanoj.github.io/Nasa-space-app/app. Video: lordxmanoj.github.io/Nasa-space-app/video. Desktop app: lordxmanoj.github.io/Nasa-space-app. Source: github.com/LORDXMANOJ/Nasa-space-app. AI use: code and documentation written with Claude (Anthropic), directed by the team; narration is AI text-to-speech; logo drawn as code with AI help; 3D organ models from Sketchfab, CC-BY 4.0.",
    "The crew tab, reports to Earth, links and AI disclosure."],
];

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
  pres.title = "Astronaut Health Monitor: Team Spades";
  pres.author = "Team Spades";
  pres.subject = "2026 NASA Space Apps Challenge: Create Health Monitoring Software for Astronauts on Space Missions";
  SLIDES.forEach(([alt, note], i) => {
    const s = pres.addSlide();
    s.background = { color: "F8FBFA" };
    s.addImage({ path: path.join(shots, `final-${i + 1}.png`), x: 0, y: 0, w: 10, h: 5.625, altText: alt });
    s.addNotes(`${note}\n\n${alt}`);
  });
  const out = path.join(__dirname, "Spades-AstronautHealthMonitor.pptx");
  await pres.writeFile({ fileName: out });
  fs.copyFileSync(out, path.join(__dirname, "..", "..", "site", "deck", "Spades-AstronautHealthMonitor.pptx"));
  console.log("written", out);
})();
