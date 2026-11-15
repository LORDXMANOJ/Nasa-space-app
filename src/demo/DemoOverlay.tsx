/** The visible parts of Demo mode: a cursor, a caption bar with progress, and a Stop button. Web version only. */
import { useEffect } from "react";
import { Play, X } from "../components/icons";
import { isDesktopApp, startDemo, stopDemo, useDemo } from "./demo";

/** Button that starts the tour. Renders nothing in the desktop app. */
export function DemoButton({
  className = "btn",
  label = "Watch the demo",
}: {
  className?: string;
  label?: string;
}) {
  const running = useDemo((s) => s.running);
  if (isDesktopApp) return null;
  return (
    <button type="button" className={className} onClick={() => void startDemo()} disabled={running}>
      <Play aria-hidden /> {label}
    </button>
  );
}

export function DemoOverlay() {
  const { running, caption, step, total, cursor } = useDemo();

  // ?demo=1 in the address starts the tour on load (used by the links on the slides)
  useEffect(() => {
    if (isDesktopApp) return;
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      const id = window.setTimeout(() => void startDemo(), 1200);
      return () => window.clearTimeout(id);
    }
  }, []);
  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && stopDemo();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  if (!running || isDesktopApp) return null;
  return (
    <div className="demo-layer" role="region" aria-label="Demo mode">
      <div className="demo-top">
        <span className="demo-chip">Demo mode · simulated crew and data</span>
        <button type="button" className="btn btn--sm demo-stop" onClick={stopDemo}>
          <X aria-hidden /> Stop demo
        </button>
      </div>
      <div className="demo-caption" role="status" aria-live="polite">
        <p>{caption}</p>
        <div className="demo-progress" aria-hidden>
          <span style={{ transform: `scaleX(${total ? step / total : 0})` }} />
        </div>
      </div>
      {cursor.visible && (
        <svg
          className={`demo-cursor${cursor.pressed ? " is-down" : ""}`}
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          width="30"
          height="30"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            d="M3 2l7.5 19 2.7-7.6L21 10.7 3 2z"
            fill="#fff"
            stroke="#111d1b"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
