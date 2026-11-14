/**
 * Mission presets and the Earth reply-time model.
 * T_reply = d_out + t_review + d_back (+ relay-pass waits for a surface base); Infinity during solar conjunction.
 * All constants marked ASSUMPTION are prototype values shown as such in the UI.
 */
import type { EnvironmentId } from "../data";

/** ASSUMPTION: flight-surgeon review time, minutes. */
export const REVIEW_MIN = 20;
/** ASSUMPTION: Mars relay satellite passes every 4 h and lasts 20 min (store-and-forward). */
export const RELAY_PASS_EVERY_MIN = 240;
export const RELAY_PASS_LENGTH_MIN = 20;
/** Solar conjunction: no contact for about two weeks. */
export const CONJUNCTION_DAYS = 14;

export type MissionId = "iss" | "moon" | "mars-transit" | "mars-base";

export interface MissionPreset {
  id: MissionId;
  name: string;
  oneWayMin: number; // default one-way signal delay
  adjustable?: { min: number; max: number }; // Mars one-way delay varies with orbital geometry
  relay?: boolean;
  canConjunct?: boolean;
}

export const MISSIONS: Record<MissionId, MissionPreset> = {
  iss: { id: "iss", name: "Space station (ISS orbit)", oneWayMin: 0.5 / 60 },
  moon: { id: "moon", name: "Moon", oneWayMin: 1.3 / 60 },
  "mars-transit": { id: "mars-transit", name: "Mars transit", oneWayMin: 22, adjustable: { min: 3, max: 22 }, canConjunct: true },
  "mars-base": { id: "mars-base", name: "Mars base", oneWayMin: 22, adjustable: { min: 3, max: 22 }, relay: true, canConjunct: true },
};

/** Our environment modes map onto mission presets. */
export const ENV_TO_MISSION: Record<EnvironmentId, MissionId> = {
  station: "iss",
  rover: "moon",
  spacecraft: "mars-transit",
  base: "mars-base",
};

export interface LinkState {
  mission: MissionId;
  oneWayMin?: number; // slider override for Mars
  conjunction?: boolean;
}

export interface ReplyBreakdown {
  totalMin: number; // Infinity when no contact
  parts: { label: string; min: number; assumption?: boolean }[];
  noContact: boolean;
}

/**
 * Earth reply time in minutes.
 * Mars base (store-and-forward, worst case): wait for a relay pass, signal out, review, signal back, wait for the next pass.
 */
export function earthReply(link: LinkState): ReplyBreakdown {
  const m = MISSIONS[link.mission];
  if (link.conjunction && m.canConjunct) {
    return { totalMin: Infinity, noContact: true, parts: [{ label: "Solar conjunction: no contact", min: CONJUNCTION_DAYS * 1440 }] };
  }
  const d = m.adjustable ? clamp(link.oneWayMin ?? m.oneWayMin, m.adjustable.min, m.adjustable.max) : m.oneWayMin;
  const parts: ReplyBreakdown["parts"] = [];
  if (m.relay) parts.push({ label: "Wait for relay pass", min: RELAY_PASS_EVERY_MIN, assumption: true });
  parts.push({ label: "Signal to Earth", min: d });
  parts.push({ label: "Flight-surgeon review", min: REVIEW_MIN, assumption: true });
  parts.push({ label: "Signal back", min: d });
  if (m.relay) parts.push({ label: "Wait for next relay pass", min: RELAY_PASS_EVERY_MIN, assumption: true });
  return { totalMin: parts.reduce((s, p) => s + p.min, 0), parts, noContact: false };
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export type Verdict = "act-onboard" | "ask-earth";

/** The decision rule: if Earth's answer arrives after the harm would, act on board now. */
export function decide(tHarmMin: number, tReplyMin: number): Verdict {
  return tReplyMin > tHarmMin ? "act-onboard" : "ask-earth";
}

export function formatDuration(min: number): string {
  if (!Number.isFinite(min)) return "no contact";
  if (min < 1) return `${Math.max(1, Math.round(min * 60))} s`;
  if (min < 90) return `${Math.round(min)} min`;
  if (min < 48 * 60) return `${(min / 60).toFixed(min < 600 ? 1 : 0)} h`;
  return `${Math.round(min / 1440)} days`;
}
