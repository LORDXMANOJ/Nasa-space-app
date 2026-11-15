/**
 * Body Report (hero screen): regions glow by status (shape + word in the list, never colour alone).
 * 3D procedural body (react-three-fiber, render-on-demand) with a 2D SVG fallback that also kicks in for
 * low-power mode or missing WebGL. A keyboard-navigable region list mirrors the selection both ways.
 */
import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Square } from "../components/icons";
import { INDICATORS, REGIONS, hazardById, type RegionId } from "../data";
import type { Status } from "../engine/alerts";
import { formatPrimary } from "../lib/format";
import { StatusBadge } from "../components/status";
import { HazardChip, Sparkline } from "../components/ui";
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

export default function BodyReport() {
  const h = useHealth();
  const settings = useMission((s) => s.settings);
  const webgl = useMemo(hasWebGL, []);
  const [mode, setMode] = useState<"3d" | "2d">(webgl && !settings.lowPower ? "3d" : "2d");
  const firstFlagged =
    REGIONS.find((r) => h.regionStatus[r.id] === "act") ??
    REGIONS.find((r) => h.regionStatus[r.id] === "watch") ??
    REGIONS[0];
  const [sel, setSel] = useState<RegionId>(firstFlagged.id);
  const use3d = mode === "3d" && webgl && !settings.lowPower;
  const reduced = settings.reducedMotion || settings.lowPower;

  const region = REGIONS.find((r) => r.id === sel)!;
  const related = INDICATORS.filter((i) => i.bodyRegions.includes(sel));
  const alerts = h.alerts.filter((a) => a.regions.includes(sel));
  const hazards = [
    ...new Set(
      related.filter((i) => ["watch", "act"].includes(h.evals[i.id].status)).flatMap((i) => i.hazards),
    ),
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Body report</h1>
          <p className="lede">
            Pick a region to see what it does, its readings and the plan. Colour, shape and word always agree.
          </p>
        </div>
      </div>
      <div className="body-layout">
        <ul className="region-list" aria-label="Body regions">
          {REGIONS.map((r) => (
            <li key={r.id}>
              <button aria-pressed={sel === r.id} onClick={() => setSel(r.id)}>
                <span>{r.name}</span>
                {INDICATORS.some((i) => i.bodyRegions.includes(r.id)) ? (
                  <StatusBadge status={h.regionStatus[r.id]} />
                ) : (
                  <span className="chip">Not tracked</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="body-stage">
          <div className="stage-tools">
            <div className="seg" role="group" aria-label="View">
              <button
                aria-pressed={use3d}
                onClick={() => setMode("3d")}
                disabled={!webgl || settings.lowPower}
                title={settings.lowPower ? "Off in low-power mode" : undefined}
              >
                <Box width={16} aria-hidden /> 3D
              </button>
              <button aria-pressed={!use3d} onClick={() => setMode("2d")}>
                <Square width={16} aria-hidden /> 2D
              </button>
            </div>
          </div>
          {use3d ? (
            <Suspense fallback={<Body2D status={h.regionStatus} selected={sel} onSelect={setSel} reduced />}>
              <Body3D status={h.regionStatus} selected={sel} onSelect={setSel} reduced={reduced} />
            </Suspense>
          ) : (
            <Body2D status={h.regionStatus} selected={sel} onSelect={setSel} reduced={reduced} />
          )}
          {use3d && (
            <div className="legend" aria-hidden>
              {(["nominal", "watch", "act", "stale"] as Status[]).map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
          )}
        </div>

        <aside
          className="card stack region-panel drawer"
          key={sel}
          aria-live="polite"
          aria-label={`${region.name} details`}
        >
          <div className="row">
            <h2>{region.name}</h2>
            <span className="spacer" style={{ flex: 1 }} />
            {related.length > 0 ? (
              <StatusBadge status={h.regionStatus[sel]} large />
            ) : (
              <span className="chip">Not tracked</span>
            )}
          </div>
          <p className="dim">{region.function}</p>
          <div className="stack" style={{ gap: "var(--sp-3)" }}>
            {related.length === 0 && (
              <p className="dim">No reading covers this region yet. A vision self-test is planned.</p>
            )}
            {related.map((i) => {
              const r = h.history[i.id].at(-1);
              const v = formatPrimary(i, r?.values, settings);
              return (
                <Link
                  key={i.id}
                  to={`/trends?ind=${i.id}`}
                  className="card card--tight"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="row">
                    <strong>{i.shortName}</strong>
                    <span className="spacer" style={{ flex: 1 }} />
                    <span className="num">
                      {v.text} <small className="dim">{v.unit}</small>
                    </span>
                    <StatusBadge status={h.evals[i.id].status} />
                  </div>
                  <Sparkline
                    values={h.history[i.id].slice(-14).map((x) => x.values[0])}
                    status={h.evals[i.id].status}
                    height={30}
                  />
                </Link>
              );
            })}
          </div>
          {hazards.length > 0 && (
            <div className="stack" style={{ gap: "var(--sp-2)" }}>
              <span className="label">Likely hazard behind it</span>
              <div className="row">
                {hazards.map((hz) => (
                  <HazardChip key={hz} id={hz} />
                ))}
              </div>
              <span className="dim" style={{ fontSize: "var(--fs-sm)" }}>
                {hazardById(hazards[0]).effects}
              </span>
            </div>
          )}
          {alerts.length > 0 && (
            <div className="stack" style={{ gap: "var(--sp-2)" }}>
              <span className="label">Plan</span>
              {alerts.map((a) => (
                <div key={a.id} className="row" style={{ justifyContent: "space-between" }}>
                  <span>{a.title}</span>
                  <span
                    className={`verdict ${a.verdict === "act-onboard" ? "verdict--act" : "verdict--wait"}`}
                    style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                  >
                    {a.verdict === "act-onboard" ? "Act on board" : "Ask Earth"}
                  </span>
                </div>
              ))}
              <Link className="btn btn--primary" to="/recovery">
                Open the full plan
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
