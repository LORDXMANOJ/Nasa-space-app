/**
 * Desktop shell for Astronaut Health Monitor (Electron).
 *
 * - Serves the built web app (dist/) from a private app:// origin, so IndexedDB, Web Workers and WebGL behave
 *   exactly as in a browser, with no network access needed.
 * - Resizable window sized for a 16:10 crew laptop (1280 x 800 at 150 % scaling), never smaller than 800 x 600.
 * - Full screen with F11 (Ctrl+Cmd+F on macOS) or start in full screen with --fullscreen (for a fixed panel).
 * - Remembers window size, position and full-screen state between launches.
 * - Locked down: no Node in the page, sandboxed, context-isolated; links to the web open in the system browser and
 *   the window cannot be navigated anywhere else. The page reaches the shell only through electron/preload.cjs.
 * - Updates from GitHub Releases, only when the page asks (electron/updater.cjs).
 */
const { app, BrowserWindow, Menu, net, protocol, shell, screen } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { setupUpdates } = require("./updater.cjs");

const DIST = path.join(__dirname, "..", "dist");
const SCHEME = "app";
const ORIGIN = `${SCHEME}://local`;
const DEV_URL = process.env.VITE_DEV_SERVER_URL; // set by `npm run app:dev`
const isMac = process.platform === "darwin";

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } },
]);

// One copy of the app at a time: a second launch focuses the first window.
if (!app.requestSingleInstanceLock()) app.quit();

/* ---------- window state ---------- */
const stateFile = () => path.join(app.getPath("userData"), "window-state.json");
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), "utf8"));
  } catch {
    return {};
  }
}
function saveState(win) {
  try {
    const s = { ...win.getNormalBounds(), maximized: win.isMaximized(), fullScreen: win.isFullScreen() };
    fs.writeFileSync(stateFile(), JSON.stringify(s));
  } catch {
    /* not critical */
  }
}
/** Keep a remembered window on a screen that still exists. */
function visible(b) {
  if (b.x === undefined || b.y === undefined) return false;
  return screen.getAllDisplays().some(({ workArea: a }) => b.x < a.x + a.width - 100 && b.x + b.width > a.x + 100 && b.y >= a.y - 20 && b.y < a.y + a.height - 100);
}

let win;
function createWindow() {
  const st = loadState();
  const work = screen.getPrimaryDisplay().workAreaSize;
  const width = Math.min(st.width ?? 1280, work.width);
  const height = Math.min(st.height ?? 800, work.height);
  win = new BrowserWindow({
    width,
    height,
    ...(visible(st) ? { x: st.x, y: st.y } : {}),
    minWidth: 800,
    minHeight: 600,
    title: "Astronaut Health Monitor",
    backgroundColor: "#e3edea",
    show: false,
    autoHideMenuBar: !isMac,
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  const wantFull = process.argv.includes("--fullscreen") || st.fullScreen;
  win.once("ready-to-show", () => {
    if (st.maximized) win.maximize();
    if (wantFull) win.setFullScreen(true);
    win.show();
  });
  for (const ev of ["resize", "move", "enter-full-screen", "leave-full-screen", "close"]) win.on(ev, () => saveState(win));

  // Web links open in the system browser; the app window itself never leaves the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    const own = url.startsWith(ORIGIN) || (DEV_URL && url.startsWith(DEV_URL));
    if (!own) {
      e.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });

  win.loadURL(DEV_URL || `${ORIGIN}/index.html`);
}

/* ---------- menu: what a crew member needs, nothing else ---------- */
function buildMenu() {
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "View",
      submenu: [
        { role: "togglefullscreen", label: "Full screen" },
        { type: "separator" },
        { role: "zoomIn", label: "Bigger text" },
        { role: "zoomOut", label: "Smaller text" },
        { role: "resetZoom", label: "Normal text size" },
        { type: "separator" },
        { role: "reload", label: "Reload" },
        ...(app.isPackaged ? [] : [{ role: "toggleDevTools" }]),
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [{ label: "Project on GitHub", click: () => shell.openExternal("https://github.com/LORDXMANOJ/Nasa-space-app") }],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on("second-instance", () => {
  if (!win) return;
  if (win.isMinimized()) win.restore();
  win.focus();
});

app.whenReady().then(() => {
  // Serve dist/ on app://local/ with a guard against reading outside the app folder.
  protocol.handle(SCHEME, (req) => {
    const { pathname } = new URL(req.url);
    const file = path.normalize(path.join(DIST, decodeURIComponent(pathname)));
    if (!file.startsWith(DIST)) return new Response("Not found", { status: 404 });
    return net.fetch(pathToFileURL(fs.existsSync(file) ? file : path.join(DIST, "index.html")).toString());
  });
  buildMenu();
  setupUpdates(() => win);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
