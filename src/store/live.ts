/**
 * The always-on live monitor (real crew only). While the app is open it samples every crew member who has a paired
 * wearable, checks each sample, and raises an alarm for everyone at this panel when a reading stays dangerous:
 * a red banner on every screen, a sound, a system notification if allowed, and an emergency report to Earth.
 * It works fully offline. Not persisted: it simply restarts when the app opens.
 */
import { useEffect } from "react";
import { create } from "zustand";
import { earthReadings } from "../engine/crew";
import { alarmText, LIVE_CONFIRM, LIVE_INTERVAL_S, LIVE_KEYS, liveSample, liveStatus, type LiveEvent, type LiveKey } from "../engine/live";
import type { Status } from "../engine/alerts";
import { useCrew } from "./crew";
import { useLink } from "./health";

export interface LiveValue {
  value: number;
  status: Status;
  streak: number; // samples in a row in the Act band
}
export interface LiveAlarm {
  id: string;
  memberId: string;
  name: string;
  key: LiveKey;
  value: number;
  at: number;
  text: string;
  acknowledgedBy: string | null;
}

interface LiveState {
  tick: number;
  lastAt: number | null;
  values: Record<string, Partial<Record<LiveKey, LiveValue>>>;
  alarms: LiveAlarm[];
  events: Record<string, { kind: LiveEvent; sinceTick: number } | null>;
  startEvent: (memberId: string, kind: LiveEvent) => void;
  clearEvent: (memberId: string) => void;
  acknowledge: (id: string, by: string) => void;
}

export const useLive = create<LiveState>((set) => ({
  tick: 0,
  lastAt: null,
  values: {},
  alarms: [],
  events: {},
  startEvent: (memberId, kind) => set((s) => ({ events: { ...s.events, [memberId]: { kind, sinceTick: s.tick } } })),
  clearEvent: (memberId) => set((s) => ({ events: { ...s.events, [memberId]: null } })),
  acknowledge: (id, by) => set((s) => ({ alarms: s.alarms.map((a) => (a.id === id ? { ...a, acknowledgedBy: by } : a)) })),
}));

/** A short two-tone alarm made in the browser (no sound files, works offline). */
function beep() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = i % 2 ? 660 : 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.28);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
    window.setTimeout(() => void ctx.close(), 1500);
  } catch {
    /* sound is a bonus; the banner is the alarm */
  }
}

function notify(text: string) {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") new Notification("Crew health alarm", { body: text });
  } catch {
    /* not available here */
  }
}

/** Runs the monitor while mounted (mounted once, in the app shell). */
export function useLiveMonitor() {
  const mode = useCrew((s) => s.mode);
  const noContact = useLink().reply.noContact;
  useEffect(() => {
    if (mode !== "mission") return;
    const step = () => {
      const crew = useCrew.getState();
      const live = useLive.getState();
      const tick = live.tick + 1;
      const values = { ...live.values };
      const newAlarms: LiveAlarm[] = [];
      for (const m of crew.members) {
        if (!m.deviceTestedAt) continue; // no paired wearable, nothing streams
        const sample = liveSample(m.id, earthReadings(m.earth, crew.launchDate), tick, live.events[m.id] ?? null);
        const prev = values[m.id] ?? {};
        const next: Partial<Record<LiveKey, LiveValue>> = {};
        for (const key of LIVE_KEYS) {
          const status = liveStatus(key, sample[key]);
          const streak = status === "act" ? (prev[key]?.streak ?? 0) + 1 : 0;
          next[key] = { value: sample[key], status, streak };
          const open = live.alarms.some((a) => a.memberId === m.id && a.key === key && !a.acknowledgedBy);
          if (streak === LIVE_CONFIRM && !open) {
            const text = alarmText(m.name, key, sample[key]);
            newAlarms.push({ id: `${m.id}:${key}:${tick}`, memberId: m.id, name: m.name, key, value: sample[key], at: Date.now(), text, acknowledgedBy: null });
          }
        }
        values[m.id] = next;
      }
      useLive.setState({ tick, lastAt: Date.now(), values, alarms: [...newAlarms, ...live.alarms].slice(0, 50) });
      for (const a of newAlarms) {
        beep();
        notify(a.text);
        crew.logReport({ at: a.at, kind: "emergency", queued: noContact, summary: `Live alarm: ${a.text}` });
      }
    };
    step();
    const id = window.setInterval(step, LIVE_INTERVAL_S * 1000);
    return () => window.clearInterval(id);
  }, [mode, noContact]);
}
