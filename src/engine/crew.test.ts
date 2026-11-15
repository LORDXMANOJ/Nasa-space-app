import { describe, expect, it } from "vitest";
import { INDICATORS } from "../data";
import { assessDay } from "./assess";
import {
  canSkip,
  dateOfMissionDay,
  earthReadings,
  memberHistory,
  missionDayOf,
  pinHash,
  reportIntervalHours,
  rowComplete,
  validPin,
  wearableReading,
  type EarthRow,
} from "./crew";
import { learnCoreBaseline, runDetectors } from "./detectors";

const LAUNCH = "2026-12-01";
const row = (o: Partial<EarthRow> = {}): EarthRow => ({
  "bp.systolic": 118,
  "bp.diastolic": 76,
  "hr.hr": 64,
  "spo2.spo2": 98,
  "temp.temp": 36.7,
  "sleep.hours": 7.3,
  "mood.mood": 7,
  ...o,
});
/** n Earth days ending the day before launch, with small wobble. */
const earthDays = (n: number) =>
  Object.fromEntries(
    Array.from({ length: n }, (_, i) => [
      dateOfMissionDay(LAUNCH, -i),
      row({ "hr.hr": 64 + ((i % 3) - 1), "temp.temp": 36.7 + ((i % 2) - 0.5) * 0.1 }),
    ]),
  );

describe("mission days", () => {
  it("launch date is day 1 and the day before is day 0", () => {
    expect(missionDayOf(LAUNCH, LAUNCH)).toBe(1);
    expect(missionDayOf(LAUNCH, "2026-11-30")).toBe(0);
    expect(missionDayOf(LAUNCH, "2026-11-21")).toBe(-9);
    expect(dateOfMissionDay(LAUNCH, 0)).toBe("2026-11-30");
    expect(missionDayOf(LAUNCH, "2027-01-01")).toBe(32);
  });
});

describe("Earth records", () => {
  it("a day is complete only when every daily reading is filled", () => {
    expect(rowComplete(row())).toBe(true);
    expect(rowComplete(row({ "mood.mood": undefined }))).toBe(false);
  });

  it("turns rows into readings before launch and ignores dates after it", () => {
    const rs = earthReadings({ ...earthDays(3), "2026-12-05": row() }, LAUNCH);
    expect(Math.max(...rs.map((r) => r.day))).toBe(0);
    expect(rs.filter((r) => r.indicatorId === "hr")).toHaveLength(3);
  });

  it("uses every Earth day when there are more than 10", () => {
    const base = learnCoreBaseline(memberHistory({ memberId: "a", earth: earthReadings(earthDays(14), LAUNCH), readings: [], day: 1, env: "spacecraft", wearablePaired: false }));
    expect(base.days).toBe(14);
  });

  it("still learns a baseline from fewer than 10 days", () => {
    const h = memberHistory({ memberId: "a", earth: earthReadings(earthDays(4), LAUNCH), readings: [], day: 1, env: "spacecraft", wearablePaired: false });
    const base = learnCoreBaseline(h);
    expect(base.mean[2]).toBeCloseTo(64, 0); // heart rate
  });

  it("a reading with no Earth baseline is left out of the unusual-day check instead of breaking it", () => {
    const earth = earthReadings(earthDays(10), LAUNCH); // no glucose on Earth
    const readings = [
      { indicatorId: "glucose", day: 1, values: [92], source: "user" as const },
      { indicatorId: "hr", day: 1, values: [65, 50], source: "user" as const },
      { indicatorId: "temp", day: 1, values: [36.7], source: "user" as const },
    ];
    const a = assessDay(memberHistory({ memberId: "a", earth, readings, day: 1, env: "spacecraft", wearablePaired: false }), 1);
    expect(Number.isFinite(a.run?.unusual?.d2)).toBe(true);
    expect(a.run?.unusual?.contributions.some((c) => c.key === "glucose.glucose")).toBe(false);
  });
});

describe("a real crew member's day", () => {
  const earth = earthReadings(earthDays(10), LAUNCH);

  it("a paired wearable fills today's auto readings near the person's own normal", () => {
    const hr = wearableReading("a", INDICATORS.find((i) => i.id === "hr")!, 3, earth, "spacecraft");
    expect(Math.abs(hr[0] - 64)).toBeLessThan(5);
    const h = memberHistory({ memberId: "a", earth, readings: [], day: 3, env: "spacecraft", wearablePaired: true });
    expect(h.hr.find((r) => r.day === 3)?.source).toBe("auto");
  });

  it("no wearable: nothing is invented for today", () => {
    const h = memberHistory({ memberId: "a", earth, readings: [], day: 3, env: "spacecraft", wearablePaired: false });
    expect(h.hr.some((r) => r.day === 3)).toBe(false);
  });

  it("a fever entered by hand raises an alert against the person's own normal", () => {
    const readings = [
      { indicatorId: "temp", day: 2, values: [38.6], source: "user" as const },
      { indicatorId: "hr", day: 2, values: [104, 40], source: "user" as const },
    ];
    const h = memberHistory({ memberId: "a", earth, readings, day: 2, env: "spacecraft", wearablePaired: false });
    const a = assessDay(h, 2);
    expect(a.alerts.length).toBeGreaterThan(0);
    expect(a.evals.temp.status).toBe("act");
  });
});

describe("didn't measure", () => {
  it("a reading can be skipped one day but not two in a row", () => {
    const skips = { 4: ["bp"] };
    expect(canSkip(skips, "bp", 5)).toBe(false);
    expect(canSkip(skips, "bp", 6)).toBe(true);
    expect(canSkip(skips, "glucose", 5)).toBe(true);
  });
});

describe("reports to Earth", () => {
  it("follows the reply-time schedule and keeps doubling", () => {
    expect(reportIntervalHours(20)).toBe(6); // under 1 h (our assumption)
    expect(reportIntervalHours(64)).toBe(12); // 1-3 h
    expect(reportIntervalHours(4 * 60)).toBe(12); // 3-5 h (our assumption)
    expect(reportIntervalHours(9 * 60)).toBe(24); // 5-12 h
    expect(reportIntervalHours(18 * 60)).toBe(48); // 12-24 h
    expect(reportIntervalHours(30 * 60)).toBe(96); // 24-48 h
    expect(reportIntervalHours(60 * 60)).toBe(192); // 48-96 h
  });
});

describe("PIN", () => {
  it("accepts exactly four digits and never stores the PIN itself", () => {
    expect(validPin("1234")).toBe(true);
    expect(validPin("123")).toBe(false);
    expect(validPin("12a4")).toBe(false);
    expect(pinHash("a", "1234")).not.toContain("1234");
    expect(pinHash("a", "1234")).not.toBe(pinHash("b", "1234"));
  });
});

describe("slow drift after a fever has passed", () => {
  it("does not call a finished fever a drift", () => {
    const earth = earthReadings(earthDays(10), LAUNCH);
    const temps = [38.6, 38.3, 37.8, 37.3, 36.9];
    const readings = Array.from({ length: 14 }, (_, i) => ({
      indicatorId: "temp",
      day: i + 1,
      values: [temps[i] ?? 36.7],
      source: "user" as const,
    }));
    const h = memberHistory({ memberId: "a", earth, readings, day: 14, env: "spacecraft", wearablePaired: false });
    expect(runDetectors(h, 14)?.drift.some((d) => d.key === "temp.temp")).toBe(false);
    // while the fever is still on, it is reported
    const h2 = memberHistory({ memberId: "a", earth, readings: readings.slice(0, 3), day: 3, env: "spacecraft", wearablePaired: false });
    expect(runDetectors(h2, 3)?.drift.some((d) => d.key === "temp.temp")).toBe(true);
  });
});
