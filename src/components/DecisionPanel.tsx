/**
 * Decision Panel — "Can this wait for Earth?"
 * Two horizontal time bars on a shared log scale: T_harm (how long it can safely wait) vs T_reply (Earth's answer).
 * Verdict: ACT ON BOARD NOW if T_reply > T_harm, otherwise ASK EARTH. The app never acts by itself.
 */
import { Link } from "react-router-dom";
import { Earth, OctagonAlert, Timer } from "lucide-react";
import { formatDuration, type ReplyBreakdown, type Verdict } from "../engine/missions";

const MIN = 1; // 1 minute
const MAX = 30 * 1440; // 30 days
const pos = (min: number) => (Number.isFinite(min) ? Math.min(1, Math.max(0.02, Math.log10(Math.max(MIN, min)) / Math.log10(MAX))) : 1);

interface Props {
  title: string;
  tHarmMin: number;
  tHarmSource: string;
  assumption: boolean;
  reply: ReplyBreakdown;
  verdict: Verdict;
  compact?: boolean;
}

export function DecisionPanel({ title, tHarmMin, tHarmSource, assumption, reply, verdict, compact }: Props) {
  const act = verdict === "act-onboard";
  return (
    <section className={`decision ${act ? "is-act" : "is-wait"}${compact ? " is-compact" : ""}`} aria-label={`Can ${title} wait for Earth?`}>
      <div className="decision-head">
        <span className="label">Can this wait for Earth?</span>
        <span className={`verdict ${act ? "verdict--act" : "verdict--wait"}`}>
          {act ? <OctagonAlert aria-hidden /> : <Earth aria-hidden />}
          {act ? "Act on board now" : "Ask Earth"}
        </span>
      </div>

      <div className="bars" role="img" aria-label={`Safe wait ${formatDuration(tHarmMin)}; Earth reply ${formatDuration(reply.totalMin)}.`}>
        <div className="bar-row">
          <span className="bar-label">
            <Timer aria-hidden /> Safe wait (T<sub>harm</sub>)
          </span>
          <div className="bar-track">
            <div className="bar-fill bar-fill--harm" style={{ width: `${pos(tHarmMin) * 100}%` }} />
          </div>
          <span className="bar-value num">{formatDuration(tHarmMin)}</span>
        </div>
        <div className="bar-row">
          <span className="bar-label">
            <Earth aria-hidden /> Earth reply (T<sub>reply</sub>)
          </span>
          <div className="bar-track">
            <div className={`bar-fill bar-fill--reply${reply.noContact ? " is-none" : ""}`} style={{ width: `${pos(reply.totalMin) * 100}%` }} />
          </div>
          <span className="bar-value num">{formatDuration(reply.totalMin)}</span>
        </div>
        <div className="bar-scale" aria-hidden>
          <span>1 min</span>
          <span>1 h</span>
          <span>1 day</span>
          <span>30 days</span>
        </div>
      </div>

      {!compact && (
        <>
          <p className="decision-text">
            {reply.noContact
              ? "No contact with Earth right now (solar conjunction). Everything is handled on board; your Consult Packet waits in the queue until contact returns."
              : act
                ? `Earth's answer would arrive after the safe wait. Start the on-board steps now and still send a Consult Packet.`
                : `Earth's answer can arrive in time. Start the steps anyway and send a Consult Packet to the flight surgeon.`}{" "}
            The app never acts by itself: your Crew Medical Officer decides.
          </p>
          <div className="row decision-foot">
            <span className="dim" style={{ fontSize: "var(--fs-sm)" }}>
              Safe wait from the {tHarmSource}
              {assumption && <span className="assume">ASSUMPTION</span>} · Reply = {reply.parts.map((p) => `${p.label} ${formatDuration(p.min)}`).join(" + ")}
            </span>
            <span className="spacer" style={{ flex: 1 }} />
            <Link className="btn btn--sm" to="/consult">
              Build Consult Packet
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
