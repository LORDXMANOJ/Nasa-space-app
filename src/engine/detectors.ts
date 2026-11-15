/**
 * Three explainable detectors over the 7 core check-in readings (classical statistics, no deep learning):
 *  1. Unusual day — squared Mahalanobis distance vs χ²(0.99, df) using a personal baseline from mission days 1–10
 *     (Schäfer–Strimmer shrunk covariance, Cholesky solve, minimum standard deviations).
 *  2. Slow drift — two-sided CUSUM on standardised values.
 *  3. Forecast — Theil–Sen slope projected to the Act limit; gives T_harm for a drifting reading.
 * Skipped readings are NaN and count as no evidence.
 */
import { indicatorById } from "../data";
import { badDirection } from "./alerts";
import { CHI2_99, cholesky, columnStats, covFromCorr, mahalanobis2, median, shrunkCorrelation, subMatrix, type Matrix } from "./linalg";
import type { Reading } from "./simulation";

export const CORE_KEYS = ["bp.systolic", "bp.diastolic", "hr.hr", "glucose.glucose", "temp.temp", "sleep.hours", "mood.mood"] as const;
export type CoreKey = (typeof CORE_KEYS)[number];
export const CORE_LABEL: Record<CoreKey, string> = {
  "bp.systolic": "systolic blood pressure",
  "bp.diastolic": "diastolic blood pressure",
  "hr.hr": "heart rate",
  "glucose.glucose": "blood glucose",
  "temp.temp": "temperature",
  "sleep.hours": "sleep",
  "mood.mood": "mood",
};

/** Pre-flight readings on Earth (mission days PREFLIGHT_START..0) teach each astronaut's own normal. */
export const PREFLIGHT_DAYS = 10;
export const PREFLIGHT_START = 1 - PREFLIGHT_DAYS; // -9
/** Kept for older call sites: the number of baseline days. */
export const BASELINE_DAYS = PREFLIGHT_DAYS;
/** Minimum standard deviations, so tiny day-to-day wobbles are not treated as "unusual" (ASSUMPTION, tuned by Monte Carlo). */
export const SD_FLOOR: Record<string, number> = {
  "bp.systolic": 4,
  "bp.diastolic": 3,
  "hr.hr": 3,
  "glucose.glucose": 5,
  "temp.temp": 0.15,
  "sleep.hours": 0.35,
  "mood.mood": 0.6,
  "hr.hrv": 5,
  "spo2.spo2": 0.6,
  "mood.reaction": 15,
  "sleep.quality": 0.6,
  "weight.mass": 0.4,
  "weight.change": 0.5,
};
/**
 * Tuning constants, chosen with the Monte Carlo check (src/engine/validate.ts) and documented in HOW_IT_DECIDES.md.
 * covScale inflates the 10-day covariance to allow for estimating it from so few days.
 * CUSUM uses reference value k and decision limit h, in (inflated) standard deviations.
 */
export const TUNING = { covScale: 1.35, zScale: 1.3, k: 0.75, h: 6 };
/** Only forecast when the drift would reach the Act limit within this many days. */
export const FORECAST_HORIZON_DAYS = 60;

export interface MetricBaseline {
  mean: number;
  sd: number;
}

export interface CoreBaseline {
  keys: readonly CoreKey[];
  mean: number[];
  sd: number[];
  R: Matrix;
  cov: Matrix;
  lambda: number;
  days: number;
}

/** Value of `indicatorId.metricKey` from a reading list on one day (NaN if skipped). */
export function valueOn(history: Record<string, Reading[]>, key: string, day: number): number {
  const [indId, metricKey] = key.split(".");
  const ind = indicatorById(indId);
  const idx = ind.metrics.findIndex((m) => m.key === metricKey);
  const r = history[indId]?.find((x) => x.day === day);
  return r ? r.values[idx] : NaN;
}

export function coreRow(history: Record<string, Reading[]>, day: number): number[] {
  return CORE_KEYS.map((k) => valueOn(history, k, day));
}

export function learnCoreBaseline(history: Record<string, Reading[]>): CoreBaseline {
  // every Earth day counts: 10 is the plan, more is better, fewer still works with wider limits
  const first = Math.min(
    PREFLIGHT_START,
    ...Object.values(history).flatMap((l) => l.filter((r) => r.day <= 0).map((r) => r.day)),
  );
  const rows: number[][] = [];
  for (let d = first; d <= 0; d++) {
    const row = coreRow(history, d);
    if (d >= PREFLIGHT_START || row.some(Number.isFinite)) rows.push(row);
  }
  const { mean, sd } = columnStats(rows, CORE_KEYS.length);
  const sdF = sd.map((s, i) => Math.max(Number.isFinite(s) ? s : 0, SD_FLOOR[CORE_KEYS[i]]));
  const { R, lambda } = shrunkCorrelation(rows, mean, sdF);
  let cov = covFromCorr(R, sdF).map((row) => row.map((v) => v * TUNING.covScale));
  // Pairwise-complete correlations (glucose has few pre-flight readings) are not guaranteed to be positive
  // definite. If Cholesky fails, shrink the off-diagonal further toward the identity until it succeeds.
  for (let k = 0; k < 12; k++) {
    try {
      cholesky(cov);
      break;
    } catch {
      cov = cov.map((row, i) => row.map((v, j) => (i === j ? v : v * 0.7)));
    }
  }
  return { keys: CORE_KEYS, mean, sd: sdF, R, cov, lambda, days: Math.max(BASELINE_DAYS, rows.length) };
}

/** Per-metric personal baseline (mean, floored sd) for every metric, from mission days 1–10. */
export function learnMetricBaselines(history: Record<string, Reading[]>): Record<string, MetricBaseline> {
  const out: Record<string, MetricBaseline> = {};
  for (const [indId, list] of Object.entries(history)) {
    const ind = indicatorById(indId);
    ind.metrics.forEach((m, i) => {
      const key = `${indId}.${m.key}`;
      const vals = list.filter((r) => r.day <= 0).map((r) => r.values[i]).filter(Number.isFinite);
      if (vals.length < 1) return;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const sd = vals.length > 1 ? Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (vals.length - 1)) : 0;
      out[key] = { mean, sd: Math.max(sd, SD_FLOOR[key] ?? 0.01 * Math.abs(mean) + 1e-6) };
    });
  }
  return out;
}

export interface UnusualResult {
  d2: number;
  df: number;
  limit: number;
  flagged: boolean;
  contributions: { key: CoreKey; z: number }[];
}

/** Detector 1: squared Mahalanobis distance of today's readings from the personal baseline. */
export function unusualDay(base: CoreBaseline, x: number[]): UnusualResult | null {
  // a reading with no Earth baseline (e.g. glucose never measured before launch) cannot be compared: leave it out
  const idx = x.map((v, i) => (Number.isFinite(v) && Number.isFinite(base.mean[i]) ? i : -1)).filter((i) => i >= 0);
  if (idx.length < 2) return null;
  const d2 = mahalanobis2(
    idx.map((i) => x[i]),
    idx.map((i) => base.mean[i]),
    subMatrix(base.cov, idx),
  );
  const limit = CHI2_99[idx.length];
  const contributions = idx
    .map((i) => ({ key: base.keys[i], z: (x[i] - base.mean[i]) / base.sd[i] }))
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  return { d2, df: idx.length, limit, flagged: d2 > limit, contributions };
}

export interface CusumResult {
  sPlus: number;
  sMinus: number;
  alarm: "up" | "down" | null;
  alarmSinceDay: number | null;
}

/** Detector 2: two-sided CUSUM. S⁺ = max(0, S⁺ + z − k), S⁻ = max(0, S⁻ − z − k); alarm when either exceeds h. */
export function cusum(zs: { day: number; z: number }[], k = TUNING.k, h = TUNING.h, side: "both" | "high" | "low" = "both"): CusumResult {
  let sPlus = 0;
  let sMinus = 0;
  let alarmSinceDay: number | null = null;
  let alarm: CusumResult["alarm"] = null;
  for (const { day, z } of zs) {
    if (!Number.isFinite(z)) continue; // skipped reading = no evidence
    sPlus = Math.max(0, sPlus + z - k);
    sMinus = Math.max(0, sMinus - z - k);
    const now = side !== "low" && sPlus > h ? "up" : side !== "high" && sMinus > h ? "down" : null;
    if (now && !alarm) alarmSinceDay = day;
    if (!now) alarmSinceDay = null;
    alarm = now;
  }
  return { sPlus, sMinus, alarm, alarmSinceDay };
}

/** Theil–Sen: slope = median over i<j of (y_j − y_i)/(x_j − x_i); intercept = median(y − slope·x). */
export function theilSen(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const slopes: number[] = [];
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[j].x - points[i].x;
      if (dx !== 0) slopes.push((points[j].y - points[i].y) / dx);
    }
  if (slopes.length === 0) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const slope = median(slopes);
  return { slope, intercept: median(points.map((p) => p.y - slope * p.x)) };
}

export interface Forecast {
  slope: number; // units per day
  fittedToday: number;
  limit: number;
  daysToLimit: number; // Infinity when moving away from the limit
}

/** Detector 3: project the Theil–Sen line to the Act limit in the drift direction. */
export function forecastToLimit(points: { x: number; y: number }[], day: number, limit: number, direction: "up" | "down"): Forecast {
  const { slope, intercept } = theilSen(points);
  const fittedToday = intercept + slope * day;
  const towards = direction === "up" ? slope > 0 && limit > fittedToday : slope < 0 && limit < fittedToday;
  const daysToLimit = towards ? (limit - fittedToday) / slope : direction === "up" ? (fittedToday >= limit ? 0 : Infinity) : fittedToday <= limit ? 0 : Infinity;
  return { slope, fittedToday, limit, daysToLimit };
}

export interface DriftFinding {
  key: CoreKey;
  cusum: CusumResult;
  forecast?: Forecast;
}

export interface DetectorRun {
  base: CoreBaseline;
  unusual: UnusualResult | null;
  drift: DriftFinding[]; // keys whose CUSUM is in alarm today
}

/** Run all three detectors for mission day `day`. Before day 11 the baseline is still learning: no detector output. */
export function runDetectors(history: Record<string, Reading[]>, day: number): DetectorRun | null {
  if (day < 1 || !Object.values(history).some((l) => l.some((r) => r.day <= 0))) return null;
  const base = learnCoreBaseline(history);
  const unusual = unusualDay(base, coreRow(history, day));
  const drift: DriftFinding[] = [];
  CORE_KEYS.forEach((key, i) => {
    const zs: { day: number; z: number }[] = [];
    const pts: { x: number; y: number }[] = [];
    for (let d = 1; d <= day; d++) {
      const v = valueOn(history, key, d);
      zs.push({ day: d, z: (v - base.mean[i]) / (base.sd[i] * TUNING.zScale) });
      if (Number.isFinite(v) && d > day - 14) pts.push({ x: d, y: v });
    }
    const [indId, mKey] = key.split(".");
    const metric = indicatorById(indId).metrics.find((m) => m.key === mKey)!;
    const res = cusum(zs, TUNING.k, TUNING.h, badDirection(metric));
    if (!res.alarm) return;
    // CUSUM remembers: after a short spike (a fever that has already passed) it stays above its limit for weeks.
    // Only report drift while the latest readings still lean that way, so a finished episode is not called a drift.
    const recent = zs.filter((p) => Number.isFinite(p.z)).slice(-3).map((p) => p.z);
    const lean = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    if (res.alarm === "up" ? lean <= TUNING.k : lean >= -TUNING.k) return;
    const limit = res.alarm === "up" ? (metric.red.high ?? metric.amber.high) : (metric.red.low ?? metric.amber.low);
    const forecast = limit !== undefined && pts.length >= 4 ? forecastToLimit(pts, day, limit, res.alarm) : undefined;
    drift.push({ key, cusum: res, forecast });
  });
  return { base, unusual, drift };
}
