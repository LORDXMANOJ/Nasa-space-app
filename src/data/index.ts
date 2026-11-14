/**
 * Loads and validates the JSON data once, then exposes typed lookups.
 * Every screen reads indicators, hazards, regions and environments from here, never from the JSON directly.
 */
import indicatorsJson from "./indicators.json";
import hazardsJson from "./hazards.json";
import regionsJson from "./regions.json";
import { hazardsFileSchema, indicatorsFileSchema, regionsFileSchema } from "./schema";
import type { EnvironmentId, HazardId, Indicator, RegionId } from "./schema";

export * from "./schema";

const indicatorsFile = indicatorsFileSchema.parse(indicatorsJson);
const hazardsFile = hazardsFileSchema.parse(hazardsJson);
const regionsFile = regionsFileSchema.parse(regionsJson);

export const INDICATORS = indicatorsFile.indicators;
export const READINESS = indicatorsFile.readiness;
export const HAZARDS = hazardsFile.hazards;
export const ENVIRONMENTS = hazardsFile.environments;
export const ENVIRONMENT_NOTE = hazardsFile.environmentNote;
export const REGIONS = regionsFile.regions;

export const indicatorById = (id: string): Indicator => {
  const found = INDICATORS.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown indicator: ${id}`);
  return found;
};
export const hazardById = (id: HazardId) => HAZARDS.find((h) => h.id === id)!;
export const regionById = (id: RegionId) => REGIONS.find((r) => r.id === id)!;
export const environmentById = (id: EnvironmentId) => ENVIRONMENTS.find((e) => e.id === id)!;
export const indicatorsForRegion = (id: RegionId) => INDICATORS.filter((i) => i.bodyRegions.includes(id));
export const indicatorsForHazard = (id: HazardId) => INDICATORS.filter((i) => i.hazards.includes(id));
