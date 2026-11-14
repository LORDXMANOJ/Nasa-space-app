/**
 * Mission Dashboard: answers "Am I OK, and what do I do next?" in three seconds.
 * Today's brief + one primary action, readiness ring with "Why?", the most urgent alert with its
 * "Can this wait for Earth?" Decision Panel, the nine indicator tiles, and light gamification (routine only).
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Award, CheckCircle2, ChevronDown, GraduationCap, Satellite, Stethoscope } from "lucide-react";
import { INDICATORS } from "../data";
import { IndicatorTile } from "../components/IndicatorTile";
import { DecisionPanel } from "../components/DecisionPanel";
import { StatusBadge, StatusShape } from "../components/status";
import { ReadinessRing } from "../components/ui";
import { BASELINE_DAYS } from "../engine/detectors";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";

export function Dashboard() {
  const h = useHealth();
  const completions = useMission((s) => s.completions);
  const outbox = useMission((s) => s.outbox);
  const checks = useMission((s) => s.checks);
  const [why, setWhy] = useState(false);

  const top = h.alerts[0];
  const dueIds = new Set(h.due.map((d) => d.id));
  const firstName = h.profile.name.split(" ")[0];
  const totalDone = Object.values(completions).reduce((a, b) => a + b, 0);
  const badges = [
    { id: "first", label: "First check-in", earned: totalDone > 0 },
    { id: "full", label: "Full check-in day", earned: h.due.length === 0 },
    { id: "recovery", label: "Recovery step done", earned: Object.values(checks).some(Boolean) },
    { id: "ground", label: "Consult Packet sent", earned: outbox.length > 0 },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{firstName}, here is your health today</h1>
          <p className="lede">
            {h.profile.role}. Day {h.day}, {h.link.preset.name}.
          </p>
        </div>
      </div>

      {h.learning && (
        <div className="banner banner--info learning" style={{ marginBottom: "var(--sp-5)" }}>
          <GraduationCap aria-hidden />
          <span>
            Learning your normal: days 1 to {BASELINE_DAYS} teach the app your personal baseline. Until then only the fixed safety rules can flag
            anything.
          </span>
        </div>
      )}

      <section className="dash-hero">
        <div className="card reveal">
          <div className="label">Today's brief</div>
          <p className="brief-text">{h.brief}</p>
          <div className="row" style={{ marginTop: "var(--sp-5)" }}>
            {h.due.length > 0 ? (
              <Link className="btn btn--primary btn--lg" to="/checkin">
                <Stethoscope aria-hidden /> Start daily check-in (~1 min)
              </Link>
            ) : (
              <span className="row" style={{ color: "var(--nominal)", fontWeight: 600 }}>
                <CheckCircle2 aria-hidden /> Check-in done for today
              </span>
            )}
            {top && (
              <Link className={`btn btn--lg${top.status === "act" ? " btn--danger" : ""}`} to="/recovery">
                Open the plan
              </Link>
            )}
          </div>
          {h.due.length > 0 && (
            <div className="due">
              <span className="label">Still to take</span>
              {h.due.map((d) => (
                <Link key={d.id} className="chip" to={`/measure/${d.id}`}>
                  {d.shortName}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card ready reveal">
          <ReadinessRing score={h.readiness.score} />
          <div className="stack" style={{ gap: "var(--sp-2)", flex: 1, minWidth: 160 }}>
            <div className="label">Crew readiness</div>
            <p className="dim">One number for how ready you are for today's work, from all nine indicators.</p>
            <button className="btn btn--ghost btn--sm" aria-expanded={why} onClick={() => setWhy((w) => !w)} style={{ alignSelf: "flex-start" }}>
              Why {h.readiness.score}? <ChevronDown style={{ transform: why ? "rotate(180deg)" : undefined }} />
            </button>
          </div>
          {why && (
            <ul className="why-list">
              {h.readiness.breakdown
                .filter((b) => b.loss > 0)
                .map((b) => (
                  <li key={b.indicator.id}>
                    <StatusBadge status={b.status} />
                    <span>{b.indicator.shortName}</span>
                    <span className="num dim">−{b.loss.toFixed(1)}</span>
                  </li>
                ))}
              {h.readiness.breakdown.every((b) => b.loss === 0) && <li className="dim">Nothing is pulling your score down.</li>}
              <li className="dim" style={{ fontSize: "var(--fs-sm)" }}>
                Each indicator has a weight. Watch costs half of it, Act all of it, Stale a quarter. <Link to="/how#readiness">How it works</Link>
              </li>
            </ul>
          )}
        </div>
      </section>

      {top && (
        <section className="card reveal" style={{ marginTop: "var(--sp-5)" }} aria-labelledby="top-alert">
          <div className="alert-card">
            <div className="row">
              <span className={`s-${top.status}`}>
                <StatusShape status={top.status} size={22} />
              </span>
              <h2 id="top-alert">{top.title}</h2>
              <StatusBadge status={top.status} />
              <span className="spacer" style={{ flex: 1 }} />
              <span className="chip">Detector: {top.detector}</span>
              <span className="chip">Confidence: {top.confidence}</span>
            </div>
            <p style={{ color: "var(--text-soft)", maxWidth: "85ch" }}>{top.reason}</p>
            <DecisionPanel
              title={top.title}
              tHarmMin={top.tHarmMin}
              tHarmSource={top.tHarmSource}
              assumption={top.assumption}
              reply={h.link.reply}
              verdict={top.verdict}
            />
            {h.alerts.length > 1 && (
              <Link to="/recovery" className="btn btn--ghost btn--sm" style={{ alignSelf: "flex-start" }}>
                See all {h.alerts.length} alerts and their plans
              </Link>
            )}
          </div>
        </section>
      )}

      <section aria-labelledby="vitals" style={{ marginTop: "var(--sp-8)" }}>
        <div className="row" style={{ marginBottom: "var(--sp-4)" }}>
          <h2 id="vitals">Your indicators</h2>
          <span className="spacer" style={{ flex: 1 }} />
          <Link to="/trends" className="btn btn--ghost btn--sm">
            All trends
          </Link>
        </div>
        <div className="tiles">
          {INDICATORS.map((ind) => (
            <IndicatorTile key={ind.id} ind={ind} evaluation={h.evals[ind.id]} readings={h.history[ind.id]} day={h.day} due={dueIds.has(ind.id)} />
          ))}
        </div>
      </section>

      <section className="dash-foot" aria-label="Routine and Consult Packets">
        <div className="card card--tight row" aria-label="Mission patches for keeping the routine">
          <Award aria-hidden style={{ color: "var(--accent)" }} />
          <span className="label">Routine patches</span>
          {badges.map((b) => (
            <span key={b.id} className={`patch${b.earned ? " is-earned" : ""}`} title={b.earned ? "Earned for keeping the routine" : "Not earned yet"}>
              {b.label}
            </span>
          ))}
        </div>
        <Link to="/consult" className="card card--tight row ground-mini">
          <Satellite aria-hidden />
          <span>{outbox.length === 0 ? "No Consult Packets sent yet" : `${outbox.length} Consult Packet${outbox.length > 1 ? "s" : ""} in the outbox`}</span>
        </Link>
      </section>
    </div>
  );
}
