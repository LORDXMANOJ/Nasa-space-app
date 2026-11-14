import { describe, expect, it } from "vitest";
import { CONDITION_CARDS } from "../data";
import { cardFires, firedCards } from "./conditions";
import { decide, earthReply, ENV_TO_MISSION, formatDuration, REVIEW_MIN } from "./missions";

const fever = CONDITION_CARDS.find((c) => c.id === "fever-tachycardia")!;

describe("Earth reply model", () => {
  it("Mars transit at 22 min one-way gives ~64 min (22 + 20 + 22)", () => {
    expect(earthReply({ mission: "mars-transit", oneWayMin: 22 }).totalMin).toBe(64);
  });
  it("ISS gives ~20 min (review dominates)", () => {
    const t = earthReply({ mission: "iss" }).totalMin;
    expect(t).toBeGreaterThan(REVIEW_MIN);
    expect(t).toBeLessThan(REVIEW_MIN + 0.1);
  });
  it("Moon adds 1.3 s each way", () => {
    expect(earthReply({ mission: "moon" }).totalMin).toBeCloseTo(20 + 2.6 / 60, 5);
  });
  it("clamps the Mars slider to 3–22 min", () => {
    expect(earthReply({ mission: "mars-transit", oneWayMin: 1 }).totalMin).toBe(3 + 20 + 3);
    expect(earthReply({ mission: "mars-transit", oneWayMin: 99 }).totalMin).toBe(64);
  });
  it("Mars base adds two relay-pass waits (store-and-forward, worst case)", () => {
    expect(earthReply({ mission: "mars-base", oneWayMin: 22 }).totalMin).toBe(240 + 22 + 20 + 22 + 240);
  });
  it("solar conjunction means no contact: T_reply = Infinity", () => {
    const r = earthReply({ mission: "mars-transit", conjunction: true });
    expect(r.totalMin).toBe(Infinity);
    expect(r.noContact).toBe(true);
    // conjunction does not apply near Earth
    expect(earthReply({ mission: "iss", conjunction: true }).noContact).toBe(false);
  });
  it("maps every environment mode onto a preset", () => {
    expect(ENV_TO_MISSION.spacecraft).toBe("mars-transit");
    expect(ENV_TO_MISSION.station).toBe("iss");
  });
  it("formats durations for people", () => {
    expect(formatDuration(64)).toBe("64 min");
    expect(formatDuration(Infinity)).toBe("no contact");
    expect(formatDuration(10080)).toBe("7 days");
  });
});

describe("Decision rule: can this wait for Earth?", () => {
  it("worked example: fever + fast HR (T_harm 60 min) → ASK EARTH on ISS, ACT ON BOARD on Mars transit", () => {
    expect(fever.tHarmMin).toBe(60);
    expect(decide(fever.tHarmMin, earthReply({ mission: "iss" }).totalMin)).toBe("ask-earth");
    expect(decide(fever.tHarmMin, earthReply({ mission: "mars-transit", oneWayMin: 22 }).totalMin)).toBe("act-onboard");
  });
  it("everything is handled on board during conjunction", () => {
    expect(decide(10080, Infinity)).toBe("act-onboard");
  });
  it("equal times count as able to wait", () => {
    expect(decide(64, 64)).toBe("ask-earth");
  });
});

describe("Condition cards", () => {
  it("fires fever+fast HR and hides plain fever", () => {
    const fired = firedCards({ "temp.temp": 38.4, "hr.hr": 104 });
    expect(fired.map((c) => c.id)).toEqual(["fever-tachycardia"]);
  });
  it("fires plain fever when the heart rate is normal", () => {
    expect(firedCards({ "temp.temp": 38.2, "hr.hr": 80 }).map((c) => c.id)).toEqual(["fever"]);
  });
  it("treats a missing reading as no evidence", () => {
    expect(cardFires(fever, { "temp.temp": 38.6 })).toBe(false);
    expect(firedCards({})).toEqual([]);
  });
  it("orders fired cards by urgency", () => {
    const fired = firedCards({ "glucose.glucose": 50, "sleep.hours": 4 });
    expect(fired[0].id).toBe("low-sugar");
  });
});
