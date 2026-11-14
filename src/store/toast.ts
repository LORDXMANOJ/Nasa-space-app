/**
 * Short feedback messages ("Saved", "Packet queued") shown bottom-centre and read out by screen readers.
 * Call toast("Saved") from anywhere; each message leaves on its own after a few seconds.
 */
import { create } from "zustand";
import { useSaveStatus } from "./saveStatus";

export type ToastKind = "success" | "info" | "error";
export interface ToastItem {
  id: number;
  text: string;
  kind: ToastKind;
}
interface ToastState {
  items: ToastItem[];
  push: (text: string, kind?: ToastKind) => void;
  dismiss: (id: number) => void;
}

let next = 1;
export const useToasts = create<ToastState>((set, get) => ({
  items: [],
  push: (text, kind = "success") => {
    const id = next++;
    // the same message twice in a row replaces the first instead of stacking
    set({ items: [...get().items.filter((t) => t.text !== text), { id, text, kind }].slice(-3) });
    window.setTimeout(() => get().dismiss(id), kind === "error" ? 6000 : 3200);
  },
  dismiss: (id) => set({ items: get().items.filter((t) => t.id !== id) }),
}));

export const toast = (text: string, kind: ToastKind = "success") => useToasts.getState().push(text, kind);

/**
 * "Saved"-type confirmations: wait until the write to device storage has had a moment to finish, and only
 * confirm if it worked. If it failed, the save notice at the top of the screen already explains what to do.
 */
export const toastWhenSaved = (text: string) =>
  window.setTimeout(() => {
    if (!useSaveStatus.getState().failed) toast(text);
  }, 350);
