/**
 * Today's readings, entered on the dashboard. Every row shows the astronaut's Earth (pre-flight) value beside
 * an input for today. Wearable rows arrive pre-filled; device rows fill when you press Measure; you can always type.
 * Skipped optional rows are simply missing (the detectors treat them as no evidence). Submitting saves readings,
 * symptoms and marks today's check-in done, which reveals the results on the 3D body.
 */
import { useMemo, useState } from "react";
import { Cpu, Hand, Loader2, Radio } from "lucide-react";
import { indicatorById, type Indicator } from "../data";
import { learnMetricBaselines } from "../engine/detectors";
import { isScheduled, simulateReading, type Reading } from "../engine/simulation";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";
import { IndicatorIcon } from "./ui";

type Mode = "auto" | "device" | "you";
interface Row {
  ind: Indicator;
  mode: Mode;
  fields: { key: string; label: string; idx: number; unit: string; decimals: number; min: number; max: number }[];
}

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
const SYMPTOMS = ["Feeling hot or shivery", "Headache", "Cough or sore throat", "Nausea", "Dizziness", "Chest pain", "Short of breath", "Aches", "Rash", "None"];
const MODE_LABEL: Record<Mode, string> = { auto: "From your wearable", device: "Measure with the device", you: "Only you can tell" };

export function CheckInForm({ onDone }: { onDone?: () => void }) {
  const h = useHealth();
  const env = useMission((s) => s.environment);
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
        return { key, label: id === "bp" ? (i === 0 ? "Top" : "Bottom") : m.label, idx: i, unit: m.unit, decimals: m.decimals, min: RANGE[key]?.[0] ?? 0, max: RANGE[key]?.[1] ?? 1e6 };
      }),
    };
  }).filter((r) => r.mode === "auto" || isScheduled(r.ind, h.day) || h.due.some((d) => d.id === r.ind.id));

  const sim = (ind: Indicator) => simulateReading(ind, h.day, h.profile, env);
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const r of rows) {
      if (r.mode !== "auto") continue;
      const s = sim(r.ind);
      r.fields.forEach((f) => (v[f.key] = s[f.idx].toFixed(f.decimals)));
    }
    return v;
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [symptoms, setSym] = useState<string[]>([]);
  const [pain, setPain] = useState(0);
  const [tried, setTried] = useState(false);

  const measure = (r: Row) => {
    setBusy(r.ind.id);
    window.setTimeout(() => {
      const s = sim(r.ind);
      setVals((v) => {
        const n = { ...v };
        r.fields.forEach((f) => (n[f.key] = s[f.idx].toFixed(f.decimals)));
        return n;
      });
      setBusy(null);
    }, 1200);
  };

  const err = (f: Row["fields"][number]) => {
    const raw = vals[f.key];
    if (raw === undefined || raw === "") return "Needed";
    const n = Number(raw);
    if (Number.isNaN(n)) return "Numbers only";
    if (n < f.min || n > f.max) return `Check this value (${f.min} to ${f.max} ${f.unit})`;
    return "";
  };
  const missing = rows.flatMap((r) => r.fields.filter((f) => err(f))).length + (mood === null ? 1 : 0);

  const submit = () => {
    setTried(true);
    if (missing > 0) return;
    const rs: Reading[] = rows.map((r) => {
      const values = sim(r.ind);
      r.fields.forEach((f) => (values[f.idx] = Number(vals[f.key])));
      if (r.ind.id === "weight") {
        const launch = earth["weight.mass"]?.mean ?? values[0];
        values[1] = Math.round(((values[0] - launch) / launch) * 1000) / 10;
      }
      return { indicatorId: r.ind.id, day: h.day, values, source: "user" };
    });
    const ms = simulateReading(indicatorById("mood"), h.day, h.profile, env);
    rs.push({ indicatorId: "mood", day: h.day, values: [mood!, ms[1]], source: "user" });
    addReadings(rs);
    setSymptoms(h.day, symptoms.filter((s) => s !== "None").concat(pain > 0 ? [`Pain ${pain}/10`] : []));
    markCheckedIn();
    onDone?.();
  };

  const earthText = (r: Row) =>
    r.fields
      .map((f) => {
        const b = earth[f.key];
        return b ? b.mean.toFixed(f.decimals) : "none";
      })
      .join("/") + ` ${r.fields[0].unit}`;

  return (
    <form
      className="ci-form"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <table className="table ci-table">
        <thead>
          <tr>
            <th scope="col">Reading</th>
            <th scope="col">How</th>
            <th scope="col">On Earth</th>
            <th scope="col">Today</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.ind.id}>
              <td>
                <span className="row" style={{ gap: "var(--sp-2)", flexWrap: "nowrap" }}>
                  <IndicatorIcon name={r.ind.icon} />
                  <strong>{r.ind.shortName}</strong>
                </span>
              </td>
              <td className="dim ci-how">
                {r.mode === "auto" ? <Radio width={15} aria-hidden /> : <Cpu width={15} aria-hidden />} {MODE_LABEL[r.mode]}
              </td>
              <td className="num dim">{earthText(r)}</td>
              <td>
                <div className="ci-inputs">
                  {r.fields.map((f) => {
                    const e = tried ? err(f) : "";
                    return (
                      <label key={f.key} className="ci-field">
                        <span className="sr-only">
                          {r.ind.shortName} {f.label}
                        </span>
                        <input
                          className="input"
                          inputMode="decimal"
                          value={vals[f.key] ?? ""}
                          aria-invalid={!!e}
                          readOnly={r.ind.id === "radiation"}
                          placeholder={r.ind.id === "bp" ? f.label : ""}
                          onChange={(ev) => setVals((v) => ({ ...v, [f.key]: ev.target.value }))}
                        />
                        {e && <small className="ci-err">{e}</small>}
                      </label>
                    );
                  })}
                  <span className="dim ci-unit">{r.fields[0].unit}</span>
                  {r.mode === "device" && (
                    <button type="button" className="btn btn--sm" onClick={() => measure(r)} disabled={busy !== null}>
                      {busy === r.ind.id ? <Loader2 className="spin" aria-hidden /> : null}
                      {busy === r.ind.id ? "Measuring" : "Measure"}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <span className="row" style={{ gap: "var(--sp-2)", flexWrap: "nowrap" }}>
                <IndicatorIcon name="brain" />
                <strong>Mood</strong>
              </span>
            </td>
            <td className="dim ci-how">
              <Hand width={15} aria-hidden /> {MODE_LABEL.you}
            </td>
            <td className="num dim">{earth["mood.mood"] ? `${earth["mood.mood"].mean.toFixed(0)} /10` : "none"}</td>
            <td>
              <div className="mood-scale" role="group" aria-label="Mood from 1 (very low) to 10 (great)">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button type="button" key={n} aria-pressed={mood === n} onClick={() => setMood(n)}>
                    {n}
                  </button>
                ))}
              </div>
              {tried && mood === null && <small className="ci-err">Pick a number</small>}
            </td>
          </tr>
        </tbody>
      </table>

      <fieldset className="field ci-symptoms">
        <legend>Any symptoms today? (optional)</legend>
        <div className="symptoms">
          {SYMPTOMS.map((s) => (
            <label key={s}>
              <input
                type="checkbox"
                checked={symptoms.includes(s)}
                onChange={(e) =>
                  setSym((cur) => (s === "None" ? (e.target.checked ? ["None"] : []) : e.target.checked ? [...cur.filter((x) => x !== "None"), s] : cur.filter((x) => x !== s)))
                }
              />
              {s}
            </label>
          ))}
        </div>
        <label className="field" style={{ maxWidth: 420, marginTop: "var(--sp-3)" }}>
          <span>
            Pain right now: <span className="num">{pain}</span>/10
          </span>
          <input type="range" min={0} max={10} value={pain} onChange={(e) => setPain(Number(e.target.value))} />
        </label>
      </fieldset>

      <div className="row ci-submit">
        <button type="submit" className="btn btn--primary btn--lg">
          See my results
        </button>
        <span className="dim">{missing > 0 ? `${missing} reading${missing > 1 ? "s" : ""} still to enter` : "All set."}</span>
      </div>
    </form>
  );
}
