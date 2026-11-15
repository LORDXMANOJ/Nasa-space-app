/**
 * "A new version is ready" card for the installed desktop app. Checks once shortly after start (if allowed in
 * Settings), then stays out of the way: the crew decides when to download and when to restart.
 */
import { useEffect } from "react";
import { Download, Loader2, RotateCcw, X } from "./icons";
import { desktop, useUpdate } from "../store/update";
import { useMission } from "../store/mission";

export function UpdateNotice() {
  const { status, canSelfUpdate, dismissed, init, check, download, install, dismiss } = useUpdate();
  const auto = useMission((s) => s.settings.checkUpdates !== false);

  useEffect(() => {
    if (!desktop) return;
    init();
    if (!auto) return;
    const id = window.setTimeout(() => void check(), 4000);
    return () => window.clearTimeout(id);
  }, [auto, init, check]);

  if (!desktop) return null;
  const s = status;
  const show =
    (s.state === "available" && s.version !== dismissed) || s.state === "downloading" || s.state === "ready";
  if (!show) return null;

  return (
    <div className="update-card" role="status" aria-live="polite">
      {s.state === "available" && (
        <>
          <p>
            <strong>Version {s.version} is available.</strong> You have {s.current}.{" "}
            {canSelfUpdate && s.canInstall !== false ? "Your readings stay on this computer." : "It opens the download page."}
          </p>
          <div className="update-actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={() => void download()}>
              <Download aria-hidden /> {canSelfUpdate && s.canInstall !== false ? "Download update" : "Get the new version"}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={dismiss}>
              Later
            </button>
          </div>
        </>
      )}
      {s.state === "downloading" && (
        <>
          <p>
            <Loader2 className="spin" aria-hidden /> Downloading the update… {s.percent ?? 0}%
          </p>
          <div className="update-bar" aria-hidden>
            <span style={{ transform: `scaleX(${(s.percent ?? 0) / 100})` }} />
          </div>
        </>
      )}
      {s.state === "ready" && (
        <>
          <p>
            <strong>Version {s.version} is ready.</strong> Restart to finish. If you close the app instead, it
            updates then.
          </p>
          <div className="update-actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={() => void install()}>
              <RotateCcw aria-hidden /> Restart and update
            </button>
          </div>
        </>
      )}
      {s.state === "available" && (
        <button type="button" className="update-close" aria-label="Close" onClick={dismiss}>
          <X aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Settings card: version, manual check, automatic checks on/off. */
export function UpdateSettings() {
  const { version, status, canSelfUpdate, platform, check, download, install } = useUpdate();
  const auto = useMission((s) => s.settings.checkUpdates !== false);
  const updateSettings = useMission((s) => s.updateSettings);
  if (!desktop)
    return (
      <section className="card stack">
        <h2>App updates</h2>
        <p className="dim" style={{ fontSize: "var(--fs-sm)" }}>
          This is the web version: it is always the newest. The desktop app checks for updates itself.
        </p>
      </section>
    );
  const s = status;
  const line =
    s.state === "checking"
      ? "Checking…"
      : s.state === "current"
        ? "You have the newest version."
        : s.state === "available"
          ? `Version ${s.version} is available.`
          : s.state === "downloading"
            ? `Downloading… ${s.percent ?? 0}%`
            : s.state === "ready"
              ? `Version ${s.version} is downloaded. Restart to finish.`
              : s.state === "error"
                ? s.message
                : "";
  return (
    <section className="card stack">
      <h2>App updates</h2>
      <p>
        Installed version <strong className="num">{version ?? "…"}</strong>
      </p>
      {line && (
        <p className={s.state === "error" ? "ob-error" : ""} role="status">
          {line}
        </p>
      )}
      <div className="row">
        {s.state === "ready" ? (
          <button className="btn btn--primary" onClick={() => void install()}>
            <RotateCcw aria-hidden /> Restart and update
          </button>
        ) : s.state === "available" ? (
          <button className="btn btn--primary" onClick={() => void download()}>
            <Download aria-hidden /> {canSelfUpdate && s.canInstall !== false ? "Download update" : "Get the new version"}
          </button>
        ) : (
          <button
            className="btn"
            onClick={() => void check()}
            disabled={s.state === "checking" || s.state === "downloading"}
          >
            Check for updates
          </button>
        )}
      </div>
      <label className="toggle">
        <span>
          <strong style={{ display: "block" }}>Check automatically</strong>
          <small className="dim">
            When this computer is online, look for a new version at start. Only the version number is fetched
            from GitHub; no health data is sent.
          </small>
        </span>
        <input
          type="checkbox"
          checked={auto}
          onChange={(e) => updateSettings({ checkUpdates: e.target.checked })}
        />
      </label>
      {platform === "darwin" && (
        <p className="dim" style={{ fontSize: "var(--fs-sm)" }}>
          On a Mac the new version is installed from the download page, because this build is not signed by
          Apple yet.
        </p>
      )}
    </section>
  );
}
