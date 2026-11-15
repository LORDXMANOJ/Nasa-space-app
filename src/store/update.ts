/**
 * App updates (installed desktop app only). The desktop shell (electron/updater.cjs) does the work; this store
 * mirrors its status for the page. In the web version there is nothing to update: the page is always the newest.
 */
import { create } from "zustand";

export type UpdateState = "idle" | "checking" | "current" | "available" | "downloading" | "ready" | "error";
export interface UpdateStatus {
  state: UpdateState;
  current?: string;
  version?: string;
  canInstall?: boolean;
  percent?: number;
  message?: string;
}
interface DesktopApi {
  info: () => Promise<{
    version: string;
    platform: string;
    packaged: boolean;
    canSelfUpdate: boolean;
    status: UpdateStatus;
  }>;
  checkForUpdate: () => Promise<UpdateStatus>;
  downloadUpdate: () => Promise<UpdateStatus>;
  installUpdate: () => Promise<UpdateStatus>;
  openDownloadPage: () => Promise<void>;
  onUpdateStatus: (cb: (s: UpdateStatus) => void) => () => void;
}

/** Present only inside the desktop app (exposed by electron/preload.cjs). */
export const desktop: DesktopApi | undefined =
  typeof window !== "undefined" ? (window as unknown as { ahmDesktop?: DesktopApi }).ahmDesktop : undefined;

interface UpdateStore {
  version: string | null;
  platform: string;
  canSelfUpdate: boolean;
  status: UpdateStatus;
  dismissed: string | null; // version the crew chose "Later" for
  init: () => void;
  check: () => Promise<void>;
  download: () => Promise<void>;
  install: () => Promise<void>;
  dismiss: () => void;
}

let started = false;

export const useUpdate = create<UpdateStore>((set, get) => ({
  version: null,
  platform: "",
  canSelfUpdate: false,
  status: { state: "idle" },
  dismissed: null,
  init: () => {
    if (!desktop || started) return;
    started = true;
    desktop.onUpdateStatus((status) => set({ status }));
    void desktop
      .info()
      .then((i) =>
        set({ version: i.version, platform: i.platform, canSelfUpdate: i.canSelfUpdate, status: i.status }),
      );
  },
  check: async () => {
    if (!desktop) return;
    set({ status: await desktop.checkForUpdate() });
  },
  download: async () => {
    if (!desktop) return;
    // found by the version-only check (no update file for this release): install from the download page
    if (!get().canSelfUpdate || get().status.canInstall === false) return void desktop.openDownloadPage();
    await desktop.downloadUpdate();
  },
  install: async () => {
    if (desktop) await desktop.installUpdate();
  },
  dismiss: () => set((s) => ({ dismissed: s.status.version ?? null })),
}));
