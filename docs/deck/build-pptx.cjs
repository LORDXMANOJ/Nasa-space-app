/**
 * Builds Spades-AstronautHealthMonitor.pptx (7 slides, 16:9) with pptxgenjs. Run: node docs/deck/build-pptx.cjs
 * (needs `npm i pptxgenjs` somewhere on the module path). Same content as the web deck in site/deck/.
 */
const path = require("node:path");
const pptxgen = require("pptxgenjs");
const ROOT = path.join(__dirname, "..", "..");
const shot = (n) => path.join(ROOT, "docs", "screenshots", n);
const OUT = path.join(__dirname, "Spades-AstronautHealthMonitor.pptx");

const THEME = {
  name: "Astronaut Health Monitor",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: { dk1: "111D1B", lt1: "FFFFFF", dk2: "123631", lt2: "E3EDEA", accent1: "1A7568", accent2: "9FCFC4", accent3: "E0A33A", accent4: "B3261E", accent5: "4F625D", accent6: "2A8F7F", hlink: "1A7568", folHlink: "4F625D" },
};
const PAPER = "F8FBFA", DEEP = "123631", INK = "111D1B", DIM = "4F625D", PRIMARY = "1A7568", LIGHT = "9FCFC4", GROUND = "E3EDEA", RED = "B3261E";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9"; // 10 x 5.625 in
pres.theme = { headFontFace: "Arial", bodyFontFace: "Calibri" };
pres.title = "Astronaut Health Monitor";
pres.author = "Team Spades";
pres.company = "Team Spades";
pres.subject = "NASA Space Apps Challenge 2026: Create Health Monitoring Software for Astronauts on Space Missions";

const T = (slide, text, o) => slide.addText(text, { isTextBox: true, margin: 0, fontFace: "Calibri", ...o });
const foot = (s, n, dark, left) => {
  T(s, left || "Team Spades · Astronaut Health Monitor", { x: 0.6, y: 5.18, w: 7, h: 0.25, fontSize: 10, color: dark ? LIGHT : DIM, fontFace: "Courier New" });
  T(s, `${n} / 7`, { x: 8.6, y: 5.18, w: 0.8, h: 0.25, fontSize: 10, color: dark ? LIGHT : DIM, align: "right", fontFace: "Courier New" });
};
const kicker = (s, text, dark) => T(s, text.toUpperCase(), { x: 0.6, y: 0.4, w: 8.8, h: 0.3, fontSize: 12, bold: true, color: dark ? LIGHT : PRIMARY, fontFace: "Courier New", charSpacing: 2 });
const title = (s, text, dark, w = 8.8, h = 1.1, y = 0.75) => T(s, text, { x: 0.6, y, w, h, fontSize: 32, bold: true, fontFace: "Arial", color: dark ? "FFFFFF" : INK, valign: "top" });
const img = (s, file, x, y, w, name, alt) => s.addImage({ path: shot(file), x, y, w, h: (w * 900) / 1440, altText: alt, objectName: name });

// 1 ----------------------------------------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: DEEP };
  s.addImage({ path: path.join(ROOT, "public", "icon-512.png"), x: 0.6, y: 0.5, w: 0.55, h: 0.55, altText: "Astronaut Health Monitor logo", objectName: "Logo" });
  T(s, "ASTRONAUT HEALTH MONITOR", { x: 1.3, y: 0.62, w: 4.5, h: 0.3, fontSize: 13, bold: true, color: LIGHT, fontFace: "Courier New", charSpacing: 2 });
  T(s, "A health check that knows when it can wait for Earth", { x: 0.6, y: 1.3, w: 5.1, h: 1.7, fontSize: 31, bold: true, fontFace: "Arial", color: "FFFFFF", valign: "top" });
  T(s, "A one-minute daily check-in for crew far from home.", { x: 0.6, y: 3.05, w: 5.1, h: 0.4, fontSize: 16, color: GROUND });
  T(s, "Team Spades", { x: 0.6, y: 3.6, w: 5.1, h: 0.4, fontSize: 22, bold: true, fontFace: "Arial", color: "FFFFFF" });
  T(s, "Sanjith S · Manoj S · Alan Jacob Sam S · Aiswarya S", { x: 0.6, y: 4.02, w: 5.2, h: 0.3, fontSize: 15, color: GROUND });
  T(s, "Challenge: Create Health Monitoring Software for Astronauts on Space Missions · 2026 NASA Space Apps Challenge", { x: 0.6, y: 4.45, w: 5.2, h: 0.5, fontSize: 12, color: LIGHT });
  img(s, "01-dashboard.png", 6.0, 1.45, 3.5, "Dashboard screenshot", "The Astronaut Health Monitor dashboard with a 3D body and the status of each region");
  foot(s, 1, true, "Team Spades");
  s.addNotes("Introduce the team and the challenge. One line: a one-minute daily health check for crew far from Earth that decides whether a problem can wait for Earth's reply.");
}
// 2 ----------------------------------------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  kicker(s, "The problem");
  title(s, "Far from Earth, the crew is the first doctor");
  const stats = [["22", "min", "one way to Earth from Mars. A reply can take over an hour."], ["14", "days", "with no contact at all during solar conjunction."], ["1", "medic", "a Crew Medical Officer with basic training, not a doctor."]];
  stats.forEach(([n, u, t], i) => {
    const x = 0.6 + i * 2.97;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.75, w: 2.8, h: 2.3, fill: { color: GROUND }, rectRadius: 0.15, line: { color: GROUND }, objectName: `Stat card ${i + 1}` });
    T(s, [{ text: n, options: { fontSize: 54, bold: false, color: DEEP, fontFace: "Arial" } }, { text: ` ${u}`, options: { fontSize: 16, bold: true, color: PRIMARY, fontFace: "Courier New" } }], { x: x + 0.25, y: 1.9, w: 2.4, h: 0.95 });
    T(s, t, { x: x + 0.25, y: 2.95, w: 2.35, h: 0.95, fontSize: 15, color: INK, valign: "top" });
  });
  T(s, [{ text: "NASA's five hazards ", options: { bold: true, color: INK } }, { text: "make it worse: space radiation, isolation and confinement, distance from Earth, altered gravity and hostile closed environments.", options: { color: DIM } }], { x: 0.6, y: 4.3, w: 8.8, h: 0.7, fontSize: 16, valign: "top" });
  foot(s, 2);
  s.addNotes("On Mars a message takes up to 22 minutes each way, and in solar conjunction there is no contact for about two weeks. The crew has first-aid training. NASA's Human Research Program names five hazards: radiation, isolation and confinement, distance from Earth, gravity fields, hostile closed environments.");
}
// 3 ----------------------------------------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  img(s, "08-decision.png", 0.6, 1.2, 4.1, "Decision screenshot", "A WARNING block: fever with fast heart rate, safe wait 60 minutes against an Earth reply of 64 minutes, ACT ON BOARD NOW");
  kicker(s, "Our answer");
  T(s, "One question: can this wait for Earth?", { x: 5.05, y: 0.75, w: 4.4, h: 1.1, fontSize: 26, bold: true, fontFace: "Arial", color: INK, valign: "top" });
  const pts = [["1", "Your own normal.", " Every reading is compared with 10 days recorded on Earth before launch."], ["2", "Plain words.", " Each alert says what changed, why, and how sure the app is."], ["3", "Wait or act.", " It weighs the safe wait against Earth's reply time and says so."]];
  pts.forEach(([n, b, t], i) => {
    const y = 2.05 + i * 0.95;
    s.addShape(pres.ShapeType.ellipse, { x: 5.05, y, w: 0.5, h: 0.5, fill: { color: DEEP }, line: { color: DEEP }, objectName: `Number ${n}` });
    T(s, n, { x: 5.05, y, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: LIGHT, align: "center", valign: "middle", fontFace: "Courier New" });
    T(s, [{ text: b, options: { bold: true, color: INK } }, { text: t, options: { color: INK } }], { x: 5.75, y: y - 0.02, w: 3.7, h: 0.85, fontSize: 14, valign: "top" });
  });
  foot(s, 3);
  s.addNotes("The app compares each reading with the astronaut's own normal, explains alerts in plain language, and answers one question: can this wait for Earth?");
}
// 4 ----------------------------------------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  kicker(s, "The user experience");
  title(s, 'From "Who are you?" to an answer in one minute', false, 8.8, 1.0);
  const steps = [["06-welcome.png", "Who are you?", "The app opens by asking who is checking in.", "Welcome screen"], ["07-earth-readings.png", "Your normal", "10 days of Earth readings become your baseline.", "Earth readings"], ["05-checkin.png", "Check in", "Wearable values arrive filled in. One tap measures the rest.", "Check-in"], ["03-body.png", "Your results", "Real organ models light up. Tap one to learn more.", "3D body"]];
  steps.forEach(([f, h, t, alt], i) => {
    const x = 0.6 + i * 2.25;
    img(s, f, x, 1.95, 2.1, `Step ${i + 1} screenshot`, `${alt} screen`);
    T(s, `STEP ${i + 1}`, { x, y: 3.45, w: 2.1, h: 0.2, fontSize: 10, bold: true, color: PRIMARY, fontFace: "Courier New" });
    T(s, h, { x, y: 3.67, w: 2.1, h: 0.3, fontSize: 16, bold: true, fontFace: "Arial", color: INK });
    T(s, t, { x, y: 4.0, w: 2.1, h: 0.7, fontSize: 12, color: DIM, valign: "top" });
  });
  T(s, [{ text: "Built for a touch panel: ", options: { bold: true, color: PRIMARY } }, { text: "56 px targets, an on-screen number pad, nothing to type. It also works with a mouse or trackpad.", options: { color: INK } }], { x: 0.6, y: 4.78, w: 8.8, h: 0.3, fontSize: 13 });
  foot(s, 4);
  s.addNotes("Walk the four steps: who are you, your Earth normal, the check-in (touch-first), and the results on a 3D body.");
}
// 5 ----------------------------------------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  kicker(s, "How it works");
  title(s, "Three explainable checks, then a clear decision", false, 4.9, 1.2);
  const checks = [["R", "Safety rules", "Limits written as data on each condition card, cited to NASA and clinical sources."], ["U", "Unusual day", "Several readings a little off together, against your own normal."], ["D", "Slow drift and forecast", "Spots a reading creeping one way and forecasts when it reaches the limit."]];
  checks.forEach(([l, h, t], i) => {
    const y = 2.1 + i * 0.78;
    s.addShape(pres.ShapeType.roundRect, { x: 0.6, y, w: 0.42, h: 0.42, fill: { color: PRIMARY }, rectRadius: 0.08, line: { color: PRIMARY }, objectName: `Check ${l}` });
    T(s, l, { x: 0.6, y, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: "FFFFFF", align: "center", valign: "middle", fontFace: "Courier New" });
    T(s, [{ text: h, options: { bold: true, color: INK, breakLine: true } }, { text: t, options: { color: DIM, fontSize: 12 } }], { x: 1.2, y: y - 0.04, w: 4.3, h: 0.72, fontSize: 14, valign: "top" });
  });
  T(s, [{ text: "Tested on 300 simulated astronauts: ", options: { bold: true, color: INK } }, { text: "every full fever caught on day one; 1.3 % false \"unusual day\" alarms. A check of the method, not clinical accuracy.", options: { color: DIM } }], { x: 0.6, y: 4.5, w: 4.9, h: 0.6, fontSize: 12, valign: "top" });
  s.addShape(pres.ShapeType.roundRect, { x: 5.8, y: 0.75, w: 3.6, h: 3.5, fill: { color: GROUND }, rectRadius: 0.18, line: { color: GROUND }, objectName: "Decision card" });
  T(s, "CAN THIS WAIT FOR EARTH?", { x: 6.05, y: 0.95, w: 3.1, h: 0.25, fontSize: 11, bold: true, color: DIM, fontFace: "Courier New" });
  [["Safe wait", 38, RED, "60 min", 1.45], ["Earth reply", 41, DEEP, "64 min", 1.95]].forEach(([l, pct, col, v, y]) => {
    T(s, l, { x: 6.05, y, w: 1.0, h: 0.3, fontSize: 13, color: INK, valign: "middle" });
    s.addShape(pres.ShapeType.roundRect, { x: 7.05, y: y + 0.05, w: 1.5, h: 0.2, fill: { color: "FFFFFF" }, rectRadius: 0.1, line: { color: "CFDCD8", width: 0.5 }, objectName: `${l} track` });
    s.addShape(pres.ShapeType.roundRect, { x: 7.05, y: y + 0.05, w: (1.5 * pct) / 100 + 0.2, h: 0.2, fill: { color: col }, rectRadius: 0.1, line: { color: col }, objectName: `${l} bar` });
    T(s, v, { x: 8.6, y, w: 0.65, h: 0.3, fontSize: 12, bold: true, color: INK, align: "right", valign: "middle", fontFace: "Courier New" });
  });
  s.addShape(pres.ShapeType.roundRect, { x: 6.05, y: 2.6, w: 3.1, h: 0.5, fill: { color: RED }, rectRadius: 0.08, line: { color: RED }, objectName: "Verdict" });
  T(s, "ACT ON BOARD NOW", { x: 6.05, y: 2.6, w: 3.1, h: 0.5, fontSize: 15, bold: true, fontFace: "Arial", color: "FFFFFF", align: "center", valign: "middle" });
  T(s, "Fever with a fast heart rate, on Mars transit (22 min each way). On the ISS (about 20 min) the same alert says ASK EARTH.", { x: 6.05, y: 3.25, w: 3.1, h: 0.85, fontSize: 12, color: DIM, valign: "top" });
  foot(s, 5);
  s.addNotes("Three checks: safety rules, an unusual-day detector and a slow-drift detector with a forecast. The decision compares how long a problem can safely wait with how long Earth takes to reply. Validation is on simulated astronauts and checks the method only.");
}
// 6 ----------------------------------------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: PAPER };
  kicker(s, "What the challenge asked, and what it stands on");
  title(s, "Built from NASA's hazards and agency research", false, 8.8, 0.9);
  const card = (x, w, head, items, note) => {
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.75, w, h: 3.3, fill: { color: GROUND }, rectRadius: 0.15, line: { color: GROUND }, objectName: `${head} card` });
    T(s, head, { x: x + 0.25, y: 1.9, w: w - 0.5, h: 0.35, fontSize: 17, bold: true, fontFace: "Arial", color: INK });
    const runs = items.flatMap(([b, t], i) => [{ text: b, options: { bold: true, color: INK, bullet: true, breakLine: false } }, { text: ` ${t}`, options: { color: INK, breakLine: i < items.length - 1 } }]);
    T(s, runs, { x: x + 0.25, y: 2.3, w: w - 0.5, h: note ? 2.0 : 2.6, fontSize: 12, valign: "top", paraSpaceAfter: 5 });
    if (note) T(s, note, { x: x + 0.25, y: 4.4, w: w - 0.5, h: 0.55, fontSize: 11, color: DIM, valign: "top" });
  };
  card(0.6, 4.3, "What we built", [["Nine indicators:", "blood pressure, heart rate, glucose, temperature, sleep, mood, oxygen, body mass, radiation."], ["A clickable body", "in 3D and as a line drawing, each region with its function and status."], ["Colour, shape and word", "for every status."], ["Plain instructions", "and a drug-free recovery plan; the Crew Medical Officer decides."], ["Four environments:", "ISS, Moon rover, Mars transit, Mars base."]]);
  card(5.1, 4.3, "NASA and agency resources used", [["NASA Human Research Program, Five Hazards:", "each indicator is mapped to the hazards that affect it."], ["NASA flight surgeon and ISS monitoring material,", "NASA Technical Reports (rHEALTH ONE, CDSS for Earth-independent care)."], ["Canadian Space Agency Bio-Monitor", "as the model for wearable readings."]], "All crew and readings are simulated. No real astronaut data. It flags and explains; it does not diagnose.");
  foot(s, 6);
  s.addNotes("The five NASA hazards drive which indicators we track. Resources: NASA HRP five hazards, NASA flight surgeon pages, NTRS papers, CSA Bio-Monitor. NASA does not endorse any non-U.S. Government entity.");
}
// 7 ----------------------------------------------------------------------------------------------------------
{
  const s = pres.addSlide();
  s.background = { color: DEEP };
  kicker(s, "Try it", true);
  title(s, "Watch it run, then use it", true, 4.6, 0.7);
  const links = [["LIVE DEMO IN YOUR BROWSER (CLICKS AND TYPES BY ITSELF)", "lordxmanoj.github.io/Nasa-space-app/app", "https://lordxmanoj.github.io/Nasa-space-app/app/?demo=1"], ["DESKTOP APP FOR WINDOWS, MACOS AND LINUX", "lordxmanoj.github.io/Nasa-space-app", "https://lordxmanoj.github.io/Nasa-space-app/"], ["30-SECOND VIDEO", "lordxmanoj.github.io/Nasa-space-app/video", "https://lordxmanoj.github.io/Nasa-space-app/video/"], ["SOURCE CODE", "github.com/LORDXMANOJ/Nasa-space-app", "https://github.com/LORDXMANOJ/Nasa-space-app"]];
  links.forEach(([lab, txt, url], i) => {
    const y = 1.5 + i * 0.9;
    s.addShape(pres.ShapeType.roundRect, { x: 0.6, y, w: 4.6, h: 0.8, fill: { color: "1D4A43" }, rectRadius: 0.12, line: { color: "4F8E83", width: 0.75 }, objectName: `Link card ${i + 1}` });
    T(s, lab, { x: 0.8, y: y + 0.08, w: 4.2, h: 0.25, fontSize: 9, bold: true, color: LIGHT, fontFace: "Courier New" });
    T(s, [{ text: txt, options: { hyperlink: { url }, color: "FFFFFF", bold: true } }], { x: 0.8, y: y + 0.36, w: 4.2, h: 0.35, fontSize: 14 });
  });
  T(s, "Next", { x: 5.6, y: 0.75, w: 3.8, h: 0.4, fontSize: 22, bold: true, fontFace: "Arial", color: "FFFFFF" });
  const next = ["Set up a whole crew: roles, and every member's Earth records, entered by a ground team.", "Pair a real wearable before launch and test it.", "A crew tab where everyone sees everyone's progress, with alerts to all.", "Reports to Earth on a schedule set by the reply time, emergencies at once."];
  T(s, next.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < next.length - 1 } })), { x: 5.6, y: 1.25, w: 3.8, h: 2.4, fontSize: 14, color: GROUND, valign: "top", paraSpaceAfter: 8 });
  T(s, "AI use: code and documentation written with Claude (Anthropic). Narration in the video is Kokoro text-to-speech. Logo drawn as code with AI assistance. 3D models: Sketchfab, CC-BY 4.0.", { x: 5.6, y: 3.85, w: 3.8, h: 1.0, fontSize: 11, color: LIGHT, valign: "top" });
  foot(s, 7, true, "Team Spades · Sanjith S · Manoj S · Alan Jacob Sam S · Aiswarya S");
  s.addNotes("Open the live demo link: it clicks and types by itself through a full check-in. The desktop app is on the download page. Next steps: crew setup, wearable pairing, crew tab, scheduled reports to Earth.");
}

pres.writeFile({ fileName: OUT }).then(async () => {
  const { applyTheme } = require(path.join("C:/Users/manoj/.claude/skills/synced/aa92c021-5e0f-402d-b8a1-e5ae61d59a43_9445415a-752b-49c2-8a31-019e2b925eed/pptx/scripts/apply_theme.js"));
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
});
