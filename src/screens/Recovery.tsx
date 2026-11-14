/**
 * Recovery Plan: one card per alert, most urgent first. Red flags first (anyone can recognise them),
 * then the non-drug on-board checklist, the escalation rule (Crew Medical Officer), the
 * "Can this wait for Earth?" Decision Panel and the sources. No doses, ever.
 */
import { Link } from "react-router-dom";
import { CheckCircle2, OctagonAlert, TriangleAlert, UserRound } from "lucide-react";
import { indicatorById } from "../data";
import { DecisionPanel } from "../components/DecisionPanel";
import { StatusBadge } from "../components/status";
import { HazardChip } from "../components/ui";
import { AllClear } from "../components/AllClear";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";
import { toast } from "../store/toast";

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
            {h.alerts.length ? "What to do now, step by step." : "Nothing needs a plan today."} Self-care
            steps only; treatment decisions belong to your Crew Medical Officer.
          </p>
        </div>
        {h.alerts.length > 0 && (
          <Link className="btn btn--primary" to="/consult">
            Build Consult Packet
          </Link>
        )}
      </div>

      {h.alerts.length === 0 && (
        <AllClear
          kicker="No plan needed today"
          title="Nothing to recover from"
          action={
            <Link className="btn" to="/">
              Back to today's results
            </Link>
          }
        >
          <p>
            This page holds the step-by-step plan for any reading that needs care: what to do now, the
            red-flag signs, and when to call your Crew Medical Officer. Today none of your readings needs one.
          </p>
          <p className="dim">Keep your routine: daily check-in, exercise session, regular sleep time.</p>
        </AllClear>
      )}

      <div className="stack" style={{ gap: "var(--sp-8)" }}>
        {h.alerts.map((a) => {
          const key = (i: number) => `${h.profile.id}:${h.day}:${a.id}:${i}`;
          const done = a.steps.filter((_, i) => checks[key(i)]).length;
          return (
            <article key={a.id} className={`block block--${a.status}`} aria-labelledby={`t-${a.id}`}>
              <div className="block-head">
                {a.status === "act" ? <OctagonAlert aria-hidden /> : <TriangleAlert aria-hidden />}
                {a.status === "act" ? "Warning" : "Caution"}
              </div>
              <div className="block-body stack">
                <div className="alert-head">
                  <h3 id={`t-${a.id}`}>{a.title}</h3>
                  <StatusBadge status={a.status} large />
                </div>
                <p style={{ maxWidth: "90ch" }}>{a.reason}</p>
                <p className="meta">
                  <span>
                    Detector <b>{a.detector}</b>
                  </span>
                  <span>
                    Confidence <b>{a.confidence}</b>
                  </span>
                </p>

                {a.redFlags.length > 0 && (
                  <div className="banner banner--act redflags" role="note">
                    <OctagonAlert style={{ color: "var(--act)" }} aria-hidden />
                    <div>
                      <strong>Any of these? Tell your Crew Medical Officer right now.</strong>
                      <ul>
                        {a.redFlags.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="alert-grid">
                  <div>
                    <div className="row" style={{ marginBottom: "var(--sp-1)" }}>
                      <h2>Procedure</h2>
                      <span className="spacer" />
                      <span className="dim" style={{ fontSize: "var(--fs-sm)" }}>
                        {done} of {a.steps.length} done
                      </span>
                    </div>
                    <ol className="checklist">
                      {a.steps.map((s, i) => (
                        <li key={i}>
                          <label>
                            <span>{s}</span>
                            <input
                              type="checkbox"
                              checked={!!checks[key(i)]}
                              onChange={() => {
                                const was = !!checks[key(i)];
                                toggle(key(i));
                                if (was) return toast(`Step ${i + 1} unticked`, "info");
                                const left = a.steps.length - done - 1;
                                toast(
                                  left === 0
                                    ? "All steps done. Tell your Crew Medical Officer how you feel."
                                    : `Step ${i + 1} done. ${left} to go.`,
                                );
                              }}
                            />
                          </label>
                        </li>
                      ))}
                    </ol>
                    {done === a.steps.length && (
                      <div className="plan-done" role="status">
                        <CheckCircle2 className="pop" aria-hidden />
                        <div>
                          <strong>Plan complete</strong>
                          <p>
                            Well done. Tell your Crew Medical Officer how you feel now, and re-measure when
                            the plan says.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="banner banner--info" style={{ marginTop: "var(--sp-4)" }}>
                      <UserRound aria-hidden />
                      <div>
                        <strong>Escalation</strong>
                        <p>{a.escalation}</p>
                      </div>
                    </div>
                    <div className="row" style={{ marginTop: "var(--sp-4)" }}>
                      {a.indicatorIds.map((i) => (
                        <Link key={i} className="btn btn--sm" to={`/measure/${i}`}>
                          Re-measure {indicatorById(i).shortName}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <DecisionPanel
                    title={a.title}
                    tHarmMin={a.tHarmMin}
                    tHarmSource={a.tHarmSource}
                    assumption={a.assumption}
                    reply={h.link.reply}
                    verdict={a.verdict}
                  />
                </div>

                <p className="dim" style={{ fontSize: "var(--fs-sm)" }}>
                  Hazards:{" "}
                  {a.hazards.map((hz, i) => (
                    <span key={hz}>
                      {i > 0 && ", "}
                      <HazardChip id={hz} />
                    </span>
                  ))}
                  {a.card && (
                    <>
                      {". Sources: "}
                      {a.card.sources.map((s, i) => (
                        <span key={s.url}>
                          {i > 0 && "; "}
                          <a href={s.url} target="_blank" rel="noreferrer">
                            {s.title}
                          </a>
                        </span>
                      ))}
                    </>
                  )}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
