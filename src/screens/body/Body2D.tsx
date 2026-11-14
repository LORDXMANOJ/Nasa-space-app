/**
 * 2D body in the Hairline style, drawn with the unmodified Hairline kernel (window.HL, public/hairline/kernel.js):
 * a standing figure built from rounded solids in single strokes. The part under the pointer lifts on a spring and
 * takes the one bright stroke; at rest the bright stroke marks the selected (most urgent) region.
 * Damage is shown with arrows, never colour (the user's request; Hairline's own rule 10 would leave arrows out):
 * a doubled arrow with a double head for Act, a dashed arrow with a single head for Watch.
 * Status words in colour live in the box beside the drawing and in the region list.
 */
import { useEffect, useRef } from "react";
import { REGIONS, type RegionId } from "../../data";
import type { Status } from "../../engine/alerts";
import { statusLabel } from "../../lib/format";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    HL?: any;
  }
}

interface Props {
  status: Record<RegionId, Status>;
  selected: RegionId;
  onSelect: (id: RegionId) => void;
  reduced?: boolean;
}

/** World geometry: x left-right, y back-front (+y faces the viewer), z up. Units ~ centimetres. */
interface Part {
  region: RegionId;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  z0: number;
  z1: number;
  r: number;
}
const PARTS: Part[] = [
  { region: "whole", x0: -36, y0: -24, x1: 36, y1: 24, z0: 0, z1: 3, r: 22 },
  { region: "musculoskeletal", x0: -15, y0: -6, x1: -4, y1: 6, z0: 3, z1: 82, r: 5 },
  { region: "musculoskeletal", x0: 4, y0: -6, x1: 15, y1: 6, z0: 3, z1: 82, r: 5 },
  { region: "gut", x0: -16, y0: -9, x1: 16, y1: 9, z0: 82, z1: 100, r: 8 },
  { region: "lungs", x0: -18, y0: -10, x1: 18, y1: 10, z0: 100, z1: 134, r: 8 },
  { region: "lungs", x0: -27, y0: -10, x1: 27, y1: 10, z0: 134, z1: 143, r: 8 },
  { region: "heart", x0: 2, y0: 10, x1: 12, y1: 13, z0: 116, z1: 129, r: 2 },
  { region: "skin", x0: -31, y0: -5, x1: -23, y1: 5, z0: 88, z1: 134, r: 4 },
  { region: "skin", x0: 23, y0: -5, x1: 31, y1: 5, z0: 88, z1: 134, r: 4 },
  { region: "brain", x0: -5, y0: -5, x1: 5, y1: 5, z0: 143, z1: 150, r: 4 },
  { region: "brain", x0: -10, y0: -11, x1: 10, y1: 11, z0: 150, z1: 174, r: 9.5 },
];
/** Where each region's arrow lands (world), which side it comes from, and how steeply. */
const TARGET: Partial<Record<RegionId, { at: [number, number, number]; side: -1 | 1; rise: number }>> = {
  brain: { at: [-10, 2, 166], side: -1, rise: 26 },
  eyes: { at: [5, 11, 160], side: 1, rise: 26 },
  lungs: { at: [14, 10, 136], side: 1, rise: 30 },
  heart: { at: [12, 13, 122], side: 1, rise: 6 },
  gut: { at: [16, 6, 90], side: 1, rise: -10 },
  skin: { at: [-31, 2, 112], side: -1, rise: 8 },
  musculoskeletal: { at: [-15, 2, 42], side: -1, rise: 4 },
  whole: { at: [-34, 10, 2], side: -1, rise: -14 },
};

export function Body2D({ status, selected, onSelect, reduced }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const live = useRef({ status, selected, onSelect, reduced });
  live.current = { status, selected, onSelect, reduced };

  useEffect(() => {
    const HL = window.HL;
    const stage = host.current;
    if (!HL || !stage) return;
    HL.inject(document);
    stage.setAttribute("data-hairline", "body");
    const svg = HL.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);

    const extremes: number[][] = [];
    for (const p of PARTS) for (const [x, y] of [[p.x0, p.y0], [p.x1, p.y1], [p.x0, p.y1], [p.x1, p.y0]]) extremes.push([x, y, p.z0], [x, y, p.z1 + 8]);
    const probe = HL.Cam(20, 0.32, 1);
    HL.fit(probe, extremes, 200, 160);
    const Pp = HL.proj(probe);
    const ys = extremes.map((e) => Pp(e[0], e[1], e[2])[1]);
    const C = HL.Cam(20, 0.32, 284 / (Math.max(...ys) - Math.min(...ys)));
    HL.fit(C, extremes, 200, 160);
    const P = HL.proj(C);
    const front = HL.facing(C);

    // paint back to front: by the part's nearest depth, then by height
    const order = PARTS.map((p, i) => ({ p, i })).sort((a, b) => a.p.y1 - b.p.y1 || a.p.z0 - b.p.z0);
    const lifts = PARTS.map(() => HL.spring(0));
    const solids = PARTS.map(() => null as any);
    const drawn = PARTS.map(() => NaN);
    for (const { i } of order) solids[i] = HL.solid(svg);
    // eyes: two dots on the face (the eyes region is not tracked yet, so they never light up)
    const eyeL = HL.flatDot(svg, C, 1.4, "dot off");
    const eyeR = HL.flatDot(svg, C, 1.4, "dot off");
    HL.place(eyeL, P(-4, 11.5, 161));
    HL.place(eyeR, P(4, 11.5, 161));
    const arrowsG = HL.mk("g", {}, svg); // annotations sit in front of the figure

    // rest-pose screen hulls for hit testing (rule 01: never test against the moving pose)
    const restHull = PARTS.map((p) => {
      const [ring] = HL.rings(p.x0, p.y0, p.x1, p.y1, p.r, 1);
      return HL.hull(HL.ringAt(P, ring, p.z0).concat(HL.ringAt(P, ring, p.z1)));
    });
    const inside = (pt: number[], poly: number[][]) => {
      let c = false;
      for (let a = 0, b = poly.length - 1; a < poly.length; b = a++) {
        const [xa, ya] = poly[a];
        const [xb, yb] = poly[b];
        if (ya > pt[1] !== yb > pt[1] && pt[0] < ((xb - xa) * (pt[1] - ya)) / (yb - ya) + xa) c = !c;
      }
      return c;
    };
    const frontToBack = [...order].reverse().map((o) => o.i);
    let hover: number | null = null;

    const drawPart = (i: number) => {
      const p = PARTS[i];
      const dz = Math.round(lifts[i].x * 100) / 100;
      if (dz === drawn[i]) return;
      drawn[i] = dz;
      const b = Math.min(1.6, (Math.min(p.x1 - p.x0, p.y1 - p.y0) / 2) * 0.6);
      const [ring, inner] = HL.rings(p.x0, p.y0, p.x1, p.y1, p.r, b);
      HL.put(solids[i], HL.prism(P, front, ring, inner, p.z0 + dz, p.z1 + dz));
    };
    const paintHighlight = () => {
      const { selected: sel } = live.current;
      const target = hover !== null ? PARTS[hover].region : sel;
      PARTS.forEach((p, i) => solids[i].sil.classList.toggle("hi", p.region === target));
    };

    const drawArrows = () => {
      while (arrowsG.firstChild) arrowsG.removeChild(arrowsG.firstChild);
      const { status: st } = live.current;
      for (const r of REGIONS) {
        const s = st[r.id];
        const t = TARGET[r.id];
        if (!t || (s !== "act" && s !== "watch")) continue;
        const tip = P(t.at[0], t.at[1], t.at[2]);
        const tail = [tip[0] + t.side * 78, tip[1] - t.rise];
        const dx = tip[0] - tail[0];
        const dy = tip[1] - tail[1];
        const len = Math.hypot(dx, dy);
        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny = ux;
        const head = (o: number) => {
          const bx = tip[0] - ux * (9 + o);
          const by = tip[1] - uy * (9 + o);
          const tx = tip[0] - ux * o;
          const ty = tip[1] - uy * o;
          return HL.open([[bx + nx * 5.5, by + ny * 5.5], [tx, ty], [bx - nx * 5.5, by - ny * 5.5]]);
        };
        if (s === "act") {
          // Act: a doubled shaft and a double head
          HL.mk("path", { d: HL.open([[tail[0] + nx * 1.6, tail[1] + ny * 1.6], [tip[0] - ux * 3 + nx * 1.6, tip[1] - uy * 3 + ny * 1.6]]), class: "nf sil" }, arrowsG);
          HL.mk("path", { d: HL.open([[tail[0] - nx * 1.6, tail[1] - ny * 1.6], [tip[0] - ux * 3 - nx * 1.6, tip[1] - uy * 3 - ny * 1.6]]), class: "nf sil" }, arrowsG);
          HL.mk("path", { d: head(0), class: "nf sil" }, arrowsG);
          HL.mk("path", { d: head(7), class: "nf sil" }, arrowsG);
        } else {
          // Watch: a dashed shaft and a single head
          HL.mk("path", { d: HL.open([tail, [tip[0] - ux * 3, tip[1] - uy * 3]]), class: "nf sil dash" }, arrowsG);
          HL.mk("path", { d: head(0), class: "nf sil" }, arrowsG);
        }
      }
    };

    const loop = HL.register(stage, (dt: number) => {
      let moving = false;
      PARTS.forEach((_, i) => {
        if (HL.stepS(lifts[i], dt)) moving = true;
        drawPart(i);
      });
      return moving;
    });
    PARTS.forEach((_, i) => drawPart(i));
    drawArrows();
    paintHighlight();

    const pick = (pt: number[]) => frontToBack.find((i) => inside(pt, restHull[i])) ?? null;
    const setHover = (i: number | null) => {
      if (i === hover) return;
      hover = i;
      PARTS.forEach((p, k) => (lifts[k].t = i !== null && p.region === PARTS[i].region && p.region !== "whole" && !live.current.reduced ? 7 : 0));
      paintHighlight();
      loop.wake();
    };
    const off = HL.pointer(stage, {
      move: (pt: number[]) => setHover(pick(pt)),
      down: (pt: number[]) => {
        const i = pick(pt);
        if (i !== null) live.current.onSelect(PARTS[i].region);
      },
      leave: () => setHover(null),
    });

    (stage as any).__hl = { drawArrows, paintHighlight };
    return () => {
      off?.();
      loop.unregister();
      stage.innerHTML = "";
      stage.removeAttribute("data-hairline");
    };
  }, []);

  // repaint arrows and the bright stroke when statuses or the selection change
  useEffect(() => {
    const api = (host.current as any)?.__hl;
    api?.drawArrows();
    api?.paintHighlight();
  }, [status, selected]);

  const damaged = REGIONS.filter((r) => status[r.id] === "act" || status[r.id] === "watch");
  return (
    <div className="hl-wrap">
      <div ref={host} className="hl-stage" aria-hidden />
      <div className="hl-key" role="group" aria-label="What the arrows mean">
        <p className="hl-key-title">Damage</p>
        {damaged.length === 0 ? (
          <p className="s-nominal hl-word">Nothing flagged</p>
        ) : (
          <ul>
            {damaged.map((r) => (
              <li key={r.id}>
                <button className={`hl-word s-${status[r.id]}`} aria-pressed={selected === r.id} onClick={() => onSelect(r.id)}>
                  {r.name}: {statusLabel[status[r.id]]}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="hl-legend">
          <svg width="34" height="12" aria-hidden>
            <path d="M2 4H24M2 8H24M20 1 30 6 20 11M26 1 32 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span className="s-act">Act</span>
          <svg width="34" height="12" aria-hidden style={{ marginLeft: 10 }}>
            <path d="M2 6H26" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 3" />
            <path d="M22 1 30 6 22 11" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span className="s-watch">Watch</span>
        </p>
      </div>
    </div>
  );
}
