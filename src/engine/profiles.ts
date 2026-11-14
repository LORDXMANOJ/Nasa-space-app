/**
 * Fictional demo crew. Each profile has a personal baseline (mean, sd) per metric,
 * which the alert engine uses for z-scores. No real people; all values are invented.
 */
export interface MetricBaseline {
  mean: number;
  sd: number;
}

export interface CrewProfile {
  id: string;
  name: string;
  role: string;
  seed: number;
  baselines: Record<string, MetricBaseline>; // key = `${indicatorId}.${metricKey}`
}

export const PROFILES: CrewProfile[] = [
  {
    id: "vega",
    name: "Mira Vega",
    role: "Commander",
    seed: 1201,
    baselines: {
      "bp.systolic": { mean: 120, sd: 5 },
      "bp.diastolic": { mean: 76, sd: 4 },
      "hr.hr": { mean: 62, sd: 4 },
      "hr.hrv": { mean: 58, sd: 8 },
      "spo2.spo2": { mean: 98, sd: 0.8 },
      "temp.temp": { mean: 36.7, sd: 0.2 },
      "sleep.hours": { mean: 7.4, sd: 0.45 },
      "sleep.quality": { mean: 7, sd: 0.9 },
      "mood.mood": { mean: 7.5, sd: 0.8 },
      "mood.reaction": { mean: 265, sd: 20 },
      "weight.mass": { mean: 66.4, sd: 0.5 },
      "glucose.glucose": { mean: 88, sd: 6 },
    },
  },
  {
    id: "okoro",
    name: "Tunde Okoro",
    role: "Flight engineer",
    seed: 2207,
    baselines: {
      "bp.systolic": { mean: 116, sd: 6 },
      "bp.diastolic": { mean: 74, sd: 4 },
      "hr.hr": { mean: 56, sd: 4 },
      "hr.hrv": { mean: 66, sd: 9 },
      "spo2.spo2": { mean: 98, sd: 0.7 },
      "temp.temp": { mean: 36.6, sd: 0.2 },
      "sleep.hours": { mean: 7.1, sd: 0.5 },
      "sleep.quality": { mean: 7, sd: 1 },
      "mood.mood": { mean: 7.8, sd: 0.7 },
      "mood.reaction": { mean: 250, sd: 18 },
      "weight.mass": { mean: 79.2, sd: 0.5 },
      "glucose.glucose": { mean: 92, sd: 6 },
    },
  },
  {
    id: "lind",
    name: "Sana Lind",
    role: "Mission specialist",
    seed: 3301,
    baselines: {
      "bp.systolic": { mean: 112, sd: 5 },
      "bp.diastolic": { mean: 70, sd: 4 },
      "hr.hr": { mean: 66, sd: 5 },
      "hr.hrv": { mean: 48, sd: 7 },
      "spo2.spo2": { mean: 97.5, sd: 0.8 },
      "temp.temp": { mean: 36.8, sd: 0.2 },
      "sleep.hours": { mean: 7.6, sd: 0.4 },
      "sleep.quality": { mean: 7.5, sd: 0.8 },
      "mood.mood": { mean: 7.2, sd: 0.9 },
      "mood.reaction": { mean: 280, sd: 22 },
      "weight.mass": { mean: 58.6, sd: 0.5 },
      "glucose.glucose": { mean: 85, sd: 5 },
    },
  },
];

export const profileById = (id: string) => PROFILES.find((p) => p.id === id) ?? PROFILES[0];
