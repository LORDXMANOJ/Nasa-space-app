/**
 * 2D body: a calm front-view SVG figure with one focusable hotspot per region.
 * Used in low-power mode, without WebGL, and as the 3D loading fallback. Same regions and colours as 3D.
 */
import { REGIONS, type RegionId } from "../../data";
import type { Status } from "../../engine/alerts";
import { StatusShape } from "../../components/status";

interface Props {
  status: Record<RegionId, Status>;
  selected: RegionId;
  onSelect: (id: RegionId) => void;
  reduced?: boolean;
}

export function Body2D({ status, selected, onSelect, reduced }: Props) {
  return (
    <svg className="body2d" viewBox="-40 -10 280 440" role="group" aria-label="Body map">
      <g className="part">
        <circle cx="100" cy="34" r="24" className="part" />
        <rect x="90" y="56" width="20" height="14" rx="4" className="part" />
        <path className="part" d="M62 72 Q100 64 138 72 L146 206 Q100 220 54 206 Z" />
        <path className="part" d="M62 78 Q44 130 40 206 L52 208 Q58 140 72 96 Z" />
        <path className="part" d="M138 78 Q156 130 160 206 L148 208 Q142 140 128 96 Z" />
        <path className="part" d="M66 210 L96 214 L92 404 L72 404 Z" />
        <path className="part" d="M134 210 L104 214 L108 404 L128 404 Z" />
      </g>
      {REGIONS.map((r) => {
        const s = status[r.id];
        const [x, y] = r.pos2d;
        const color = `var(--${s})`;
        return (
          <g
            key={r.id}
            className={`hot${selected === r.id ? " is-sel" : ""}`}
            role="button"
            tabIndex={0}
            aria-pressed={selected === r.id}
            aria-label={`${r.name}: ${s}`}
            onClick={() => onSelect(r.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(r.id))}
          >
            <circle cx={x} cy={y} r={s === "act" ? 20 : 15} fill={color} opacity={s === "nominal" || s === "stale" ? 0.18 : 0.35} className={s === "act" && !reduced ? "pulse" : undefined} />
            <circle className="ring-sel" cx={x} cy={y} r={11} fill="var(--bg)" stroke={color} strokeWidth={1.5} />
            <g transform={`translate(${x - 7} ${y - 7})`} style={{ color }}>
              <StatusShape status={s} size={14} />
            </g>
          </g>
        );
      })}
    </svg>
  );
}
