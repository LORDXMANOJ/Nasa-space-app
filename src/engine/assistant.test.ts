import { describe, expect, it } from "vitest";
import { answer, isBlocked, passesPostCheck, REFUSAL } from "./assistant";
import { assessDay } from "./assess";
import { verdictFor } from "./assess";
import { profileById } from "./profiles";
import { buildHistory } from "./simulation";
import { earthReply } from "./missions";

const ctxFor = (id: string, day: number) => {
  const a = assessDay(buildHistory(profileById(id), "spacecraft", day, [], -9, true), day);
  const reply = earthReply({ mission: "mars-transit", oneWayMin: 22 });
  return { alerts: a.alerts.map((x) => ({ ...x, verdict: verdictFor(x, reply.totalMin) })), evals: a.evals, replyMin: reply.totalMin, noContact: false };
};

describe("assistant safety blocks", () => {
  it.each([
    "How much ibuprofen should I take?",
    "what dose of paracetamol for fever",
    "Can I take a sleeping pill?",
    "how many tablets of aspirin",
    "Should I inject insulin?",
    "Which medicine helps?",
  ])("refuses dose questions: %s", (q) => {
    expect(isBlocked(q)).toBe("dose");
    expect(answer(q, ctxFor("okafor", 23)).text).toBe(REFUSAL);
  });
  it.each(["Do I have an infection?", "Diagnose me", "Is this a heart attack?", "what disease do I have"])("refuses diagnosis questions: %s", (q) => {
    expect(isBlocked(q)).toBe("diagnosis");
    expect(answer(q, ctxFor("okafor", 23)).kind).toBe("blocked");
  });
  it("post-check catches doses and drug names but allows food and water amounts", () => {
    expect(passesPostCheck("Take 400 mg now")).toBe(false);
    expect(passesPostCheck("Drink 250 ml of water now and eat 15 g of fast sugar")).toBe(true);
  });
});

describe("assistant answers from cards and detectors", () => {
  it("explains why an alert fired, naming the detector", () => {
    const a = answer("Why did I get this alert?", ctxFor("okafor", 22));
    expect(a.kind).toBe("answer");
    expect(a.text).toMatch(/Unusual day/);
  });
  it("answers 'can it wait' with the decision rule", () => {
    const a = answer("Can this wait for Earth?", ctxFor("okafor", 23));
    expect(a.text).toMatch(/act on board now/);
  });
  it("gives the card's steps without any drug", () => {
    const a = answer("What should I do?", ctxFor("okafor", 23));
    expect(a.text).toMatch(/Rest|rest/);
    expect(passesPostCheck(a.text)).toBe(true);
  });
  it("defines glossary terms", () => {
    expect(answer("What is HRV?", ctxFor("lindqvist", 20)).text).toMatch(/Heart-rate variability/);
  });
  it("says there is nothing wrong when there are no alerts", () => {
    expect(answer("why do I have an alert", ctxFor("lindqvist", 20)).text).toMatch(/no alerts/i);
  });
});
