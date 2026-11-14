/**
 * Simulated crew and their seeded demo stories. No real people; every value is invented.
 * `baselines` are the TRUE values the simulator draws around; the detectors never see them —
 * they learn each astronaut's normal from mission days 1–10, like a real deployment would.
 */
export interface MetricBaseline {
  mean: number;
  sd: number;
}

export type StoryId = "fever" | "steady" | "isolation" | "bp-creep" | "day120";

export interface CrewProfile {
  id: string;
  name: string;
  role: string;
  seed: number;
  story: StoryId;
  storyTitle: string;
  storySummary: string;
  days: { min: number; max: number; focus: number };
  baselines: Record<string, MetricBaseline>; // key = `${indicatorId}.${metricKey}`
}

const base = (o: Partial<Record<string, MetricBaseline>>): Record<string, MetricBaseline> => ({
  "bp.systolic": { mean: 118, sd: 5 },
  "bp.diastolic": { mean: 75, sd: 4 },
  "hr.hr": { mean: 64, sd: 3.5 },
  "hr.hrv": { mean: 55, sd: 7 },
  "spo2.spo2": { mean: 98, sd: 0.7 },
  "temp.temp": { mean: 36.7, sd: 0.15 },
  "sleep.hours": { mean: 7.3, sd: 0.45 },
  "sleep.quality": { mean: 7, sd: 0.9 },
  "mood.mood": { mean: 7.4, sd: 0.7 },
  "mood.reaction": { mean: 265, sd: 18 },
  "weight.mass": { mean: 68, sd: 0.4 },
  "glucose.glucose": { mean: 89, sd: 5 },
  ...(o as Record<string, MetricBaseline>),
});

export const PROFILES: CrewProfile[] = [
  {
    id: "okafor",
    name: "Ines Okafor",
    role: "Commander",
    seed: 4101,
    story: "fever",
    storyTitle: "Fever with a fast heart rate",
    storySummary:
      "On day 22 several readings are each slightly off. The unusual-day detector flags it a day before any fixed rule fires. On day 23 the fever card fires: on the ISS it can wait for Earth; far out toward Mars it cannot.",
    days: { min: 11, max: 30, focus: 23 },
    baselines: base({ "temp.temp": { mean: 36.6, sd: 0.15 }, "hr.hr": { mean: 66, sd: 3.5 }, "weight.mass": { mean: 71.5, sd: 0.4 } }),
  },
  {
    id: "lindqvist",
    name: "Mikael Lindqvist",
    role: "Flight engineer",
    seed: 4207,
    story: "steady",
    storyTitle: "A resting heart rate of 52 is normal for him",
    storySummary:
      "A fixed 60–100 bpm rule would flag Mikael almost every day. His personal baseline knows 52 is his normal, so nothing is flagged. This is what the baseline is for.",
    days: { min: 11, max: 30, focus: 20 },
    baselines: base({ "hr.hr": { mean: 52, sd: 3 }, "hr.hrv": { mean: 78, sd: 9 }, "bp.systolic": { mean: 114, sd: 5 }, "weight.mass": { mean: 79, sd: 0.4 } }),
  },
  {
    id: "raman",
    name: "Priya Raman",
    role: "Mission specialist",
    seed: 4303,
    story: "isolation",
    storyTitle: "Sleep and mood slip over five days",
    storySummary:
      "From day 21 Priya sleeps less and her mood drops a little each day (isolation hazard). The drift and unusual-day detectors catch it before the sleep rule fires on day 25.",
    days: { min: 11, max: 30, focus: 25 },
    baselines: base({ "sleep.hours": { mean: 7.2, sd: 0.4 }, "mood.mood": { mean: 7.2, sd: 0.7 }, "weight.mass": { mean: 58.5, sd: 0.4 } }),
  },
  {
    id: "sato",
    name: "Hana Sato",
    role: "Crew medical officer",
    seed: 4409,
    story: "bp-creep",
    storyTitle: "Blood pressure creeping up slowly",
    storySummary:
      "Hana's systolic pressure rises about 1 mmHg a day. No rule fires and no single day is unusual, but the drift detector catches it and the forecast says it reaches 140 in about two weeks: it can wait for Earth.",
    days: { min: 11, max: 30, focus: 25 },
    baselines: base({ "bp.systolic": { mean: 114, sd: 4 }, "bp.diastolic": { mean: 73, sd: 3 }, "weight.mass": { mean: 62, sd: 0.4 } }),
  },
  {
    id: "vega",
    name: "Mira Vega",
    role: "Pilot",
    seed: 1201,
    story: "day120",
    storyTitle: "Day 120, Mars transit",
    storySummary:
      "Sleep falls for five nights, mood dips, then heart rate and blood pressure creep up: a Watch and an Act. Detection, on-board guidance, a Consult Packet to Earth and recovery by day 124.",
    days: { min: 100, max: 130, focus: 120 },
    baselines: base({
      "bp.systolic": { mean: 120, sd: 5 },
      "bp.diastolic": { mean: 76, sd: 4 },
      "hr.hr": { mean: 62, sd: 4 },
      "hr.hrv": { mean: 58, sd: 8 },
      "sleep.hours": { mean: 7.4, sd: 0.45 },
      "mood.mood": { mean: 7.5, sd: 0.8 },
      "weight.mass": { mean: 66.4, sd: 0.5 },
      "glucose.glucose": { mean: 88, sd: 6 },
    }),
  },
];

export const profileById = (id: string) => PROFILES.find((p) => p.id === id) ?? PROFILES[0];
