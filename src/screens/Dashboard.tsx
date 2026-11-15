/**
 * Dashboard as a guided flow so the astronaut always knows what to do next:
 *   1 Who are you  >  2 Earth readings  >  3 Today's readings (entered right here)  >  4 Results on the 3D body.
 * After the check-in, the most urgent alert leads as a WARNING / CAUTION block with the "Can this wait for Earth?"
 * timing table, followed by the readings log and other alerts.
 */
import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronDown, OctagonAlert, Pencil, TriangleAlert } from "../components/icons";
import { INDICATORS, REGIONS, type RegionId } from "../data";
import { AllClear } from "../components/AllClear";
import { CheckInForm } from "../components/CheckInForm";
import { DecisionPanel } from "../components/DecisionPanel";
import { StatusBadge } from "../components/status";
import { Sparkline } from "../components/ui";
import { formatDuration } from "../engine/missions";
import { ago, displayValue, formatPrimary } from "../lib/format";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";
import { Body2D } from "./body/Body2D";

const Body3D = lazy(() => import("./body/Body3D"));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function Dashboard() {
  const h = useHealth();
  const settings = useMission((s) => s.settings);
  const signOut = useMission((s) => s.signOut);
  const done = useMission((s) => !!s.checkedIn[`${s.profileId}:${s.day}`]);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [why, setWhy] = useState(false);
  const [more, setMore] = useState(false);
  const [how, setHow] = useState(false);
  const [allRegions, setAllRegions] = useState(false);
  const tracked = REGIONS.filter((r) => INDICATORS.some((i) => i.bodyRegions.includes(r.id)));
  const flagged = tracked.filter((r) => h.regionStatus[r.id] === "act" || h.regionStatus[r.id] === "watch");
  const webgl = useMemo(hasWebGL, []);
  const firstFlagged =
    REGIONS.find((r) => h.regionStatus[r.id] === "act") ??
    REGIONS.find((r) => h.regionStatus[r.id] === "watch") ??
    REGIONS[0];
  const [sel, setSel] = useState<RegionId>(firstFlagged.id);

  const showForm = !done || editing;
  const top = h.alerts[0];
  const rest = h.alerts.slice(1);
  const firstName = h.profile.name.split(" ")[0];
  const reduced = settings.reducedMotion || settings.lowPower;
  const use3d = webgl && !settings.lowPower;
  const steps = [
    { n: 1, label: `You are ${firstName}`, state: "done" as const },
    { n: 2, label: "Earth readings", state: "done" as const },
    { n: 3, label: "Today's readings", state: showForm ? ("now" as const) : ("done" as const) },
    { n: 4, label: "Your results", state: showForm ? ("next" as const) : ("now" as const) },
  ];
  const region = REGIONS.find((r) => r.id === sel)!;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Hello {firstName}</h1>
          <p className="lede">
            {h.profile.role}. Day {h.day} of the mission, {h.link.preset.name}.{" "}
            <button className="btn btn--ghost btn--sm" onClick={signOut}>
              Not you?
            </button>
          </p>
        </div>
        {!showForm && (
          <div className="readiness">
            <span className="label">Crew readiness</span>
            <span className="figure">
              {h.readiness.score}
              <small> / 100</small>
            </span>
            <div className="meter" role="img" aria-label={`Readiness ${h.readiness.score} of 100`}>
              <span style={{ width: `${h.readiness.score}%` }} />
            </div>
            <button className="btn btn--ghost btn--sm" aria-expanded={why} onClick={() => setWhy((w) => !w)}>
              Why {h.readiness.score}?{" "}
              <ChevronDown width={14} style={{ transform: why ? "rotate(180deg)" : undefined }} />
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
                <li className="dim">
                  Watch costs half an indicator's weight, Act all of it.{" "}
                  <Link to="/how#readiness">How it works</Link>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>

      <ol className="flow-steps" aria-label="Your check-in steps">
        {steps.map((s) => (
          <li key={s.n} className={`is-${s.state}`} aria-current={s.state === "now" ? "step" : undefined}>
            <span className="k">{s.state === "done" ? <Check width={16} aria-label="done" /> : s.n}</span>
            {s.label}
          </li>
        ))}
      </ol>

      {showForm ? (
        <section className="card" aria-labelledby="today-readings">
          <h2 id="today-readings" className="sr-only">
            Step 3: today's readings
          </h2>
          <CheckInForm
            key={`${h.profile.id}:${h.day}`} /* a new day or crew member starts a fresh form */
            onDone={() => {
              setEditing(false);
              document.getElementById("main")?.scrollTo({ top: 0 });
            }}
          />
        </section>
      ) : (
        <>
          <section className="results results-reveal" aria-labelledby="results">
            <div className="results-body">
              <div className="body-stage" style={{ height: 520, minHeight: 0 }}>
                {use3d ? (
                  <Suspense
                    fallback={<Body2D status={h.regionStatus} selected={sel} onSelect={setSel} reduced />}
                  >
                    <Body3D status={h.regionStatus} selected={sel} onSelect={setSel} reduced={reduced} />
                  </Suspense>
                ) : (
                  <Body2D status={h.regionStatus} selected={sel} onSelect={setSel} reduced={reduced} />
                )}
              </div>
            </div>
            <div className="stack" style={{ gap: "var(--sp-4)" }}>
              <div className="row">
                <h2 id="results">Step 4: your results</h2>
                <span className="spacer" />
                <button className="btn btn--sm" onClick={() => setEditing(true)}>
                  <Pencil /> Edit readings
                </button>
              </div>
              <p className="brief-text">{h.brief}</p>
              <ul className="region-list" aria-label="Body regions">
                {tracked
                  .filter((r) => allRegions || flagged.length === 0 || flagged.includes(r) || r.id === sel)
                  .map((r) => (
                    <li key={r.id}>
                      <button aria-pressed={sel === r.id} onClick={() => setSel(r.id)}>
                        <span>{r.name}</span>
                        <StatusBadge status={h.regionStatus[r.id]} />
                      </button>
                    </li>
                  ))}
              </ul>
              {flagged.length > 0 && flagged.length < tracked.length && (
                <button
                  className="btn btn--sm"
                  aria-expanded={allRegions}
                  onClick={() => setAllRegions((v) => !v)}
                >
                  {allRegions ? "Show only flagged regions" : `Show all ${tracked.length} regions`}
                  <ChevronDown aria-hidden style={{ transform: allRegions ? "rotate(180deg)" : undefined }} />
                </button>
              )}
              <p className="dim" style={{ fontSize: "var(--fs-sm)" }}>
                {region.name}: {region.function}{" "}
                <button className="btn btn--ghost btn--sm" onClick={() => navigate("/body")}>
                  Open body report
                </button>
              </p>
            </div>
          </section>

          {top ? (
            <section
              className={`block block--${top.status}`}
              aria-labelledby="top-alert"
              style={{ margin: "var(--sp-8) 0" }}
            >
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
                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ alignSelf: "flex-start" }}
                    aria-expanded={how}
                    onClick={() => setHow((v) => !v)}
                  >
                    How was this found?{" "}
                    <ChevronDown aria-hidden style={{ transform: how ? "rotate(180deg)" : undefined }} />
                  </button>
                  {how && (
                    <p className="meta">
                      <span>
                        Detector <b>{top.detector}</b>
                      </span>
                      <span>
                        Confidence <b>{top.confidence}</b>
                      </span>
                      <Link to="/how">How it decides</Link>
                    </p>
                  )}
                  <div className="row" style={{ marginTop: "var(--sp-2)" }}>
                    <Link
                      className={`btn${top.status === "act" ? " btn--danger" : " btn--primary"}`}
                      to="/recovery"
                    >
                      What to do now
                    </Link>
                    <Link className="btn" to="/consult">
                      Send to flight surgeon
                    </Link>
                  </div>
                </div>
                <DecisionPanel
                  title={top.title}
                  tHarmMin={top.tHarmMin}
                  tHarmSource={top.tHarmSource}
                  assumption={top.assumption}
                  reply={h.link.reply}
                  verdict={top.verdict}
                  compact
                />
              </div>
            </section>
          ) : (
            <AllClear
              kicker="Today's goal reached"
              title={`All clear today, ${firstName}`}
              action={
                <Link className="btn" to="/trends">
                  See your trends
                </Link>
              }
            >
              <p>
                Every reading is within your normal from Earth. Nothing to do on board, and nothing to send to
                Earth.
              </p>
              <p className="dim">Keep your routine. Next check-in: tomorrow, day {h.day + 1}.</p>
            </AllClear>
          )}

          <button
            className="btn more-toggle"
            aria-expanded={more}
            aria-controls="dash-more"
            onClick={() => setMore((m) => !m)}
          >
            <span>
              {more ? "Hide" : "Show"} all readings
              {rest.length ? ` and ${rest.length} other alert${rest.length > 1 ? "s" : ""}` : ""}
            </span>
            <ChevronDown aria-hidden style={{ transform: more ? "rotate(180deg)" : undefined }} />
          </button>
          {more && (
            <div className="dash-grid results-reveal" id="dash-more" style={{ marginTop: "var(--sp-4)" }}>
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
                      <th scope="col">Today</th>
                      <th scope="col">Status</th>
                      <th scope="col">Last 10</th>
                      <th scope="col">Measured</th>
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
                            <Sparkline
                              values={list
                                .filter((r) => r.day > 0)
                                .slice(-10)
                                .map((r) => displayValue(ind, r.values[0], settings))}
                              status={s}
                              height={24}
                            />
                          </td>
                          <td className="dim">{ago(h.day, latest?.day)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
              <aside className="card" aria-labelledby="others">
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
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
}
