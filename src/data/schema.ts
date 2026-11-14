/**
 * Zod schemas for the JSON data files (single source of truth for indicators, hazards, regions).
 * Validation runs at app start and in tests, so a typo in the JSON fails loudly instead of in the demo.
 * Threshold semantics: a band's `high` triggers when value >= high; its `low` triggers when value < low.
 */
import { z } from "zod";

export const HAZARD_IDS = ["radiation", "isolation", "distance", "gravity", "hostile"] as const;
export const REGION_IDS = ["brain", "eyes", "heart", "lungs", "musculoskeletal", "gut", "skin", "whole"] as const;

const band = z.object({ low: z.number().optional(), high: z.number().optional() });

const metric = z.object({
  key: z.string(),
  label: z.string(),
  unit: z.string(),
  decimals: z.number().int().min(0).max(3),
  normalRange: z.object({ min: z.number(), max: z.number() }),
  amber: band,
  red: band,
  /** Monotonic running total (e.g. radiation dose): skip baseline z-score and trend rules. */
  cumulative: z.boolean().optional(),
});

const source = z.object({ title: z.string(), url: z.string().url(), usedFor: z.string() });

export const indicatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  icon: z.string(),
  metrics: z.array(metric).min(1).max(2),
  hazards: z.array(z.enum(HAZARD_IDS)).min(1),
  bodyRegions: z.array(z.enum(REGION_IDS)).min(1),
  deviceName: z.string(),
  deviceVerified: z.boolean(),
  inputType: z.enum(["manual", "sensor-sim", "camera-sim", "file"]),
  autoLogged: z.boolean(),
  cadenceHours: z.number().positive(),
  captureDurationSec: z.number().positive(),
  weight: z.number().nonnegative(),
  altUnit: z.object({ unit: z.string(), factor: z.number(), offset: z.number(), decimals: z.number() }).optional(),
  thresholdSource: z.enum(["NASA", "clinical-reference", "demo-assumption"]),
  todo: z.string().optional(),
  whyItMatters: z.string(),
  plainMeaning: z.object({ nominal: z.string(), watch: z.string(), act: z.string(), stale: z.string() }),
  howToSteps: z.array(z.object({ text: z.string(), videoTimestampSec: z.number().optional() })).min(1),
  videoFile: z.string(),
  captionsFile: z.string(),
  recoveryActions: z
    .array(z.object({ kind: z.enum(["immediate", "exercise", "sleep", "nutrition", "crew"]), text: z.string() }))
    .min(1),
  remeasureHours: z.number().nonnegative(),
  escalationRule: z.object({
    afterHours: z.number().nonnegative(),
    /** Symptoms anyone can recognise without medical training. Any one = act now. */
    redFlags: z.array(z.string()).min(1),
    /** What to do on board (Crew Medical Officer, on-board guide). Earth is weeks away. */
    onboard: z.string(),
    /** The report to Earth: a record, never the thing you wait for. */
    earth: z.string(),
  }),
  glossary: z.record(z.string(), z.string()),
  sources: z.array(source).min(1),
});

export const indicatorsFileSchema = z.object({
  indicators: z.array(indicatorSchema).min(1),
  readiness: z.object({
    penalty: z.object({ nominal: z.number(), watch: z.number(), act: z.number(), stale: z.number() }),
    note: z.string(),
  }),
});

export const hazardsFileSchema = z.object({
  hazards: z.array(
    z.object({
      id: z.enum(HAZARD_IDS),
      name: z.string(),
      short: z.string(),
      plain: z.string(),
      effects: z.string(),
      source: z.object({ title: z.string(), url: z.string().url() }),
    }),
  ),
  environments: z.array(
    z.object({
      id: z.enum(["spacecraft", "station", "rover", "base"]),
      name: z.string(),
      doseRate: z.number(),
      /** Report turnaround to Earth in days (relay schedule + blackouts), demo assumption. */
      commDelayDays: z.number(),
      emphasis: z.array(z.enum(HAZARD_IDS)),
    }),
  ),
  environmentNote: z.string(),
});

export const regionsFileSchema = z.object({
  regions: z.array(
    z.object({
      id: z.enum(REGION_IDS),
      name: z.string(),
      function: z.string(),
      pos3d: z.tuple([z.number(), z.number(), z.number()]),
      radius: z.number(),
      pos2d: z.tuple([z.number(), z.number()]),
      stretch: z.boolean().optional(),
    }),
  ),
});

export type Indicator = z.infer<typeof indicatorSchema>;
export type Metric = Indicator["metrics"][number];
export type Band = Metric["amber"];
export type Hazard = z.infer<typeof hazardsFileSchema>["hazards"][number];
export type Environment = z.infer<typeof hazardsFileSchema>["environments"][number];
export type EnvironmentId = Environment["id"];
export type Region = z.infer<typeof regionsFileSchema>["regions"][number];
export type HazardId = (typeof HAZARD_IDS)[number];
export type RegionId = (typeof REGION_IDS)[number];

const clause = z.object({ metric: z.string(), op: z.enum([">", ">=", "<", "<="]), value: z.number() });
export const conditionCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  severity: z.enum(["watch", "act"]),
  when: z.union([z.object({ all: z.array(clause).min(1) }), z.object({ any: z.array(clause).min(1) })]),
  supersedes: z.array(z.string()).optional(),
  tHarmMin: z.number().positive(),
  assumption: z.boolean(),
  bodyRegions: z.array(z.enum(REGION_IDS)),
  hazards: z.array(z.enum(HAZARD_IDS)),
  plain: z.string(),
  steps: z.array(z.string()).min(1),
  escalation: z.string(),
  redFlags: z.array(z.string()),
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })),
});
const detectorCard = z.object({
  name: z.string(),
  tHarmMin: z.number().optional(),
  assumption: z.boolean(),
  plain: z.string(),
  steps: z.array(z.string()),
  escalation: z.string(),
});
export const conditionsFileSchema = z.object({
  _note: z.string(),
  cards: z.array(conditionCardSchema),
  detectorCards: z.object({ unusual: detectorCard, drift: detectorCard }),
});
export type ConditionCard = z.infer<typeof conditionCardSchema>;
export type Clause = z.infer<typeof clause>;
