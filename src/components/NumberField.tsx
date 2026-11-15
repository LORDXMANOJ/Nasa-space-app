/**
 * Touch-first number entry. Big − / + steppers handle small corrections without any keyboard.
 * Tapping the value opens an on-screen number pad (a bottom sheet); a physical keyboard also works there.
 * The system keyboard never pops up (inputMode="none"), so the screen stays calm on a touch panel.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Delete, Minus, Plus } from "./icons";

interface Props {
  id: string;
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  decimals: number;
  min: number;
  max: number;
  invalid?: boolean;
  readOnly?: boolean;
  shake?: number;
  placeholder?: string;
}

export function NumberField({
  id,
  label,
  unit,
  value,
  onChange,
  decimals,
  min,
  max,
  invalid,
  readOnly,
  shake,
  placeholder = "Tap to enter",
}: Props) {
  const [open, setOpen] = useState(false);
  const step = decimals > 0 ? Math.pow(10, -decimals) : 1;
  const bump = (dir: 1 | -1) => {
    const n = Number(value);
    const base = value === "" || Number.isNaN(n) ? Math.round((min + max) / 2) : n;
    const v = Math.min(max, Math.max(min, base + dir * step));
    onChange(v.toFixed(decimals));
  };
  return (
    <div className={`nf-field${invalid ? " is-invalid" : ""}${shake ? " jiggle" : ""}`} key={shake}>
      {!readOnly && (
        <button type="button" className="nf-step" aria-label={`Lower ${label}`} onClick={() => bump(-1)}>
          <Minus aria-hidden />
        </button>
      )}
      <button
        type="button"
        id={id}
        className="nf-value"
        aria-label={`${label}: ${value || "not entered"} ${unit}. ${readOnly ? "Read from your wearable." : "Tap to type."}`}
        aria-invalid={invalid || undefined}
        disabled={readOnly}
        onClick={() => setOpen(true)}
      >
        {value ? (
          <span key={value} className="num">
            {value}
          </span>
        ) : (
          <span className="nf-ph">{placeholder}</span>
        )}
        <small>{unit}</small>
      </button>
      {!readOnly && (
        <button type="button" className="nf-step" aria-label={`Raise ${label}`} onClick={() => bump(1)}>
          <Plus aria-hidden />
        </button>
      )}
      {open && (
        <Keypad
          label={label}
          unit={unit}
          initial={value}
          decimals={decimals}
          onClose={(v) => {
            setOpen(false);
            if (v !== null) onChange(v);
            window.setTimeout(() => document.getElementById(id)?.focus(), 0);
          }}
        />
      )}
    </div>
  );
}

function Keypad({
  label,
  unit,
  initial,
  decimals,
  onClose,
}: {
  label: string;
  unit: string;
  initial: string;
  decimals: number;
  onClose: (v: string | null) => void;
}) {
  const [v, setV] = useState(initial);
  const [fresh, setFresh] = useState(true); // the first key replaces the old value
  const done = useRef<HTMLButtonElement>(null);
  const type = (k: string) => {
    setV((cur) => {
      const base = fresh ? "" : cur;
      if (k === "⌫") return base.slice(0, -1);
      if (k === "." && (decimals === 0 || base.includes("."))) return base;
      if (base.includes(".") && base.split(".")[1].length >= decimals && k !== ".") return base;
      if (base.replace(".", "").length >= 6) return base;
      return base + k;
    });
    setFresh(false);
  };
  useEffect(() => {
    done.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) type(e.key);
      else if (e.key === "." || e.key === ",") type(".");
      else if (e.key === "Backspace") type("⌫");
      else if (e.key === "Enter") onClose(v);
      else if (e.key === "Escape") onClose(null);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", decimals > 0 ? "." : "", "0", "⌫"];
  return createPortal(
    <div className="kp-scrim" onClick={() => onClose(v)}>
      <div
        className="kp-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Enter ${label}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="kp-label">{label}</p>
        <p className="kp-display" aria-live="polite">
          <span className={fresh ? "kp-old" : ""}>{v || "–"}</span> <small>{unit}</small>
        </p>
        <div className="kp-keys">
          {keys.map((k, i) =>
            k ? (
              <button
                key={i}
                type="button"
                className="kp-key"
                aria-label={k === "⌫" ? "Delete" : k === "." ? "Decimal point" : k}
                onClick={() => type(k)}
              >
                {k === "⌫" ? <Delete aria-hidden /> : k}
              </button>
            ) : (
              <span key={i} />
            ),
          )}
        </div>
        <div className="kp-actions">
          <button type="button" className="btn" onClick={() => onClose(null)}>
            Cancel
          </button>
          <button type="button" ref={done} className="btn btn--primary btn--lg" onClick={() => onClose(v)}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
