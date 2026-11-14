/**
 * Value formatting: applies the user's unit preference (°C/°F, mg/dL/mmol/L) and decimals.
 * Thresholds stay in the canonical JSON units; only the display converts.
 */
import type { Indicator } from "../data";
import type { Settings } from "../store/mission";

export interface Display {
  text: string; // e.g. "138/88"
  unit: string; // e.g. "mmHg"
}

function convert(ind: Indicator, v: number, settings: Settings): { v: number; unit: string; decimals: number } {
  const m = ind.metrics[0];
  const wantsAlt =
    ind.altUnit &&
    ((ind.altUnit.unit === "°F" && settings.tempUnit === "°F") ||
      (ind.altUnit.unit === "mmol/L" && settings.glucoseUnit === "mmol/L") ||
      (ind.altUnit.unit === "lb" && settings.weightUnit === "lb"));
  if (wantsAlt && ind.altUnit) {
    return { v: v * ind.altUnit.factor + ind.altUnit.offset, unit: ind.altUnit.unit, decimals: ind.altUnit.decimals };
  }
  return { v, unit: m.unit, decimals: m.decimals };
}

/** Headline value of an indicator: BP shows "sys/dia", others show the primary metric. */
export function formatPrimary(ind: Indicator, values: number[] | undefined, settings: Settings): Display {
  if (!values) return { text: "No reading", unit: "" };
  if (ind.id === "bp") return { text: `${values[0].toFixed(0)}/${values[1].toFixed(0)}`, unit: "mmHg" };
  const c = convert(ind, values[0], settings);
  return { text: c.v.toFixed(c.decimals), unit: c.unit };
}

export function formatMetric(ind: Indicator, index: number, v: number, settings: Settings): Display {
  if (index === 0 && ind.id !== "bp") return formatPrimary(ind, [v], settings);
  const m = ind.metrics[index];
  return { text: v.toFixed(m.decimals), unit: m.unit };
}

/** Value in display units for charts (primary metric). */
export function displayValue(ind: Indicator, v: number, settings: Settings): number {
  return convert(ind, v, settings).v;
}

export const statusLabel = { nominal: "Nominal", watch: "Watch", act: "Act", stale: "Stale" } as const;

export function ago(currentDay: number, readingDay: number | undefined): string {
  if (readingDay === undefined) return "never measured";
  const d = currentDay - readingDay;
  if (d <= 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}
