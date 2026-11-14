/**
 * Simulation engine: produces SIMULATED readings for every indicator and mission day.
 * value = personal baseline + seeded daily noise + scripted scenario drift (+ dose accumulation for radiation).
 * The "Day 120, Mars transit" scenario: sleep falls from day 113, mood dips 2 days later,
 * heart rate and blood pressure creep up 3 days later; everything recovers by day 124.
 */
import { INDICATORS, environmentById, type EnvironmentId, type Indicator } from "../data";
import { gaussian } from "./rng";
import type { CrewProfile, StoryId } from "./profiles";

export interface Reading {
  indicatorId: string;
  day: number;
  values: number[]; // one per metric, in indicator.metrics order
  source: "sim" | "auto" | "user";
}

export const SCENARIO = {
  name: "Day 120, Mars transit",
  startDay: 113,
  focusDay: 120,
  recoveredDay: 124,
  minDay: 100,
  maxDay: 130,
  events: [
    { day: 113, label: "Sleep starts to slip" },
    { day: 116, label: "Mood dips" },
    { day: 118, label: "HR and BP creep up" },
    { day: 120, label: "Act: sleep · Watch: BP" },
    { day: 124, label: "Recovered" },
  ],
} as const;

/** Sleep hours offset (negative = less sleep) on a given day. */
export function sleepOffset(day: number): number {
  if (day < SCENARIO.startDay) return 0;
  if (day <= SCENARIO.focusDay) return -(day - (SCENARIO.startDay - 1)) * 0.35;
  const recovery: Record<number, number> = { 121: -1.8, 122: -0.9, 123: -0.3 };
  return recovery[day] ?? 0;
}

/** Day 120 story: scripted drift per metric, in that metric's units. */
export function scenarioDrift(metricKey: string, day: number): number {
  switch (metricKey) {
    case "sleep.hours":
      return sleepOffset(day);
    case "sleep.quality":
      return sleepOffset(day) * 1.2;
    case "mood.mood":
      return sleepOffset(day - 2) * 1.5;
    case "mood.reaction":
      return -sleepOffset(day - 1) * 40;
    case "hr.hr":
      return -sleepOffset(day - 3) * 5;
    case "hr.hrv":
      return sleepOffset(day - 3) * 8;
    case "bp.systolic":
      return -sleepOffset(day - 3) * 8.5;
    case "bp.diastolic":
      return -sleepOffset(day - 3) * 7;
    default:
      return 0;
  }
}

const round = (v: number, decimals: number) => {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
};

const step = (table: Record<number, number>, day: number) => table[day] ?? 0;

/** Scripted drift for each crew story (metric units). Days not listed have no drift. */
export function storyDrift(story: StoryId, key: string, day: number): number {
  switch (story) {
    case "day120":
      return scenarioDrift(key, day);
    case "fever": {
      const t: Record<string, Record<number, number>> = {
        "temp.temp": { 21: 0.2, 22: 0.6, 23: 1.65, 24: 1.9, 25: 1.2, 26: 0.5, 27: 0.2 },
        "hr.hr": { 21: 3, 22: 10, 23: 38, 24: 40, 25: 22, 26: 9, 27: 3 },
        "sleep.hours": { 22: -0.8, 23: -1.4, 24: -1.2, 25: -0.6 },
        "mood.mood": { 22: -1.2, 23: -2.2, 24: -2.2, 25: -1.2 },
        "spo2.spo2": { 23: -1, 24: -1 },
        "hr.hrv": { 22: -10, 23: -22, 24: -22, 25: -12 },
      };
      return t[key] ? step(t[key], day) : 0;
    }
    case "isolation": {
      if (day < 21) return 0;
      const n = Math.min(day, 25) - 20;
      const fade = day > 25 ? Math.max(0, 1 - (day - 25) * 0.25) : 1;
      if (key === "sleep.hours") return -0.5 * n * fade;
      if (key === "sleep.quality") return -0.7 * n * fade;
      if (key === "mood.mood") return -0.6 * n * fade;
      if (key === "mood.reaction") return 12 * n * fade;
      if (key === "hr.hr") return 1.6 * n * fade; // stress
      return 0;
    }
    case "bp-creep": {
      if (day < 12) return 0;
      if (key === "bp.systolic") return 1.0 * (day - 11);
      if (key === "bp.diastolic") return 0.25 * (day - 11);
      return 0;
    }
    default:
      return 0;
  }
}

/** In-flight mass loss of ~12 g/day plus appetite loss during the poor-sleep stretch. Returns [kg, % since launch]. */
export const MASS_LOSS_PER_DAY = 0.012;
function simulateMass(day: number, profile: CrewProfile): number[] {
  const b = profile.baselines["weight.mass"] ?? { mean: 70, sd: 0.5 };
  const launch = b.mean + MASS_LOSS_PER_DAY * 100; // baseline is the in-flight mean around day 100
  const appetite = profile.story === "day120" ? sleepOffset(day - 1) * 0.25 : 0;
  const mass = launch - MASS_LOSS_PER_DAY * day + appetite + gaussian(`${profile.seed}:weight.mass:${day}`) * b.sd * 0.4;
  return [round(mass, 1), round(((mass - launch) / launch) * 100, 1)];
}

/** Is this indicator scheduled on this day (cadence)? Day 1 always counts. */
export const isScheduled = (ind: Indicator, day: number) => {
  const every = Math.max(1, Math.round(ind.cadenceHours / 24));
  return (day - 1) % every === 0;
};

/** The simulated value set for one indicator on one day. Deterministic. */
export function simulateReading(
  ind: Indicator,
  day: number,
  profile: CrewProfile,
  env: EnvironmentId,
): number[] {
  if (ind.id === "weight") return simulateMass(day, profile);
  return ind.metrics.map((m) => {
    const key = `${ind.id}.${m.key}`;
    if (m.cumulative) {
      const rate = environmentById(env).doseRate;
      const jitter = gaussian(`${profile.seed}:${key}:${day}`) * 0.6;
      return round(Math.max(0, rate * day + jitter), m.decimals);
    }
    const b = profile.baselines[key] ?? { mean: (m.normalRange.min + m.normalRange.max) / 2, sd: 1 };
    const noise = gaussian(`${profile.seed}:${key}:${day}`) * b.sd * 0.55;
    let v = b.mean + noise + storyDrift(profile.story, key, day);
    if (m.unit === "/10") v = Math.min(10, Math.max(1, v));
    if (m.unit === "%") v = Math.min(100, v);
    return round(v, m.decimals);
  });
}

/**
 * Readings visible on mission day `currentDay`:
 * - every scheduled day before today (simulated history),
 * - today only for auto-logged indicators (dosimeter, shirt temperature, sleep watch),
 * - plus any readings the user took through the Measure flow (they win over simulated ones).
 */
export function buildHistory(
  profile: CrewProfile,
  env: EnvironmentId,
  currentDay: number,
  userReadings: Reading[],
  firstDay = 1,
  /** Include every indicator on the current day (as if the full check-in were done). Used by tests and validation. */
  completeToday = false,
): Record<string, Reading[]> {
  const out: Record<string, Reading[]> = {};
  for (const ind of INDICATORS) {
    const list: Reading[] = [];
    for (let d = firstDay; d <= currentDay; d++) {
      const today = d === currentDay;
      if (today && !ind.autoLogged && !completeToday) continue;
      if (!isScheduled(ind, d) && !(today && (ind.autoLogged || completeToday))) continue;
      list.push({
        indicatorId: ind.id,
        day: d,
        values: simulateReading(ind, d, profile, env),
        source: today ? "auto" : "sim",
      });
    }
    for (const u of userReadings) {
      if (u.indicatorId !== ind.id || u.day > currentDay) continue;
      const i = list.findIndex((r) => r.day === u.day);
      if (i >= 0) list[i] = u;
      else list.push(u);
    }
    list.sort((a, b) => a.day - b.day);
    out[ind.id] = list;
  }
  return out;
}
