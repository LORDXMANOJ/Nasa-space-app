/**
 * Feedback pieces used across the app:
 *  - Toaster: short, self-dismissing confirmations (never used for important errors; those are inline or blocks).
 *  - ActionButton: a button that shows it is working and then done, following loading-time research:
 *      under ~0.4 s it shows no spinner at all (a flash feels broken); after that a spinner with words;
 *      for long work (expectedMs) the words change as it goes and a progress bar fills.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, CheckCircle2, Info, Loader2, TriangleAlert, X } from "./icons";
import { useToasts } from "../store/toast";

export function Toaster() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          {t.kind === "success" ? (
            <CheckCircle2 aria-hidden />
          ) : t.kind === "error" ? (
            <TriangleAlert aria-hidden />
          ) : (
            <Info aria-hidden />
          )}
          <span>{t.text}</span>
          <button className="toast-x" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            <X aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

type Phase = "idle" | "pending" | "working" | "done" | "failed";
interface ActionButtonProps {
  /** The work. May return a promise; the button stays busy until it resolves. A rejection shows failLabel beside it. */
  onAction: () => unknown;
  children: ReactNode;
  workingLabel: string;
  /** Words that replace workingLabel as time passes, e.g. [[1500, "Almost done…"]]. */
  steps?: [number, string][];
  /** Expected duration; when set, a progress bar fills along the bottom of the button. */
  expectedMs?: number;
  doneLabel?: string;
  failLabel?: string;
  className?: string;
  disabled?: boolean;
  /** How long the done state shows before the button returns to idle (0 = stay done). */
  doneMs?: number;
}

const SPINNER_AFTER_MS = 400;

export function ActionButton({
  onAction,
  children,
  workingLabel,
  steps,
  expectedMs,
  doneLabel,
  failLabel,
  className = "btn",
  disabled,
  doneMs = 1600,
}: ActionButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState(workingLabel);
  const alive = useRef(true);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    alive.current = true; // set on every mount (React may mount twice in development)
    const list = timers.current;
    return () => {
      alive.current = false;
      list.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  const later = (ms: number, fn: () => void) =>
    timers.current.push(window.setTimeout(() => alive.current && fn(), ms));

  const run = async () => {
    if (phase === "pending" || phase === "working") return;
    setPhase("pending");
    setLabel(workingLabel);
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    later(SPINNER_AFTER_MS, () => setPhase((p) => (p === "pending" ? "working" : p)));
    steps?.forEach(([at, words]) => later(at, () => setLabel(words)));
    try {
      await Promise.resolve(onAction());
      timers.current.forEach((t) => window.clearTimeout(t));
      if (!alive.current) return;
      if (doneLabel) {
        setPhase("done");
        if (doneMs > 0) {
          await wait(doneMs);
          if (alive.current) setPhase("idle");
        }
      } else setPhase("idle");
    } catch {
      timers.current.forEach((t) => window.clearTimeout(t));
      if (alive.current) setPhase("failed");
    }
  };
  const busy = phase === "pending" || phase === "working";
  return (
    <span className="action-wrap">
      <button
        type="button"
        className={`${className} is-${phase}${expectedMs ? " has-progress" : ""}`}
        onClick={run}
        disabled={disabled || busy}
        aria-busy={busy}
      >
        {phase === "working" ? (
          <>
            <Loader2 className="spin" aria-hidden /> {label}
          </>
        ) : phase === "done" ? (
          <>
            <Check className="pop" aria-hidden /> {doneLabel}
          </>
        ) : (
          children
        )}
        {busy && expectedMs ? (
          <span className="btn-progress" style={{ animationDuration: `${expectedMs}ms` }} aria-hidden />
        ) : null}
      </button>
      {phase === "failed" && (
        <span className="inline-error" role="alert">
          <TriangleAlert aria-hidden /> {failLabel ?? "That did not work."} Press it again to retry.
        </span>
      )}
    </span>
  );
}
