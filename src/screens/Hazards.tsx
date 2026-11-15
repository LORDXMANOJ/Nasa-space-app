/**
 * Hazards: the five NASA spaceflight hazards as a short list. Each row says what the hazard is in one sentence
 * and how its readings look for you today. Effects, the readings themselves, body regions and the source
 * open on tap. The hazards that matter most in the current environment come first and are labelled.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "../components/icons";
import { HAZARDS, environmentById, indicatorsForHazard, regionById } from "../data";
import { StatusBadge } from "../components/status";
import type { Status } from "../engine/alerts";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";

const RANK: Record<Status, number> = { act: 3, watch: 2, stale: 1, nominal: 0 };

export function Hazards() {
  const h = useHealth();
  const env = environmentById(useMission((s) => s.environment));
  const [open, setOpen] = useState<string | null>(null);
  const list = [...HAZARDS].sort(
    (a, b) => Number(env.emphasis.includes(b.id)) - Number(env.emphasis.includes(a.id)),
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Five hazards of long missions</h1>
          <p className="lede">
            What each one does to the body, and how your readings look today. Tap a hazard for more.
          </p>
        </div>
      </div>
      <ul className="hazard-list">
        {list.map((hz) => {
          const inds = indicatorsForHazard(hz.id);
          const worst = inds.reduce<Status>(
            (w, i) => (RANK[h.evals[i.id].status] > RANK[w] ? h.evals[i.id].status : w),
            "nominal",
          );
          const flagged = inds.filter((i) => RANK[h.evals[i.id].status] >= 2).length;
          const isOpen = open === hz.id;
          const regions = [...new Set(inds.flatMap((i) => i.bodyRegions))];
          return (
            <li key={hz.id} id={hz.id} className={isOpen ? "is-open" : undefined}>
              <button
                className="hazard-row"
                aria-expanded={isOpen}
                aria-controls={`hz-${hz.id}`}
                onClick={() => setOpen(isOpen ? null : hz.id)}
              >
                <span className="hazard-name">
                  <strong>{hz.name}</strong>
                  {env.emphasis.includes(hz.id) && (
                    <span className="hazard-key">Matters most on this mission</span>
                  )}
                </span>
                <span className="hazard-plain">{hz.plain}</span>
                <span className="hazard-status">
                  <StatusBadge status={worst} />
                  <span className="dim">
                    {flagged
                      ? `${flagged} of ${inds.length} readings flagged`
                      : `${inds.length} readings fine`}
                  </span>
                </span>
                <ChevronDown aria-hidden style={{ transform: isOpen ? "rotate(180deg)" : undefined }} />
              </button>
              {isOpen && (
                <div className="hazard-more" id={`hz-${hz.id}`}>
                  <div>
                    <h2>What it can do</h2>
                    <p>{hz.effects}</p>
                    <p className="dim" style={{ marginTop: "var(--sp-3)" }}>
                      Body areas: {regions.map((r) => regionById(r).name).join(", ")}.
                    </p>
                    <a
                      href={hz.source.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "var(--fs-sm)" }}
                    >
                      Source: {hz.source.title}
                    </a>
                  </div>
                  <div>
                    <h2>Your readings that show it</h2>
                    <ul className="hazard-readings">
                      {inds.map((i) => (
                        <li key={i.id}>
                          <Link to={`/trends?ind=${i.id}`}>
                            <span>{i.shortName}</span>
                            <StatusBadge status={h.evals[i.id].status} />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
