/**
 * The goal empty state: nothing to act on today. It should feel like an achievement, not like a blank page:
 * a calm orbit scene in the crew's palette, a short animation (off with reduced motion), why it is empty,
 * and what to do next.
 */
import type { ReactNode } from "react";
import { Check } from "./icons";
import { useMission } from "../store/mission";

export function AllClear({
  kicker,
  title,
  children,
  action,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const reduced = useMission((st) => st.settings.reducedMotion || st.settings.lowPower);
  const still =
    reduced ||
    (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
  return (
    <section className="all-clear" aria-labelledby="all-clear-title">
      <svg className="all-clear-art" viewBox="0 0 240 200" aria-hidden>
        <g className="ac-stars">
          <circle cx="28" cy="34" r="2" />
          <circle cx="206" cy="26" r="2.5" />
          <circle cx="220" cy="140" r="1.8" />
          <circle cx="40" cy="160" r="2.2" />
          <circle cx="120" cy="14" r="1.6" />
        </g>
        <ellipse className="ac-orbit" cx="120" cy="104" rx="96" ry="34" />
        <circle className="ac-planet" cx="120" cy="104" r="46" />
        <path className="ac-land" d="M88 92c10-8 22-6 30 0s20 8 26 2M92 118c12 6 30 6 44-2" />
        {still ? (
          <circle className="ac-ship" cx="216" cy="104" r="7" />
        ) : (
          <circle className="ac-ship" r="7">
            <animateMotion
              dur="9s"
              repeatCount="indefinite"
              path="M216 104 A96 34 0 1 1 24 104 A96 34 0 1 1 216 104"
            />
          </circle>
        )}
        <g className="ac-check">
          <circle cx="164" cy="62" r="20" />
          <path d="M154 62l7 7 13-14" />
        </g>
      </svg>
      <div className="all-clear-copy">
        <p className="all-clear-kicker">
          <Check aria-hidden /> {kicker}
        </p>
        <h2 id="all-clear-title">{title}</h2>
        {children}
        {action && (
          <div className="row" style={{ marginTop: "var(--sp-3)" }}>
            {action}
          </div>
        )}
      </div>
    </section>
  );
}
