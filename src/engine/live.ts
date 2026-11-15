/**
 * Live monitoring: the paired wearable streams heart rate, blood oxygen and temperature all the time, on board, with
 * no network. Every sample is checked against the same safety bands the daily check-in uses (indicators.json).
 * An alarm fires only when a reading stays in the Act band for LIVE_CONFIRM samples in a row, so one bad sample or a
 * short burst of exercise does not wake the whole crew.
 *
 * Prototype: the stream is SIMULATED around each person's own Earth normal. A test event can push one person's
 * readings into danger to show the alarm.
 */
import { indicatorById } from "../data";
import { thresholdStatus, type Status } from "./alerts";
import { groupByIndicator } from "./crew";
import { learnMetricBaselines } from "./detectors";
import { gaussian } from "./rng";
import type { Reading } from "./simulation";

export const LIVE_KEYS = ["hr.hr", "spo2.spo2", "temp.temp"] as const;
export type LiveKey = (typeof LIVE_KEYS)[number];
export const LIVE_LABEL: Record<LiveKey, string> = { "hr.hr": "Heart rate", "spo2.spo2": "Blood oxygen", "temp.temp": "Temperature" };
export const LIVE_UNIT: Record<LiveKey, string> = { "hr.hr": "bpm", "spo2.spo2": "%", "temp.temp": "°C" };
/** Samples in a row in the Act band before the alarm sounds. */
export const LIVE_CONFIRM = 3;
/** Seconds between samples in this prototype (a real wearable streams faster; the check is the same). */
export const LIVE_INTERVAL_S = 3;

export type LiveEvent = "low-oxygen" | "fever" | "fast-heart";
/** How far a test event moves each reading, reached gradually over a few samples. */
const EVENT_SHIFT: Record<LiveEvent, Partial<Record<LiveKey, number>>> = {
  "low-oxygen": { "spo2.spo2": -9, "hr.hr": 22 },
  fever: { "temp.temp": 2.0, "hr.hr": 38 },
  "fast-heart": { "hr.hr": 60 },
};

const metricOf = (key: LiveKey) => {
  const [id, mk] = key.split(".");
  return indicatorById(id).metrics.find((m) => m.key === mk)!;
};

/** One simulated sample for one person: their Earth normal, small noise, plus any test event (ramping in). */
export function liveSample(
  memberId: string,
  earth: Reading[],
  tick: number,
  event: { kind: LiveEvent; sinceTick: number } | null,
): Record<LiveKey, number> {
  const base = learnMetricBaselines(groupByIndicator(earth));
  const out = {} as Record<LiveKey, number>;
  for (const key of LIVE_KEYS) {
    const m = metricOf(key);
    const b = base[key] ?? { mean: (m.normalRange.min + m.normalRange.max) / 2, sd: 1 };
    let v = b.mean + gaussian(`live:${memberId}:${key}:${tick}`) * Math.min(b.sd, key === "temp.temp" ? 0.1 : 2) * 0.6;
    if (event) {
      const ramp = Math.min(1, (tick - event.sinceTick + 1) / 3);
      v += (EVENT_SHIFT[event.kind][key] ?? 0) * ramp;
    }
    if (key === "spo2.spo2") v = Math.min(100, v);
    const f = 10 ** m.decimals;
    out[key] = Math.round(v * f) / f;
  }
  return out;
}

export const liveStatus = (key: LiveKey, v: number): Status => thresholdStatus(v, metricOf(key));

/** Plain words for an alarm. */
export function alarmText(name: string, key: LiveKey, v: number): string {
  const what =
    key === "spo2.spo2"
      ? `blood oxygen is ${v} %`
      : key === "hr.hr"
        ? `heart rate is ${v} bpm at rest`
        : `temperature is ${v.toFixed(1)} °C`;
  return `${name}'s ${what}. Check on ${name} now.`;
}
