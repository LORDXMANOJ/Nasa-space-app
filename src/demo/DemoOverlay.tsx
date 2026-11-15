/** The visible parts of Demo mode: a cursor, a caption bar with progress, and a Stop button. Web version only. */
import { useEffect } from "react";
import { Play, X } from "../components/icons";
import { isDesktopApp, restoreRealCrew, setVoice, startDemo, stopDemo, useDemo } from "./demo";
import { useCrew } from "../store/crew";

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
  const { running, caption, step, total, cursor, voice, ready } = useDemo();

  // a tour that was cut off (tab closed) still gives the real crew back, once storage has loaded
  const crewHydrated = useCrew((s) => s.hydrated);
  useEffect(() => {
    if (crewHydrated && !useDemo.getState().running) restoreRealCrew();
  }, [crewHydrated]);

  // ?demo=1 in the address starts the tour on load (used by the links on the slides)
  useEffect(() => {
    if (isDesktopApp) return;
    if (new URLSearchParams(window.location.search).get("demo") === "1") {
      // sound needs a tap in browsers, so ask first instead of starting silently
      useDemo.setState({ ready: true });
    }
  }, []);
  useEffect(() => {
    if (!running) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && stopDemo();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running]);

  if (isDesktopApp) return null;
  if (ready && !running)
    return (
      <div className="demo-layer demo-layer--ask" role="dialog" aria-label="Start demo mode">
        <div className="demo-ask">
          <h2>Demo mode</h2>
          <p>
            A cursor will click and type through a full check-in by itself, with a voice explaining each step. All crew
            and readings are simulated.
          </p>
          <div className="demo-ask-actions">
            <button type="button" className="btn btn--lg btn--primary" onClick={() => void startDemo(true)}>
              <Play aria-hidden /> Start with voice
            </button>
            <button type="button" className="btn btn--lg" onClick={() => void startDemo(false)}>
              Start without voice
            </button>
          </div>
        </div>
      </div>
    );
  if (!running) return null;
  return (
    <div className="demo-layer" role="region" aria-label="Demo mode">
      <div className="demo-top">
        <span className="demo-chip">Demo mode · simulated crew and data</span>
        <button type="button" className="btn btn--sm" aria-pressed={voice} onClick={() => setVoice(!voice)}>
          {voice ? "Voice on" : "Voice off"}
        </button>
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
