/**
 * Presenter controls for the demo (Ctrl+Shift+D): pick a crew story, scrub/step the mission day,
 * replay or reset, switch mission (environment), Mars delay and solar conjunction, and the packet clock speed.
 * Never part of the astronaut's normal UI.
 */
import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Trash2, X } from "../components/icons";
import { ENVIRONMENTS, type EnvironmentId } from "../data";
import { PROFILES, profileById } from "../engine/profiles";
import { MISSIONS, ENV_TO_MISSION } from "../engine/missions";
import { useMission } from "../store/mission";

export const SPEEDS = [
  { x: 1, label: "Real" },
  { x: 60, label: "×60" },
  { x: 600, label: "×600" },
];

export function PresenterPanel() {
  const s = useMission();
  const profile = profileById(s.profileId);
  const [playing, setPlaying] = useState(false);
  const target = profile.days.focus;

  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      const d = useMission.getState().day;
      if (d >= target) return setPlaying(false);
      useMission.getState().setDay(d + 1);
    }, 1100);
    return () => window.clearInterval(t);
  }, [playing, target]);

  const mission = MISSIONS[ENV_TO_MISSION[s.environment]];

  return (
    <aside className="presenter stack" aria-label="Presenter controls">
      <div className="row">
        <h2>Presenter controls</h2>
        <span className="spacer" style={{ flex: 1 }} />
        <button
          className="icon-btn"
          onClick={() => s.togglePresenter(false)}
          aria-label="Close presenter controls"
        >
          <X />
        </button>
      </div>

      <label className="field">
        <span>Crew story</span>
        <select className="select" value={s.profileId} onChange={(e) => s.setProfile(e.target.value)}>
          {PROFILES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}: {p.storyTitle}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>
          Mission day <span className="num">{s.day}</span>
        </span>
        <input
          type="range"
          min={profile.days.min}
          max={profile.days.max}
          value={s.day}
          onChange={(e) => s.setDay(Number(e.target.value))}
          aria-valuetext={`Day ${s.day}`}
        />
      </label>
      <div className="row">
        <button className="btn btn--sm" onClick={() => s.setDay(s.day - 1)} aria-label="Previous day">
          <SkipBack />
        </button>
        <button className="btn btn--sm" onClick={() => s.setDay(s.day + 1)} aria-label="Next day">
          <SkipForward />
        </button>
        <button className="btn btn--sm" onClick={() => s.setDay(target)}>
          Skip to day {target}
        </button>
      </div>
      <div className="row">
        <button
          className="btn btn--primary btn--sm"
          onClick={() => {
            s.replayScenario();
            setPlaying(true);
          }}
        >
          <RotateCcw /> Replay scenario
        </button>
        <button className="btn btn--sm" onClick={() => setPlaying((p) => !p)} disabled={s.day >= target}>
          {playing ? <Pause /> : <Play />} {playing ? "Pause" : `Play to ${target}`}
        </button>
        <button className="btn btn--sm btn--ghost" onClick={() => s.resetDemo()}>
          <Trash2 /> Reset demo
        </button>
      </div>

      <hr className="divider" />
      <label className="field">
        <span>Where are we?</span>
        <select
          className="select"
          value={s.environment}
          onChange={(e) => s.setEnvironment(e.target.value as EnvironmentId)}
        >
          {ENVIRONMENTS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>
      {mission.adjustable && (
        <label className="field">
          <span>
            Mars one-way signal delay <span className="num">{s.marsOneWayMin} min</span>
          </span>
          <input
            type="range"
            min={mission.adjustable.min}
            max={mission.adjustable.max}
            value={s.marsOneWayMin}
            onChange={(e) => s.setMarsDelay(Number(e.target.value))}
          />
        </label>
      )}
      {mission.canConjunct && (
        <label className="toggle">
          <span>Solar conjunction (no contact ~2 weeks)</span>
          <input
            type="checkbox"
            checked={s.conjunction}
            onChange={(e) => s.setConjunction(e.target.checked)}
          />
        </label>
      )}
      <div className="field">
        <span>Packet clock</span>
        <div className="seg" role="group" aria-label="Simulated communication speed">
          {SPEEDS.map((sp) => (
            <button key={sp.x} aria-pressed={s.demoSpeed === sp.x} onClick={() => s.setDemoSpeed(sp.x)}>
              {sp.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
