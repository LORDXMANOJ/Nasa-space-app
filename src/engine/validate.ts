/**
 * Monte Carlo validation of the detectors on simulated astronauts (checks the METHOD, not clinical accuracy).
 * 300 astronauts with random personal baselines: 10 pre-flight days on Earth learn the baseline, then flight days 1-20 are
 * normal days (6,000 in total). Injected events: a full fever, an early mild fever, and a slow blood-pressure climb.
 */
import { assessDay } from "./assess";
import { runDetectors } from "./detectors";
import { gaussian, hashString, mulberry32 } from "./rng";
import type { Reading } from "./simulation";

export interface ValidationResult {
  astronauts: number;
  normalDays: number;
  unusualFalseAlarmRate: number; // per normal day, unusual-day detector
  anyAlertFalseRate: number; // per normal day, any alert from any detector or rule
  ruleFalseRate: number; // per normal day, fixed-rule alerts only
  driftFalseDayRate: number; // per normal day, drift alerts
  feverCaughtDayOne: number; // share of full fevers flagged on the day they start
  earlyMildFeverCaught: number; // share of mild prodromes flagged by any detector
  slowClimbCaught: number; // share of BP climbs caught by the drift detector within 20 days
  slowClimbMedianDays: number | null;
  steadyFalseDriftRate: number; // share of steady astronauts with any drift flag in 20 days
  seed: number;
  ms: number;
}

const SD = { sys: 5, dia: 4, hr: 3.5, glu: 6, temp: 0.15, sleep: 0.5, mood: 0.8 };

interface Person {
  id: number;
  m: { sys: number; dia: number; hr: number; glu: number; temp: number; sleep: number; mood: number };
  k: number; // personal variability factor
}

function makePerson(id: number, seed: number): Person {
  const r = mulberry32(hashString(`person:${seed}:${id}`));
  const u = (a: number, b: number) => a + (b - a) * r();
  return {
    id,
    m: { sys: u(105, 128), dia: u(65, 80), hr: u(50, 78), glu: u(78, 96), temp: u(36.4, 36.9), sleep: u(6.6, 8), mood: u(6, 8.5) },
    k: u(0.6, 1.2),
  };
}

type Shift = Partial<Record<keyof Person["m"], number>>;

function history(p: Person, seed: number, days: number, shift: (d: number) => Shift): Record<string, Reading[]> {
  const h: Record<string, Reading[]> = { bp: [], hr: [], glucose: [], temp: [], sleep: [], mood: [] };
  const g = (k: string, d: number) => gaussian(`v:${seed}:${p.id}:${k}:${d}`);
  for (let d = -9; d <= days; d++) {
    const s = shift(d);
    const v = (k: keyof Person["m"]) => p.m[k] + (s[k] ?? 0) + g(k, d) * SD[k] * p.k;
    const push = (id: string, values: number[]) => h[id].push({ indicatorId: id, day: d, values, source: "sim" });
    push("bp", [Math.round(v("sys")), Math.round(v("dia"))]);
    push("hr", [Math.round(v("hr")), 55]);
    if ((d - 1) % 3 === 0) push("glucose", [Math.round(v("glu"))]);
    push("temp", [Math.round(v("temp") * 10) / 10]);
    push("sleep", [Math.round(v("sleep") * 10) / 10, 7]);
    push("mood", [Math.min(10, Math.max(1, Math.round(v("mood")))), 260]);
  }
  return h;
}

const FEVER: Shift = { temp: 1.6, hr: 35, sleep: -1.2, mood: -2 };
const MILD: Shift = { temp: 0.5, hr: 9, sleep: -0.8, mood: -1.2 };

export function runValidation(n = 300, seed = 2026): ValidationResult {
  const t0 = Date.now();
  let normalDays = 0;
  let unusualFalse = 0;
  let anyFalse = 0;
  let ruleFalse = 0;
  let driftDayFalse = 0;
  let feverCaught = 0;
  let mildCaught = 0;
  let climbCaught = 0;
  const climbDays: number[] = [];
  let steadyDrift = 0;

  for (let i = 0; i < n; i++) {
    const p = makePerson(i, seed);
    // Normal days 11–30.
    const normal = history(p, seed, 20, () => ({}));
    let drifted = false;
    for (let d = 1; d <= 20; d++) {
      const view = cut(normal, d);
      const a = assessDay(view, d);
      normalDays++;
      if (a.run?.unusual?.flagged) unusualFalse++;
      if (a.alerts.length) anyFalse++;
      if (a.alerts.some((x) => x.kind === "rule")) ruleFalse++;
      if (a.run?.drift.length) driftDayFalse++;
      if (a.run?.drift.length) drifted = true;
    }
    if (drifted) steadyDrift++;

    // Full fever starting on a random day 12–28: flagged that same day?
    const fd = 2 + (i % 17);
    const fever = history(p, seed + 1, fd, (d) => (d === fd ? FEVER : {}));
    if (assessDay(fever, fd).alerts.length) feverCaught++;

    // Early mild fever (prodrome) on day fd.
    const mild = history(p, seed + 2, fd, (d) => (d === fd ? MILD : {}));
    const ma = runDetectors(mild, fd);
    if (ma?.unusual?.flagged || ma?.drift.length) mildCaught++;

    // Slow systolic climb of +1 mmHg/day from day 11, watched for 20 days.
    const climb = history(p, seed + 3, 20, (d) => (d > 0 ? { sys: d * 1, dia: d * 0.25 } : {}));
    for (let d = 1; d <= 20; d++) {
      const r = runDetectors(cut(climb, d), d);
      if (r?.drift.some((x) => x.key === "bp.systolic")) {
        climbCaught++;
        climbDays.push(d);
        break;
      }
    }
  }
  climbDays.sort((a, b) => a - b);
  return {
    astronauts: n,
    normalDays,
    unusualFalseAlarmRate: unusualFalse / normalDays,
    anyAlertFalseRate: anyFalse / normalDays,
    ruleFalseRate: ruleFalse / normalDays,
    driftFalseDayRate: driftDayFalse / normalDays,
    feverCaughtDayOne: feverCaught / n,
    earlyMildFeverCaught: mildCaught / n,
    slowClimbCaught: climbCaught / n,
    slowClimbMedianDays: climbDays.length ? climbDays[Math.floor(climbDays.length / 2)] : null,
    steadyFalseDriftRate: steadyDrift / n,
    seed,
    ms: Date.now() - t0,
  };
}

function cut(h: Record<string, Reading[]>, day: number): Record<string, Reading[]> {
  return Object.fromEntries(Object.entries(h).map(([k, v]) => [k, v.filter((r) => r.day <= day)]));
}
