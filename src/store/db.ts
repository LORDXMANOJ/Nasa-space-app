/**
 * Local persistence in IndexedDB via Dexie. One key–value table holds the persisted app state
 * (settings, user readings, checklists, Ground Link outbox). No network, no telemetry.
 */
import Dexie, { type Table } from "dexie";
import { useSaveStatus } from "./saveStatus";
import type { StateStorage } from "zustand/middleware";

interface KV {
  key: string;
  value: string;
}

class AhmDb extends Dexie {
  kv!: Table<KV, string>;
  constructor() {
    super("astronaut-health-monitor");
    this.version(1).stores({ kv: "key" });
  }
}

export const db = new AhmDb();

/** zustand `persist` storage backed by Dexie; if a write fails the app keeps running in memory and shows a notice. */
export const dexieStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return (await db.kv.get(name))?.value ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await db.kv.put({ key: name, value });
      if (useSaveStatus.getState().failed) useSaveStatus.getState().setFailed(false);
    } catch {
      // storage unavailable or full: keep running in memory, and tell the crew (never fail silently)
      useSaveStatus.getState().setFailed(true);
    }
  },
  removeItem: async (name) => {
    try {
      await db.kv.delete(name);
    } catch {
      /* ignore */
    }
  },
};
