import { describe, expect, it } from "vitest";
import { indicatorById } from "../data";
import { evaluate, slope, thresholdStatus, worst } from "./alerts";
import { profileById } from "./profiles";
import { buildHistory, type Reading } from "./simulation";
import { briefSentence, dueIndicators, readiness } from "./readiness";

const bp = indicatorById("bp");
const spo2 = indicatorById("spo2");
const rad = indicatorById("radiation");
const sleep = indicatorById("sleep");
const base = {
  "bp.systolic": { mean: 120, sd: 5 },
  "bp.diastolic": { mean: 76, sd: 4 },
  "hr.hr": { mean: 62, sd: 4 },
  "hr.hrv": { mean: 58, sd: 8 },
};

const r = (indicatorId: string, day: number, ...values: number[]): Reading => ({ indicatorId, day, values, source: "sim" });

describe("thresholdStatus", () => {
  it("treats high limits as inclusive", () => {
    expect(thresholdStatus(129, bp.metrics[0])).toBe("nominal");
    expect(thresholdStatus(130, bp.metrics[0])).toBe("watch");
    expect(thresholdStatus(140, bp.metrics[0])).toBe("act");
  });
  it("treats low limits as exclusive", () => {
    expect(thresholdStatus(95, spo2.metrics[0])).toBe("nominal");
    expect(thresholdStatus(94, spo2.metrics[0])).toBe("watch");
    expect(thresholdStatus(92, spo2.metrics[0])).toBe("watch");
    expect(thresholdStatus(91, spo2.metrics[0])).toBe("act");
  });
});

describe("evaluate", () => {
  it("is stale with no readings", () => {
    const e = evaluate(bp, [], base, 120);
    expect(e.status).toBe("stale");
    expect(e.confidence).toBe("low");
  });

  it("is stale when the last reading is older than cadence + 1 day", () => {
    const e = evaluate(bp, [r("bp", 117, 118, 75)], base, 120);
    expect(e.status).toBe("stale");
    expect(e.reason).toMatch(/3 days ago/);
  });

  it("gives low confidence for a single reading", () => {
    const e = evaluate(bp, [r("bp", 120, 118, 75)], base, 120);
    expect(e.status).toBe("nominal");
    expect(e.confidence).toBe("low");
  });

  it("flags the worst metric (diastolic Act beats systolic Watch)", () => {
    const e = evaluate(bp, [r("bp", 118, 120, 76), r("bp", 119, 121, 77), r("bp", 120, 132, 92)], base, 120);
    expect(e.status).toBe("act");
    expect(e.metricKey).toBe("diastolic");
    expect(e.rule).toBe("threshold");
    expect(e.confidence).toBe("high");
  });

  it("uses the personal baseline when the value is normal clinically but unusual for this person", () => {
    // systolic 128 is below the 130 Watch limit, but 1.6 sd above baseline 120 — not enough;
    // diastolic 79 is below 80, but (79-76)/4 = 0.75 — not enough. Use HR: 71 vs baseline 62 (sd 4) → z 2.25.
    const hr = indicatorById("hr");
    const e = evaluate(hr, [r("hr", 118, 63, 57), r("hr", 119, 64, 56), r("hr", 120, 71, 55)], base, 120);
    expect(e.status).toBe("watch");
    expect(e.rule).toBe("baseline");
    expect(e.reason).toMatch(/above your usual/);
  });

  it("flags a 3-day trend in the bad direction", () => {
    const e = evaluate(bp, [r("bp", 118, 121, 76), r("bp", 119, 124, 77), r("bp", 120, 127, 78)], base, 120);
    expect(e.status).toBe("watch");
    expect(e.rule).toBe("trend");
    expect(e.reason).toMatch(/rising for 3 readings/);
  });

  it("ignores an improving trend", () => {
    const e = evaluate(bp, [r("bp", 118, 127, 79), r("bp", 119, 124, 77), r("bp", 120, 121, 76)], base, 120);
    expect(e.status).toBe("nominal");
  });

  it("skips baseline and trend rules for cumulative metrics (radiation)", () => {
    const e = evaluate(rad, [r("radiation", 118, 212), r("radiation", 119, 214), r("radiation", 120, 216)], base, 120);
    expect(e.status).toBe("nominal");
    const high = evaluate(rad, [r("radiation", 120, 300)], base, 120);
    expect(high.status).toBe("watch");
  });

  it("respects the 3-day cadence for glucose (not stale after 3 days)", () => {
    const glucose = indicatorById("glucose");
    expect(evaluate(glucose, [r("glucose", 117, 90)], base, 120).status).toBe("nominal");
    expect(evaluate(glucose, [r("glucose", 116, 90)], base, 120).status).toBe("stale");
  });
});

describe("helpers", () => {
  it("slope is the least-squares gradient", () => {
    expect(slope([{ day: 1, value: 1 }, { day: 2, value: 3 }, { day: 3, value: 5 }])).toBeCloseTo(2);
    expect(slope([{ day: 1, value: 4 }])).toBe(0);
  });
  it("worst ranks act > watch > nominal > stale", () => {
    expect(worst("nominal", "watch")).toBe("watch");
    expect(worst("act", "watch")).toBe("act");
    expect(worst("stale", "nominal")).toBe("nominal");
  });
});

describe("Day 120 scenario (integration)", () => {
  const profile = profileById("vega");
  const evalAll = (day: number) => {
    const h = buildHistory(profile, "spacecraft", day, [], -9, true);
    return Object.fromEntries(Object.entries(h).map(([id, list]) => [id, evaluate(indicatorById(id), list, profile.baselines, day)]));
  };

  it("is calm on day 105", () => {
    const e = evalAll(105);
    expect(Object.values(e).some((x) => x.status === "act")).toBe(false);
  });

  it("shows an Act (sleep) and at least one Watch on day 120", () => {
    const e = evalAll(120);
    expect(e.sleep.status).toBe("act");
    expect(Object.values(e).filter((x) => x.status === "watch").length).toBeGreaterThanOrEqual(1);
    expect(sleep.metrics[0].key).toBe("hours");
  });

  it("recovers by day 126", () => {
    const e = evalAll(126);
    expect(Object.values(e).some((x) => x.status === "act")).toBe(false);
  });

  it("scores readiness lower on day 120 than day 105 and writes a brief", () => {
    const h120 = buildHistory(profile, "spacecraft", 120, []);
    const e120 = evalAll(120);
    const s120 = readiness(e120).score;
    expect(s120).toBeLessThan(readiness(evalAll(105)).score);
    const due = dueIndicators(h120, 120);
    expect(due.map((d) => d.id)).toContain("bp");
    expect(briefSentence(e120, due)).toMatch(/measurements? due today/);
  });

  it("is deterministic", () => {
    const a = buildHistory(profile, "spacecraft", 120, []);
    const b = buildHistory(profile, "spacecraft", 120, []);
    expect(a).toEqual(b);
  });
});
