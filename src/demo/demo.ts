/**
 * Demo mode (web version only): plays a guided tour of the real app. A visible cursor moves to each control,
 * clicks it and types on the number pad, with a caption saying what is happening and why.
 * It drives the actual interface through the DOM, so what judges see is exactly what a crew member would use.
 * It is hidden in the desktop app, where nobody needs a tour.
 */
import { create } from "zustand";
import { useMission } from "../store/mission";
import { useCrew } from "../store/crew";

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
const wait =
  (ms: number): Step =>
  async (t) =>
    sleep(ms, t);

const SCRIPT: Step[] = [
  say("Astronaut Health Monitor: a one-minute daily health check for crew far from Earth.", 3600),
  say("On Mars, Earth's answer takes up to 22 minutes each way. The app has to decide on board.", 3800),
  async (t) => click(t, "button", "Who are you?"),
  say("It starts by asking who is checking in. Ines Okafor is the Commander.", 2800),
  async (t) => click(t, "button", "Okafor"),
  say("These are the readings Ines took on Earth before launch. This is her normal.", 4200),
  async (t) => click(t, "button", "Next: today"),
  async (t) => {
    useMission.getState().setDay(23);
    await sleep(1200, t);
  },
  say("Day 23 of the mission. Step 1: her wearable already sent heart rate, temperature and sleep.", 3800),
  say("She can correct a number on the on-screen pad. No keyboard needed.", 2600),
  async (t) => typeNumber(t, "hr.hr", "104"),
  async (t) => click(t, ".ci-bar button", "Next"),
  say("Step 2: the devices. One tap on Measure, and the number fills in.", 3200),
  async (t) => {
    const buttons = [...document.querySelectorAll<HTMLElement>(".ci-measure")].filter(visible);
    for (const b of buttons) await press(t, b);
    await sleep(4800, t);
  },
  async (t) => click(t, ".ci-bar button", "Next"),
  say("Step 3: only Ines can tell us how she feels. Mood 4, and she feels hot.", 3000),
  async (t) => click(t, ".mood-scale button", /^\s*4\s*$/),
  async (t) => click(t, ".symptoms label", "Feeling hot"),
  async (t) => click(t, ".ci-bar button", "See my results"),
  async (t) => {
    await waitFor(t, "#results", undefined, 12000);
    await sleep(1800, t);
  },
  say("Her results appear on a 3D body. Heart and skin turn red: act.", 3800),
  async (t) => click(t, ".region-list button", "Heart"),
  async (t) => {
    const block = find(".block--act");
    if (block) await moveTo(t, block);
  },
  say("Fever with a fast heart rate. Can it wait for Earth? Safe wait: 60 minutes. Earth's reply: 64.", 4800),
  say("So the verdict is ACT ON BOARD NOW.", 3000),
  go("#/recovery"),
  say("A short, drug-free checklist. The Crew Medical Officer decides on any treatment.", 3600),
  async (t) => {
    const labels = [...document.querySelectorAll<HTMLElement>(".checklist label")]
      .filter(visible)
      .slice(0, 3);
    for (const l of labels) await press(t, l);
  },
  go("#/body"),
  async (t) => click(t, "button", /^\s*2D\s*$/),
  say("The line drawing marks damage with arrows: double for Act, dashed for Watch.", 4200),
  go("#/consult"),
  say(
    "One tap builds a packet for the flight surgeon. During solar conjunction it queues until contact returns.",
    4200,
  ),
  async (t) => click(t, "button", /(Queue|Send) for flight surgeon|Send to flight surgeon/),
  wait(2500),
  go("#/"),
  say("That is the whole loop. Everything runs on board. Nothing waits for Earth.", 4200),
];

export async function startDemo(withVoice = true) {
  if (isDesktopApp || useDemo.getState().running) return;
  const t = ++token;
  set({
    voice: withVoice && canSpeak,
    ready: false,
    running: true,
    step: 0,
    total: SCRIPT.length,
    caption: "Starting the demo with simulated crew data…",
    cursor: { x: -40, y: -40, visible: false, pressed: false },
  });
  try {
    // a clean, repeatable start: the demo crew, nothing entered yet
    // the tour always uses the simulated crew; a real crew's data is left untouched
    useCrew.getState().setMode("demo");
    const m = useMission.getState();
    m.resetDemo();
    m.signOut();
    window.location.hash = "#/";
    await sleep(1200, t);
    for (let i = 0; i < SCRIPT.length; i++) {
      set({ step: i + 1 });
      await SCRIPT[i](t);
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

export function stopDemo() {
  token++;
  if (canSpeak) window.speechSynthesis.cancel();
  set({ running: false, ready: false, caption: "", cursor: { x: -40, y: -40, visible: false, pressed: false } });
}
