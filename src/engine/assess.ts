/**
 * assessDay(): the whole decision pipeline for one mission day.
 *   rules (indicator limits + condition cards) + personal baseline + three detectors → per-indicator status
 *   → alerts, each with T_harm (card, forecast or assumption) → "can this wait for Earth?" verdict.
 * Every alert carries a plain-English reason, which detector fired, and a confidence.
 */
import { DETECTOR_CARDS, INDICATORS, indicatorById, type ConditionCard, type HazardId, type RegionId } from "../data";
import { evaluate, worst, statusRank, type Confidence, type DetectorName, type Evaluation, type Status } from "./alerts";
import { cardMetrics, firedCards, type Values } from "./conditions";
import { CORE_KEYS, CORE_LABEL, learnMetricBaselines, runDetectors, type DetectorRun } from "./detectors";
import { decide, type Verdict } from "./missions";
import type { Reading } from "./simulation";

export type AlertKind = "rule" | "unusual" | "drift";

export interface Alert {
  id: string;
  kind: AlertKind;
  title: string;
  status: Exclude<Status, "nominal" | "stale">;
  reason: string;
  detector: DetectorName;
  confidence: Confidence;
  tHarmMin: number;
  tHarmSource: "condition card" | "forecast" | "indicator rule";
  assumption: boolean;
  indicatorIds: string[];
  regions: RegionId[];
  hazards: HazardId[];
  steps: string[];
  escalation: string;
  redFlags: string[];
  card?: ConditionCard;
}

export interface DayAssessment {
  evals: Record<string, Evaluation>;
  alerts: Alert[];
  run: DetectorRun | null;
  values: Values;
}

const CORE_SET: ReadonlySet<string> = new Set(CORE_KEYS);
const indOfKey = (key: string) => key.split(".")[0];

export function todaysValues(history: Record<string, Reading[]>, day: number): Values {
  const v: Values = {};
  for (const ind of INDICATORS) {
    const r = history[ind.id]?.find((x) => x.day === day);
    if (r) ind.metrics.forEach((m, i) => (v[`${ind.id}.${m.key}`] = r.values[i]));
  }
  return v;
}

const sd = (n: number) => `${n > 0 ? "+" : "−"}${Math.abs(n).toFixed(1)} sd`;

export function assessDay(history: Record<string, Reading[]>, day: number): DayAssessment {
  const baselines = learnMetricBaselines(history);
  const run = runDetectors(history, day);
  const values = todaysValues(history, day);

  // 1) Rules + personal baseline (non-core metrics also get the single-metric z-score/trend rules).
  const evals: Record<string, Evaluation> = {};
  for (const ind of INDICATORS) evals[ind.id] = evaluate(ind, history[ind.id] ?? [], baselines, day, CORE_SET);

  // 2) Overlay detector findings on the indicators they concern.
  const bump = (indId: string, status: Status, detector: DetectorName, reason: string, confidence: Confidence) => {
    const e = evals[indId];
    if (!e || e.status === "stale") return;
    if (statusRank(status) > statusRank(e.status)) evals[indId] = { ...e, status, detector, reason, confidence, rule: "baseline" };
  };
  if (run?.unusual?.flagged) {
    for (const c of run.unusual.contributions.filter((c) => Math.abs(c.z) >= 1.5).slice(0, 3)) {
      bump(indOfKey(c.key), "watch", "Unusual day", `Part of an unusual day: your ${CORE_LABEL[c.key]} is ${sd(c.z)} from your normal.`, "medium");
    }
  }
  for (const d of run?.drift ?? []) {
    const f = d.forecast;
    const tail = f && Number.isFinite(f.daysToLimit) ? ` At this pace it reaches ${f.limit} in about ${Math.round(f.daysToLimit)} days.` : "";
    bump(indOfKey(d.key), "watch", "Slow drift", `Your ${CORE_LABEL[d.key]} has been drifting ${d.cusum.alarm} since day ${d.cusum.alarmSinceDay}.${tail}`, "medium");
  }

  // 3) Alerts with T_harm.
  const alerts: Alert[] = [];
  const cards = firedCards(values);
  const covered = new Set<string>();
  for (const card of cards) {
    const inds = [...new Set(cardMetrics(card).map(indOfKey))];
    inds.forEach((i) => covered.add(i));
    alerts.push({
      id: `card:${card.id}`,
      kind: "rule",
      title: card.name,
      status: card.severity,
      reason: `${card.plain} (Rule: ${describeWhen(card)}.)`,
      detector: "Rules",
      confidence: "high",
      tHarmMin: card.tHarmMin,
      tHarmSource: "condition card",
      assumption: card.assumption,
      indicatorIds: inds,
      regions: card.bodyRegions,
      hazards: card.hazards,
      steps: card.steps,
      escalation: card.escalation,
      redFlags: card.redFlags,
      card,
    });
  }
  // Indicator-limit alerts not already explained by a card.
  for (const ind of INDICATORS) {
    const e = evals[ind.id];
    if (covered.has(ind.id) || e.detector !== "Rules" || (e.status !== "watch" && e.status !== "act")) continue;
    alerts.push({
      id: `ind:${ind.id}`,
      kind: "rule",
      title: `${ind.shortName}: ${e.status === "act" ? "outside the safe range" : "outside your normal range"}`,
      status: e.status,
      reason: e.reason,
      detector: "Rules",
      confidence: e.confidence,
      tHarmMin: Math.max(60, ind.escalationRule.afterHours * 60),
      tHarmSource: "indicator rule",
      assumption: true,
      indicatorIds: [ind.id],
      regions: ind.bodyRegions,
      hazards: ind.hazards,
      steps: ind.recoveryActions.map((a) => a.text),
      escalation: ind.escalationRule.onboard,
      redFlags: ind.escalationRule.redFlags,
    });
  }
  if (run?.unusual?.flagged) {
    const top = run.unusual.contributions.slice(0, 3);
    const u = DETECTOR_CARDS.unusual;
    const inds = [...new Set(top.map((c) => indOfKey(c.key)))];
    alerts.push({
      id: "unusual",
      kind: "unusual",
      title: u.name,
      status: "watch",
      reason: `${u.plain} Biggest differences today: ${top.map((c) => `${CORE_LABEL[c.key]} ${sd(c.z)}`).join(", ")}. (Distance score ${run.unusual.d2.toFixed(1)} vs limit ${run.unusual.limit.toFixed(1)}.)`,
      detector: "Unusual day",
      confidence: run.unusual.d2 > run.unusual.limit * 1.5 ? "medium" : "low",
      tHarmMin: u.tHarmMin ?? 720,
      tHarmSource: "indicator rule",
      assumption: true,
      indicatorIds: inds,
      regions: [...new Set(inds.flatMap((i) => indicatorById(i).bodyRegions))],
      hazards: [...new Set(inds.flatMap((i) => indicatorById(i).hazards))],
      steps: u.steps,
      escalation: u.escalation,
      redFlags: [],
    });
  }
  for (const d of run?.drift ?? []) {
    const ind = indicatorById(indOfKey(d.key));
    const f = d.forecast;
    const days = f && Number.isFinite(f.daysToLimit) ? f.daysToLimit : 14;
    const dc = DETECTOR_CARDS.drift;
    alerts.push({
      id: `drift:${d.key}`,
      kind: "drift",
      title: `${dc.name}: ${CORE_LABEL[d.key]}`,
      status: "watch",
      reason: `${dc.plain} Your ${CORE_LABEL[d.key]} has drifted ${d.cusum.alarm} since day ${d.cusum.alarmSinceDay}${
        f ? ` at about ${Math.abs(f.slope).toFixed(1)} ${ind.metrics[0].unit} per day; the forecast reaches the limit (${f.limit}) in about ${Math.round(days)} days` : ""
      }.`,
      detector: "Slow drift",
      confidence: f && f.slope !== 0 ? "medium" : "low",
      tHarmMin: Math.max(60, days * 1440),
      tHarmSource: f ? "forecast" : "indicator rule",
      assumption: !f,
      indicatorIds: [ind.id],
      regions: ind.bodyRegions,
      hazards: ind.hazards,
      steps: [...dc.steps, ...ind.recoveryActions.slice(0, 2).map((a) => a.text)],
      escalation: dc.escalation,
      redFlags: ind.escalationRule.redFlags,
    });
  }
  alerts.sort((a, b) => statusRank(b.status) - statusRank(a.status) || a.tHarmMin - b.tHarmMin);
  return { evals, alerts, run, values };
}

function describeWhen(card: ConditionCard): string {
  const parts = ("all" in card.when ? card.when.all : card.when.any).map((c) => {
    const [i, m] = c.metric.split(".");
    const metric = indicatorById(i).metrics.find((x) => x.key === m)!;
    return `${metric.label.toLowerCase()} ${c.op} ${c.value} ${metric.unit}`;
  });
  return parts.join("all" in card.when ? " and " : " or ");
}

export const verdictFor = (a: Alert, tReplyMin: number): Verdict => decide(a.tHarmMin, tReplyMin);
export const worstStatus = (evals: Record<string, Evaluation>) => Object.values(evals).reduce<Status>((s, e) => worst(s, e.status), "stale");
