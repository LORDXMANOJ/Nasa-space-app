/**
 * Local persistence in IndexedDB via Dexie. One key–value table holds the persisted app state
 * (settings, user readings, checklists, Ground Link outbox). No network, no telemetry.
 */
import Dexie, { type Table } from "dexie";
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

/** zustand `persist` storage backed by Dexie; falls back silently if IndexedDB is unavailable. */
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
    } catch {
      /* storage unavailable: keep running in memory */
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
