/**
 * App state (zustand), persisted to IndexedDB through Dexie.
 * Holds settings, crew story + mission day, the Earth-link state (mission, Mars delay, conjunction),
 * readings the user took, recovery checklists, symptoms and the Consult Packet outbox.
 * Derived health data (detectors, alerts, decisions) is computed in `useHealth()` (store/health.ts).
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { EnvironmentId } from "../data";
import { profileById } from "../engine/profiles";
import type { Reading } from "../engine/simulation";
import { dexieStorage } from "./db";

export interface ConsultPacket {
  id: string;
  createdAt: number; // ms epoch
  sentAt: number | null; // null = queued, no contact (conjunction)
  oneWayMin: number;
  tReplyMin: number;
  speed: number; // demo time multiplier
  day: number;
  crew: string;
  title: string;
  included: string[];
  payload: unknown;
}

export interface Settings {
  glucoseUnit: "mg/dL" | "mmol/L";
  tempUnit: "°C" | "°F";
  weightUnit: "kg" | "lb";
  lowPower: boolean;
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

interface MissionState {
  hydrated: boolean;
  onboarded: boolean;
  profileId: string;
  environment: EnvironmentId;
  marsOneWayMin: number;
  conjunction: boolean;
  day: number;
  settings: Settings;
  userReadings: Reading[];
  symptoms: Record<number, string[]>; // day -> symptoms
  completions: Record<string, number>;
  checks: Record<string, boolean>; // `${profile}:${day}:${alertId}:${i}`
  outbox: ConsultPacket[];
  demoSpeed: number;
  presenterOpen: boolean;

  setDay: (d: number) => void;
  setProfile: (id: string) => void;
  setEnvironment: (id: EnvironmentId) => void;
  setMarsDelay: (min: number) => void;
  setConjunction: (on: boolean) => void;
  updateSettings: (s: Partial<Settings>) => void;
  completeOnboarding: () => void;
  replayOnboarding: () => void;
  addReadings: (rs: Reading[]) => void;
  setSymptoms: (day: number, list: string[]) => void;
  toggleCheck: (key: string) => void;
  sendPacket: (p: Omit<ConsultPacket, "id" | "createdAt" | "sentAt">, noContact: boolean) => void;
  releaseQueue: (oneWayMin: number, tReplyMin: number) => void;
  clearOutbox: () => void;
  setDemoSpeed: (x: number) => void;
  togglePresenter: (open?: boolean) => void;
  replayScenario: () => void;
  resetDemo: () => void;
}

const defaultSettings: Settings = {
  glucoseUnit: "mg/dL",
  tempUnit: "°C",
  weightUnit: "kg",
  lowPower: false,
  largeText: false,
  highContrast: false,
  reducedMotion: false,
};

const DEFAULT_PROFILE = "okafor";

const initial = {
  onboarded: false,
  profileId: DEFAULT_PROFILE,
  environment: "spacecraft" as EnvironmentId,
  marsOneWayMin: 22,
  conjunction: false,
  day: profileById(DEFAULT_PROFILE).days.focus - 1,
  settings: defaultSettings,
  userReadings: [] as Reading[],
  symptoms: {} as Record<number, string[]>,
  completions: {} as Record<string, number>,
  checks: {} as Record<string, boolean>,
  outbox: [] as ConsultPacket[],
  demoSpeed: 60,
};

const clearPerDay = { userReadings: [] as Reading[], symptoms: {}, checks: {} };

export const useMission = create<MissionState>()(
  persist(
    (set) => ({
      ...initial,
      hydrated: false,
      presenterOpen: false,

      setDay: (d) =>
        set((st) => {
          const r = profileById(st.profileId).days;
          return { day: Math.min(r.max, Math.max(r.min, Math.round(d))) };
        }),
      setProfile: (id) => {
        const p = profileById(id);
        set({ profileId: p.id, day: p.story === "fever" ? p.days.focus - 1 : p.days.focus, ...clearPerDay });
      },
      setEnvironment: (id) => set({ environment: id }),
      setMarsDelay: (min) => set({ marsOneWayMin: min }),
      setConjunction: (on) => set({ conjunction: on }),
      updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
      completeOnboarding: () => set({ onboarded: true }),
      replayOnboarding: () => set({ onboarded: false }),
      addReadings: (rs) =>
        set((st) => {
          const keep = st.userReadings.filter((u) => !rs.some((r) => r.indicatorId === u.indicatorId && r.day === u.day));
          const completions = { ...st.completions };
          rs.forEach((r) => (completions[r.indicatorId] = (completions[r.indicatorId] ?? 0) + 1));
          return { userReadings: [...keep, ...rs], completions };
        }),
      setSymptoms: (day, list) => set((st) => ({ symptoms: { ...st.symptoms, [day]: list } })),
      toggleCheck: (key) => set((st) => ({ checks: { ...st.checks, [key]: !st.checks[key] } })),
      sendPacket: (p, noContact) =>
        set((st) => {
          const now = Date.now();
          const id = `CP-${now.toString(36).toUpperCase()}`;
          return { outbox: [{ ...p, id, createdAt: now, sentAt: noContact ? null : now }, ...st.outbox] };
        }),
      releaseQueue: (oneWayMin, tReplyMin) =>
        set((st) => ({
          outbox: st.outbox.map((o) => (o.sentAt === null ? { ...o, sentAt: Date.now(), oneWayMin, tReplyMin } : o)),
        })),
      clearOutbox: () => set({ outbox: [] }),
      setDemoSpeed: (x) => set({ demoSpeed: x }),
      togglePresenter: (open) => set((st) => ({ presenterOpen: open ?? !st.presenterOpen })),
      replayScenario: () =>
        set((st) => {
          const p = profileById(st.profileId);
          return { day: p.story === "day120" ? 112 : Math.max(p.days.min, p.days.focus - 4), ...clearPerDay };
        }),
      resetDemo: () => set({ ...initial, onboarded: true }),
    }),
    {
      name: "ahm-state-v2",
      storage: createJSONStorage(() => dexieStorage),
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hydrated, presenterOpen, ...rest } = s;
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function"));
      },
      onRehydrateStorage: () => () => useMission.setState({ hydrated: true }),
    },
  ),
);

export type PacketStatus = "queued" | "transit" | "delivered" | "reply-due";

/** Packet state from wall-clock time; demo speed compresses the delay. */
export function packetStatus(p: ConsultPacket, now: number): { status: PacketStatus; replyInMs: number } {
  if (p.sentAt === null) return { status: "queued", replyInMs: Infinity };
  const elapsedSim = (now - p.sentAt) * p.speed;
  const replyInMs = Math.max(0, p.tReplyMin * 60_000 - elapsedSim) / p.speed;
  if (elapsedSim < p.oneWayMin * 60_000) return { status: "transit", replyInMs };
  if (elapsedSim < p.tReplyMin * 60_000) return { status: "delivered", replyInMs };
  return { status: "reply-due", replyInMs: 0 };
}
