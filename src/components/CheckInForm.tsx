/**
 * Today's check-in, touch first and in three short steps (progressive disclosure):
 *   1 Your wearable: readings that arrived on their own; the crew member only confirms or nudges them.
 *   2 Measure: the device readings due today (skipped when nothing is due). One tap on Measure fills each.
 *   3 How you feel: mood (required), symptoms and pain (optional).
 * Each row shows the astronaut's Earth (pre-flight) value. Numbers change with − / + or an on-screen pad,
 * never the system keyboard. Pressing Next or See my results with something missing moves to the first
 * missing field, jiggles it and says what is needed. Submitting shows "Checking your readings…" first.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Cpu, Loader2, Radio } from "./icons";
import { indicatorById, type Indicator } from "../data";
import { learnMetricBaselines } from "../engine/detectors";
import { isScheduled, type Reading } from "../engine/simulation";
import { canSkip } from "../engine/crew";
import { useCrew } from "../store/crew";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";
import { toastWhenSaved } from "../store/toast";
import { ActionButton } from "./Feedback";
import { NumberField } from "./NumberField";
import { IndicatorIcon } from "./ui";

type Mode = "auto" | "device";
interface Field {
  key: string;
  label: string;
  idx: number;
  unit: string;
  decimals: number;
  min: number;
  max: number;
}
interface Row {
  ind: Indicator;
  mode: Mode;
  fields: Field[];
}
type StepId = "wearable" | "devices" | "feel";

const ORDER: [string, Mode][] = [
  ["hr", "auto"],
  ["temp", "auto"],
  ["sleep", "auto"],
  ["radiation", "auto"],
  ["bp", "device"],
  ["spo2", "device"],
  ["glucose", "device"],
  ["weight", "device"],
];
const RANGE: Record<string, [number, number]> = {
  "hr.hr": [25, 220],
  "temp.temp": [33, 43],
  "sleep.hours": [0, 16],
  "radiation.dose": [0, 2000],
  "bp.systolic": [60, 260],
  "bp.diastolic": [30, 160],
  "spo2.spo2": [60, 100],
  "glucose.glucose": [20, 600],
  "weight.mass": [30, 200],
};
const SYMPTOMS = [
  "Feeling hot or shivery",
  "Headache",
  "Cough or sore throat",
  "Nausea",
  "Dizziness",
  "Chest pain",
  "Short of breath",
  "Aches",
  "Rash",
  "None",
];
const STEP_TITLE: Record<StepId, string> = {
  wearable: "Your wearable",
  devices: "Measure",
  feel: "How you feel",
};
const STEP_HINT: Record<StepId, string> = {
  wearable: "Your wearable already sent these. Check they look right; use − and + to fix one.",
  devices: "Press Measure and hold still. The number fills in by itself.",
  feel: "Only you can tell us this part.",
};
const MOOD_ID = "mood.mood";
/** Simulated measuring time per device (a real cuff takes 30 to 40 s; shortened for the demo) and the words shown meanwhile. */
const MEASURE: Record<string, { ms: number; steps: [number, string][] }> = {
  bp: {
    ms: 4200,
    steps: [
      [1200, "Cuff filling… hold still"],
      [2600, "Reading your pulse…"],
      [3600, "Almost done…"],
    ],
  },
  default: { ms: 2200, steps: [[1100, "Almost done…"]] },
};
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export function CheckInForm({ onDone }: { onDone?: () => void }) {
  const h = useHealth();
  const reduced = useMission((s) => s.settings.reducedMotion || s.settings.lowPower);
  const addReadings = useMission((s) => s.addReadings);
  const setSymptoms = useMission((s) => s.setSymptoms);
  const markCheckedIn = useMission((s) => s.markCheckedIn);
  const earth = useMemo(() => learnMetricBaselines(h.history), [h.history]);

  const rows: Row[] = ORDER.map(([id, mode]) => {
    const ind = indicatorById(id);
    const metricIdx = id === "bp" ? [0, 1] : [0];
    return {
      ind,
      mode,
      fields: metricIdx.map((i) => {
        const m = ind.metrics[i];
        const key = `${id}.${m.key}`;
        return {
          key,
          label: id === "bp" ? (i === 0 ? "Top number" : "Bottom number") : m.label,
          idx: i,
          unit: m.unit,
          decimals: m.decimals,
          min: RANGE[key]?.[0] ?? 0,
          max: RANGE[key]?.[1] ?? 1e6,
        };
      }),
    };
  }).filter((r) => r.mode === "auto" || isScheduled(r.ind, h.day) || h.due.some((d) => d.id === r.ind.id));
  const byStep: Record<StepId, Row[]> = {
    wearable: rows.filter((r) => r.mode === "auto"),
    devices: rows.filter((r) => r.mode === "device"),
    feel: [],
  };
  const steps: StepId[] = byStep.devices.length ? ["wearable", "devices", "feel"] : ["wearable", "feel"];

  const sim = (ind: Indicator) => h.simulate(ind);
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const r of rows) {
      if (r.mode !== "auto") continue;
      const s = sim(r.ind);
      r.fields.forEach((f) => (v[f.key] = s[f.idx].toFixed(f.decimals)));
    }
    return v;
  });
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const [symptoms, setSym] = useState<string[]>([]);
  const [pain, setPain] = useState(0);
  const [tried, setTried] = useState<Record<StepId, boolean>>({
    wearable: false,
    devices: false,
    feel: false,
  });
  const [shake, setShake] = useState<{ key: string; n: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const cur = steps[step];
  // "Didn't measure": a real crew member may skip a reading for one day, never two days in a row
  const setSkips = useCrew((s) => s.setSkips);
  const pastSkips = h.member?.skips ?? {};
  const [skipped, setSkipped] = useState<string[]>(() => h.member?.skips[h.day] ?? []);
  const skippable = (r: Row) => !!h.member && r.ind.id !== "radiation" && canSkip(pastSkips, r.ind.id, h.day);
  const skippedYesterday = (r: Row) => !!h.member && !canSkip(pastSkips, r.ind.id, h.day);
  const isSkipped = (key: string) => skipped.includes(key.split(".")[0]);

  const err = (f: Field) => {
    if (isSkipped(f.key)) return "";
    const raw = vals[f.key];
    if (raw === undefined || raw === "") return "Needed. Press Measure or tap the box to type it.";
    const n = Number(raw);
    if (Number.isNaN(n)) return "Numbers only";
    if (n < f.min || n > f.max)
      return `${raw} ${f.unit} can't be right: a person reads ${f.min} to ${f.max} ${f.unit}. Check the number and enter it again.`;
    return "";
  };
  const firstProblem = (s: StepId): string | null => {
    if (s === "feel") return mood === null ? MOOD_ID : null;
    for (const r of byStep[s]) for (const f of r.fields) if (err(f)) return f.key;
    return null;
  };
  const missingIn = (s: StepId) =>
    s === "feel" ? (mood === null ? 1 : 0) : byStep[s].flatMap((r) => r.fields.filter((f) => err(f))).length;
  const missingAll = steps.reduce((n, s) => n + missingIn(s), 0);

  // after a step change caused by validation, bring the problem field into view, focus it and jiggle it
  useEffect(() => {
    if (!shake) return;
    const el = document.getElementById(shake.key === MOOD_ID ? "mood-scale" : shake.key);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    const target = shake.key === MOOD_ID ? el.querySelector("button") : el;
    (target as HTMLElement | null)?.focus({ preventScroll: true });
  }, [shake, step, reduced]);

  const flag = (s: StepId, key: string) => {
    setTried((t) => ({ ...t, [s]: true }));
    setStep(steps.indexOf(s));
    setShake((p) => ({ key, n: (p?.n ?? 0) + 1 }));
  };

  const next = () => {
    const p = firstProblem(cur);
    if (p) return flag(cur, p);
    setStep((i) => i + 1);
    document.getElementById("main")?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  const submit = async () => {
    for (const s of steps) {
      const p = firstProblem(s);
      if (p) return flag(s, p);
    }
    setSubmitting(true);
    await wait(reduced ? 300 : 1100);
    const rs: Reading[] = rows.filter((r) => !skipped.includes(r.ind.id)).map((r) => {
      const values = sim(r.ind);
      r.fields.forEach((f) => (values[f.idx] = Number(vals[f.key])));
      if (r.ind.id === "weight") {
        const launch = earth["weight.mass"]?.mean ?? values[0];
        values[1] = Math.round(((values[0] - launch) / launch) * 1000) / 10;
      }
      return { indicatorId: r.ind.id, day: h.day, values, source: "user" };
    });
    const ms = h.simulate(indicatorById("mood"));
    rs.push({ indicatorId: "mood", day: h.day, values: [mood!, ms[1]], source: "user" });
    addReadings(rs);
    if (h.member) setSkips(h.member.id, h.day, skipped);
    setSymptoms(h.day, symptoms.filter((s) => s !== "None").concat(pain > 0 ? [`Pain ${pain}/10`] : []));
    markCheckedIn();
    toastWhenSaved("Check-in saved. Here are your results.");
    onDone?.();
  };

  const measure = (r: Row) =>
    wait((MEASURE[r.ind.id] ?? MEASURE.default).ms).then(() => {
      const s = sim(r.ind);
      setVals((v) => {
        const n = { ...v };
        r.fields.forEach((f) => (n[f.key] = s[f.idx].toFixed(f.decimals)));
        return n;
      });
    });

  const earthText = (r: Row) =>
    r.fields.map((f) => (earth[f.key] ? earth[f.key].mean.toFixed(f.decimals) : "none")).join("/") +
    ` ${r.fields[0].unit}`;

  const renderRow = (r: Row) => (
    <li key={r.ind.id} className="ci-card">
      <div className="ci-card-head">
        <IndicatorIcon name={r.ind.icon} />
        <div>
          <strong>{r.ind.shortName}</strong>
          <span className="dim">
            {r.mode === "auto" ? <Radio width={14} aria-hidden /> : <Cpu width={14} aria-hidden />} On Earth:{" "}
            <span className="num">{earthText(r)}</span>
          </span>
        </div>
      </div>
      <div className="ci-card-body">
        {skipped.includes(r.ind.id) && <p className="ci-skipped">Not measured today. It must be measured tomorrow.</p>}
        {!skipped.includes(r.ind.id) && r.fields.map((f) => {
          const e = tried[cur] || touched[f.key] ? err(f) : "";
          return (
            <div key={f.key} className="ci-numfield">
              {r.fields.length > 1 && <span className="ci-sub">{f.label}</span>}
              <NumberField
                id={f.key}
                label={`${r.ind.shortName}${r.fields.length > 1 ? ` ${f.label}` : ""}`}
                unit={f.unit}
                value={vals[f.key] ?? ""}
                onChange={(v) => {
                  setVals((c) => ({ ...c, [f.key]: v }));
                  setTouched((t) => ({ ...t, [f.key]: true }));
                }}
                decimals={f.decimals}
                min={f.min}
                max={f.max}
                invalid={!!e}
                readOnly={r.ind.id === "radiation"}
                shake={shake?.key === f.key && !reduced ? shake.n : undefined}
              />
              {e && <small className="ci-err">{e}</small>}
            </div>
          );
        })}
        {skippable(r) && (
          <button
            type="button"
            className="btn btn--ghost ci-skip"
            aria-pressed={skipped.includes(r.ind.id)}
            onClick={() =>
              setSkipped((l) => (l.includes(r.ind.id) ? l.filter((x) => x !== r.ind.id) : [...l, r.ind.id]))
            }
          >
            {skipped.includes(r.ind.id) ? "Measure it after all" : "Didn't measure"}
          </button>
        )}
        {skippedYesterday(r) && <small className="ci-skip-note">Skipped yesterday, so it is needed today.</small>}
        {r.mode === "device" && !skipped.includes(r.ind.id) && (
          <ActionButton
            className="btn btn--primary ci-measure"
            onAction={() => measure(r)}
            workingLabel={r.ind.id === "bp" ? "Starting the cuff…" : "Hold still…"}
            steps={(MEASURE[r.ind.id] ?? MEASURE.default).steps}
            expectedMs={(MEASURE[r.ind.id] ?? MEASURE.default).ms}
            doneLabel="Measured"
          >
            {vals[r.fields[0].key] ? "Measure again" : "Measure"}
          </ActionButton>
        )}
      </div>
    </li>
  );

  return (
    <form
      className="ci-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (step < steps.length - 1) next();
        else void submit();
      }}
      noValidate
      aria-busy={submitting}
    >
      <ol className="ci-steps" aria-label="Check-in steps">
        {steps.map((s, i) => (
          <li
            key={s}
            className={i < step ? "is-done" : i === step ? "is-now" : ""}
            aria-current={i === step ? "step" : undefined}
          >
            <span className="k">{i < step ? <Check width={16} aria-label="done" /> : i + 1}</span>
            {STEP_TITLE[s]}
          </li>
        ))}
      </ol>

      <div className="ci-pane" key={cur}>
        <h3 className="ci-pane-title">
          Step {step + 1} of {steps.length}: {STEP_TITLE[cur]}
        </h3>
        <p className="dim ci-pane-hint">{STEP_HINT[cur]}</p>

        {cur !== "feel" ? (
          <ul className="ci-cards">{byStep[cur].map(renderRow)}</ul>
        ) : (
          <div className="stack" style={{ gap: "var(--sp-6)" }}>
            <fieldset
              className={`ci-mood${shake?.key === MOOD_ID && !reduced ? " jiggle" : ""}`}
              key={shake?.key === MOOD_ID ? shake.n : 0}
            >
              <legend>
                Mood today <span className="req">Required</span>{" "}
                <span className="dim">
                  (1 very low, 10 great; on Earth: {earth[MOOD_ID] ? earth[MOOD_ID].mean.toFixed(0) : "none"})
                </span>
              </legend>
              <div
                id="mood-scale"
                className="mood-scale"
                role="group"
                aria-label="Mood from 1 (very low) to 10 (great)"
                aria-invalid={tried.feel && mood === null}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button type="button" key={n} aria-pressed={mood === n} onClick={() => setMood(n)}>
                    {n}
                  </button>
                ))}
              </div>
              {tried.feel && mood === null && <small className="ci-err">Pick a number for your mood.</small>}
            </fieldset>

            <fieldset className="ci-symptoms">
              <legend>
                Any symptoms today? <span className="dim">(optional, tap all that fit)</span>
              </legend>
              <div className="symptoms">
                {SYMPTOMS.map((s) => (
                  <label key={s}>
                    <input
                      type="checkbox"
                      checked={symptoms.includes(s)}
                      onChange={(e) =>
                        setSym((c) =>
                          s === "None"
                            ? e.target.checked
                              ? ["None"]
                              : []
                            : e.target.checked
                              ? [...c.filter((x) => x !== "None"), s]
                              : c.filter((x) => x !== s),
                        )
                      }
                    />
                    <span className="sym-box" aria-hidden>
                      <Check />
                    </span>
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="field ci-pain">
              <span>
                Pain right now: <strong className="num">{pain}</strong>/10{" "}
                <span className="dim">(optional)</span>
              </span>
              <input
                type="range"
                min={0}
                max={10}
                value={pain}
                onChange={(e) => setPain(Number(e.target.value))}
              />
            </label>
          </div>
        )}
      </div>

      <div className="ci-bar">
        {step > 0 ? (
          <button
            type="button"
            className="btn btn--lg"
            onClick={() => setStep((i) => i - 1)}
            disabled={submitting}
          >
            <ArrowLeft aria-hidden /> Back
          </button>
        ) : (
          <span />
        )}
        <span className="dim ci-bar-note" aria-live="polite">
          {submitting ? "" : missingAll > 0 ? `${missingAll} still to fill` : "All filled in"}
        </span>
        {step < steps.length - 1 ? (
          <button type="submit" className="btn btn--primary btn--lg">
            Next <ArrowRight aria-hidden />
          </button>
        ) : (
          <button
            type="submit"
            className={`btn btn--primary btn--lg ci-go${submitting ? " is-working" : ""}`}
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="spin" aria-hidden /> Checking your readings…
              </>
            ) : (
              "See my results"
            )}
            {submitting && <span className="ci-go-bar" aria-hidden />}
          </button>
        )}
      </div>
    </form>
  );
}
