/**
 * The real crew, set up on first launch: mission and launch date, crew members and roles, the Earth records one
 * recorder enters for everyone, wearable pairing, PINs, each member's daily readings and skips, and the
 * report-to-Earth log. Persisted to IndexedDB, separately from the demo crew (store/mission.ts).
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { EnvironmentId } from "../data";
import type { EarthRow } from "../engine/crew";
import type { Reading } from "../engine/simulation";
import { dexieStorage } from "./db";

/** "new" = first launch (onboarding), "demo" = the simulated crew, "mission" = a real crew. */
export type AppMode = "new" | "demo" | "mission";

export interface EarthInfo {
  age: string;
  sex: string;
  heightCm: string;
  bloodType: string;
  allergies: string;
  medicines: string;
  conditions: string;
  vaccinations: string;
}
export const emptyInfo = (): EarthInfo => ({
  age: "",
  sex: "",
  heightCm: "",
  bloodType: "",
  allergies: "",
  medicines: "",
  conditions: "",
  vaccinations: "",
});

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  pinHash: string | null;
  deviceId: string;
  deviceTestedAt: number | null;
  info: EarthInfo;
  /** date (YYYY-MM-DD) → one row of readings for that day on Earth */
  earth: Record<string, EarthRow>;
  /** in-flight readings this member entered (days ≥ 1) */
  readings: Reading[];
  /** mission day → indicator ids marked "didn't measure" */
  skips: Record<number, string[]>;
}

export interface ReportLog {
  id: string;
  at: number;
  kind: "routine" | "emergency";
  summary: string;
  queued: boolean; // no contact: waits for the link to return
}

/** The onboarding steps, in order. */
export const SETUP_STEPS = ["welcome", "how", "mission", "crew", "recorder", "earth", "wearables", "done"] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

interface CrewState {
  hydrated: boolean;
  mode: AppMode;
  step: SetupStep;
  setupDone: boolean;
  launchDate: string; // YYYY-MM-DD
  environment: EnvironmentId;
  members: CrewMember[];
  recorderId: string | null;
  reports: ReportLog[];
  lastReportAt: number | null;

  setMode: (m: AppMode) => void;
  goStep: (s: SetupStep) => void;
  setMission: (launchDate: string, env: EnvironmentId) => void;
  addMember: (name?: string, role?: string) => void;
  updateMember: (id: string, patch: Partial<CrewMember>) => void;
  removeMember: (id: string) => void;
  setRecorder: (id: string) => void;
  setEarthValue: (id: string, date: string, key: string, v: number | undefined) => void;
  removeEarthDay: (id: string, date: string) => void;
  setInfo: (id: string, patch: Partial<EarthInfo>) => void;
  finishSetup: () => void;
  addReadings: (id: string, rs: Reading[]) => void;
  setSkips: (id: string, day: number, indicatorIds: string[]) => void;
  logReport: (r: Omit<ReportLog, "id">) => void;
  releaseReports: () => void;
  resetAll: () => void;
}

const newId = () => `m-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const blankMember = (name = "", role = ""): CrewMember => ({
  id: newId(),
  name,
  role,
  pinHash: null,
  deviceId: "",
  deviceTestedAt: null,
  info: emptyInfo(),
  earth: {},
  readings: [],
  skips: {},
});

const initial = {
  mode: "new" as AppMode,
  step: "welcome" as SetupStep,
  setupDone: false,
  launchDate: "",
  environment: "spacecraft" as EnvironmentId,
  members: [] as CrewMember[],
  recorderId: null as string | null,
  reports: [] as ReportLog[],
  lastReportAt: null as number | null,
};

const mapMember = (members: CrewMember[], id: string, f: (m: CrewMember) => CrewMember) =>
  members.map((m) => (m.id === id ? f(m) : m));

export const useCrew = create<CrewState>()(
  persist(
    (set) => ({
      ...initial,
      hydrated: false,
      setMode: (mode) => set({ mode }),
      goStep: (step) => set({ step }),
      setMission: (launchDate, environment) => set({ launchDate, environment }),
      addMember: (name, role) => set((s) => ({ members: [...s.members, blankMember(name, role)] })),
      updateMember: (id, patch) => set((s) => ({ members: mapMember(s.members, id, (m) => ({ ...m, ...patch })) })),
      removeMember: (id) =>
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
          recorderId: s.recorderId === id ? null : s.recorderId,
        })),
      setRecorder: (id) => set({ recorderId: id }),
      setEarthValue: (id, date, key, v) =>
        set((s) => ({
          members: mapMember(s.members, id, (m) => {
            const row = { ...(m.earth[date] ?? {}) };
            if (v === undefined || !Number.isFinite(v)) delete row[key];
            else row[key] = v;
            return { ...m, earth: { ...m.earth, [date]: row } };
          }),
        })),
      removeEarthDay: (id, date) =>
        set((s) => ({
          members: mapMember(s.members, id, (m) => {
            const earth = { ...m.earth };
            delete earth[date];
            return { ...m, earth };
          }),
        })),
      setInfo: (id, patch) =>
        set((s) => ({ members: mapMember(s.members, id, (m) => ({ ...m, info: { ...m.info, ...patch } })) })),
      finishSetup: () => set({ setupDone: true, step: "done" }),
      addReadings: (id, rs) =>
        set((s) => ({
          members: mapMember(s.members, id, (m) => ({
            ...m,
            readings: [
              ...m.readings.filter((u) => !rs.some((r) => r.indicatorId === u.indicatorId && r.day === u.day)),
              ...rs,
            ],
          })),
        })),
      setSkips: (id, day, indicatorIds) =>
        set((s) => ({ members: mapMember(s.members, id, (m) => ({ ...m, skips: { ...m.skips, [day]: indicatorIds } })) })),
      logReport: (r) =>
        set((s) => ({
          reports: [{ ...r, id: `R-${Date.now().toString(36).toUpperCase()}` }, ...s.reports].slice(0, 200),
          lastReportAt: r.kind === "routine" ? r.at : s.lastReportAt,
        })),
      releaseReports: () => set((s) => ({ reports: s.reports.map((r) => (r.queued ? { ...r, queued: false } : r)) })),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: "ahm-crew-v1",
      storage: createJSONStorage(() => dexieStorage),
      partialize: (s) =>
        Object.fromEntries(Object.entries(s).filter(([k, v]) => typeof v !== "function" && k !== "hydrated")),
      onRehydrateStorage: () => () => useCrew.setState({ hydrated: true }),
    },
  ),
);
