/**
 * Guided measurement: one reusable 4-step template for every indicator.
 * (1) Why this matters in space → (2) How to: animated step cards with captions (MP4s optional, cut first)
 * → (3) Capture: simulated device stream, reaction-time test for mood, or manual entry → (4) Result + "Why this status?".
 */
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, CircleHelp, Pause, Play, PenLine } from "../components/icons";
import { INDICATORS, indicatorById, type Indicator } from "../data";
import { simulateReading } from "../engine/simulation";
import { learnMetricBaselines } from "../engine/detectors";
import { formatPrimary, statusLabel } from "../lib/format";
import { GlossaryText, HazardChip, IndicatorIcon } from "../components/ui";
import { StatusBadge } from "../components/status";
import { DecisionPanel } from "../components/DecisionPanel";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";

const MODE: Record<string, string> = {
  manual: "Manual",
  "sensor-sim": "Device (simulated)",
  "camera-sim": "Camera (simulated)",
  file: "File",
};

export function MeasureList() {
  const h = useHealth();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Guided measurements</h1>
          <p className="lede">
            Each one explains why it matters in space, shows how to do it, then reads the (simulated) device.
          </p>
        </div>
        <Link className="btn btn--primary" to="/checkin">
          Quick daily check-in
        </Link>
      </div>
      <div className="measure-grid">
        {INDICATORS.map((ind) => (
          <Link key={ind.id} to={`/measure/${ind.id}`} className="card tile" style={{ minHeight: 0 }}>
            <div className="tile-head">
              <IndicatorIcon name={ind.icon} />
              <strong style={{ color: "var(--text)" }}>{ind.name}</strong>
            </div>
            <span className="dim" style={{ fontSize: "var(--fs-sm)" }}>
              {ind.deviceName} · {MODE[ind.inputType]} · every{" "}
              {ind.cadenceHours >= 48 ? `${Math.round(ind.cadenceHours / 24)} days` : "day"}
            </span>
            <div className="tile-foot">
              <StatusBadge status={h.evals[ind.id].status} />
              {h.due.some((d) => d.id === ind.id) && <span className="chip">Due today</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

const STEPS = ["Why it matters", "How to do it", "Take the reading", "Your result"];

export function MeasureFlow() {
  const { id = "bp" } = useParams();
  const ind = INDICATORS.find((i) => i.id === id) ?? indicatorById("bp");
  const completions = useMission((s) => s.completions[ind.id] ?? 0);
  const [step, setStep] = useState(0);
  useEffect(() => setStep(0), [ind.id]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link to="/measure" className="btn btn--ghost btn--sm" style={{ marginBottom: "var(--sp-3)" }}>
            <ArrowLeft /> All measurements
          </Link>
          <h1>{ind.name}</h1>
          <p className="lede">{ind.deviceName}</p>
        </div>
        {completions >= 3 && step < 2 && (
          <button className="btn" onClick={() => setStep(2)}>
            Quick measure (you've done this {completions}×)
          </button>
        )}
      </div>
      <div className="flow">
        <ol className="stepper" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i < step ? "done" : ""}>
              <button
                aria-current={i === step ? "step" : undefined}
                onClick={() => i <= 2 && setStep(i)}
                disabled={i === 3 && step < 3}
              >
                <span className="k">
                  {i < step ? <Check width={16} height={16} aria-label="done" /> : i + 1}
                </span>
                {s}
              </button>
            </li>
          ))}
        </ol>
        <div>
          {step === 0 && <Why ind={ind} onNext={() => setStep(1)} />}
          {step === 1 && <HowTo ind={ind} onNext={() => setStep(2)} />}
          {step === 2 && <Capture ind={ind} onDone={() => setStep(3)} />}
          {step === 3 && <Result ind={ind} />}
        </div>
      </div>
    </div>
  );
}

function Why({ ind, onNext }: { ind: Indicator; onNext: () => void }) {
  return (
    <section className="card stack reveal">
      <div className="label">Why this matters in space</div>
      <p style={{ fontSize: "var(--fs-lg)", lineHeight: 1.45, maxWidth: "60ch" }}>
        <GlossaryText text={ind.whyItMatters} glossary={ind.glossary} />
      </p>
      <div className="row">
        <span className="dim">Linked hazards:</span>
        {ind.hazards.map((hz) => (
          <HazardChip key={hz} id={hz} />
        ))}
      </div>
      <div className="row dim" style={{ fontSize: "var(--fs-sm)" }}>
        {ind.deviceVerified ? <BadgeCheck width={16} aria-hidden /> : <CircleHelp width={16} aria-hidden />}
        {ind.deviceVerified
          ? "Device name confirmed in a public source."
          : "Generic device name; this reading is simulated."}{" "}
        Limits:{" "}
        {ind.thresholdSource === "demo-assumption"
          ? "demo assumption"
          : ind.thresholdSource === "NASA"
            ? "NASA standard"
            : "clinical reference"}
        .
      </div>
      <div className="row">
        <button className="btn btn--primary btn--lg" onClick={onNext}>
          Show me how <ArrowRight />
        </button>
      </div>
    </section>
  );
}

function HowTo({ ind, onNext }: { ind: Indicator; onNext: () => void }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const lowPower = useMission((s) => s.settings.lowPower);
  const n = ind.howToSteps.length;
  useEffect(() => {
    if (!playing || lowPower) return;
    const t = window.setTimeout(() => setI((x) => (x + 1 < n ? x + 1 : x)), 4200);
    return () => window.clearTimeout(t);
  }, [i, playing, n, lowPower]);
  return (
    <section className="card stack reveal">
      <div className="howto">
        <div>
          <div
            className="stepcard"
            role="img"
            aria-label={`Step ${i + 1} of ${n}: ${ind.howToSteps[i].text}`}
          >
            <span className="big">{String(i + 1).padStart(2, "0")}</span>
            <p className="cap" key={i}>
              {ind.howToSteps[i].text}
            </p>
            <span className="progress" style={{ width: `${((i + 1) / n) * 100}%` }} />
          </div>
          <div className="row" style={{ marginTop: "var(--sp-3)" }}>
            <button
              className="btn btn--sm"
              onClick={() => setI((x) => Math.max(0, x - 1))}
              aria-label="Previous step"
            >
              <ArrowLeft />
            </button>
            <button className="btn btn--sm" onClick={() => setPlaying((p) => !p)}>
              {playing ? <Pause /> : <Play />} {playing ? "Pause" : "Play"}
            </button>
            <button
              className="btn btn--sm"
              onClick={() => setI((x) => Math.min(n - 1, x + 1))}
              aria-label="Next step"
            >
              <ArrowRight />
            </button>
            <span className="dim" style={{ fontSize: "var(--fs-sm)" }}>
              Animated step cards. Captions are the step text.
            </span>
          </div>
        </div>
        <ol className="steps-list">
          {ind.howToSteps.map((s, k) => (
            <li key={k} className={k === i ? "is-on" : ""}>
              <GlossaryText text={s.text} glossary={ind.glossary} />
            </li>
          ))}
        </ol>
      </div>
      <div className="row">
        <button className="btn btn--primary btn--lg" onClick={onNext}>
          I'm ready to measure <ArrowRight />
        </button>
      </div>
    </section>
  );
}

function Capture({ ind, onDone }: { ind: Indicator; onDone: () => void }) {
  const h = useHealth();
  const env = useMission((s) => s.environment);
  const addReadings = useMission((s) => s.addReadings);
  const [phase, setPhase] = useState<"idle" | "running" | "manual">("idle");
  const [progress, setProgress] = useState(0);
  const target = simulateReading(ind, h.day, h.profile, env);
  const save = (values: number[]) => {
    addReadings([{ indicatorId: ind.id, day: h.day, values, source: "user" }]);
    onDone();
  };

  useEffect(() => {
    if (phase !== "running") return;
    const dur = Math.min(4000, ind.captureDurationSec * 500);
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / dur);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else save(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (ind.id === "mood") return <MoodCapture onSave={save} simReaction={target[1]} />;
  if (phase === "manual") return <ManualEntry ind={ind} onSave={save} onCancel={() => setPhase("idle")} />;

  const shown = ind.metrics.map((m, i) => (target[i] * Math.min(1, progress * 1.05)).toFixed(m.decimals));
  return (
    <section className="card stack reveal">
      <div className="capture" aria-live="polite">
        <Wave kind={ind.id} progress={progress} />
        <div className="readout">
          {phase === "running" ? (ind.id === "bp" ? `${shown[0]}/${shown[1]}` : shown[0]) : "Ready"}
        </div>
        <div className="dim">
          {phase === "running"
            ? `Reading from ${ind.deviceName}…`
            : `Simulated reading from ${ind.deviceName}. Stay still once you press start.`}
        </div>
      </div>
      <div className="row">
        <button
          className="btn btn--primary btn--lg"
          onClick={() => setPhase("running")}
          disabled={phase === "running"}
        >
          {phase === "running" ? "Measuring…" : "Start measurement"}
        </button>
        <button className="btn" onClick={() => setPhase("manual")} disabled={phase === "running"}>
          <PenLine /> Enter it by hand
        </button>
      </div>
    </section>
  );
}

function Wave({ kind, progress }: { kind: string; progress: number }) {
  if (kind === "bp") {
    const c = Math.PI * 90;
    return (
      <svg viewBox="0 0 220 120" className="wave" aria-hidden>
        <path
          d="M20 110 A90 90 0 0 1 200 110"
          fill="none"
          stroke="var(--border)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M20 110 A90 90 0 0 1 200 110"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
        />
      </svg>
    );
  }
  const pts: string[] = [];
  const N = 120;
  const upto = Math.floor(N * progress);
  for (let i = 0; i <= upto; i++) {
    const x = (i / N) * 560;
    const ph = (i % 30) / 30;
    const ecg =
      kind === "hr"
        ? ph > 0.45 && ph < 0.5
          ? -50
          : ph > 0.5 && ph < 0.55
            ? 30
            : Math.sin(ph * 6.28) * 6
        : Math.sin(ph * 6.28) * 28;
    pts.push(`${x},${60 + ecg}`);
  }
  return (
    <svg viewBox="0 0 560 120" className="wave" aria-hidden>
      <line x1="0" y1="60" x2="560" y2="60" stroke="var(--border)" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--nominal)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ManualEntry({
  ind,
  onSave,
  onCancel,
}: {
  ind: Indicator;
  onSave: (v: number[]) => void;
  onCancel: () => void;
}) {
  const [vals, setVals] = useState<string[]>(ind.metrics.map(() => ""));
  const bounds = (i: number) => {
    const m = ind.metrics[i];
    const span = Math.max(1, m.normalRange.max - m.normalRange.min);
    return {
      min: m.unit === "%" && m.key !== "change" ? 50 : m.normalRange.min - span * 2,
      max: m.normalRange.max + span * 3,
    };
  };
  const errs = vals.map((v, i) => {
    if (v === "") return "Required";
    const n = Number(v);
    const b = bounds(i);
    return Number.isNaN(n)
      ? "Numbers only"
      : n < b.min || n > b.max
        ? `Check this: usually ${ind.metrics[i].normalRange.min} to ${ind.metrics[i].normalRange.max} ${ind.metrics[i].unit}`
        : "";
  });
  const ok = errs.every((e) => !e);
  return (
    <section className="card stack reveal">
      <div className="label">Enter it by hand</div>
      {ind.metrics.map((m, i) => (
        <label key={m.key} className="field" style={{ maxWidth: 360 }}>
          <span>
            {m.label} ({m.unit})
          </span>
          <input
            className="input"
            inputMode="decimal"
            value={vals[i]}
            aria-invalid={!!errs[i] && vals[i] !== ""}
            onChange={(e) => setVals((v) => v.map((x, k) => (k === i ? e.target.value : x)))}
          />
          {vals[i] !== "" && errs[i] && <small style={{ color: "var(--watch)" }}>{errs[i]}</small>}
        </label>
      ))}
      <div className="row">
        <button className="btn btn--primary" disabled={!ok} onClick={() => onSave(vals.map(Number))}>
          Save reading
        </button>
        <button className="btn btn--ghost" onClick={onCancel}>
          Back
        </button>
      </div>
    </section>
  );
}

function MoodCapture({ onSave, simReaction }: { onSave: (v: number[]) => void; simReaction: number }) {
  const [mood, setMood] = useState<number | null>(null);
  const [trial, setTrial] = useState(0);
  const [state, setState] = useState<"idle" | "wait" | "go" | "early" | "done">("idle");
  const times = useRef<number[]>([]);
  const goAt = useRef(0);
  const timer = useRef<number>(0);
  const TRIALS = 5;
  const arm = () => {
    setState("wait");
    timer.current = window.setTimeout(
      () => {
        goAt.current = performance.now();
        setState("go");
      },
      1200 + Math.random() * 1800,
    );
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const tap = () => {
    if (state === "idle" || state === "early") return arm();
    if (state === "wait") {
      window.clearTimeout(timer.current);
      return setState("early");
    }
    if (state === "go") {
      times.current.push(performance.now() - goAt.current);
      const next = trial + 1;
      setTrial(next);
      if (next >= TRIALS) setState("done");
      else arm();
    }
  };
  const avg = times.current.length
    ? Math.round(times.current.reduce((a, b) => a + b, 0) / times.current.length)
    : null;
  return (
    <section className="card stack reveal">
      <div className="field">
        <span id="m-l">1. Rate your mood (1 = very low, 10 = great)</span>
        <div className="mood-scale" role="group" aria-labelledby="m-l">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button key={n} aria-pressed={mood === n} onClick={() => setMood(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>
          2. Reaction test: tap the pad as soon as it turns green ({Math.min(trial, TRIALS)}/{TRIALS})
        </span>
        <button
          className={`reaction-pad${state === "go" ? " is-go" : ""}`}
          onClick={tap}
          disabled={state === "done"}
        >
          {state === "idle" && "Tap to start"}
          {state === "wait" && "Wait for green…"}
          {state === "go" && "TAP!"}
          {state === "early" && "Too soon. Tap to try again"}
          {state === "done" && `Done: average ${avg} ms`}
        </button>
      </div>
      <div className="row">
        <button
          className="btn btn--primary btn--lg"
          disabled={mood === null}
          onClick={() => onSave([mood!, avg ?? simReaction])}
        >
          Save
        </button>
        {state !== "done" && (
          <span className="dim">You can skip the test; a simulated reaction time is used instead.</span>
        )}
      </div>
    </section>
  );
}

function Result({ ind }: { ind: Indicator }) {
  const h = useHealth();
  const settings = useMission((s) => s.settings);
  const navigate = useNavigate();
  const e = h.evals[ind.id];
  const r = h.history[ind.id].at(-1);
  const v = formatPrimary(ind, r?.values, settings);
  const base = learnMetricBaselines(h.history)[`${ind.id}.${ind.metrics[0].key}`];
  const diff = r && base ? r.values[0] - base.mean : 0;
  const alert = h.alerts.find((a) => a.indicatorIds.includes(ind.id));
  return (
    <section className="card stack reveal" aria-live="polite">
      <StatusBadge status={e.status} large />
      <div className="row" style={{ alignItems: "baseline" }}>
        <span className="result-big">{v.text}</span>
        <span className="dim mono">{v.unit}</span>
        {base && ind.id !== "radiation" && (
          <span className="mono" style={{ color: `var(--${e.status === "stale" ? "stale" : e.status})` }}>
            {diff >= 0 ? "+" : "−"}
            {Math.abs(diff).toFixed(ind.metrics[0].decimals)} vs your usual{" "}
            {base.mean.toFixed(ind.metrics[0].decimals)}
          </span>
        )}
      </div>
      <p style={{ fontSize: "var(--fs-lg)" }}>{ind.plainMeaning[e.status]}</p>
      {alert && (
        <DecisionPanel
          title={alert.title}
          tHarmMin={alert.tHarmMin}
          tHarmSource={alert.tHarmSource}
          assumption={alert.assumption}
          reply={h.link.reply}
          verdict={alert.verdict}
          compact
        />
      )}
      <div className="row">
        {e.status === "watch" || e.status === "act" ? (
          <button className="btn btn--primary btn--lg" onClick={() => navigate("/recovery")}>
            Open the plan
          </button>
        ) : (
          <button className="btn btn--primary btn--lg" onClick={() => navigate("/")}>
            Back to dashboard
          </button>
        )}
        <Link className="btn" to={`/trends?ind=${ind.id}`}>
          See trend
        </Link>
      </div>
      <details className="why">
        <summary>Why this status? ({statusLabel[e.status]})</summary>
        <div className="stack" style={{ gap: "var(--sp-2)", paddingTop: "var(--sp-2)" }}>
          <p>{e.reason}</p>
          <p className="dim">
            Detector: {e.detector ?? "None"} · Confidence: {e.confidence} · Limits from{" "}
            {ind.thresholdSource === "demo-assumption"
              ? "a demo assumption"
              : ind.thresholdSource === "NASA"
                ? "a NASA standard"
                : "a clinical reference"}
            {ind.todo && <> · Note: {ind.todo}</>}
          </p>
          <ul>
            {ind.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>{" "}
                <span className="dim">({s.usedFor})</span>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
