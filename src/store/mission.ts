/**
 * App state (zustand), persisted to IndexedDB through Dexie.
 * Holds settings, the mission day, readings the user took, recovery checklists and the Ground Link outbox.
 * Derived health data (history, evaluations, readiness) is computed in `useHealth()` (store/health.ts).
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { EnvironmentId } from "../data";
import { SCENARIO, type Reading } from "../engine/simulation";
import { dexieStorage } from "./db";

export type GroundStatus = "queued" | "transit" | "delivered";

export interface GroundItem {
  id: string;
  createdAt: number; // ms epoch
  delayMin: number;
  speed: number; // demo time multiplier
  day: number;
  title: string;
  payload: unknown; // JSON report
}

export interface Settings {
  glucoseUnit: "mg/dL" | "mmol/L";
  tempUnit: "°C" | "°F";
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
  day: number;
  settings: Settings;
  userReadings: Reading[];
  completions: Record<string, number>;
  acknowledged: Record<string, number>; // indicatorId -> day acknowledged ("I'm on it")
  checks: Record<string, boolean>; // `${day}:${indicatorId}:${actionIndex}`
  remeasureAt: Record<string, number>; // indicatorId -> ms epoch
  outbox: GroundItem[];
  commDelayMin: number;
  demoSpeed: number;
  presenterOpen: boolean;

  setDay: (d: number) => void;
  setProfile: (id: string) => void;
  setEnvironment: (id: EnvironmentId) => void;
  updateSettings: (s: Partial<Settings>) => void;
  completeOnboarding: () => void;
  replayOnboarding: () => void;
  addReading: (r: Reading) => void;
  acknowledge: (indicatorId: string) => void;
  toggleCheck: (key: string) => void;
  startRemeasureTimer: (indicatorId: string, hours: number) => void;
  sendReport: (item: Omit<GroundItem, "id" | "createdAt">) => void;
  clearDelivered: () => void;
  setCommDelay: (min: number) => void;
  setDemoSpeed: (x: number) => void;
  togglePresenter: (open?: boolean) => void;
  replayScenario: () => void;
  resetDemo: () => void;
}

const defaultSettings: Settings = {
  glucoseUnit: "mg/dL",
  tempUnit: "°C",
  lowPower: false,
  largeText: false,
  highContrast: false,
  reducedMotion: false,
};

const initial = {
  onboarded: false,
  profileId: "vega",
  environment: "spacecraft" as EnvironmentId,
  day: SCENARIO.focusDay,
  settings: defaultSettings,
  userReadings: [] as Reading[],
  completions: {} as Record<string, number>,
  acknowledged: {} as Record<string, number>,
  checks: {} as Record<string, boolean>,
  remeasureAt: {} as Record<string, number>,
  outbox: [] as GroundItem[],
  commDelayMin: 12,
  demoSpeed: 30,
};

export const useMission = create<MissionState>()(
  persist(
    (set) => ({
      ...initial,
      hydrated: false,
      presenterOpen: false,

      setDay: (d) => set({ day: Math.min(SCENARIO.maxDay, Math.max(SCENARIO.minDay, Math.round(d))) }),
      setProfile: (id) => set({ profileId: id, userReadings: [], checks: {}, acknowledged: {}, remeasureAt: {} }),
      setEnvironment: (id) => set({ environment: id }),
      updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
      completeOnboarding: () => set({ onboarded: true }),
      replayOnboarding: () => set({ onboarded: false }),
      addReading: (r) =>
        set((st) => ({
          userReadings: [...st.userReadings.filter((u) => !(u.indicatorId === r.indicatorId && u.day === r.day)), r],
          completions: { ...st.completions, [r.indicatorId]: (st.completions[r.indicatorId] ?? 0) + 1 },
        })),
      acknowledge: (id) => set((st) => ({ acknowledged: { ...st.acknowledged, [id]: st.day } })),
      toggleCheck: (key) => set((st) => ({ checks: { ...st.checks, [key]: !st.checks[key] } })),
      startRemeasureTimer: (id, hours) =>
        set((st) => ({ remeasureAt: { ...st.remeasureAt, [id]: Date.now() + hours * 3600_000 } })),
      sendReport: (item) =>
        set((st) => ({
          outbox: [{ ...item, id: `GL-${Date.now().toString(36).toUpperCase()}`, createdAt: Date.now() }, ...st.outbox],
        })),
      clearDelivered: () =>
        set((st) => ({ outbox: st.outbox.filter((o) => groundStatus(o, Date.now()) !== "delivered") })),
      setCommDelay: (min) => set({ commDelayMin: min }),
      setDemoSpeed: (x) => set({ demoSpeed: x }),
      togglePresenter: (open) => set((st) => ({ presenterOpen: open ?? !st.presenterOpen })),
      replayScenario: () =>
        set({ day: SCENARIO.startDay - 1, userReadings: [], checks: {}, acknowledged: {}, remeasureAt: {} }),
      resetDemo: () => set({ ...initial, onboarded: true }),
    }),
    {
      name: "ahm-state-v1",
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

/** Ground Link delivery state from wall-clock time (demo speed compresses the delay). */
export function groundStatus(item: GroundItem, now: number): GroundStatus {
  const elapsed = now - item.createdAt;
  if (elapsed < 2500) return "queued";
  return elapsed >= deliveryMs(item) ? "delivered" : "transit";
}
export const deliveryMs = (item: GroundItem) => 2500 + (item.delayMin * 60_000) / Math.max(1, item.speed);
