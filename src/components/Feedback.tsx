/**
 * Feedback pieces used across the app:
 *  - Toaster: renders toast messages (bottom-centre, aria-live) with a big dismiss target.
 *  - ActionButton: a button that shows it is working (spinner + words) and then done (tick + words).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, CheckCircle2, Info, Loader2, TriangleAlert, X } from "lucide-react";
import { useToasts } from "../store/toast";

export function Toaster() {
  const items = useToasts((s) => s.items);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div className="toaster" role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          {t.kind === "success" ? <CheckCircle2 aria-hidden /> : t.kind === "error" ? <TriangleAlert aria-hidden /> : <Info aria-hidden />}
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

type Phase = "idle" | "working" | "done";
interface ActionButtonProps {
  /** The work. May return a promise; the button stays in "working" until it resolves (and at least minWorkMs). */
  onAction: () => unknown;
  children: ReactNode;
  workingLabel: string;
  doneLabel?: string;
  className?: string;
  disabled?: boolean;
  minWorkMs?: number;
  /** How long the done state shows before the button returns to idle (0 = stay done). */
  doneMs?: number;
}

export function ActionButton({ onAction, children, workingLabel, doneLabel, className = "btn", disabled, minWorkMs = 600, doneMs = 1600 }: ActionButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true; // set on every mount (React may mount twice in development)
    return () => {
      alive.current = false;
    };
  }, []);
  const run = async () => {
    if (phase === "working") return;
    setPhase("working");
    try {
      await Promise.all([Promise.resolve(onAction()), wait(minWorkMs)]);
      if (!alive.current) return;
      if (doneLabel) {
        setPhase("done");
        if (doneMs > 0) {
          await wait(doneMs);
          if (alive.current) setPhase("idle");
        }
      } else setPhase("idle");
    } catch {
      if (alive.current) setPhase("idle");
    }
  };
  return (
    <button type="button" className={`${className} is-${phase}`} onClick={run} disabled={disabled || phase === "working"} aria-busy={phase === "working"}>
      {phase === "working" ? (
        <>
          <Loader2 className="spin" aria-hidden /> {workingLabel}
        </>
      ) : phase === "done" ? (
        <>
          <Check className="pop" aria-hidden /> {doneLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
