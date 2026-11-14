/**
 * "How it decides" (also the Sources & About page): the pipeline, formulas and constants, the Earth reply model,
 * Monte Carlo results measured live on THIS implementation (in a Web Worker), how astronauts are monitored today,
 * honesty notes, and every source and licence.
 */
import { useEffect, useState } from "react";
import { CONDITION_CARDS, HAZARDS, INDICATORS, READINESS } from "../data";
import { BASELINE_DAYS, SD_FLOOR, TUNING } from "../engine/detectors";
import { WATCH_GATE_Z } from "../engine/alerts";
import { earthReply, formatDuration, MISSIONS, REVIEW_MIN, RELAY_PASS_EVERY_MIN, CONJUNCTION_DAYS, type MissionId } from "../engine/missions";
import type { ValidationResult } from "../engine/validate";

const pct = (x: number) => `${(x * 100).toFixed(x < 0.1 ? 2 : 0)} %`;

export function HowItDecides() {
  const [res, setRes] = useState<ValidationResult | null>(null);
  const [running, setRunning] = useState(false);
  const run = () => {
    setRunning(true);
    const w = new Worker(new URL("../engine/validate.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<ValidationResult>) => {
      setRes(e.data);
      setRunning(false);
      w.terminate();
    };
    w.postMessage({ n: 300, seed: 2026 });
  };
  useEffect(run, []);

  const sources = new Map<string, string>();
  INDICATORS.forEach((i) => i.sources.forEach((s) => sources.set(s.url, s.title)));
  CONDITION_CARDS.forEach((c) => c.sources.forEach((s) => sources.set(s.url, s.title)));
  HAZARDS.forEach((h) => sources.set(h.source.url, h.source.title));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">How it decides · Sources</div>
          <h1>Flags, explains, and decides whether it can wait</h1>
          <p className="lede">
            A prototype with simulated data. It never diagnoses and never acts by itself: it gives the crew a reason, a safe wait, and a checklist; the Crew
            Medical Officer decides.
          </p>
        </div>
      </div>

      <div className="stack" style={{ gap: "var(--sp-6)" }}>
        <section className="card prose">
          <h2>The pipeline</h2>
          <div className="pipeline" aria-label="Pipeline">
            <span>Daily check-in</span>
            <i>→</i>
            <span>Safety rules (condition cards)</span>
            <i>+</i>
            <span>Your normal (days 1–{BASELINE_DAYS})</span>
            <i>→</i>
            <span>Unusual day · Slow drift · Forecast</span>
            <i>→</i>
            <span>T_harm vs T_reply</span>
            <i>→</i>
            <span>Act on board / Ask Earth</span>
          </div>
          <p>
            Every alert says which check fired, why (in plain words), how confident it is, and how long it can safely wait. Skipped readings count as no evidence,
            never as bad results.
          </p>
        </section>

        <section className="card prose">
          <h2>Can this wait for Earth?</h2>
          <code className="formula">T_reply = signal out + flight-surgeon review + signal back (+ relay-pass waits on a Mars base)</code>
          <code className="formula">if T_reply &gt; T_harm → ACT ON BOARD NOW, otherwise → ASK EARTH</code>
          <table className="table">
            <thead>
              <tr>
                <th>Mission</th>
                <th>One-way signal</th>
                <th>Earth reply</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(MISSIONS) as MissionId[]).map((m) => (
                <tr key={m}>
                  <td>{MISSIONS[m].name}</td>
                  <td className="num">{formatDuration(MISSIONS[m].oneWayMin)}</td>
                  <td className="num">{formatDuration(earthReply({ mission: m }).totalMin)}</td>
                </tr>
              ))}
              <tr>
                <td>Mars, solar conjunction</td>
                <td className="num">—</td>
                <td className="num">no contact (~{CONJUNCTION_DAYS} days)</td>
              </tr>
            </tbody>
          </table>
          <p className="dim">
            ASSUMPTIONS: review time {REVIEW_MIN} min; relay pass every {RELAY_PASS_EVERY_MIN / 60} h (worst case, store-and-forward); every T_harm on the
            condition cards. Worked example: fever with a fast heart rate can wait 60 min. On the ISS (~20 min reply) → Ask Earth. In Mars transit at 22 min
            one-way (22 + 20 + 22 = 64 min) → Act on board now.
          </p>
        </section>

        <section className="card prose">
          <h2>The three detectors</h2>
          <h3>1 · Safety rules</h3>
          <p>
            Condition cards are data (limits, safe wait, steps, red flags, sources), read by a small rule interpreter, so a medic can change a limit without touching code.
            Act limits always count. For the seven daily readings a Watch limit only counts when the value is also at least {WATCH_GATE_Z} sd from your own normal
            — this is why a resting heart rate of 52 that is normal for one astronaut is never flagged.
          </p>
          <h3>2 · Unusual day</h3>
          <code className="formula">D² = (x − μ)ᵀ Σ⁻¹ (x − μ),  flag if D² &gt; χ²(0.99, k)  (18.475 for all 7 readings)</code>
          <p>
            μ and Σ come from mission days 1–{BASELINE_DAYS}. With so few days, the correlation matrix is shrunk toward the identity (Schäfer–Strimmer, intensity
            estimated from the data), standard deviations have floors (e.g. temperature {SD_FLOOR["temp.temp"]} °C, heart rate {SD_FLOOR["hr.hr"]} bpm), Σ is
            inflated ×{TUNING.covScale} for estimation error, and solved with a Cholesky factorisation Σ = L Lᵀ, never inverted directly. k = readings present today.
          </p>
          <h3>3 · Slow drift and forecast</h3>
          <code className="formula">S⁺ = max(0, S⁺ + z − k),  S⁻ = max(0, S⁻ − z − k),  alarm if S &gt; h</code>
          <p>
            Two-sided CUSUM on standardised readings (z uses sd ×{TUNING.zScale}), k = {TUNING.k}, h = {TUNING.h}, chosen with the Monte Carlo check below. When it
            alarms, a Theil–Sen line (median of all pairwise slopes, robust to one wild reading) is projected to the Act limit; the days until it gets there become
            T_harm.
          </p>
        </section>

        <section className="card prose" id="readiness">
          <h2>Readiness score</h2>
          <code className="formula">score = 100 − Σ (weightᵢ / Σweights × 100) × penalty(statusᵢ)</code>
          <p>
            Penalties: Nominal {READINESS.penalty.nominal}, Watch {READINESS.penalty.watch}, Act {READINESS.penalty.act}, Stale {READINESS.penalty.stale}. Weights:{" "}
            {INDICATORS.map((i) => `${i.shortName} ${i.weight}`).join(", ")}.
          </p>
        </section>

        <section className="card prose" aria-live="polite">
          <div className="row">
            <h2>Measured on this implementation</h2>
            <span className="spacer" style={{ flex: 1 }} />
            <button className="btn btn--sm" onClick={run} disabled={running}>
              {running ? "Running…" : "Run again"}
            </button>
          </div>
          <p className="dim">
            300 simulated astronauts, 6,000 normal days, seeded and run right here on your machine. This checks the method on simulated people. It says nothing about
            clinical accuracy.
          </p>
          {res ? (
            <div className="results">
              {[
                ["Unusual-day false alarms", pct(res.unusualFalseAlarmRate), "per normal day"],
                ["Any alert on a normal day", pct(res.anyAlertFalseRate), "rules + detectors"],
                ["Fevers caught on day one", pct(res.feverCaughtDayOne), "full fever + fast HR"],
                ["Early mild fevers caught", pct(res.earlyMildFeverCaught), "a day before rules could"],
                ["Slow BP climbs caught", pct(res.slowClimbCaught), `median ${res.slowClimbMedianDays} days`],
                ["Steady astronauts with a false drift flag", pct(res.steadyFalseDriftRate), "within 20 days"],
              ].map(([t, v, s]) => (
                <div key={t} className="card card--tight result-stat">
                  <div className="label">{t}</div>
                  <div className="num">{v}</div>
                  <small className="dim">{s}</small>
                </div>
              ))}
            </div>
          ) : (
            <p>Running…</p>
          )}
          <p className="dim">
            Known weakness: about {res ? pct(res.anyAlertFalseRate) : "7 %"} of normal days still get some alert, mostly single readings that cross a clinical limit and
            are also far from that person's normal. A real system would need real data to tune this.
          </p>
        </section>

        <section className="card prose">
          <h2>How astronauts are monitored today</h2>
          <p>
            On the ISS, crew health is followed by flight surgeons on the ground: regular private medical conferences, scheduled exams, and sensors used in research
            studies. The Canadian Space Agency's Bio-Monitor shirt is a test wearable. We do <em>not</em> claim the ISS runs daily check-ins like this app; a daily
            check-in is our proposal for missions where help is delayed by minutes, hours or weeks.
          </p>
          <p className="dim">Sources for this section are marked "TODO verify" in REFERENCES.md until each link is checked.</p>
        </section>

        <section className="card prose">
          <h2>Honesty</h2>
          <ul>
            <li>Prototype. All crew, readings and stories are simulated; no real astronaut data.</li>
            <li>It flags, explains and decides whether something can wait. It does not diagnose and never gives medicine doses.</li>
            <li>Limits come from public clinical references or a NASA standard where stated; everything else is labelled ASSUMPTION or demo assumption.</li>
            <li>The on-board assistant gives pre-written answers built from the condition cards; no AI model runs in this app.</li>
            <li>An AI coding assistant (Claude) helped write this code and documentation.</li>
          </ul>
        </section>

        <section className="card prose">
          <h2>Sources</h2>
          <ul>
            {[...sources.entries()].map(([url, title]) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {title}
                </a>
              </li>
            ))}
          </ul>
          <h3>Software and assets</h3>
          <p className="dim">
            React, React Router, Zustand, Dexie, Recharts, three.js, @react-three/fiber, @react-three/drei, Zod (all MIT); lucide-react icons (ISC); IBM Plex Sans and
            IBM Plex Mono fonts (SIL Open Font License 1.1, bundled). The 3D body is procedural (no third-party model). Full list with licences in REFERENCES.md.
          </p>
        </section>
      </div>
    </div>
  );
}
