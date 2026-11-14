import { describe, expect, it } from "vitest";
import { assessDay } from "./assess";
import { cusum, forecastToLimit, theilSen } from "./detectors";
import { cholesky, forwardSolve, mahalanobis2, shrunkCorrelation, columnStats } from "./linalg";
import { decide, earthReply } from "./missions";
import { profileById } from "./profiles";
import { buildHistory } from "./simulation";

describe("linear algebra", () => {
  it("Cholesky reproduces A = L Lᵀ", () => {
    const A = [
      [4, 2, 0.6],
      [2, 5, 1],
      [0.6, 1, 3],
    ];
    const L = cholesky(A);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const v = L[i].reduce((s, _, k) => s + L[i][k] * L[j][k], 0);
        expect(v).toBeCloseTo(A[i][j], 10);
      }
    expect(forwardSolve(L, [2, 0, 0])[0]).toBeCloseTo(1);
  });
  it("Mahalanobis with the identity is the squared Euclidean distance", () => {
    const I = [
      [1, 0],
      [0, 1],
    ];
    expect(mahalanobis2([3, 4], [0, 0], I)).toBeCloseTo(25);
  });
  it("shrinkage intensity stays in [0, 1] and keeps a unit diagonal", () => {
    const rows = [
      [1, 2, 3],
      [2, 3, 1],
      [3, 5, 2],
      [4, 4, 5],
      [5, 7, 4],
      [6, 6, 6],
    ];
    const { mean, sd } = columnStats(rows, 3);
    const { R, lambda } = shrunkCorrelation(rows, mean, sd);
    expect(lambda).toBeGreaterThanOrEqual(0);
    expect(lambda).toBeLessThanOrEqual(1);
    expect(R[1][1]).toBe(1);
    expect(Math.abs(R[0][1])).toBeLessThanOrEqual(1);
  });
});

describe("drift detectors", () => {
  it("CUSUM stays quiet on zeros and alarms on a sustained shift", () => {
    expect(cusum(Array.from({ length: 20 }, (_, i) => ({ day: i, z: 0 }))).alarm).toBeNull();
    const r = cusum(Array.from({ length: 20 }, (_, i) => ({ day: i, z: 1.5 })));
    expect(r.alarm).toBe("up");
    expect(r.alarmSinceDay).toBe(6); // (1.5 − 0.5) per day crosses h = 6 on the 7th value
  });
  it("CUSUM ignores skipped readings", () => {
    const r = cusum([{ day: 1, z: NaN }, { day: 2, z: NaN }]);
    expect(r.sPlus).toBe(0);
  });
  it("Theil–Sen ignores a single wild outlier", () => {
    const pts = Array.from({ length: 10 }, (_, i) => ({ x: i, y: 2 * i + 1 }));
    pts[4].y = 100;
    expect(theilSen(pts).slope).toBeCloseTo(2);
  });
  it("forecast: rising 1 mmHg/day from 127 reaches 140 in 13 days", () => {
    const pts = Array.from({ length: 10 }, (_, i) => ({ x: 16 + i, y: 118 + i }));
    const f = forecastToLimit(pts, 25, 140, "up");
    expect(f.daysToLimit).toBeCloseTo(13);
  });
});

const story = (id: string) => {
  const p = profileById(id);
  const historyAt = (day: number) => buildHistory(p, "spacecraft", day, [], 1, true);
  return { p, at: (day: number) => assessDay(historyAt(day), day) };
};

describe("crew stories", () => {
  it("Ines (fever): unusual day flagged on day 22, a day before any rule fires", () => {
    const s = story("okafor");
    const d22 = s.at(22);
    expect(d22.run?.unusual?.flagged).toBe(true);
    expect(d22.alerts.some((a) => a.kind === "rule")).toBe(false);
    const d23 = s.at(23);
    const fever = d23.alerts.find((a) => a.card?.id === "fever-tachycardia");
    expect(fever).toBeDefined();
    expect(decide(fever!.tHarmMin, earthReply({ mission: "iss" }).totalMin)).toBe("ask-earth");
    expect(decide(fever!.tHarmMin, earthReply({ mission: "mars-transit", oneWayMin: 22 }).totalMin)).toBe("act-onboard");
  });

  it("Mikael (HR 52): nothing flagged on any day, though a fixed 60–100 rule would flag most days", () => {
    const s = story("lindqvist");
    let naive = 0;
    for (let d = 11; d <= 30; d++) {
      const a = s.at(d);
      expect(a.alerts, `day ${d}`).toEqual([]);
      if ((a.values["hr.hr"] ?? 70) < 60) naive++;
    }
    expect(naive).toBeGreaterThan(14);
  });

  it("Priya (isolation): a detector flags the slide before the sleep rule", () => {
    const s = story("raman");
    const firstDetector = [21, 22, 23, 24, 25].find((d) => s.at(d).alerts.some((a) => a.kind !== "rule"));
    const firstRule = [21, 22, 23, 24, 25, 26].find((d) => s.at(d).alerts.some((a) => a.kind === "rule"));
    expect(firstDetector).toBeDefined();
    expect(firstDetector!).toBeLessThan(firstRule ?? 99);
  });

  it("Hana (BP creep): only the drift detector catches it; forecast ~13 days → can wait for Earth", () => {
    const s = story("sato");
    const a = s.at(25);
    expect(a.alerts.some((x) => x.kind === "rule")).toBe(false);
    expect(a.run?.unusual?.flagged).toBe(false);
    const drift = a.alerts.find((x) => x.id === "drift:bp.systolic");
    expect(drift).toBeDefined();
    const days = drift!.tHarmMin / 1440;
    expect(days).toBeGreaterThan(8);
    expect(days).toBeLessThan(20);
    expect(decide(drift!.tHarmMin, earthReply({ mission: "mars-transit", oneWayMin: 22 }).totalMin)).toBe("ask-earth");
  });

  it("Mira (Day 120): sleep Act and at least one Watch on day 120; calm on day 105", () => {
    const s = story("vega");
    const a = s.at(120);
    expect(a.evals.sleep.status).toBe("act");
    expect(Object.values(a.evals).some((e) => e.status === "watch")).toBe(true);
    expect(s.at(105).alerts.filter((x) => x.status === "act")).toEqual([]);
  });
});
