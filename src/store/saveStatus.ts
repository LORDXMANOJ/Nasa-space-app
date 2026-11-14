/** Whether the last write to on-device storage failed, so the app can say so instead of failing silently. */
import { create } from "zustand";

export const useSaveStatus = create<{ failed: boolean; setFailed: (v: boolean) => void }>((set) => ({
  failed: false,
  setFailed: (failed) => set({ failed }),
}));
