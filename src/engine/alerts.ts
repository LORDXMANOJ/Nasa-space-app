/**
 * Alert engine: turns an indicator's readings into a status the astronaut can act on.
 * status = worst of (1) clinical/NASA threshold check, (2) personal-baseline z-score, (3) 3-day trend slope.
 * Returns { status, reason, rule, confidence } — `reason` is plain English and shown verbatim in "Why this status?".
 * Pure functions, no React: unit-tested in alerts.test.ts.
 */
import type { Band, Indicator, Metric } from "../data/schema";
import type { MetricBaseline } from "./profiles";
import type { Reading } from "./simulation";

export type Status = "nominal" | "watch" | "act" | "stale";
export type Rule = "threshold" | "baseline" | "trend" | "none" | "stale";
export type Confidence = "high" | "medium" | "low";

export type DetectorName = "Rules" | "Personal baseline" | "Trend" | "Unusual day" | "Slow drift" | "None";

export interface Evaluation {
  status: Status;
  detector?: DetectorName;
  reason: string;
  rule: Rule;
  confidence: Confidence;
  metricKey?: string;
  z?: number;
  slope?: number;
  latest?: Reading;
}

const RANK: Record<Status, number> = { stale: 0, nominal: 1, watch: 2, act: 3 };
export const worst = (a: Status, b: Status): Status => (RANK[b] > RANK[a] ? b : a);
export const statusRank = (s: Status) => RANK[s];

export const Z_LIMIT = 2;
export const TREND_SD_PER_DAY = 0.5;

/** Which direction is "bad" for a metric, read from its threshold bands. */
export function badDirection(m: Metric): "high" | "low" | "both" {
  const hasHigh = m.amber.high !== undefined || m.red.high !== undefined;
  const hasLow = m.amber.low !== undefined || m.red.low !== undefined;
  if (hasHigh && hasLow) return "both";
  return hasHigh ? "high" : "low";
}

/** high is inclusive (value >= high), low is exclusive (value < low). */
export const breaches = (v: number, b: Band) =>
  (b.high !== undefined && v >= b.high) || (b.low !== undefined && v < b.low);

export function thresholdStatus(v: number, m: Metric): Status {
  if (breaches(v, m.red)) return "act";
  if (breaches(v, m.amber)) return "watch";
  return "nominal";
}

/** Least-squares slope (units per day) over the given points. */
export function slope(points: { day: number; value: number }[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const mx = points.reduce((s, p) => s + p.day, 0) / n;
  const my = points.reduce((s, p) => s + p.value, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.day - mx) * (p.value - my);
    den += (p.day - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

const fmt = (v: number, m: Metric) => `${v.toFixed(m.decimals)} ${m.unit}`.replace(" /10", "/10").replace(" %", "%");

interface MetricResult {
  status: Status;
  rule: Rule;
  reason: string;
  priority: number; // tie-break: threshold > baseline > trend
  z?: number;
  slope?: number;
}

function evaluateMetric(
  m: Metric,
  idx: number,
  readings: Reading[],
  baseline: MetricBaseline | undefined,
  skipStats = false,
): MetricResult {
  const latest = readings[readings.length - 1];
  const v = latest.values[idx];
  const results: MetricResult[] = [];
  const dir = badDirection(m);

  const th = thresholdStatus(v, m);
  if (th !== "nominal") {
    const side = (m.red.high !== undefined && v >= m.red.high) || (m.amber.high !== undefined && v >= m.amber.high);
    const limit = th === "act" ? (side ? m.red.high : m.red.low) : side ? m.amber.high : m.amber.low;
    results.push({
      status: th,
      rule: "threshold",
      priority: 3,
      reason: `${m.label} ${fmt(v, m)} is ${side ? "at or above" : "below"} the ${th === "act" ? "Act" : "Watch"} limit of ${fmt(limit!, m)}.`,
    });
  }

  if (baseline && baseline.sd > 0 && !m.cumulative && !skipStats) {
    const z = (v - baseline.mean) / baseline.sd;
    const bad = dir === "both" ? Math.abs(z) : dir === "high" ? z : -z;
    if (bad >= Z_LIMIT) {
      const diff = v - baseline.mean;
      results.push({
        status: "watch",
        rule: "baseline",
        priority: 2,
        z,
        reason: `${m.label} is ${Math.abs(diff).toFixed(m.decimals || 1)} ${m.unit.replace("/10", "points")} ${diff > 0 ? "above" : "below"} your usual ${fmt(baseline.mean, m)} (z = ${z.toFixed(1)}).`,
      });
    }

    const last3 = readings.slice(-3).map((r) => ({ day: r.day, value: r.values[idx] }));
    if (last3.length === 3) {
      const s = slope(last3);
      const badSlope = dir === "high" ? s : dir === "low" ? -s : Math.abs(s) * Math.sign(z || 1) * Math.sign(s || 1);
      const beyond = dir === "high" ? z >= 1 : dir === "low" ? z <= -1 : Math.abs(z) >= 1;
      if (badSlope >= TREND_SD_PER_DAY * baseline.sd && beyond) {
        results.push({
          status: "watch",
          rule: "trend",
          priority: 1,
          slope: s,
          reason: `${m.label} has been ${s > 0 ? "rising" : "falling"} for 3 readings (${s > 0 ? "+" : ""}${s.toFixed(m.decimals || 1)} ${m.unit.replace("/10", "points")} per day).`,
        });
      }
    }
  }

  if (results.length === 0) {
    return { status: "nominal", rule: "none", priority: 0, reason: `${m.label} ${fmt(v, m)} is within your normal range.` };
  }
  results.sort((a, b) => RANK[b.status] - RANK[a.status] || b.priority - a.priority);
  return results[0];
}

/** Days after which a reading no longer counts as current: cadence + one day of grace. */
export const staleAfterDays = (ind: Indicator) => Math.max(1, Math.round(ind.cadenceHours / 24)) + 1;

export function evaluate(
  ind: Indicator,
  readings: Reading[],
  baselines: Record<string, MetricBaseline>,
  currentDay: number,
  /** Metric keys ("ind.metric") whose baseline/trend rules are handled by the multivariate detectors instead. */
  skipStats: ReadonlySet<string> = new Set(),
): Evaluation {
  if (readings.length === 0) {
    return { status: "stale", rule: "stale", confidence: "low", reason: "No readings yet. Take a measurement to see your status." };
  }
  const latest = readings[readings.length - 1];
  const age = currentDay - latest.day;
  if (age >= staleAfterDays(ind)) {
    return {
      status: "stale",
      rule: "stale",
      confidence: "low",
      latest,
      reason: `Last measured ${age} days ago, so this status may be out of date. Measure to update.`,
    };
  }

  let best: (MetricResult & { metricKey: string }) | undefined;
  ind.metrics.forEach((m, i) => {
    const key = `${ind.id}.${m.key}`;
    const r = { ...evaluateMetric(m, i, readings, baselines[key], skipStats.has(key)), metricKey: m.key };
    if (!best || RANK[r.status] > RANK[best.status] || (RANK[r.status] === RANK[best.status] && r.priority > best.priority)) {
      best = r;
    }
  });
  const b = best!;
  const n = readings.length;
  const confidence: Confidence =
    n === 1 ? "low" : b.rule === "threshold" ? (n >= 3 ? "high" : "medium") : b.rule === "none" ? (n >= 3 ? "high" : "medium") : n >= 5 ? "medium" : "low";

  const detector: DetectorName = b.rule === "threshold" ? "Rules" : b.rule === "baseline" ? "Personal baseline" : b.rule === "trend" ? "Trend" : "None";
  return { status: b.status, detector, reason: b.reason, rule: b.rule, confidence, metricKey: b.metricKey, z: b.z, slope: b.slope, latest };
}
