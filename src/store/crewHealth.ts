/**
 * The whole crew at once (real crew only): every member's status today, their alerts, and whether they have
 * checked in. Everyone can see everyone's results (read only); an Act alert is shown to the whole crew.
 * Also runs the report-to-Earth schedule.
 */
import { useEffect, useMemo } from "react";
import { assessDay, verdictFor, type Alert } from "../engine/assess";
import { worst, type Status } from "../engine/alerts";
import { earthReadings, formatInterval, memberHistory, reportIntervalHours } from "../engine/crew";
import type { Verdict } from "../engine/missions";
import { useCrew, type CrewMember } from "./crew";
import { useLink } from "./health";
import { useMission } from "./mission";

export interface MemberToday {
  member: CrewMember;
  checkedIn: boolean;
  status: Status;
  alerts: (Alert & { verdict: Verdict })[];
  history: ReturnType<typeof memberHistory>;
}

export function useCrewToday(): MemberToday[] {
  const mode = useCrew((s) => s.mode);
  const members = useCrew((s) => s.members);
  const launchDate = useCrew((s) => s.launchDate);
  const environment = useMission((s) => s.environment);
  const day = useMission((s) => s.day);
  const link = useLink();
  return useMemo(() => {
    if (mode !== "mission") return [];
    return members.map((member) => {
      const history = memberHistory({
        memberId: member.id,
        earth: earthReadings(member.earth, launchDate),
        readings: member.readings,
        day,
        env: environment,
        wearablePaired: !!member.deviceTestedAt,
        skippedToday: member.skips[day],
      });
      const checkedIn = member.readings.some((r) => r.day === day);
      if (day < 1) return { member, checkedIn, status: "stale" as Status, alerts: [], history };
      const a = assessDay(history, day);
      const alerts = a.alerts.map((x) => ({ ...x, verdict: verdictFor(x, link.reply.totalMin) }));
      const status = Object.values(a.evals).reduce<Status>((acc, e) => worst(acc, e.status), "stale");
      return { member, checkedIn, status: checkedIn ? status : "stale", alerts: checkedIn ? alerts : [], history };
    });
  }, [mode, members, launchDate, environment, day, link]);
}

/**
 * Report-to-Earth schedule. A routine report is due every `reportIntervalHours(reply)`; an emergency report goes
 * at once when any member gets an ACT ON BOARD NOW alert (once per member per alert per day). With no contact
 * (solar conjunction) reports queue and go out when contact returns.
 */
export function useReportSchedule(crew: MemberToday[]) {
  const mode = useCrew((s) => s.mode);
  const reports = useCrew((s) => s.reports);
  const lastReportAt = useCrew((s) => s.lastReportAt);
  const logReport = useCrew((s) => s.logReport);
  const releaseReports = useCrew((s) => s.releaseReports);
  const day = useMission((s) => s.day);
  const link = useLink();
  const noContact = link.reply.noContact;
  const intervalH = reportIntervalHours(Number.isFinite(link.reply.totalMin) ? link.reply.totalMin : 14 * 1440);

  useEffect(() => {
    if (mode !== "mission" || day < 1) return;
    const check = () => {
      const now = Date.now();
      // read the stored value, not the render's copy, so a report is never logged twice
      const last = useCrew.getState().lastReportAt;
      if (last === null || now - last >= intervalH * 3_600_000) {
        const done = crew.filter((c) => c.checkedIn).length;
        logReport({
          at: now,
          kind: "routine",
          queued: noContact,
          summary: `Day ${day}: ${done} of ${crew.length} crew checked in; ${crew.filter((c) => c.status === "act").length} Act, ${crew.filter((c) => c.status === "watch").length} Watch.`,
        });
      }
    };
    check();
    const id = window.setInterval(check, 60_000);
    return () => window.clearInterval(id);
  }, [mode, day, lastReportAt, intervalH, noContact, crew, logReport]);

  useEffect(() => {
    if (mode !== "mission") return;
    for (const c of crew)
      for (const a of c.alerts.filter((x) => x.verdict === "act-onboard")) {
        const summary = `Day ${day}: ${c.member.name} (${c.member.role}): ${a.title}. Act on board now.`;
        if (!useCrew.getState().reports.some((r) => r.kind === "emergency" && r.summary === summary))
          logReport({ at: Date.now(), kind: "emergency", queued: noContact, summary });
      }
  }, [mode, crew, day, reports, noContact, logReport]);

  useEffect(() => {
    if (!noContact && reports.some((r) => r.queued)) releaseReports();
  }, [noContact, reports, releaseReports]);

  return { intervalH, label: formatInterval(intervalH), noContact };
}
