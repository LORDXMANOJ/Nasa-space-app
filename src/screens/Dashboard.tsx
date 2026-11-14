/**
 * Dashboard as a crew procedure page: the most urgent alert first as a WARNING / CAUTION block with the
 * "Can this wait for Earth?" timing table, then today's line and primary action, then the readings log (a table,
 * not cards), other alerts, and routine patches. Answers "Am I OK, and what do I do next?" in three seconds.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronDown, Circle, GraduationCap, OctagonAlert, Satellite, Stethoscope, TriangleAlert } from "lucide-react";
import { INDICATORS } from "../data";
import { DecisionPanel } from "../components/DecisionPanel";
import { StatusBadge } from "../components/status";
import { Sparkline } from "../components/ui";
import { BASELINE_DAYS } from "../engine/detectors";
import { formatDuration } from "../engine/missions";
import { ago, displayValue, formatPrimary } from "../lib/format";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";

export function Dashboard() {
  const h = useHealth();
  const settings = useMission((s) => s.settings);
  const completions = useMission((s) => s.completions);
  const outbox = useMission((s) => s.outbox);
  const checks = useMission((s) => s.checks);
  const [why, setWhy] = useState(false);

  const top = h.alerts[0];
  const rest = h.alerts.slice(1);
  const dueIds = new Set(h.due.map((d) => d.id));
  const firstName = h.profile.name.split(" ")[0];
  const totalDone = Object.values(completions).reduce((a, b) => a + b, 0);
  const patches = [
    { id: "first", label: "First check-in", earned: totalDone > 0 },
    { id: "full", label: "Full check-in day", earned: h.due.length === 0 },
    { id: "recovery", label: "Recovery step done", earned: Object.values(checks).some(Boolean) },
    { id: "ground", label: "Consult Packet sent", earned: outbox.length > 0 },
  ];
  const score = h.readiness.score;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{firstName}, here is your health today</h1>
          <p className="lede">
            {h.profile.role}. Day {h.day}, {h.link.preset.name}.
          </p>
        </div>
        <div className="readiness">
          <span className="label">Crew readiness</span>
          <span className="figure">
            {score}
            <small> / 100</small>
          </span>
          <div className="meter" role="img" aria-label={`Readiness ${score} of 100`}>
            <span style={{ width: `${score}%` }} />
            <i style={{ left: "65%" }} title="Watch below 65" />
            <i style={{ left: "85%" }} title="Nominal from 85" />
          </div>
          <button className="btn btn--ghost btn--sm" aria-expanded={why} onClick={() => setWhy((w) => !w)}>
            Why {score}? <ChevronDown width={14} style={{ transform: why ? "rotate(180deg)" : undefined }} />
          </button>
          {why && (
            <ul className="why-list">
              {h.readiness.breakdown
                .filter((b) => b.loss > 0)
                .map((b) => (
                  <li key={b.indicator.id}>
                    <span>
                      <StatusBadge status={b.status} /> {b.indicator.shortName}
                    </span>
                    <span className="num">−{b.loss.toFixed(1)}</span>
                  </li>
                ))}
              {h.readiness.breakdown.every((b) => b.loss === 0) && <li className="dim">Nothing is pulling your score down.</li>}
              <li className="dim">
                Watch costs half an indicator's weight, Act all of it. <Link to="/how#readiness">How it works</Link>
              </li>
            </ul>
          )}
        </div>
      </div>

      {h.learning && (
        <div className="banner banner--info learning" style={{ marginBottom: "var(--sp-6)" }}>
          <GraduationCap aria-hidden />
          <span>
            Learning your normal: days 1 to {BASELINE_DAYS} teach the app your personal baseline. Until then only the fixed safety rules can flag anything.
          </span>
        </div>
      )}

      {top && (
        <section className={`block block--${top.status}`} aria-labelledby="top-alert" style={{ marginBottom: "var(--sp-8)" }}>
          <div className="block-head">
            {top.status === "act" ? <OctagonAlert aria-hidden /> : <TriangleAlert aria-hidden />}
            {top.status === "act" ? "Warning" : "Caution"}
          </div>
          <div className="block-body alert-grid">
            <div className="stack" style={{ gap: "var(--sp-3)" }}>
              <div className="alert-head">
                <h3 id="top-alert">{top.title}</h3>
                <StatusBadge status={top.status} large />
              </div>
              <p>{top.reason}</p>
              <p className="meta">
                <span>
                  Detector <b>{top.detector}</b>
                </span>
                <span>
                  Confidence <b>{top.confidence}</b>
                </span>
              </p>
              <div className="row" style={{ marginTop: "var(--sp-2)" }}>
                <Link className={`btn${top.status === "act" ? " btn--danger" : " btn--primary"}`} to="/recovery">
                  Open the plan
                </Link>
                <Link className="btn" to="/consult">
                  Build Consult Packet
                </Link>
              </div>
            </div>
            <DecisionPanel title={top.title} tHarmMin={top.tHarmMin} tHarmSource={top.tHarmSource} assumption={top.assumption} reply={h.link.reply} verdict={top.verdict} compact />
          </div>
        </section>
      )}

      <div className="dash-grid">
        <div className="stack" style={{ gap: "var(--sp-8)" }}>
          <section className="card" aria-labelledby="today">
            <h2 id="today">Today</h2>
            <p className="brief-text" style={{ marginTop: "var(--sp-2)" }}>
              {h.brief}
            </p>
            <div className="row" style={{ marginTop: "var(--sp-4)" }}>
              {h.due.length > 0 ? (
                <Link className="btn btn--primary btn--lg" to="/checkin">
                  <Stethoscope aria-hidden /> Start daily check-in
                </Link>
              ) : (
                <span className="row" style={{ color: "var(--nominal)", fontWeight: 700 }}>
                  <CheckCircle2 aria-hidden /> Check-in done for today
                </span>
              )}
              {h.due.length > 0 && (
                <span className="due">
                  <span className="dim">Still to take:</span>
                  {h.due.map((d) => (
                    <Link key={d.id} className="chip" to={`/measure/${d.id}`}>
                      {d.shortName}
                    </Link>
                  ))}
                </span>
              )}
            </div>
          </section>

          <section className="card" aria-labelledby="readings">
            <div className="row">
              <h2 id="readings">Readings</h2>
              <span className="spacer" />
              <Link to="/trends" className="btn btn--ghost btn--sm">
                All trends
              </Link>
            </div>
            <table className="table readings">
              <thead>
                <tr>
                  <th scope="col">Reading</th>
                  <th scope="col">Latest</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last 10</th>
                  <th scope="col">Measured</th>
                  <th scope="col">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {INDICATORS.map((ind) => {
                  const list = h.history[ind.id];
                  const latest = list[list.length - 1];
                  const v = formatPrimary(ind, latest?.values, settings);
                  const s = h.evals[ind.id].status;
                  return (
                    <tr key={ind.id} className={`is-${s}`}>
                      <td>
                        <Link to={`/trends?ind=${ind.id}`} className="tile-link">
                          {ind.shortName}
                        </Link>
                      </td>
                      <td className="num">
                        {v.text}
                        <span className="unit">{v.unit}</span>
                      </td>
                      <td>
                        <StatusBadge status={s} />
                      </td>
                      <td className="spark-cell">
                        <Sparkline values={list.slice(-10).map((r) => displayValue(ind, r.values[0], settings))} status={s} height={24} />
                      </td>
                      <td className="dim">{ago(h.day, latest?.day)}</td>
                      <td style={{ textAlign: "right" }}>
                        {dueIds.has(ind.id) ? (
                          <Link className="btn btn--sm btn--primary" to={`/measure/${ind.id}`}>
                            Measure
                          </Link>
                        ) : (
                          <Link className="btn btn--sm btn--ghost" to={`/measure/${ind.id}`}>
                            How to
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>

        <aside className="stack" style={{ gap: "var(--sp-8)" }}>
          <section className="card" aria-labelledby="others">
            <h2 id="others">Other alerts</h2>
            {rest.length === 0 ? (
              <p className="dim">None.</p>
            ) : (
              <ul className="why-list" style={{ marginTop: "var(--sp-2)" }}>
                {rest.map((a) => (
                  <li key={a.id}>
                    <Link to="/recovery" className="tile-link">
                      <StatusBadge status={a.status} /> {a.title}
                    </Link>
                    <span className="dim" title="Safe wait">
                      {formatDuration(a.tHarmMin)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card" aria-labelledby="routine">
            <h2 id="routine">Routine</h2>
            <ul className="why-list" style={{ marginTop: "var(--sp-2)" }}>
              {patches.map((p) => (
                <li key={p.id}>
                  <span className={`patch${p.earned ? " is-earned" : ""}`}>
                    {p.earned ? <CheckCircle2 aria-hidden style={{ color: "var(--nominal)" }} /> : <Circle aria-hidden />}
                    {p.label}
                  </span>
                  <span className="sr-only">{p.earned ? "earned" : "not yet"}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" aria-labelledby="packets">
            <h2 id="packets">Consult Packets</h2>
            <Link to="/consult" className="row tile-link" style={{ marginTop: "var(--sp-2)" }}>
              <Satellite width={18} aria-hidden />
              {outbox.length === 0 ? "None sent yet" : `${outbox.length} in the outbox`}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
