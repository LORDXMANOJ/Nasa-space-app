/**
 * Recovery Plan: most urgent alert first and open; the others are one-line rows that open on tap.
 * An open plan shows only what is needed to act: red flags, the non-drug checklist, who to tell, and whether
 * it can wait for Earth. Why it fired, measure-again links, hazards and sources sit behind one button.
 * No doses, ever.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronDown, OctagonAlert, TriangleAlert, UserRound } from "../components/icons";
import { indicatorById } from "../data";
import { DecisionPanel } from "../components/DecisionPanel";
import { StatusBadge } from "../components/status";
import { HazardChip } from "../components/ui";
import { AllClear } from "../components/AllClear";
import { formatDuration } from "../engine/missions";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";
import { toast } from "../store/toast";

export function Recovery() {
  const h = useHealth();
  const checks = useMission((s) => s.checks);
  const toggle = useMission((s) => s.toggleCheck);
  /** One plan is open at a time: the most urgent one until the crew opens another. */
  const [open, setOpen] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, boolean>>({});
  const count = h.alerts.length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Recovery plan</h1>
          <p className="lede">
            {count
              ? `${count} plan${count > 1 ? "s" : ""} today, most urgent first. Your Crew Medical Officer decides on treatment.`
              : "Nothing needs a plan today."}
          </p>
        </div>
        {count > 0 && (
          <Link className="btn btn--primary" to="/consult">
            Send to flight surgeon
          </Link>
        )}
      </div>

      {count === 0 && (
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
            This page holds the plan for any reading that needs care: what to do now, the warning signs, and
            when to call your Crew Medical Officer. Today none of your readings needs one.
          </p>
        </AllClear>
      )}

      <div className="stack" style={{ gap: "var(--sp-4)" }}>
        {h.alerts.map((a, n) => {
          const key = (i: number) => `${h.profile.id}:${h.day}:${a.id}:${i}`;
          const done = a.steps.filter((_, i) => checks[key(i)]).length;
          const isOpen = open === null ? n === 0 : open === a.id;
          const more = !!details[a.id];

          if (!isOpen)
            return (
              <button key={a.id} className="plan-row" aria-expanded={false} onClick={() => setOpen(a.id)}>
                <StatusBadge status={a.status} />
                <strong>{a.title}</strong>
                <span className="dim">
                  {done} of {a.steps.length} steps done · can wait {formatDuration(a.tHarmMin)}
                </span>
                <ChevronDown aria-hidden />
              </button>
            );

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
                      <h2>What to do now</h2>
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
                            Tell your Crew Medical Officer how you feel now, and measure again when the plan
                            says.
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="plan-next">
                      <UserRound aria-hidden /> <span>{a.escalation}</span>
                    </p>
                  </div>
                  <DecisionPanel
                    title={a.title}
                    tHarmMin={a.tHarmMin}
                    tHarmSource={a.tHarmSource}
                    assumption={a.assumption}
                    reply={h.link.reply}
                    verdict={a.verdict}
                    compact
                  />
                </div>

                <button
                  className="btn btn--ghost btn--sm"
                  style={{ alignSelf: "flex-start" }}
                  aria-expanded={more}
                  onClick={() => setDetails((d) => ({ ...d, [a.id]: !d[a.id] }))}
                >
                  {more ? "Hide details" : "Why this alert, measure again, sources"}
                  <ChevronDown aria-hidden style={{ transform: more ? "rotate(180deg)" : undefined }} />
                </button>
                {more && (
                  <div className="plan-more stack">
                    <p style={{ maxWidth: "65ch" }}>{a.reason}</p>
                    <p className="meta">
                      <span>
                        Detector <b>{a.detector}</b>
                      </span>
                      <span>
                        Confidence <b>{a.confidence}</b>
                      </span>
                    </p>
                    <div className="row">
                      {a.indicatorIds.map((i) => (
                        <Link key={i} className="btn btn--sm" to={`/measure/${i}`}>
                          Measure {indicatorById(i).shortName} again
                        </Link>
                      ))}
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
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
