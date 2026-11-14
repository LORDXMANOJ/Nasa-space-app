/**
 * useHealth(): the derived view of the astronaut's health for the current mission day.
 * Combines the simulation history with user readings, runs the alert engine on every indicator,
 * and returns evaluations, readiness, due list and the brief. Memoised on the inputs that matter.
 */
import { useMemo } from "react";
import { INDICATORS, REGIONS, type RegionId } from "../data";
import { evaluate, worst, type Evaluation, type Status } from "../engine/alerts";
import { profileById } from "../engine/profiles";
import { briefSentence, dueIndicators, readiness } from "../engine/readiness";
import { buildHistory } from "../engine/simulation";
import { useMission } from "./mission";

export function useHealth() {
  const profileId = useMission((s) => s.profileId);
  const environment = useMission((s) => s.environment);
  const day = useMission((s) => s.day);
  const userReadings = useMission((s) => s.userReadings);

  return useMemo(() => {
    const profile = profileById(profileId);
    const history = buildHistory(profile, environment, day, userReadings);
    const evals: Record<string, Evaluation> = {};
    for (const ind of INDICATORS) evals[ind.id] = evaluate(ind, history[ind.id], profile.baselines, day);
    const ready = readiness(evals);
    const due = dueIndicators(history, day);
    const brief = briefSentence(evals, due);
    const regionStatus = {} as Record<RegionId, Status>;
    for (const r of REGIONS) {
      const related = INDICATORS.filter((i) => i.bodyRegions.includes(r.id));
      regionStatus[r.id] = related.length
        ? related.reduce<Status>((acc, i) => worst(acc, evals[i.id].status), "stale")
        : "stale";
      if (related.length === 0) regionStatus[r.id] = "stale";
    }
    return { profile, history, evals, readiness: ready, due, brief, regionStatus, day };
  }, [profileId, environment, day, userReadings]);
}
