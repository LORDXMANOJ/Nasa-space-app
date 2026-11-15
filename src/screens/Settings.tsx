/**
 * Settings: crew story (demo profile), where we are (mission preset, Mars delay, solar conjunction),
 * units, and accessibility/power (low-power, large text, high contrast, reduced motion). Changes apply live.
 */
import { ENVIRONMENTS, type EnvironmentId } from "../data";
import { PROFILES } from "../engine/profiles";
import { formatDuration, MISSIONS, ENV_TO_MISSION } from "../engine/missions";
import { useLink } from "../store/health";
import { useMission } from "../store/mission";
import { toast, toastWhenSaved } from "../store/toast";
import { useCrew } from "../store/crew";
import { missionDayOf, todayIso } from "../engine/crew";

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="toggle">
      <span>
        <strong style={{ display: "block" }}>{label}</strong>
        <small className="dim">{hint}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} aria-pressed={value === o} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function Settings() {
  const st = useMission();
  const link = useLink();
  const set = (patch: Parameters<typeof st.updateSettings>[0]) => {
    st.updateSettings(patch);
    toastWhenSaved("Saved");
  };
  const mission = MISSIONS[ENV_TO_MISSION[st.environment]];
  const crewMode = useCrew((s) => s.mode);
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
        </div>
      </div>
      <div className="settings-grid">
        {crewMode === "mission" ? (
          <MissionCard />
        ) : (
          <section className="card stack">
            <h2>Crew member (demo stories)</h2>
            <div className="crew-pick">
              {PROFILES.map((p) => (
                <button key={p.id} aria-pressed={st.profileId === p.id} onClick={() => st.setProfile(p.id)}>
                  <strong>{p.name}</strong>
                  <span className="dim">{p.role}</span>
                  <span style={{ fontSize: "var(--fs-sm)" }}>{p.storyTitle}</span>
                </button>
              ))}
            </div>
            <p className="dim" style={{ fontSize: "var(--fs-sm)" }}>
              All crew and readings are simulated. Each story is seeded, so it plays out the same way every
              time.
            </p>
            <button
              className="btn"
              style={{ alignSelf: "flex-start" }}
              onClick={() => useCrew.getState().setMode(useCrew.getState().setupDone ? "mission" : "new")}
            >
              {useCrew.getState().setupDone ? "Back to my crew" : "Set up a real crew"}
            </button>
          </section>
        )}

        <section className="card stack">
          <h2>Where are we?</h2>
          <label className="field">
            <span>Environment</span>
            <select
              className="select"
              value={st.environment}
              onChange={(e) => {
                st.setEnvironment(e.target.value as EnvironmentId);
                const c = useCrew.getState();
                if (c.mode === "mission") c.setMission(c.launchDate, e.target.value as EnvironmentId);
                toastWhenSaved("Saved. Earth reply updated.");
              }}
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
                One-way signal delay to Earth: <span className="num">{st.marsOneWayMin} min</span>
              </span>
              <input
                type="range"
                min={mission.adjustable.min}
                max={mission.adjustable.max}
                value={st.marsOneWayMin}
                onChange={(e) => st.setMarsDelay(Number(e.target.value))}
              />
              <small>Mars is 3 to 22 light-minutes away depending on where the planets are.</small>
            </label>
          )}
          {mission.canConjunct && (
            <label className="toggle">
              <span>
                <strong style={{ display: "block" }}>Solar conjunction</strong>
                <small className="dim">
                  The Sun blocks the signal for about two weeks: no contact at all.
                </small>
              </span>
              <input
                type="checkbox"
                checked={st.conjunction}
                onChange={(e) => {
                  st.setConjunction(e.target.checked);
                  toast(
                    e.target.checked
                      ? "Conjunction on: no contact with Earth."
                      : "Conjunction off: contact restored.",
                    "info",
                  );
                }}
              />
            </label>
          )}
          <div className="banner banner--info">
            <span>
              Earth reply right now: <strong>{formatDuration(link.reply.totalMin)}</strong>
              {!link.reply.noContact && (
                <>
                  :{" "}
                  {link.reply.parts
                    .map((p) => `${p.label.toLowerCase()} ${formatDuration(p.min)}`)
                    .join(" + ")}
                  .
                </>
              )}
              <span className="assume">ASSUMPTION</span> review time and relay waits
            </span>
          </div>
        </section>

        <section className="card stack">
          <h2>Units</h2>
          <div className="row">
            <span style={{ width: 120 }}>Temperature</span>
            <Seg
              label="Temperature unit"
              value={st.settings.tempUnit}
              options={["°C", "°F"]}
              onChange={(v) => set({ tempUnit: v })}
            />
          </div>
          <div className="row">
            <span style={{ width: 120 }}>Glucose</span>
            <Seg
              label="Glucose unit"
              value={st.settings.glucoseUnit}
              options={["mg/dL", "mmol/L"]}
              onChange={(v) => set({ glucoseUnit: v })}
            />
          </div>
          <div className="row">
            <span style={{ width: 120 }}>Body mass</span>
            <Seg
              label="Mass unit"
              value={st.settings.weightUnit}
              options={["kg", "lb"]}
              onChange={(v) => set({ weightUnit: v })}
            />
          </div>
        </section>

        <section className="card stack">
          <h2>Comfort and power</h2>
          <Toggle
            checked={st.settings.lowPower}
            onChange={(v) => set({ lowPower: v })}
            label="Low-power mode"
            hint="Turns off 3D and animation. Saves laptop battery."
          />
          <Toggle
            checked={st.settings.largeText}
            onChange={(v) => set({ largeText: v })}
            label="Large text"
            hint="Everything 25 % bigger, for reading at arm's length."
          />
          <Toggle
            checked={st.settings.highContrast}
            onChange={(v) => set({ highContrast: v })}
            label="High contrast"
            hint="Brighter text and borders, no transparency."
          />
          <Toggle
            checked={st.settings.reducedMotion}
            onChange={(v) => set({ reducedMotion: v })}
            label="Reduce motion"
            hint="No pulsing or sliding."
          />
          <hr className="divider" />
          <div className="row">
            <button className="btn" onClick={st.signOut}>
              Switch crew member
            </button>
            <button
              className="btn btn--danger"
              onClick={() => {
                if (window.confirm("Reset all demo data (check-ins, checklists, outbox)?")) st.resetDemo();
              }}
            >
              Reset demo data
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Real crew: launch date (editable), mission setup, and switching to the demo. */
function MissionCard() {
  const c = useCrew();
  const day = missionDayOf(c.launchDate, todayIso());
  return (
    <section className="card stack">
      <h2>Mission and crew</h2>
      <label className="field">
        <span>Launch date</span>
        <input
          type="date"
          className="select"
          value={c.launchDate}
          onChange={(e) => {
            if (!e.target.value) return;
            c.setMission(e.target.value, c.environment);
            useMission.setState({ day: missionDayOf(e.target.value, todayIso()) });
            toastWhenSaved("Saved. Mission days updated.");
          }}
        />
      </label>
      <p className="dim" style={{ fontSize: "var(--fs-sm)" }}>
        {day < 1 ? `Launch in ${1 - day} day${1 - day === 1 ? "" : "s"}.` : `Today is mission day ${day}.`}{" "}
        Earth records are the days before the launch date.
      </p>
      <p style={{ fontSize: "var(--fs-sm)" }}>
        {c.members.length} crew member{c.members.length === 1 ? "" : "s"}:{" "}
        {c.members.map((m) => `${m.name} (${m.role})`).join(", ")}
      </p>
      <div className="row">
        <button
          className="btn"
          onClick={() => {
            useCrew.setState({ setupDone: false });
            c.goStep("crew");
            useMission.getState().signOut();
          }}
        >
          Edit crew, Earth records or wearables
        </button>
        <button
          className="btn btn--ghost"
          onClick={() => {
            useMission.getState().signOut();
            c.setMode("demo");
          }}
        >
          Open the demo crew
        </button>
      </div>
    </section>
  );
}
