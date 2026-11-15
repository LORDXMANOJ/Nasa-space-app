/**
 * useHealth(): the derived view of the astronaut's health for the current mission day.
 * Simulation history + user check-ins → assessDay() (rules, personal baseline, three detectors)
 * → statuses, alerts with T_harm, Earth reply time, "can it wait?" verdicts, readiness, due list, brief.
 */
import { useMemo } from "react";
import { INDICATORS, REGIONS, type Indicator, type RegionId } from "../data";
import { worst, type Status } from "../engine/alerts";
import { assessDay, verdictFor, type Alert } from "../engine/assess";
import { profileById } from "../engine/profiles";
import { dueIndicators, readiness } from "../engine/readiness";
import { buildHistory, simulateReading } from "../engine/simulation";
import { earthReadings, memberHistory, wearableReading } from "../engine/crew";
import { useCrew } from "./crew";
import { earthReply, ENV_TO_MISSION, formatDuration, MISSIONS, type Verdict } from "../engine/missions";
import { useMission } from "./mission";

export interface AlertWithVerdict extends Alert {
  verdict: Verdict;
}

export function useLink() {
  const environment = useMission((s) => s.environment);
  const marsOneWayMin = useMission((s) => s.marsOneWayMin);
  const conjunction = useMission((s) => s.conjunction);
  return useMemo(() => {
    const mission = ENV_TO_MISSION[environment];
    const preset = MISSIONS[mission];
    const reply = earthReply({ mission, oneWayMin: marsOneWayMin, conjunction });
    const oneWayMin = preset.adjustable ? marsOneWayMin : preset.oneWayMin;
    return { mission, preset, reply, oneWayMin, conjunction: reply.noContact };
  }, [environment, marsOneWayMin, conjunction]);
}

export function useHealth() {
  const profileId = useMission((s) => s.profileId);
  const environment = useMission((s) => s.environment);
  const day = useMission((s) => s.day);
  const userReadings = useMission((s) => s.userReadings);
  const link = useLink();
  const mode = useCrew((s) => s.mode);
  const members = useCrew((s) => s.members);
  const launchDate = useCrew((s) => s.launchDate);

  return useMemo(() => {
    // a real crew member (mission mode) or one of the simulated demo crew
    const member = mode === "mission" ? members.find((m) => m.id === profileId) : undefined;
    const earth = member ? earthReadings(member.earth, launchDate) : [];
    const profile: { id: string; name: string; role: string } = member ?? profileById(profileId);
    const history = member
      ? memberHistory({
          memberId: member.id,
          earth,
          readings: member.readings,
          day,
          env: environment,
          wearablePaired: !!member.deviceTestedAt,
          skippedToday: member.skips[day],
        })
      : buildHistory(profileById(profileId), environment, day, userReadings);
    /** What a device "measures" today: simulated in both modes, around the member's own Earth normal for a real crew. */
    const simulate = (ind: Indicator) =>
      member
        ? wearableReading(member.id, ind, day, earth, environment)
        : simulateReading(ind, day, profileById(profileId), environment);
    const a = assessDay(history, day);
    const alerts: AlertWithVerdict[] = a.alerts.map((x) => ({
      ...x,
      verdict: verdictFor(x, link.reply.totalMin),
    }));
    const ready = readiness(a.evals);
    const due = dueIndicators(history, day);
    const regionStatus = {} as Record<RegionId, Status>;
    for (const r of REGIONS) {
      const related = INDICATORS.filter((i) => i.bodyRegions.includes(r.id));
      regionStatus[r.id] = related.reduce<Status>((acc, i) => worst(acc, a.evals[i.id].status), "stale");
    }
    const top = alerts[0];
    const parts = [
      due.length
        ? `${due.length} check-in reading${due.length > 1 ? "s" : ""} still to take today.`
        : "Today's check-in is complete.",
    ];
    if (!top) parts.push("No alerts: everything is within your normal.");
    else
      parts.push(
        `${top.title}: ${
          top.verdict === "act-onboard"
            ? `act on board now. Earth's reply (${formatDuration(link.reply.totalMin)}) would come after the safe wait (${formatDuration(top.tHarmMin)}).`
            : `this can wait for Earth (safe wait ${formatDuration(top.tHarmMin)}, reply ${formatDuration(link.reply.totalMin)}). Start the steps anyway.`
        }`,
      );
    return {
      profile,
      history,
      evals: a.evals,
      alerts,
      run: a.run,
      values: a.values,
      readiness: ready,
      due,
      brief: parts.join(" "),
      regionStatus,
      day,
      learning: false,
      link,
      simulate,
      member,
    };
  }, [profileId, environment, day, userReadings, link, mode, members, launchDate]);
}
