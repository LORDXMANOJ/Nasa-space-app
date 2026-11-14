/**
 * IndicatorTile: one vital at a glance — value + unit, status (shape + word), trend arrow,
 * 10-reading sparkline, last-measured time, and a Measure action. The whole tile links to its trend.
 */
import { Link } from "react-router-dom";
import type { Indicator } from "../data";
import type { Evaluation } from "../engine/alerts";
import type { Reading } from "../engine/simulation";
import { ago, displayValue, formatPrimary } from "../lib/format";
import { useMission } from "../store/mission";
import { StatusBadge } from "./status";
import { IndicatorIcon, Sparkline, TrendArrow } from "./ui";

interface Props {
  ind: Indicator;
  evaluation: Evaluation;
  readings: Reading[];
  day: number;
  due: boolean;
}

export function IndicatorTile({ ind, evaluation, readings, day, due }: Props) {
  const settings = useMission((s) => s.settings);
  const latest = readings[readings.length - 1];
  const prev = readings[readings.length - 2];
  const v = formatPrimary(ind, latest?.values, settings);
  const series = readings.slice(-10).map((r) => displayValue(ind, r.values[0], settings));
  const delta = latest && prev ? latest.values[0] - prev.values[0] : 0;
  const s = evaluation.status;

  return (
    <article className={`tile is-${s}`} aria-label={`${ind.shortName}: ${v.text} ${v.unit}, ${s}`}>
      <div className="tile-head">
        <IndicatorIcon name={ind.icon} />
        <h3 style={{ fontSize: "var(--fs-base)", fontWeight: 500 }}>
          <Link to={`/trends?ind=${ind.id}`} className="tile-link">
            {ind.shortName}
          </Link>
        </h3>
        <span className="spacer" style={{ flex: 1 }} />
        <TrendArrow delta={ind.id === "radiation" ? 0 : delta} />
      </div>
      <div className="tile-value">
        <span className="num">{v.text}</span>
        <span className="unit">{v.unit}</span>
      </div>
      <Sparkline values={series} status={s === "stale" ? "stale" : s} />
      <div className="tile-foot">
        <StatusBadge status={s} />
        {due ? (
          <Link className="btn btn--primary btn--sm tile-action" to={`/measure/${ind.id}`}>
            Measure
          </Link>
        ) : (
          <span className="tile-meta">{ago(day, latest?.day)}</span>
        )}
      </div>
    </article>
  );
}
