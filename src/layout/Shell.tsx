/**
 * App shell: left navigation rail (icon + label), top mission bar, persistent safety footer,
 * global keyboard shortcuts (1–9 screens, M = next measurement, ? = shortcuts, Ctrl+Shift+D = presenter).
 */
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  BookOpen,
  HeartPulse,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  Orbit,
  Satellite,
  Settings as SettingsIcon,
  ShieldAlert,
  Stethoscope,
  MessageCircleQuestion,
  TriangleAlert,
  Zap,
} from "../components/icons";
import { environmentById } from "../data";
import { useHealth } from "../store/health";
import { formatDuration } from "../engine/missions";
import { useMission } from "../store/mission";
import { Modal } from "../components/ui";
import { PresenterPanel } from "./PresenterPanel";
import { ActionButton } from "../components/Feedback";
import { useSaveStatus } from "../store/saveStatus";
import { Toaster } from "../components/Feedback";

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, key: "1" },
  { to: "/checkin", label: "Check-in", icon: Stethoscope, key: "2" },
  { to: "/body", label: "Body", icon: HeartPulse, key: "3" },
  { to: "/recovery", label: "Recovery", icon: LifeBuoy, key: "4" },
  { to: "/trends", label: "Trends", icon: LineChart, key: "5" },
  { to: "/hazards", label: "Hazards", icon: ShieldAlert, key: "6" },
  { to: "/assistant", label: "Assistant", icon: MessageCircleQuestion, key: "0" },
  { to: "/consult", label: "Consult", icon: Satellite, key: "7" },
  { to: "/how", label: "How it decides", icon: BookOpen, key: "8" },
  { to: "/settings", label: "Settings", icon: SettingsIcon, key: "9" },
];

export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const health = useHealth();
  const day = useMission((s) => s.day);
  const env = environmentById(useMission((s) => s.environment));
  const lowPower = useMission((s) => s.settings.lowPower);
  const saveFailed = useSaveStatus((s) => s.failed);
  /** Any state update makes persist write again; then wait a moment and report whether it worked. */
  const retrySave = async () => {
    useMission.setState({});
    await new Promise((r) => window.setTimeout(r, 300));
    if (useSaveStatus.getState().failed) throw new Error("still failing");
  };
  const presenterOpen = useMission((s) => s.presenterOpen);
  const togglePresenter = useMission((s) => s.togglePresenter);
  const [help, setHelp] = useState(false);
  const flagged = Object.values(health.evals).some((e) => e.status === "act");
  const releaseQueue = useMission((s) => s.releaseQueue);
  const hasQueued = useMission((s) => s.outbox.some((o) => o.sentAt === null));
  useEffect(() => {
    if (!health.link.reply.noContact && hasQueued)
      releaseQueue(health.link.oneWayMin, health.link.reply.totalMin);
  }, [health.link, hasQueued, releaseQueue]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        togglePresenter();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const nav = NAV.find((n) => n.key === e.key);
      if (nav) navigate(nav.to);
      else if (e.key === "m" || e.key === "M") {
        const next = health.due[0];
        navigate(next ? "/checkin" : "/measure");
      } else if (e.key === "?") setHelp(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, health.due, togglePresenter]);

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="rail" aria-label="Main">
        <div className="rail-brand" aria-hidden>
          <Orbit width={30} height={30} />
        </div>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <n.icon aria-hidden />
            {n.label}
            {n.to === "/recovery" && flagged && <span className="dot" aria-label="Action needed" />}
          </NavLink>
        ))}
      </nav>

      <header className="bar">
        <span className="item">Health check</span>
        <span className="item">
          <Activity aria-hidden />
          <span>
            Day <strong>{day}</strong>
          </span>
        </span>
        <span className="item">{env.name}</span>
        <span
          className="item"
          title="Time to get an answer from the flight surgeon on Earth (signal out + review + signal back)"
        >
          <Satellite aria-hidden />
          {health.link.conjunction ? (
            <span style={{ color: "var(--act)", fontWeight: 700 }}>No contact: solar conjunction</span>
          ) : (
            <>
              Earth reply <strong>{formatDuration(health.link.reply.totalMin)}</strong>
            </>
          )}
        </span>
        <span className="item">
          <span className="crew">{health.profile.name}</span>
          <span>{health.profile.role}</span>
        </span>
        <span className="spacer" />
        {lowPower && (
          <span className="item" title="Low-power mode: 3D and animation off">
            <Zap aria-hidden />
            Low power
          </span>
        )}
        <span className="sim-pill" role="note">
          <TriangleAlert width={14} height={14} aria-hidden />
          SIMULATED DEMO DATA
        </span>
      </header>

      <main id="main" className="shell-main" tabIndex={-1}>
        {saveFailed && (
          <div className="banner banner--watch save-banner" role="alert">
            <TriangleAlert aria-hidden />
            <div>
              <strong>Your last change could not be saved on this device.</strong>
              <p>
                The device storage is full or blocked. Your readings are kept while the app stays open, but
                would be lost if you close it.
              </p>
            </div>
            <ActionButton
              className="btn btn--primary"
              onAction={retrySave}
              workingLabel="Saving…"
              doneLabel="Saved"
              failLabel="Still not saved: storage is still blocked."
            >
              Try again
            </ActionButton>
          </div>
        )}
        {children}
      </main>

      <footer className="foot" role="contentinfo">
        <TriangleAlert aria-hidden />
        Prototype with simulated data. It flags and explains; it does not diagnose. Your Crew Medical Officer
        decides. Consult the flight surgeon.
        <span className="spacer" style={{ flex: 1 }} />
        <span>
          Press <span className="kbd">?</span> for shortcuts
        </span>
      </footer>

      <Toaster />
      {presenterOpen && <PresenterPanel />}
      {help && (
        <Modal title="Keyboard shortcuts" onClose={() => setHelp(false)}>
          <table className="table">
            <tbody>
              {NAV.map((n) => (
                <tr key={n.key}>
                  <td style={{ width: 80 }}>
                    <span className="kbd">{n.key}</span>
                  </td>
                  <td>{n.label}</td>
                </tr>
              ))}
              <tr>
                <td>
                  <span className="kbd">M</span>
                </td>
                <td>Start the next due measurement</td>
              </tr>
              <tr>
                <td>
                  <span className="kbd">Esc</span>
                </td>
                <td>Close a panel or dialog</td>
              </tr>
              <tr>
                <td>
                  <span className="kbd">Ctrl</span>+<span className="kbd">Shift</span>+
                  <span className="kbd">D</span>
                </td>
                <td>Presenter controls (demo)</td>
              </tr>
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  );
}
