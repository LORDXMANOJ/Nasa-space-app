/**
 * Small shared UI pieces: indicator icon, sparkline, trend arrow, readiness ring, hazard chip,
 * glossary-aware text, modal and empty state. Styling lives in styles/components.css.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Brain,
  Droplet,
  Gauge,
  HeartPulse,
  Moon,
  Radiation,
  Scale,
  Thermometer,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { hazardById, type HazardId } from "../data";
import type { Status } from "../engine/alerts";
import { statusColorVar } from "./status";

const ICONS: Record<string, LucideIcon> = {
  gauge: Gauge,
  "heart-pulse": HeartPulse,
  wind: Wind,
  thermometer: Thermometer,
  moon: Moon,
  brain: Brain,
  droplet: Droplet,
  radiation: Radiation,
  scale: Scale,
};
export function IndicatorIcon({ name, size = 18 }: { name: string; size?: number }) {
  const C = ICONS[name] ?? Activity;
  return <C width={size} height={size} aria-hidden />;
}

export function Sparkline({
  values,
  status,
  height = 36,
}: {
  values: number[];
  status: Status;
  height?: number;
}) {
  if (values.length < 2) return <svg className="spark" style={{ height }} aria-hidden />;
  const w = 200;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map(
    (v, i) => `${(i / (values.length - 1)) * w},${height - 4 - ((v - min) / span) * (height - 8)}`,
  );
  const last = pts[pts.length - 1].split(",");
  return (
    <svg
      className="spark"
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      style={{ height }}
      aria-hidden
    >
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={statusColorVar(status)}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="3" fill={statusColorVar(status)} />
    </svg>
  );
}

export function TrendArrow({ delta, label }: { delta: number; label?: string }) {
  const Icon = Math.abs(delta) < 0.0001 ? ArrowRight : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const word = Math.abs(delta) < 0.0001 ? "steady" : delta > 0 ? "rising" : "falling";
  return (
    <span className="trend" title={`Trend: ${word}`}>
      <Icon aria-hidden />
      <span className="sr-only">{word}</span>
      {label}
    </span>
  );
}

export function ReadinessRing({
  score,
  size = 168,
  stroke = 14,
}: {
  score: number;
  size?: number;
  stroke?: number;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const status: Status = score >= 85 ? "nominal" : score >= 65 ? "watch" : "act";
  return (
    <div
      className="ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Crew readiness ${score} out of 100`}
    >
      <svg width={size} height={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={statusColorVar(status)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="ring-center">
        <span className="num">{score}</span>
        <span className="label">Readiness</span>
      </div>
    </div>
  );
}

export function HazardChip({ id, link = true }: { id: HazardId; link?: boolean }) {
  const h = hazardById(id);
  return link ? (
    <Link className="chip" to={`/hazards#${id}`} title={h.name}>
      {h.short}
    </Link>
  ) : (
    <span className="chip">{h.short}</span>
  );
}

/** A glossary term with a click/focus popover: plain definitions for crew without medical training. */
export function Term({ term, def, children }: { term: string; def: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof KeyboardEvent && e.key !== "Escape") return;
      if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", close);
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("mousedown", close);
    };
  }, [open]);
  return (
    <button
      ref={ref}
      type="button"
      className="term"
      aria-expanded={open}
      aria-describedby={open ? id : undefined}
      onClick={() => setOpen((o) => !o)}
      onBlur={() => setOpen(false)}
    >
      {children ?? term}
      {open && (
        <span role="tooltip" id={id} className="term-pop">
          <b>{term}</b>
          {def}
        </span>
      )}
    </button>
  );
}

/** Renders text and turns any glossary term it contains into a <Term>. */
export function GlossaryText({ text, glossary }: { text: string; glossary: Record<string, string> }) {
  const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
  if (terms.length === 0) return <>{text}</>;
  const esc = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${esc.join("|")})`, "g");
  const parts = text.split(re);
  const used = new Set<string>();
  return (
    <>
      {parts.map((p, i) => {
        if (glossary[p] && !used.has(p)) {
          used.add(p);
          return <Term key={i} term={p} def={glossary[p]} />;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        style={wide ? { width: "min(980px, 100%)" } : undefined}
      >
        <div className="row" style={{ marginBottom: "var(--sp-5)" }}>
          <h2>{title}</h2>
          <span className="spacer" />
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      {icon}
      <h3 style={{ color: "var(--text)" }}>{title}</h3>
      {children}
    </div>
  );
}
