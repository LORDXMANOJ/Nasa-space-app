/**
 * Crew Readiness Score (0–100) and today's brief.
 * score = 100 − Σ (weightᵢ / Σweights × 100) × penalty[statusᵢ]; weights and penalties live in indicators.json.
 * Also computes which measurements are due today and a one-sentence plain-English brief.
 */
import { INDICATORS, READINESS, type Indicator } from "../data";
import { statusRank, type Evaluation, type Status } from "./alerts";
import type { Reading } from "./simulation";

export interface ReadinessResult {
  score: number;
  breakdown: { indicator: Indicator; status: Status; loss: number }[];
}

export function readiness(evals: Record<string, Evaluation>): ReadinessResult {
  const total = INDICATORS.reduce((s, i) => s + i.weight, 0) || 1;
  const breakdown = INDICATORS.map((ind) => {
    const status = evals[ind.id]?.status ?? "stale";
    const loss = (ind.weight / total) * 100 * READINESS.penalty[status];
    return { indicator: ind, status, loss };
  }).sort((a, b) => b.loss - a.loss);
  const score = Math.round(Math.max(0, 100 - breakdown.reduce((s, b) => s + b.loss, 0)));
  return { score, breakdown };
}

/** Manual / on-demand measurements whose cadence has elapsed and that are not yet taken today. */
export function dueIndicators(history: Record<string, Reading[]>, currentDay: number): Indicator[] {
  return INDICATORS.filter((ind) => {
    if (ind.autoLogged) return false;
    const list = history[ind.id] ?? [];
    const last = list[list.length - 1];
    if (!last) return true;
    if (last.day >= currentDay) return false;
    const every = Math.max(1, Math.round(ind.cadenceHours / 24));
    return currentDay - last.day >= every;
  });
}

export function briefSentence(evals: Record<string, Evaluation>, due: Indicator[]): string {
  const parts: string[] = [];
  parts.push(
    due.length === 0
      ? "All of today's measurements are done."
      : `${due.length} measurement${due.length === 1 ? "" : "s"} due today.`,
  );
  const flagged = INDICATORS.map((i) => ({ i, e: evals[i.id] }))
    .filter((x) => x.e && (x.e.status === "act" || x.e.status === "watch"))
    .sort((a, b) => statusRank(b.e.status) - statusRank(a.e.status) || b.i.weight - a.i.weight);
  if (flagged.length === 0) {
    parts.push("Everything is Nominal. Keep your routine.");
  } else {
    const top = flagged[0];
    parts.push(`${top.i.shortName} needs ${top.e.status === "act" ? "action" : "watching"}: ${top.e.reason}`);
    if (flagged.length > 1) parts.push(`${flagged.length - 1} more indicator${flagged.length > 2 ? "s" : ""} to watch.`);
  }
  return parts.join(" ");
}
