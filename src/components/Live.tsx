/**
 * Live monitoring UI: the alarm banner that appears on every screen, and the live readings shown on each crew card.
 */
import { useEffect, useState } from "react";
import { TriangleAlert } from "./icons";
import { LIVE_KEYS, LIVE_LABEL, LIVE_UNIT, type LiveEvent } from "../engine/live";
import { useLive } from "../store/live";
import { useHealth } from "../store/health";

/** Red banner for every unacknowledged live alarm, on every screen. */
export function LiveAlarmBanner() {
  const all = useLive((s) => s.alarms);
  const alarms = all.filter((a) => !a.acknowledgedBy);
  const acknowledge = useLive((s) => s.acknowledge);
  const me = useHealth().profile.name;
  if (!alarms.length) return null;
  return (
    <div className="live-alarm" role="alert" aria-live="assertive">
      {alarms.map((a) => (
        <div key={a.id} className="live-alarm-row">
          <TriangleAlert aria-hidden />
          <div>
            <strong>Live alarm.</strong> {a.text}
            <small>Every crew member at this panel sees this. An emergency report went to Earth.</small>
          </div>
          <button type="button" className="btn btn--lg" onClick={() => acknowledge(a.id, me)}>
            I'm on it
          </button>
        </div>
      ))}
    </div>
  );
}

/** Live readings for one crew member (wearable stream), updated every few seconds. */
export function LiveReadings({ memberId, paired }: { memberId: string; paired: boolean }) {
  const v = useLive((s) => s.values[memberId]);
  const lastAt = useLive((s) => s.lastAt);
  const handled = useLive((s) => s.alarms.find((a) => a.memberId === memberId && a.acknowledgedBy));
  const [, force] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!paired)
    return <p className="live-none">No wearable paired: no live readings.</p>;
  if (!v) return <p className="live-none">Waiting for the wearable…</p>;
  const ago = lastAt ? Math.max(0, Math.round((Date.now() - lastAt) / 1000)) : 0;
  return (
    <div className="live">
      <span className="live-dot" aria-hidden /> <span className="live-lab">Live · {ago}s ago</span>
      <ul>
        {LIVE_KEYS.map((k) => (
          <li key={k} className={`live-v live-v--${v[k]?.status ?? "stale"}`}>
            <span>{LIVE_LABEL[k]}</span>
            <b>
              {v[k]?.value ?? "–"} <small>{LIVE_UNIT[k]}</small>
            </b>
          </li>
        ))}
      </ul>
      {handled && <p className="live-none">Alarm handled by {handled.acknowledgedBy}.</p>}
    </div>
  );
}

/** Prototype only: push one person's readings into danger to show the alarm. */
export function LiveTestButton({ memberId, name }: { memberId: string; name: string }) {
  const startEvent = useLive((s) => s.startEvent);
  const clearEvent = useLive((s) => s.clearEvent);
  const event = useLive((s) => s.events[memberId]);
  const kinds: [LiveEvent, string][] = [
    ["low-oxygen", "low oxygen"],
    ["fever", "fever"],
    ["fast-heart", "fast heart"],
  ];
  return event ? (
    <button type="button" className="btn btn--sm btn--ghost" onClick={() => clearEvent(memberId)}>
      End the test for {name}
    </button>
  ) : (
    <span className="live-test">
      Test the alarm (simulated):{" "}
      {kinds.map(([k, label]) => (
        <button key={k} type="button" className="btn btn--sm btn--ghost" onClick={() => startEvent(memberId, k)}>
          {label}
        </button>
      ))}
    </span>
  );
}
