import { describe, expect, it } from "vitest";
import { runValidation } from "./validate";

describe("Monte Carlo validation (300 simulated astronauts, 6,000 normal days)", () => {
  const r = runValidation(300, 2026);
  it("prints the measured results", () => {
    console.log(JSON.stringify(r, null, 2));
    expect(r.normalDays).toBe(6000);
  });
  it("keeps unusual-day false alarms near the 1 % the chi-square limit is designed for", () => {
    expect(r.unusualFalseAlarmRate).toBeLessThan(0.015);
  });
  it("catches full fevers on the first day", () => {
    expect(r.feverCaughtDayOne).toBeGreaterThanOrEqual(0.95);
  });
  it("catches most slow blood-pressure climbs within 20 days", () => {
    expect(r.slowClimbCaught).toBeGreaterThanOrEqual(0.9);
    expect(r.slowClimbMedianDays).toBeLessThanOrEqual(15);
  });
  it("rarely flags drift in steady astronauts", () => {
    expect(r.steadyFalseDriftRate).toBeLessThan(0.05);
  });
});
