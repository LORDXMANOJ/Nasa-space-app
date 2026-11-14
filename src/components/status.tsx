/**
 * Status primitives: shape + word + colour, never colour alone.
 * StatusShape (circle-check / triangle / octagon / dashed circle) and StatusBadge.
 */
import type { Status } from "../engine/alerts";
import { statusLabel } from "../lib/format";

export function StatusShape({ status, size = 16 }: { status: Status; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 16 16", "aria-hidden": true as const };
  switch (status) {
    case "nominal":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <polyline points="4.6,8.3 7,10.6 11.4,5.6" fill="none" stroke="var(--bg)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "watch":
      return (
        <svg {...common}>
          <path d="M8 1.2 15 14.4H1Z" fill="currentColor" strokeLinejoin="round" />
          <rect x="7.1" y="5.6" width="1.8" height="4.6" rx="0.9" fill="var(--bg)" />
          <circle cx="8" cy="12.1" r="1" fill="var(--bg)" />
        </svg>
      );
    case "act":
      return (
        <svg {...common}>
          <path d="M5 0.8h6L15.2 5v6L11 15.2H5L0.8 11V5Z" fill="currentColor" />
          <rect x="7.1" y="3.8" width="1.8" height="5.4" rx="0.9" fill="var(--bg)" />
          <circle cx="8" cy="11.6" r="1.05" fill="var(--bg)" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="2.6 2.2" />
        </svg>
      );
  }
}

export function StatusBadge({ status, large }: { status: Status; large?: boolean }) {
  return (
    <span className={`badge s-${status}${large ? " badge--lg" : ""}`}>
      <StatusShape status={status} />
      {statusLabel[status]}
    </span>
  );
}

export const statusColorVar = (s: Status) => `var(--${s})`;
