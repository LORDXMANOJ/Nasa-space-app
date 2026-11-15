/**
 * Trends: one indicator over mission days with the personal baseline band (mean ± 1 sd from days 1–10),
 * labelled Watch/Act limits, the baseline-learning window and today. Every chart has a data-table alternative.
 */
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { INDICATORS, indicatorById } from "../data";
import { learnMetricBaselines } from "../engine/detectors";
import { displayValue } from "../lib/format";
import { StatusBadge } from "../components/status";
import { useHealth } from "../store/health";
import { useMission } from "../store/mission";

const COLORS = ["#123631", "#2a8f7f"];

export default function Trends() {
  const h = useHealth();
  const settings = useMission((s) => s.settings);
  const [params, setParams] = useSearchParams();
  const ind = indicatorById(params.get("ind") ?? "bp");
  const [range, setRange] = useState<7 | 30 | 0>(30);
  const [table, setTable] = useState(false);

  const base = useMemo(() => learnMetricBaselines(h.history), [h.history]);
  const rows = h.history[ind.id]
    .filter((r) => range === 0 || r.day > h.day - range)
    .map((r) => ({
      day: r.day,
      ...Object.fromEntries(
        ind.metrics.map((m, i) => [
          m.key,
          i === 0 ? +displayValue(ind, r.values[0], settings).toFixed(2) : r.values[i],
        ]),
      ),
    }));
  const metrics = ind.id === "bp" ? ind.metrics : [ind.metrics[0]];
  const m0 = ind.metrics[0];
  const b0 = base[`${ind.id}.${m0.key}`];
  const conv = (v: number) => displayValue(ind, v, settings);
  const lines = [
    ...(m0.amber.high !== undefined ? [{ y: m0.amber.high, label: "Watch", c: "var(--watch)" }] : []),
    ...(m0.red.high !== undefined ? [{ y: m0.red.high, label: "Act", c: "var(--act)" }] : []),
    ...(m0.amber.low !== undefined ? [{ y: m0.amber.low, label: "Watch", c: "var(--watch)" }] : []),
    ...(m0.red.low !== undefined ? [{ y: m0.red.low, label: "Act", c: "var(--act)" }] : []),
  ];
  const first = rows[0]?.day ?? 1;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{ind.name} trend</h1>
          <p className="lede">
            The shaded band is your normal, from your readings on Earth before launch (days -9 to 0). Dashed
            lines are the fixed safety limits.
          </p>
        </div>
        <StatusBadge status={h.evals[ind.id].status} large />
      </div>

      <div className="row" style={{ marginBottom: "var(--sp-4)" }}>
        <label className="field" style={{ minWidth: 260 }}>
          <span className="sr-only">Indicator</span>
          <select className="select" value={ind.id} onChange={(e) => setParams({ ind: e.target.value })}>
            {INDICATORS.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <div className="seg" role="group" aria-label="Range">
          {([7, 30, 0] as const).map((r) => (
            <button key={r} aria-pressed={range === r} onClick={() => setRange(r)}>
              {r === 0 ? "Mission" : `${r} days`}
            </button>
          ))}
        </div>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn btn--sm" aria-pressed={table} onClick={() => setTable((t) => !t)}>
          {table ? "Show chart" : "Show as table"}
        </button>
      </div>

      <section className="card">
        {table ? (
          <div style={{ maxHeight: 460, overflow: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  {metrics.map((m) => (
                    <th key={m.key}>
                      {m.label} (
                      {m.key === m0.key ? (ind.altUnit && conv(1) !== 1 ? ind.altUnit.unit : m.unit) : m.unit}
                      )
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...rows].reverse().map((r) => (
                  <tr key={r.day}>
                    <td className="num">{r.day}</td>
                    {metrics.map((m) => (
                      <td key={m.key} className="num">
                        {(r as Record<string, number>)[m.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{ height: 440 }}
            role="img"
            aria-label={`${ind.name} over ${rows.length} readings. Latest status ${h.evals[ind.id].status}.`}
          >
            <ResponsiveContainer>
              <LineChart data={rows} margin={{ top: 16, right: 56, bottom: 8, left: 8 }}>
                <CartesianGrid stroke="#cfdcd8" strokeDasharray="0" vertical={false} />
                <XAxis
                  dataKey="day"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  stroke="#4f625d"
                  tick={{ fontFamily: "IBM Plex Mono", fontSize: 12, fill: "#4f625d" }}
                  label={{
                    value: "Mission day",
                    position: "insideBottomRight",
                    offset: -4,
                    fill: "#4f625d",
                    fontSize: 12,
                  }}
                />
                <YAxis
                  stroke="#4f625d"
                  tick={{ fontFamily: "IBM Plex Mono", fontSize: 12, fill: "#4f625d" }}
                  domain={["auto", "auto"]}
                  width={56}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "2px solid #123631",
                    borderRadius: 10,
                    fontFamily: "IBM Plex Mono",
                  }}
                  labelFormatter={(d) => `Day ${d}`}
                />
                {first <= 0 && (
                  <ReferenceArea
                    x1={first}
                    x2={0}
                    fill="#e3edea"
                    fillOpacity={0.7}
                    label={{ value: "on Earth", fill: "#4f625d", fontSize: 12, position: "insideTop" }}
                  />
                )}
                {b0 && !m0.cumulative && (
                  <ReferenceArea
                    y1={conv(b0.mean - b0.sd)}
                    y2={conv(b0.mean + b0.sd)}
                    fill="#2a8f7f"
                    fillOpacity={0.15}
                    ifOverflow="extendDomain"
                  />
                )}
                {lines.map((l, i) => (
                  <ReferenceLine
                    key={i}
                    y={conv(l.y)}
                    stroke={l.c}
                    strokeDasharray="6 5"
                    ifOverflow="extendDomain"
                    label={{ value: l.label, fill: l.c, position: "right", fontSize: 12 }}
                  />
                ))}
                <ReferenceLine
                  x={h.day}
                  stroke="#123631"
                  strokeOpacity={0.5}
                  label={{ value: "today", fill: "#4f625d", fontSize: 11, position: "top" }}
                />
                {metrics.map((m, i) => (
                  <Line
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    name={m.label}
                    stroke={COLORS[i]}
                    strokeWidth={2.2}
                    dot={{ r: 2.5 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={!settings.lowPower && !settings.reducedMotion}
                    connectNulls
                  />
                ))}
                {metrics.length > 1 && <Legend />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="dim" style={{ marginTop: "var(--sp-3)", fontSize: "var(--fs-sm)" }}>
          {h.evals[ind.id].reason}{" "}
          {b0 &&
            !m0.cumulative &&
            `Your normal: ${conv(b0.mean).toFixed(m0.decimals)} ± ${(conv(b0.mean + b0.sd) - conv(b0.mean)).toFixed(m0.decimals || 1)}.`}
        </p>
      </section>
    </div>
  );
}
