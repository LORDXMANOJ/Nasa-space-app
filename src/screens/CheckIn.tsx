/**
 * Daily check-in (~1 minute). Three input modes, always labelled:
 *  - automatic: wearable feeds already filled (sleep, heart rate, temperature, radiation)
 *  - semi-automatic: you start it, the (simulated) device sends the result (BP, SpO₂, glucose, body mass)
 *  - manual: mood, symptoms, pain.
 * Skipped fields are simply missing: the detectors treat them as no evidence.
 */
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Cpu, Hand, Loader2, Radio } from "lucide-react";
import { INDICATORS, indicatorById, type Indicator } from "../data";
import { simulateReading, isScheduled, type Reading } from "../engine/simulation";
import { formatPrimary } from "../lib/format";
import { IndicatorIcon } from "../components/ui";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";

const SEMI = ["bp", "spo2", "glucose", "weight"];
const SYMPTOMS = ["Feeling hot or shivery", "Headache", "Cough or sore throat", "Nausea", "Dizziness", "Chest pain", "Short of breath", "Aches", "Rash", "None"];

export function CheckIn() {
  const h = useHealth();
  const env = useMission((s) => s.environment);
  const settings = useMission((s) => s.settings);
  const addReadings = useMission((s) => s.addReadings);
  const setSymptoms = useMission((s) => s.setSymptoms);
  const saved = useMission((s) => s.symptoms[s.day]);
  const navigate = useNavigate();

  const todayOf = (id: string) => h.history[id]?.find((r) => r.day === h.day);
  const autos = INDICATORS.filter((i) => i.autoLogged);
  const semis = SEMI.map(indicatorById).filter((i) => isScheduled(i, h.day) || todayOf(i.id) || h.due.some((d) => d.id === i.id));

  const [taken, setTaken] = useState<Record<string, Reading>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [mood, setMood] = useState<number | null>(todayOf("mood")?.values[0] ?? null);
  const [symptoms, setSym] = useState<string[]>(saved ?? []);
  const [pain, setPain] = useState(0);

  const measure = (ind: Indicator) => {
    setBusy(ind.id);
    window.setTimeout(
      () => {
        setTaken((t) => ({ ...t, [ind.id]: { indicatorId: ind.id, day: h.day, values: simulateReading(ind, h.day, h.profile, env), source: "user" } }));
        setBusy(null);
      },
      Math.min(2400, ind.captureDurationSec * 300),
    );
  };

  const doneCount = useMemo(() => semis.filter((i) => taken[i.id] || todayOf(i.id)).length + (mood !== null ? 1 : 0), [semis, taken, mood]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = semis.length + 1;

  const submit = () => {
    const rs: Reading[] = Object.values(taken);
    if (mood !== null) {
      const sim = simulateReading(indicatorById("mood"), h.day, h.profile, env);
      rs.push({ indicatorId: "mood", day: h.day, values: [mood, sim[1]], source: "user" });
    }
    addReadings(rs);
    setSymptoms(h.day, symptoms.filter((s) => s !== "None").concat(pain > 0 ? [`Pain ${pain}/10`] : []));
    navigate("/");
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">Day {h.day} · Daily check-in</div>
          <h1>About one minute. Skip anything you can't do.</h1>
          <p className="lede">Wearables already filled some fields. Skipped readings are fine: the app only uses what you give it.</p>
        </div>
      </div>

      <div className="checkin">
        <div className="stack">
          <section className="card ci-group">
            <h2>
              <Radio aria-hidden /> Automatic <small>· from your wearables, already filled</small>
            </h2>
            {autos.map((ind) => {
              const r = todayOf(ind.id);
              const v = formatPrimary(ind, r?.values, settings);
              return (
                <div className="ci-row" key={ind.id}>
                  <IndicatorIcon name={ind.icon} size={22} />
                  <div>
                    <strong>{ind.shortName}</strong>
                    <div className="src">{ind.deviceName}</div>
                  </div>
                  <span className="val">
                    {v.text} <small className="dim">{v.unit}</small>
                  </span>
                  <span className="autotag">
                    <Check width={14} height={14} aria-hidden /> AUTO-FILLED
                  </span>
                </div>
              );
            })}
          </section>

          <section className="card ci-group">
            <h2>
              <Cpu aria-hidden /> Semi-automatic <small>· you start it, the device sends the result</small>
            </h2>
            {semis.map((ind) => {
              const r = taken[ind.id] ?? todayOf(ind.id);
              const v = formatPrimary(ind, r?.values, settings);
              return (
                <div className="ci-row" key={ind.id}>
                  <IndicatorIcon name={ind.icon} size={22} />
                  <div>
                    <strong>{ind.shortName}</strong>
                    <div className="src">
                      {ind.deviceName} · <Link to={`/measure/${ind.id}`}>How to measure</Link>
                    </div>
                  </div>
                  <span className="val">{r ? `${v.text}` : "—"} {r && <small className="dim">{v.unit}</small>}</span>
                  {r ? (
                    <span className="autotag">
                      <Check width={14} height={14} aria-hidden /> FROM DEVICE
                    </span>
                  ) : (
                    <button className="btn btn--primary" onClick={() => measure(ind)} disabled={busy !== null} aria-busy={busy === ind.id}>
                      {busy === ind.id ? <Loader2 className="spin" aria-hidden /> : null}
                      {busy === ind.id ? "Measuring…" : "Measure"}
                    </button>
                  )}
                </div>
              );
            })}
          </section>

          <section className="card ci-group stack">
            <h2>
              <Hand aria-hidden /> Manual <small>· only you can tell us</small>
            </h2>
            <div className="field">
              <span id="mood-l">How is your mood right now? (1 = very low, 10 = great)</span>
              <div className="mood-scale" role="group" aria-labelledby="mood-l">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button key={n} aria-pressed={mood === n} onClick={() => setMood(n)}>
                    {n}
                  </button>
                ))}
              </div>
              <small>
                The 30-second reaction test is in the <Link to="/measure/mood">guided mood check</Link>. Here, reaction time is filled from the
                simulated device feed.
              </small>
            </div>
            <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={{ fontWeight: 600, marginBottom: "var(--sp-2)" }}>Any symptoms today?</legend>
              <div className="symptoms">
                {SYMPTOMS.map((s) => (
                  <label key={s}>
                    <input
                      type="checkbox"
                      checked={symptoms.includes(s)}
                      onChange={(e) =>
                        setSym((cur) =>
                          s === "None" ? (e.target.checked ? ["None"] : []) : e.target.checked ? [...cur.filter((x) => x !== "None"), s] : cur.filter((x) => x !== s),
                        )
                      }
                    />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="field">
              <span>
                Pain right now: <span className="num">{pain}</span>/10
              </span>
              <input type="range" min={0} max={10} value={pain} onChange={(e) => setPain(Number(e.target.value))} />
            </label>
          </section>
        </div>

        <aside className="card stack" style={{ position: "sticky", top: "var(--sp-4)" }}>
          <div className="label">Progress</div>
          <div className="num" style={{ fontSize: "var(--fs-3xl)" }}>
            {doneCount}/{total}
          </div>
          <p className="dim">
            {autos.length} fields auto-filled from wearables. Anything you skip counts as "no evidence", never as a bad result.
          </p>
          <button className="btn btn--primary btn--lg" onClick={submit}>
            Save check-in
          </button>
          <Link className="btn btn--ghost" to="/">
            Cancel
          </Link>
        </aside>
      </div>
    </div>
  );
}
