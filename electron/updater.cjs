/**
 * App updates for the installed desktop app, from GitHub Releases.
 *
 * - Nothing is checked unless the page asks (the crew can turn automatic checks off in Settings, and on a spacecraft
 *   there is usually no internet). A check only downloads the newest version number; no health data is ever sent.
 * - Windows (per-user installer) and Linux (AppImage, .deb, .rpm) download and install the update themselves, after the
 *   crew presses "Download" and then "Restart and update". On Linux .deb/.rpm the system asks for a password.
 * - macOS: Apple only allows in-place updates for signed apps, and this build is not signed yet. The app still tells
 *   the crew a new version exists and opens the download page.
 * - Versions installed before 1.1.0 have no update check at all; they need one manual install of 1.1.0 or newer.
 */
const { app, ipcMain, net, shell } = require("electron");

const REPO = "LORDXMANOJ/Nasa-space-app";
const DOWNLOAD_PAGE = "https://lordxmanoj.github.io/Nasa-space-app/";

/** Can this install update itself? (packaged, and not an unsigned Mac app) */
const canSelfUpdate = () => app.isPackaged && process.platform !== "darwin";

/** "1.10.0" > "1.9.2" */
function newer(a, b) {
  const pa = a.split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  const pb = b.split(/[.-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  return false;
}

const offlineMessage = "Could not reach GitHub. Updates are checked when this computer is online.";
const friendly = (err) => {
  const m = String(err?.message ?? err);
  return /ENOTFOUND|ENETUNREACH|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|net::ERR_|getaddrinfo|network/i.test(m) ? offlineMessage : m.split("\n")[0].slice(0, 200);
};

function setupUpdates(getWindow) {
  let status = { state: "idle", current: app.getVersion() };
  const set = (s) => {
    status = { current: app.getVersion(), ...s };
    const w = getWindow();
    if (w && !w.isDestroyed()) w.webContents.send("update:status", status);
  };

  /* --- self-installing updates (Windows, Linux) --- */
  let updater = null;
  let checkingFull = false;
  const getUpdater = () => {
    if (updater) return updater;
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = false; // ask first: downloads can be large and the link may be slow
    autoUpdater.autoInstallOnAppQuit = true; // a downloaded update also installs when the app is closed normally
    autoUpdater.on("checking-for-update", () => set({ state: "checking" }));
    autoUpdater.on("update-available", (info) => set({ state: "available", version: info.version, canInstall: true }));
    autoUpdater.on("update-not-available", () => set({ state: "current" }));
    autoUpdater.on("download-progress", (p) => set({ state: "downloading", percent: Math.round(p.percent) }));
    autoUpdater.on("update-downloaded", (info) => set({ state: "ready", version: info.version }));
    // errors while checking are handled in update:check (it falls back to a version-only check)
    autoUpdater.on("error", (err) => {
      if (!checkingFull) set({ state: "error", message: friendly(err) });
    });
    updater = autoUpdater;
    return updater;
  };

  /* --- check only (macOS, and the development build) --- */
  async function checkByVersionOnly() {
    set({ state: "checking" });
    try {
      const res = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "AstronautHealthMonitor-updater" },
      });
      if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
      const latest = String((await res.json()).tag_name || "").replace(/^v/, "");
      if (latest && newer(latest, app.getVersion())) set({ state: "available", version: latest, canInstall: false });
      else set({ state: "current" });
    } catch (err) {
      set({ state: "error", message: friendly(err) });
    }
  }

  ipcMain.handle("app:info", () => ({
    version: app.getVersion(),
    platform: process.platform,
    packaged: app.isPackaged,
    canSelfUpdate: canSelfUpdate(),
    status,
  }));

  ipcMain.handle("update:check", async () => {
    if (status.state === "downloading" || status.state === "ready") return status;
    if (!canSelfUpdate()) {
      await checkByVersionOnly();
      return status;
    }
    checkingFull = true;
    try {
      await getUpdater().checkForUpdates();
    } catch (err) {
      // e.g. the newest release was published before in-app updates existed (no latest.yml), or GitHub is
      // unreachable: still tell the crew whether a newer version exists
      if (friendly(err) === offlineMessage) set({ state: "error", message: offlineMessage });
      else await checkByVersionOnly();
    } finally {
      checkingFull = false;
    }
    return status;
  });

  ipcMain.handle("update:download", async () => {
    if (!canSelfUpdate()) {
      shell.openExternal(DOWNLOAD_PAGE);
      return status;
    }
    try {
      set({ state: "downloading", percent: 0 });
      await getUpdater().downloadUpdate();
    } catch (err) {
      set({ state: "error", message: friendly(err) });
    }
    return status;
  });

  ipcMain.handle("update:install", () => {
    if (status.state === "ready" && updater) setImmediate(() => updater.quitAndInstall(false, true));
    return status;
  });

  ipcMain.handle("update:open-page", () => shell.openExternal(DOWNLOAD_PAGE));
}

module.exports = { setupUpdates, newer };
