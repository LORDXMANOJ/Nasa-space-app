/**
 * Crew: everyone's health today, read only. On a long mission the crew looks after each other, so results are
 * shared, not private. Nobody can change another person's readings here. Also shows the reports sent to Earth.
 */
import { useState } from "react";
import { INDICATORS } from "../data";
import { CheckCircle2, Satellite, TriangleAlert, Users } from "../components/icons";
import { learnMetricBaselines } from "../engine/detectors";
import { formatDuration } from "../engine/missions";
import { useCrew } from "../store/crew";
import { useCrewToday, type MemberToday } from "../store/crewHealth";
import { formatInterval, reportIntervalHours } from "../engine/crew";
import { useLink } from "../store/health";
import { useMission } from "../store/mission";

const STATUS_WORD = { nominal: "Nominal", watch: "Watch", act: "Act", stale: "No check-in yet" } as const;

export function Crew() {
  const crew = useCrewToday();
  const reports = useCrew((s) => s.reports);
  const day = useMission((s) => s.day);
  const me = useMission((s) => s.profileId);
  const link = useLink();
  const [open, setOpen] = useState<string | null>(null);
  const done = crew.filter((c) => c.checkedIn).length;
  // the schedule itself runs in the Shell (store/crewHealth.ts useReportSchedule); this only describes it
  const noContact = link.reply.noContact;
  const schedule = {
    label: formatInterval(reportIntervalHours(noContact ? 14 * 1440 : link.reply.totalMin)),
    noContact,
  };

  if (crew.length === 0)
    return (
      <div className="page">
        <h1>Crew</h1>
        <p className="lede">The crew view is for a real crew. The demo crew each have their own story instead.</p>
      </div>
    );

  return (
    <div className="page stack">
      <header>
        <h1>
          <Users aria-hidden /> Crew
        </h1>
        <p className="lede">
          Everyone's health today, day {day}. You can see everyone's results; only each person can enter their own.{" "}
          {done} of {crew.length} checked in.
        </p>
      </header>

      <ul className="crew-list">
        {crew.map((c) => (
          <li key={c.member.id} className={`crew-card crew-card--${c.status}`}>
            <button
              type="button"
              className="crew-card-head"
              aria-expanded={open === c.member.id}
              onClick={() => setOpen(open === c.member.id ? null : c.member.id)}
            >
              <span className="crew-card-name">
                <strong>
                  {c.member.name}
                  {c.member.id === me && <span className="dim"> (you)</span>}
                </strong>
                <span className="dim">{c.member.role}</span>
              </span>
              <span className={`crew-status crew-status--${c.status}`}>
                {c.status === "act" ? (
                  <TriangleAlert aria-hidden />
                ) : c.status === "stale" ? null : (
                  <CheckCircle2 aria-hidden />
                )}
                {STATUS_WORD[c.status]}
              </span>
            </button>
            {c.alerts.length > 0 && (
              <ul className="crew-alerts">
                {c.alerts.map((a) => (
                  <li key={a.id}>
                    <strong>{a.title}</strong>{" "}
                    <span className={a.verdict === "act-onboard" ? "crew-verdict--act" : "crew-verdict"}>
                      {a.verdict === "act-onboard" ? "Act on board now" : "Can wait for Earth"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {open === c.member.id && <MemberDetail c={c} day={day} />}
          </li>
        ))}
      </ul>

      <section className="ob-section">
        <h2>
          <Satellite aria-hidden /> Reports to Earth
        </h2>
        <p>
          Routine report {schedule.label} (Earth's reply: {formatDuration(link.reply.totalMin)}). Emergency reports go at
          once. {schedule.noContact && "No contact now: reports wait in the queue and go when contact returns."}
        </p>
        {reports.length === 0 ? (
          <p className="dim">No reports yet. The first one goes after the first check-in day starts.</p>
        ) : (
          <ul className="crew-reports">
            {reports.slice(0, 8).map((r) => (
              <li key={r.id}>
                <span className={r.kind === "emergency" ? "crew-tag crew-tag--act" : "crew-tag"}>{r.kind}</span>
                <span className="num">{new Date(r.at).toLocaleString()}</span>
                <span>{r.summary}</span>
                <span className="dim">{r.queued ? "Queued" : "Sent"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Read-only: today's readings next to the person's Earth normal. */
function MemberDetail({ c, day }: { c: MemberToday; day: number }) {
  const base = learnMetricBaselines(c.history);
  return (
    <div className="crew-detail">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Reading</th>
            <th scope="col">Today</th>
            <th scope="col">Normal on Earth</th>
          </tr>
        </thead>
        <tbody>
          {INDICATORS.filter((i) => i.id !== "radiation").map((ind) => {
            const r = c.history[ind.id]?.find((x) => x.day === day);
            const keys = ind.id === "bp" ? [0, 1] : [0];
            const m = ind.metrics[0];
            const fmt = (v: number | undefined) => (v === undefined || !Number.isFinite(v) ? "–" : v.toFixed(m.decimals));
            return (
              <tr key={ind.id}>
                <td>{ind.shortName}</td>
                <td className="num">
                  {r ? keys.map((k) => fmt(r.values[k])).join("/") : c.member.skips[day]?.includes(ind.id) ? "Not measured" : "–"}{" "}
                  <span className="dim">{r ? m.unit : ""}</span>
                </td>
                <td className="num dim">
                  {keys.map((k) => fmt(base[`${ind.id}.${ind.metrics[k].key}`]?.mean)).join("/")} {m.unit}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Shown on every screen: any crew member with an ACT ON BOARD NOW alert today. */
export function CrewAlertBanner({ crew }: { crew: MemberToday[] }) {
  const me = useMission((s) => s.profileId);
  const urgent = crew.filter((c) => c.member.id !== me && c.alerts.some((a) => a.verdict === "act-onboard"));
  if (!urgent.length) return null;
  return (
    <div className="banner banner--act crew-banner" role="alert">
      <TriangleAlert aria-hidden />
      <div>
        <strong>Crew alert.</strong>{" "}
        {urgent
          .map((c) => `${c.member.name}: ${c.alerts.find((a) => a.verdict === "act-onboard")!.title}`)
          .join(" · ")}
        . Act on board now. <a href="#/crew">Open Crew</a>
      </div>
    </div>
  );
}
