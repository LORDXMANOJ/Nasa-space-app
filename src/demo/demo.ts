/**
 * Demo mode (web version only): plays a guided tour of the real app. A visible cursor moves to each control,
 * clicks it and types on the number pad, with a caption saying what is happening and why.
 * It drives the actual interface through the DOM, so what judges see is exactly what a crew member would use.
 * It is hidden in the desktop app, where nobody needs a tour.
 */
import { create } from "zustand";
import { useMission } from "../store/mission";
import { infoOf, useCrew } from "../store/crew";
import { todayIso } from "../engine/crew";
import { gaussian } from "../engine/rng";
import type { Reading } from "../engine/simulation";
import { useLive } from "../store/live";
import { defaultEarthDates } from "../screens/onboarding/Onboarding";

/** The desktop app (Electron) never offers the tour. */
export const isDesktopApp = typeof navigator !== "undefined" && /Electron/i.test(navigator.userAgent);

interface DemoState {
  running: boolean;
  caption: string;
  step: number;
  total: number;
  cursor: { x: number; y: number; visible: boolean; pressed: boolean };
  /** narrate each caption with the browser's built-in speech voice */
  voice: boolean;
  /** shown when the page was opened with ?demo=1: browsers only allow sound after a tap */
  ready: boolean;
}
export const useDemo = create<DemoState>(() => ({
  running: false,
  caption: "",
  step: 0,
  total: 0,
  cursor: { x: -40, y: -40, visible: false, pressed: false },
  voice: true,
  ready: false,
}));
const set = (p: Partial<DemoState>) => useDemo.setState(p);

let token = 0;
const alive = (t: number) => {
  if (t !== token) throw new Error("demo-stopped");
};
const sleep = async (ms: number, t: number) => {
  for (let left = ms; left > 0; left -= 50) {
    alive(t);
    await new Promise((r) => window.setTimeout(r, Math.min(50, left)));
  }
  alive(t);
};

const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
};
const find = (selector: string, text?: string | RegExp) =>
  [...document.querySelectorAll<HTMLElement>(selector)].find(
    (e) =>
      visible(e) &&
      (text === undefined ||
        (typeof text === "string" ? (e.textContent ?? "").includes(text) : text.test(e.textContent ?? ""))),
  );
async function waitFor(t: number, selector: string, text?: string | RegExp, ms = 9000) {
  for (let i = 0; i < ms / 100; i++) {
    const el = find(selector, text);
    if (el) return el;
    await sleep(100, t);
  }
  throw new Error(`demo: could not find ${selector} ${String(text ?? "")}`);
}

async function moveTo(t: number, el: HTMLElement) {
  el.scrollIntoView({ block: "center", behavior: "auto" });
  await sleep(180, t);
  const r = el.getBoundingClientRect();
  const c = useDemo.getState().cursor;
  set({ cursor: { x: r.left + r.width / 2, y: r.top + r.height / 2, visible: true, pressed: c.pressed } });
  await sleep(750, t);
}
async function press(t: number, el: HTMLElement) {
  await moveTo(t, el);
  set({ cursor: { ...useDemo.getState().cursor, pressed: true } });
  await sleep(140, t);
  el.click();
  set({ cursor: { ...useDemo.getState().cursor, pressed: false } });
  await sleep(250, t);
}
const click = async (t: number, selector: string, text?: string | RegExp) =>
  press(t, await waitFor(t, selector, text));

/** Types a number on the on-screen pad: opens the field, taps each digit, then Done. */
async function typeNumber(t: number, fieldId: string, value: string) {
  const field = document.getElementById(fieldId);
  if (!field) throw new Error(`demo: no field ${fieldId}`);
  await press(t, field);
  await waitFor(t, ".kp-sheet");
  for (const ch of value) await click(t, ".kp-key", new RegExp(`^\\s*${ch === "." ? "\\." : ch}\\s*$`));
  await click(t, ".kp-actions button", "Done");
  await sleep(500, t);
}

type Step = (t: number) => Promise<void>;
const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
let chosenVoice: SpeechSynthesisVoice | undefined;
function pickVoice() {
  if (chosenVoice || !canSpeak) return chosenVoice;
  const all = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  chosenVoice =
    all.find((v) => /natural|online|google/i.test(v.name) && /en-(US|GB)/i.test(v.lang)) ??
    all.find((v) => /en-US/i.test(v.lang)) ??
    all[0];
  return chosenVoice;
}
/** Speaks one caption; resolves when finished (or after a safety timeout). Silent if voice is off or unsupported. */
function speak(text: string): Promise<void> {
  if (!canSpeak || !useDemo.getState().voice) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-US";
    u.rate = 1;
    const done = () => resolve();
    u.onend = done;
    u.onerror = done;
    window.setTimeout(done, 15000);
    window.speechSynthesis.speak(u);
  });
}
const say =
  (text: string, ms = 3200): Step =>
  async (t) => {
    set({ caption: text });
    // the step lasts as long as the caption needs to be read, or the voice needs to finish, whichever is longer
    await Promise.all([sleep(ms, t), speak(text)]);
    alive(t);
  };
const go =
  (hash: string): Step =>
  async (t) => {
    window.location.hash = hash;
    await sleep(1300, t);
  };

/* ---------- typing into ordinary fields (setup screens) ---------- */

/** Types into a text box like a person would: one character at a time, through React's own change events. */
async function typeText(t: number, el: HTMLInputElement | HTMLTextAreaElement, text: string) {
  await moveTo(t, el);
  el.focus();
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setValue = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
  for (let i = 1; i <= text.length; i++) {
    setValue.call(el, text.slice(0, i));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(55, t);
  }
  el.blur();
  await sleep(150, t);
}
async function typeInto(t: number, selector: string, text: string, index = 0) {
  await waitFor(t, selector);
  const el = [...document.querySelectorAll<HTMLInputElement>(selector)].filter(visible)[index];
  if (!el) throw new Error(`demo: no field ${selector}[${index}]`);
  await typeText(t, el, text);
}
async function choose(t: number, el: HTMLSelectElement, value: string) {
  await moveTo(t, el);
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(el, value);
  el.dispatchEvent(new Event("change", { bubbles: true }));
  await sleep(300, t);
}

/* ---------- the demo crew (simulated: every value is invented) ---------- */

const CREW = [
  { name: "Manoj", role: "Commander", hr: 62, sys: 118, dia: 76, temp: 36.6, sleep: 7.2, mood: 7, glu: 90, mass: 72.4 },
  { name: "Aasha", role: "Crew Medical Officer", hr: 66, sys: 112, dia: 72, temp: 36.7, sleep: 7.6, mood: 8, glu: 86, mass: 58.1 },
  { name: "Arya", role: "Mission specialist", hr: 58, sys: 116, dia: 74, temp: 36.5, sleep: 7.0, mood: 7, glu: 92, mass: 66.0 },
];
const RECORDER = "Dr. Sanjith";

/** The days the demo does not type by hand: ten believable days on Earth for every crew member. */
function fillEarthRecords() {
  const c = useCrew.getState();
  const dates = defaultEarthDates(c.launchDate);
  c.members.forEach((m, mi) => {
    const p = CREW.find((x) => x.name === m.name) ?? CREW[mi % CREW.length];
    dates.forEach((d, di) => {
      const w = (k: number) => Math.round(gaussian(`demo:${m.name}:${k}:${di}`) * 10) / 10;
      const row: Record<string, number> = {
        "bp.systolic": Math.round(p.sys + w(1) * 3),
        "bp.diastolic": Math.round(p.dia + w(2) * 2),
        "hr.hr": Math.round(p.hr + w(3) * 2),
        "spo2.spo2": 98 + (w(4) > 0.8 ? 1 : 0),
        "temp.temp": Math.round((p.temp + w(5) * 0.1) * 10) / 10,
        "sleep.hours": Math.round((p.sleep + w(6) * 0.3) * 10) / 10,
        "mood.mood": Math.min(10, Math.max(1, Math.round(p.mood + w(7) * 0.6))),
      };
      if (di % 3 === 0) row["glucose.glucose"] = Math.round(p.glu + w(8) * 4);
      if (di % 7 === 0) row["weight.mass"] = Math.round((p.mass + w(9) * 0.2) * 10) / 10;
      const kept = useCrew.getState().members.find((x) => x.id === m.id)?.earth[d] ?? {};
      for (const [k, v] of Object.entries(row)) if (!Number.isFinite(kept[k])) c.setEarthValue(m.id, d, k, v);
    });
    const info = infoOf(useCrew.getState().members.find((x) => x.id === m.id)!);
    c.setInfo(m.id, {
      noAllergies: info.allergyList.some((a) => a.substance.trim()) ? false : true,
      noMedicines: info.medicineList.some((x) => x.name.trim()) ? false : true,
      bloodType: info.bloodType || ["O+", "A+", "B+"][mi % 3],
    });
  });
}

/* ---------- the tour ---------- */

const SCRIPT: Step[] = [
  say("Astronaut Health Monitor: a one-minute daily health check for crew far from Earth.", 3400),
  say("First, the crew sets it up on Earth, before launch.", 2600),
  async (t) => click(t, "button", "Get started"),
  say("Why it exists: on Mars, Earth's answer takes up to 22 minutes each way.", 3400),
  async (t) => click(t, ".ob-nav button", "Next"),
  say("What you enter: ten days of Earth readings, then a one-minute check-in every day in space.", 4200),
  async (t) => click(t, ".ob-nav button", "Next"),
  say("And what happens next: act on board, or ask Earth.", 2800),
  async (t) => click(t, ".ob-nav button", "Set up the mission"),

  // mission
  async (t) => {
    await moveTo(t, await waitFor(t, "input[type=date]"));
    useCrew.getState().setMission(todayIso(), "spacecraft");
    await sleep(400, t);
  },
  say("Launch today, on a Mars transit. Earth's reply takes about an hour, so routine reports go every 12 hours.", 4600),
  async (t) => click(t, ".ob-nav button", "Next"),

  // crew
  say("Add the crew: any number, any roles.", 2200),
  async (t) => click(t, "button", "Add the first crew member"),
  async (t) => {
    for (let i = 0; i < CREW.length; i++) {
      if (i > 0) await click(t, "button", "Add crew member");
      await sleep(250, t);
      await typeInto(t, ".ob-crew input:not([list])", CREW[i].name, i);
      await typeInto(t, ".ob-crew input[list]", CREW[i].role, i);
    }
  },
  say("Manoj is the Commander, Aasha the Crew Medical Officer, Arya a mission specialist.", 3600),
  async (t) => click(t, ".ob-nav button", "Next"),

  // recorder
  say(`One person enters everyone's Earth records. Here it is ${RECORDER}, a doctor on the ground team.`, 4000),
  async (t) => click(t, ".ob-choice", "Someone on the ground team"),
  async (t) => typeInto(t, ".ob-field input", RECORDER),
  async (t) => click(t, ".ob-nav button", "Enter Earth records"),

  // Earth records: health information
  say(`${RECORDER} records each person's allergies, daily medicines and the basics.`, 3400),
  async (t) => click(t, ".ob-tab", "Aasha"),
  async (t) => click(t, ".ob-yesno button", "Has allergies"),
  async (t) => typeInto(t, ".ob-item input", "Penicillin", 0),
  async (t) => typeInto(t, ".ob-item input", "Rash and swelling", 1),
  async (t) => {
    const sel = [...document.querySelectorAll<HTMLSelectElement>(".ob-item select")].filter(visible);
    if (sel[1]) await choose(t, sel[1], "Moderate");
  },
  say("Aasha is allergic to penicillin. The crew and the flight surgeon will see that on every report.", 3800),
  async (t) => click(t, ".ob-yesno button", /^\s*None\s*$/),

  // Earth records: daily readings
  async (t) => click(t, ".ob-tab", "Manoj"),
  say("Then one row of readings for each day on Earth. Ten days is the goal; five is the minimum.", 3800),
  async (t) => {
    const row = await waitFor(t, ".ob-grid tbody tr");
    const cells = [...row.querySelectorAll<HTMLInputElement>("input")];
    const vals = ["118", "76", "62", "98", "36.6", "7.2", "7"];
    for (let i = 0; i < vals.length; i++) await typeText(t, cells[i], vals[i]);
  },
  async (t) => {
    fillEarthRecords();
    await sleep(600, t);
  },
  say("For the demo, the other days fill in at once: ten days for each of the three.", 3600),
  async (t) => click(t, ".ob-nav button", "Next: wearables"),

  // wearables
  say("Each wearable is paired by its device ID and tested before launch. In this prototype the test is simulated.", 4600),
  async (t) => {
    const ids = ["BM-4F2A-91C3", "BM-7C10-2B8E", "BM-33D9-E047"];
    for (let i = 0; i < ids.length; i++) {
      await typeInto(t, ".ob-wear input", ids[i], i);
      const btn = [...document.querySelectorAll<HTMLElement>(".ob-wear-row")][i]?.querySelector<HTMLButtonElement>("button");
      if (btn) await press(t, btn);
    }
    for (let i = 0; i < 80 && document.querySelectorAll(".ob-wear-row.is-ok").length < ids.length; i++) await sleep(100, t);
    await sleep(600, t);
  },
  async (t) => click(t, ".ob-nav button", "Next"),
  say("Ready for launch.", 2000),
  async (t) => click(t, ".ob-nav button", "Finish setup"),

  // in space: sign in with a PIN
  say("In space, each crew member signs in with their own four-digit PIN.", 3200),
  async (t) => click(t, ".crew-pick button", "Manoj"),
  async (t) => {
    for (let round = 0; round < 2; round++) {
      for (const d of "2468") await click(t, ".ob-pin-pad button", new RegExp(`^\\s*${d}\\s*$`));
      await sleep(700, t);
    }
    await waitFor(t, ".ci-bar", undefined, 9000);
  },

  // check-in
  say("Day 1. Manoj's wearable already sent his heart rate, temperature and sleep.", 3400),
  say("He feels unwell: his temperature is 38.6 and his heart rate 104.", 3200),
  async (t) => typeNumber(t, "temp.temp", "38.6"),
  async (t) => typeNumber(t, "hr.hr", "104"),
  async (t) => click(t, ".ci-bar button", "Next"),
  say("One tap on Measure fills each device reading.", 2400),
  async (t) => {
    const buttons = [...document.querySelectorAll<HTMLElement>(".ci-measure")].filter(visible);
    for (const b of buttons) await press(t, b);
    await sleep(4800, t);
  },
  async (t) => click(t, ".ci-bar button", "Next"),
  async (t) => click(t, ".mood-scale button", /^\s*4\s*$/),
  async (t) => click(t, ".symptoms label", "Feeling hot"),
  async (t) => click(t, ".ci-bar button", "See my results"),
  async (t) => {
    await waitFor(t, "#results", undefined, 12000);
    await sleep(1600, t);
  },
  say("Compared with his own normal on Earth, his heart and skin turn red: act.", 3600),
  async (t) => click(t, ".region-list button", "Heart"),
  async (t) => {
    const block = find(".block--act");
    if (block) await moveTo(t, block);
  },
  say("Can it wait for Earth? It is safe to wait 60 minutes; Earth's reply takes 64. So: act on board now.", 5000),

  // the whole crew
  go("#/crew"),
  say("The whole crew sees it, and an emergency report went to Earth at once.", 3600),
  async (t) => click(t, ".crew-card-head", "Aasha"),
  say("Everyone sees everyone's results, allergies and medicines. Nobody can edit another person's record.", 4600),
  async (t) => {
    const arya = useCrew.getState().members.find((m) => m.name === "Arya");
    if (arya) useLive.getState().startEvent(arya.id, "low-oxygen");
    await sleep(300, t);
  },
  say("And the wearables stream all day, even offline. If anything turns dangerous, everyone is alerted at once.", 4800),
  async (t) => {
    await waitFor(t, ".live-alarm-row", undefined, 25000);
    await sleep(1200, t);
  },
  say("Arya's blood oxygen is low. The alarm is on every screen, and Earth gets an emergency report.", 4400),
  async (t) => {
    await click(t, ".live-alarm-row button", "I'm on it");
    const arya = useCrew.getState().members.find((m) => m.name === "Arya");
    if (arya) useLive.getState().clearEvent(arya.id);
    await sleep(600, t);
  },
  go("#/recovery"),
  say("A short, drug-free checklist. The Crew Medical Officer decides on any treatment.", 3600),
  async (t) => {
    const labels = [...document.querySelectorAll<HTMLElement>(".checklist label")].filter(visible).slice(0, 2);
    for (const l of labels) await press(t, l);
  },

  // the rest of the mission: days of check-ins, the fever settles, everything stays on record
  async (t) => {
    addMissionDays("Manoj", 14);
    await sleep(500, t);
  },
  say("Days pass. Manoj checks in every morning, and the fever settles.", 3200),
  go("#/trends?ind=temp"),
  say("Day 14. His temperature against his own normal from Earth: the fever, then the recovery.", 4600),
  go("#/crew"),
  say("To the end of the mission, every check-in and every report stays on record, for the crew and for Earth.", 4600),
  go("#/"),
  say("Before launch, in space, to the end of the mission: it all runs on board. Nothing waits for Earth.", 4400),
];

/** Fills the days after the fever for one member (simulated): the temperature and heart rate come back to normal. */
function addMissionDays(name: string, lastDay: number) {
  const m = useCrew.getState().members.find((x) => x.name === name);
  if (!m) return;
  const temps = [38.3, 37.8, 37.3, 36.9];
  const hrs = [99, 90, 78, 70];
  const rs: Reading[] = [];
  for (let d = 2; d <= lastDay; d++) {
    const w = (k: number) => gaussian(`demo-days:${name}:${k}:${d}`);
    const t = temps[d - 2] ?? Math.round((36.6 + w(1) * 0.1) * 10) / 10;
    const hr = hrs[d - 2] ?? Math.round(62 + w(2) * 2);
    rs.push(
      { indicatorId: "temp", day: d, values: [t], source: "user" },
      { indicatorId: "hr", day: d, values: [hr, Math.round(55 + w(3) * 4)], source: "user" },
      { indicatorId: "bp", day: d, values: [Math.round(118 + w(4) * 3), Math.round(76 + w(5) * 2)], source: "user" },
      { indicatorId: "spo2", day: d, values: [98], source: "user" },
      { indicatorId: "sleep", day: d, values: [Math.round((7.2 + w(6) * 0.3) * 10) / 10, 7], source: "user" },
      { indicatorId: "mood", day: d, values: [d < 5 ? 5 : 7, 265], source: "user" },
    );
  }
  useCrew.getState().addReadings(m.id, rs);
  useMission.setState((st) => ({ day: lastDay, checkedIn: { ...st.checkedIn, [`${m.id}:${lastDay}`]: true } }));
}

/* ---------- a real crew is never lost to the tour ---------- */

const BACKUP_KEY = "ahm-demo-backup";
const crewData = () =>
  Object.fromEntries(Object.entries(useCrew.getState()).filter(([k, v]) => typeof v !== "function" && k !== "hydrated"));
function backupRealCrew(): boolean {
  if (!useCrew.getState().members.length) return false;
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(crewData()));
    return true;
  } catch {
    return false;
  }
}
/** Puts back a crew saved before the tour (also after a tab was closed mid-tour). Returns true if one was restored. */
export function restoreRealCrew(): boolean {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return false;
    localStorage.removeItem(BACKUP_KEY);
    useCrew.setState(JSON.parse(raw));
    useMission.getState().signOut();
    return true;
  } catch {
    return false;
  }
}

export async function startDemo(withVoice = true) {
  if (isDesktopApp || useDemo.getState().running) return;
  const t = ++token;
  set({
    voice: withVoice && canSpeak,
    ready: false,
    running: true,
    step: 0,
    total: SCRIPT.length,
    caption: "Starting the demo with a simulated crew…",
    cursor: { x: -40, y: -40, visible: false, pressed: false },
  });
  const hadCrew = backupRealCrew();
  try {
    // a clean, repeatable start: a new crew, nothing entered yet
    useMission.getState().signOut();
    useCrew.getState().resetAll();
    useCrew.setState({ hydrated: true, mode: "new", step: "welcome" });
    useLive.setState({ alarms: [], values: {}, events: {}, tick: 0, lastAt: null });
    window.location.hash = "#/";
    await sleep(1200, t);
    for (let i = 0; i < SCRIPT.length; i++) {
      set({ step: i + 1 });
      await SCRIPT[i](t);
    }
    if (hadCrew) {
      set({ caption: "Demo finished. Your own crew is back." });
      await sleep(2500, t);
    }
  } catch (e) {
    if (!(e instanceof Error) || e.message !== "demo-stopped") console.warn(e);
  } finally {
    if (t === token) stopDemo();
  }
}

export function setVoice(on: boolean) {
  set({ voice: on });
  if (!on && canSpeak) window.speechSynthesis.cancel();
}

/** Ends the tour. A crew that existed before the tour comes back; otherwise the demo crew stays to explore. */
export function stopDemo() {
  token++;
  if (canSpeak) window.speechSynthesis.cancel();
  set({ running: false, ready: false, caption: "", cursor: { x: -40, y: -40, visible: false, pressed: false } });
  restoreRealCrew();
}
