/**
 * Recovery Plan: one card per alert, most urgent first. Red flags first (anyone can recognise them),
 * then the non-drug on-board checklist, the escalation rule (Crew Medical Officer), the
 * "Can this wait for Earth?" Decision Panel and the sources. No doses, ever.
 */
import { Link } from "react-router-dom";
import { CheckCircle2, OctagonAlert, UserRound } from "lucide-react";
import { indicatorById } from "../data";
import { DecisionPanel } from "../components/DecisionPanel";
import { StatusBadge, StatusShape } from "../components/status";
import { EmptyState, HazardChip } from "../components/ui";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";

export function Recovery() {
  const h = useHealth();
  const checks = useMission((s) => s.checks);
  const toggle = useMission((s) => s.toggleCheck);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Recovery plan</h1>
          <p className="lede">
            {h.alerts.length ? "What to do now, step by step." : "Nothing needs a plan today."} Self-care steps only; treatment decisions belong to your Crew Medical
            Officer.
          </p>
        </div>
        {h.alerts.length > 0 && (
          <Link className="btn btn--primary" to="/consult">
            Build Consult Packet
          </Link>
        )}
      </div>

      {h.alerts.length === 0 && (
        <div className="card">
          <EmptyState icon={<CheckCircle2 />} title="All clear">
            <p>Keep your routine: daily check-in, exercise session, regular sleep time.</p>
            <Link className="btn" to="/checkin">
              Do today's check-in
            </Link>
          </EmptyState>
        </div>
      )}

      <div className="stack">
        {h.alerts.map((a) => {
          const key = (i: number) => `${h.profile.id}:${h.day}:${a.id}:${i}`;
          const done = a.steps.filter((_, i) => checks[key(i)]).length;
          return (
            <article key={a.id} className="card stack reveal" aria-labelledby={`t-${a.id}`}>
              <div className="row">
                <span className={`s-${a.status}`}>
                  <StatusShape status={a.status} size={24} />
                </span>
                <h2 id={`t-${a.id}`}>{a.title}</h2>
                <StatusBadge status={a.status} />
                <span className="spacer" style={{ flex: 1 }} />
                <span className="chip">Detector: {a.detector}</span>
                <span className="chip">Confidence: {a.confidence}</span>
              </div>
              <p style={{ color: "var(--text-soft)", maxWidth: "90ch" }}>{a.reason}</p>
              <div className="row">
                {a.indicatorIds.map((i) => (
                  <Link key={i} className="chip" to={`/measure/${i}`}>
                    Re-measure {indicatorById(i).shortName}
                  </Link>
                ))}
                {a.hazards.map((hz) => (
                  <HazardChip key={hz} id={hz} />
                ))}
              </div>

              {a.redFlags.length > 0 && (
                <div className="redflags" role="note">
                  <strong className="row" style={{ gap: "var(--sp-2)" }}>
                    <OctagonAlert width={20} style={{ color: "var(--act)" }} aria-hidden /> Any of these? Tell your Crew Medical Officer right now.
                  </strong>
                  <ul>
                    {a.redFlags.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="settings-grid" style={{ gap: "var(--sp-5)" }}>
                <div>
                  <div className="row" style={{ marginBottom: "var(--sp-2)" }}>
                    <span className="label">On-board steps</span>
                    <span className="dim mono" style={{ fontSize: "var(--fs-sm)" }}>
                      {done}/{a.steps.length} done
                    </span>
                  </div>
                  <ul className="checklist">
                    {a.steps.map((s, i) => (
                      <li key={i}>
                        <label>
                          <input type="checkbox" checked={!!checks[key(i)]} onChange={() => toggle(key(i))} />
                          <span>{s}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="banner" style={{ marginTop: "var(--sp-4)" }}>
                    <UserRound style={{ color: "var(--accent)" }} aria-hidden />
                    <div>
                      <strong>Escalation</strong>
                      <p>{a.escalation}</p>
                    </div>
                  </div>
                </div>
                <DecisionPanel title={a.title} tHarmMin={a.tHarmMin} tHarmSource={a.tHarmSource} assumption={a.assumption} reply={h.link.reply} verdict={a.verdict} />
              </div>

              {a.card && (
                <p className="dim" style={{ fontSize: "var(--fs-sm)" }}>
                  Sources:{" "}
                  {a.card.sources.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 && " · "}
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.title}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
