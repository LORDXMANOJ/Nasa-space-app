/** Dev-only component gallery (/#/dev/components): every primitive in every state, our visual regression target. */
import { StatusBadge } from "../components/status";
import { DecisionPanel } from "../components/DecisionPanel";
import { ReadinessRing, Sparkline } from "../components/ui";
import { earthReply } from "../engine/missions";
import type { Status } from "../engine/alerts";

const S: Status[] = ["nominal", "watch", "act", "stale"];

export function DevComponents() {
  return (
    <div className="page stack">
      <h1>Component gallery</h1>
      <section className="card stack">
        <h2>Buttons</h2>
        <div className="row">
          <button className="btn btn--primary">Primary</button>
          <button className="btn">Secondary</button>
          <button className="btn btn--ghost">Ghost</button>
          <button className="btn btn--danger">Danger</button>
          <button className="btn btn--primary" disabled>
            Disabled
          </button>
          <button className="btn btn--primary btn--lg">Large</button>
          <button className="btn btn--sm">Small</button>
        </div>
      </section>
      <section className="card stack">
        <h2>Status</h2>
        <div className="row">
          {S.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
          {S.map((s) => (
            <StatusBadge key={s + "l"} status={s} large />
          ))}
        </div>
        <div className="row">
          {S.map((s) => (
            <div key={s} style={{ width: 160 }}>
              <Sparkline values={[3, 4, 3, 5, 6, 5, 7]} status={s} />
            </div>
          ))}
        </div>
        <div className="row">
          {[95, 72, 40].map((v) => (
            <ReadinessRing key={v} score={v} size={120} />
          ))}
        </div>
      </section>
      <section className="card stack">
        <h2>Decision panel</h2>
        <DecisionPanel
          title="Fever"
          tHarmMin={60}
          tHarmSource="condition card"
          assumption
          reply={earthReply({ mission: "mars-transit", oneWayMin: 22 })}
          verdict="act-onboard"
        />
        <DecisionPanel
          title="BP drift"
          tHarmMin={13 * 1440}
          tHarmSource="forecast"
          assumption={false}
          reply={earthReply({ mission: "iss" })}
          verdict="ask-earth"
        />
        <DecisionPanel
          title="Conjunction"
          tHarmMin={720}
          tHarmSource="indicator rule"
          assumption
          reply={earthReply({ mission: "mars-transit", conjunction: true })}
          verdict="act-onboard"
          compact
        />
      </section>
      <section className="card stack">
        <h2>Banners</h2>
        <div className="banner banner--act">Act banner</div>
        <div className="banner banner--watch">Watch banner</div>
        <div className="banner banner--info">Info banner</div>
      </section>
    </div>
  );
}
