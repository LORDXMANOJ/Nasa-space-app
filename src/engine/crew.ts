/**
 * A real crew (not the demo stories): dates, Earth records, a simulated wearable, the "didn't measure" rule
 * and the report-to-Earth schedule. Pure functions, unit-tested in crew.test.ts.
 *
 * Mission day 1 is the launch date. Earth records are the days before launch (day 0 = the day before launch,
 * day -9 = ten days before), so they slot straight into the same baseline learner the demo crew uses.
 */
import { INDICATORS, environmentById, type EnvironmentId, type Indicator } from "../data";
import { learnMetricBaselines } from "./detectors";
import { gaussian } from "./rng";
import type { Reading } from "./simulation";

/* ---------------- dates ---------------- */

/** "2026-11-15" → days since 1970-01-01 (UTC, so time zones and summer time never shift a day). */
export const dayIndex = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
};
export const isoOf = (index: number) => new Date(index * 86_400_000).toISOString().slice(0, 10);
export const todayIso = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

/** Mission day of a calendar date: launch date = day 1, the day before launch = day 0. */
export const missionDayOf = (launchIso: string, dateIso: string) => dayIndex(dateIso) - dayIndex(launchIso) + 1;
export const dateOfMissionDay = (launchIso: string, day: number) => isoOf(dayIndex(launchIso) + day - 1);

/* ---------------- Earth records ---------------- */

/** The columns of one Earth-record row. All readings for one day sit in one row. */
export interface EarthField {
  key: string; // `${indicatorId}.${metricKey}`
  label: string;
  unit: string;
  min: number;
  max: number;
  decimals: number;
}
export const EARTH_FIELDS: EarthField[] = [
  { key: "bp.systolic", label: "Systolic", unit: "mmHg", min: 60, max: 220, decimals: 0 },
  { key: "bp.diastolic", label: "Diastolic", unit: "mmHg", min: 30, max: 140, decimals: 0 },
  { key: "hr.hr", label: "Heart rate", unit: "bpm", min: 30, max: 200, decimals: 0 },
  { key: "spo2.spo2", label: "SpO₂", unit: "%", min: 70, max: 100, decimals: 0 },
  { key: "temp.temp", label: "Temp", unit: "°C", min: 34, max: 42, decimals: 1 },
  { key: "sleep.hours", label: "Sleep", unit: "h", min: 0, max: 16, decimals: 1 },
  { key: "mood.mood", label: "Mood", unit: "/10", min: 1, max: 10, decimals: 0 },
  { key: "glucose.glucose", label: "Glucose", unit: "mg/dL", min: 30, max: 400, decimals: 0 },
  { key: "weight.mass", label: "Mass", unit: "kg", min: 30, max: 200, decimals: 1 },
];
/** The readings a day needs before it counts as a complete Earth day (glucose and mass are not daily). */
export const EARTH_DAILY_KEYS = ["bp.systolic", "bp.diastolic", "hr.hr", "spo2.spo2", "temp.temp", "sleep.hours", "mood.mood"];
export const EARTH_TARGET_DAYS = 10;

export type EarthRow = Partial<Record<string, number>>;

export const rowComplete = (row: EarthRow | undefined) =>
  !!row && EARTH_DAILY_KEYS.every((k) => Number.isFinite(row[k]));
export const rowStarted = (row: EarthRow | undefined) =>
  !!row && EARTH_FIELDS.some((f) => Number.isFinite(row[f.key]));

/** Range check for one value; returns a plain message, or null when fine. */
export function checkEarthValue(key: string, v: number): string | null {
  const f = EARTH_FIELDS.find((x) => x.key === key);
  if (!f || !Number.isFinite(v)) return null;
  if (v < f.min || v > f.max) return `${f.label} must be between ${f.min} and ${f.max} ${f.unit}.`;
  return null;
}

/** Earth rows (keyed by date) → readings on mission days ≤ 0. Dates on or after launch are ignored. */
export function earthReadings(rows: Record<string, EarthRow>, launchIso: string): Reading[] {
  const out: Reading[] = [];
  for (const [date, row] of Object.entries(rows)) {
    const day = missionDayOf(launchIso, date);
    if (day > 0 || !rowStarted(row)) continue;
    for (const ind of INDICATORS) {
      const values = ind.metrics.map((m) => row[`${ind.id}.${m.key}`] ?? NaN);
      if (ind.id === "weight") values[1] = 0; // change since launch: none before launch
      if (ind.id === "radiation") values[0] = 0; // mission dose starts at launch
      if (ind.id === "radiation" || values.some(Number.isFinite)) out.push({ indicatorId: ind.id, day, values, source: "earth" });
    }
  }
  return out;
}

/* ---------------- the simulated wearable ---------------- */

/** Stable number from a string (seeds the simulated wearable per crew member). */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * What the paired wearable "sends" today. There is no real device yet, so this is SIMULATED: the member's own
 * Earth average with small day-to-day noise. It is labelled as simulated everywhere it appears.
 */
export function wearableReading(
  memberId: string,
  ind: Indicator,
  day: number,
  earth: Reading[],
  env: EnvironmentId,
): number[] {
  const base = learnMetricBaselines(groupByIndicator(earth));
  return ind.metrics.map((m) => {
    const key = `${ind.id}.${m.key}`;
    const noise = gaussian(`${hashString(memberId)}:${key}:${day}`);
    if (m.cumulative) return Math.max(0, Math.round(environmentById(env).doseRate * day + noise * 0.6));
    if (key === "weight.change") return 0;
    const b = base[key] ?? { mean: (m.normalRange.min + m.normalRange.max) / 2, sd: 1 };
    let v = b.mean + noise * b.sd * 0.5;
    if (m.unit === "/10") v = Math.min(10, Math.max(1, v));
    if (m.unit === "%") v = Math.min(100, v);
    const f = 10 ** m.decimals;
    return Math.round(v * f) / f;
  });
}

export function groupByIndicator(readings: Reading[]): Record<string, Reading[]> {
  const out: Record<string, Reading[]> = {};
  for (const ind of INDICATORS) out[ind.id] = [];
  for (const r of readings) (out[r.indicatorId] ??= []).push(r);
  for (const list of Object.values(out)) list.sort((a, b) => a.day - b.day);
  return out;
}

/**
 * History for one crew member on mission day `day`: Earth records + their own check-ins (later entries win)
 * + today's wearable values for the auto-logged readings, if a wearable is paired.
 */
export function memberHistory(opts: {
  memberId: string;
  earth: Reading[];
  readings: Reading[];
  day: number;
  env: EnvironmentId;
  wearablePaired: boolean;
  /** readings marked "didn't measure" today: the wearable does not fill these */
  skippedToday?: string[];
}): Record<string, Reading[]> {
  const { memberId, earth, readings, day, env, wearablePaired, skippedToday = [] } = opts;
  const own = readings.filter((r) => r.day >= 1 && r.day <= day);
  const today: Reading[] = [];
  if (wearablePaired && day >= 1)
    for (const ind of INDICATORS.filter((i) => i.autoLogged && !skippedToday.includes(i.id)))
      if (!own.some((r) => r.indicatorId === ind.id && r.day === day))
        today.push({ indicatorId: ind.id, day, values: wearableReading(memberId, ind, day, earth, env), source: "auto" });
  return groupByIndicator([...earth, ...own, ...today]);
}

/* ---------------- "didn't measure" ---------------- */

/** A reading may be skipped for one day, never two days in a row. */
export const canSkip = (skips: Record<number, string[]>, indicatorId: string, day: number) =>
  !(skips[day - 1] ?? []).includes(indicatorId);

/* ---------------- reports to Earth ---------------- */

/**
 * How often a routine report goes to Earth, from Earth's reply time (round trip, minutes):
 *   under 1 h → every 6 h · 1–3 h → every 12 h · 3–5 h → every 12 h · 5–12 h → every day · 12–24 h → every 2 days,
 *   then the interval doubles each time the reply time doubles. An emergency report is sent at once.
 * The under-1-hour and 3–5-hour rows are our assumption; the team set the others.
 */
export function reportIntervalHours(replyMin: number): number {
  const h = replyMin / 60;
  if (h < 1) return 6;
  if (h < 5) return 12;
  if (h < 12) return 24;
  if (h < 24) return 48;
  let interval = 48;
  for (let limit = 24; h >= limit; limit *= 2) interval *= 2;
  return interval;
}

export const formatInterval = (hours: number) =>
  hours < 24 ? `every ${hours} hours` : hours === 24 ? "every day" : `every ${hours / 24} days`;

/* ---------------- PIN ---------------- */

/**
 * The PIN keeps crew members from checking in as each other on a shared panel. It is a convenience lock on this
 * device, not strong security: it is stored only as a salted hash and never leaves the device.
 */
export const pinHash = (memberId: string, pin: string) => hashString(`ahm:${memberId}:${pin}`).toString(36);
export const validPin = (pin: string) => /^\d{4}$/.test(pin);
