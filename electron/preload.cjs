/**
 * The only bridge between the page and the desktop shell. The page gets a small, fixed set of calls
 * (app version and updates); it never gets Node, files or the network.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ahmDesktop", {
  info: () => ipcRenderer.invoke("app:info"),
  checkForUpdate: () => ipcRenderer.invoke("update:check"),
  downloadUpdate: () => ipcRenderer.invoke("update:download"),
  installUpdate: () => ipcRenderer.invoke("update:install"),
  openDownloadPage: () => ipcRenderer.invoke("update:open-page"),
  onUpdateStatus: (callback) => {
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("update:status", listener);
    return () => ipcRenderer.removeListener("update:status", listener);
  },
});
