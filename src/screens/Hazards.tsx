/**
 * Hazards Overview: the five NASA spaceflight hazards, each linked to the indicators it affects (live status),
 * the body regions involved, and its source. The current environment's emphasised hazards are marked.
 */
import { Link } from "react-router-dom";
import { HAZARDS, environmentById, indicatorsForHazard, regionById } from "../data";
import { StatusBadge } from "../components/status";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";

export function Hazards() {
  const h = useHealth();
  const env = environmentById(useMission((s) => s.environment));
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Five hazards of long missions</h1>
          <p className="lede">
            Each hazard links to the readings that would show its effect on you. Highlighted: most important
            for {env.name}.
          </p>
        </div>
      </div>
      <div className="hazard-grid">
        {HAZARDS.map((hz) => {
          const inds = indicatorsForHazard(hz.id);
          const regions = [...new Set(inds.flatMap((i) => i.bodyRegions))];
          const emph = env.emphasis.includes(hz.id);
          return (
            <article
              key={hz.id}
              id={hz.id}
              className="card stack hazard-card"
              style={emph ? { borderColor: "var(--accent)" } : undefined}
            >
              <div className="row">
                <h2>{hz.name}</h2>
                {emph && <span className="chip">Key for {env.name}</span>}
              </div>
              <p>{hz.plain}</p>
              <p className="dim">
                <strong style={{ color: "var(--text-soft)" }}>Effects:</strong> {hz.effects}
              </p>
              <div className="stack" style={{ gap: "var(--sp-2)" }}>
                <span className="label">Readings that show it</span>
                {inds.map((i) => (
                  <Link
                    key={i.id}
                    to={`/trends?ind=${i.id}`}
                    className="row"
                    style={{ justifyContent: "space-between", color: "inherit", textDecoration: "none" }}
                  >
                    <span>{i.shortName}</span>
                    <StatusBadge status={h.evals[i.id].status} />
                  </Link>
                ))}
              </div>
              <div className="row">
                {regions.map((r) => (
                  <span key={r} className="chip">
                    {regionById(r).name}
                  </span>
                ))}
              </div>
              <a href={hz.source.url} target="_blank" rel="noreferrer" style={{ fontSize: "var(--fs-sm)" }}>
                Source: {hz.source.title}
              </a>
            </article>
          );
        })}
      </div>
    </div>
  );
}
