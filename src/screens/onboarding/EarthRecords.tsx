/**
 * Earth records, entered by the one recorder for the whole crew. For each crew member:
 *  - health information (age, sex, height, blood type, allergies, medicines, past conditions, vaccinations);
 *  - one row per day on Earth with all readings in that row. 10 days is the target; more are welcome and all are used;
 *    fewer shows a warning and asks for older records.
 */
import { useState } from "react";
import { Plus, Trash2 } from "../../components/icons";
import {
  checkEarthValue,
  EARTH_FIELDS,
  EARTH_TARGET_DAYS,
  missionDayOf,
  rowComplete,
  rowStarted,
  type EarthRow,
} from "../../engine/crew";
import { useCrew, type CrewMember, type EarthInfo } from "../../store/crew";
import { completeDays, defaultEarthDates, MIN_EARTH_DAYS, olderDate, recorderName, StepNav } from "./Onboarding";

const BLOOD_TYPES = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "Unknown"];

export function EarthRecords({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const members = useCrew((s) => s.members);
  const launchDate = useCrew((s) => s.launchDate);
  const recorderId = useCrew((s) => s.recorderId);
  const [sel, setSel] = useState(members[0]?.id ?? "");
  const [tried, setTried] = useState(false);
  const member = members.find((m) => m.id === sel) ?? members[0];
  const blocking = members.filter((m) => completeDays(m, launchDate) < MIN_EARTH_DAYS);

  return (
    <div className="stack">
      <div>
        <h1>Earth records</h1>
        <p className="lede">
          Entered by <strong>{recorderName(recorderId, members)}</strong> for the whole crew. These become each
          person's normal: every reading in space is compared with them.
        </p>
      </div>
      <div className="ob-tabs" role="tablist" aria-label="Crew members">
        {members.map((m) => {
          const days = completeDays(m, launchDate);
          return (
            <button
              key={m.id}
              role="tab"
              aria-selected={m.id === member?.id}
              className="ob-tab"
              onClick={() => setSel(m.id)}
            >
              <strong>{m.name}</strong>
              <span className={days >= EARTH_TARGET_DAYS ? "ob-tab-ok" : "ob-tab-short"}>
                {days}/{EARTH_TARGET_DAYS} days
              </span>
            </button>
          );
        })}
      </div>
      {member && <MemberRecords key={member.id} member={member} launchDate={launchDate} />}
      {tried && blocking.length > 0 && (
        <p className="ob-error" role="alert">
          {blocking.map((m) => m.name).join(", ")} need{blocking.length === 1 ? "s" : ""} at least {MIN_EARTH_DAYS}{" "}
          complete days before setup can finish. A day is complete when blood pressure, heart rate, SpO₂, temperature,
          sleep and mood are filled in.
        </p>
      )}
      <StepNav
        onBack={onBack}
        onNext={() => (blocking.length ? setTried(true) : onNext())}
        nextLabel="Next: wearables"
      />
    </div>
  );
}

function MemberRecords({ member, launchDate }: { member: CrewMember; launchDate: string }) {
  const setInfo = useCrew((s) => s.setInfo);
  const setEarthValue = useCrew((s) => s.setEarthValue);
  const removeEarthDay = useCrew((s) => s.removeEarthDay);
  const updateMember = useCrew((s) => s.updateMember);
  const own = Object.keys(member.earth).filter((d) => missionDayOf(launchDate, d) <= 0);
  const dates = [...new Set([...defaultEarthDates(launchDate), ...own])].sort();
  const days = completeDays(member, launchDate);
  const info = member.info;
  const field = (k: keyof EarthInfo) => ({
    value: info[k],
    onChange: (e: { target: { value: string } }) => setInfo(member.id, { [k]: e.target.value }),
  });

  return (
    <div className="stack">
      <section className="ob-section">
        <h2>Health information</h2>
        <div className="ob-info">
          <label className="ob-field">
            <span className="ob-label">Age</span>
            <input className="ob-input" inputMode="numeric" {...field("age")} />
          </label>
          <label className="ob-field">
            <span className="ob-label">Sex</span>
            <select className="ob-input" {...field("sex")}>
              <option value="">Choose</option>
              <option>Female</option>
              <option>Male</option>
              <option>Prefer not to say</option>
            </select>
          </label>
          <label className="ob-field">
            <span className="ob-label">Height (cm)</span>
            <input className="ob-input" inputMode="numeric" {...field("heightCm")} />
          </label>
          <label className="ob-field">
            <span className="ob-label">Blood type</span>
            <select className="ob-input" {...field("bloodType")}>
              <option value="">Choose</option>
              {BLOOD_TYPES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="ob-info ob-info--text">
          <label className="ob-field">
            <span className="ob-label">Allergies</span>
            <textarea className="ob-input" rows={2} placeholder="None known" {...field("allergies")} />
          </label>
          <label className="ob-field">
            <span className="ob-label">Current medicines</span>
            <textarea className="ob-input" rows={2} placeholder="None" {...field("medicines")} />
          </label>
          <label className="ob-field">
            <span className="ob-label">Past conditions</span>
            <textarea className="ob-input" rows={2} placeholder="None" {...field("conditions")} />
          </label>
          <label className="ob-field">
            <span className="ob-label">Vaccinations</span>
            <textarea className="ob-input" rows={2} placeholder="List with dates if known" {...field("vaccinations")} />
          </label>
        </div>
      </section>

      <section className="ob-section">
        <div className="row" style={{ alignItems: "baseline" }}>
          <h2>Daily readings on Earth</h2>
          <span className="spacer" />
          <span className={days >= EARTH_TARGET_DAYS ? "ob-count ob-count--ok" : "ob-count"}>
            {days} of {EARTH_TARGET_DAYS} days complete
          </span>
        </div>
        <div className="ob-meter" aria-hidden>
          <span style={{ transform: `scaleX(${Math.min(1, days / EARTH_TARGET_DAYS)})` }} />
        </div>
        {days < EARTH_TARGET_DAYS && (
          <p className="ob-note">
            Fewer than {EARTH_TARGET_DAYS} days. If {member.name.split(" ")[0] || "this person"} has older records
            from before launch, add them with <strong>Add an older day</strong>. Every extra day makes their
            normal more accurate.
          </p>
        )}
        <div className="ob-grid-wrap">
          <table className="ob-grid">
            <thead>
              <tr>
                <th scope="col">Date</th>
                {EARTH_FIELDS.map((f) => (
                  <th scope="col" key={f.key}>
                    {f.label}
                    <span className="dim">{f.unit}</span>
                  </th>
                ))}
                <th scope="col">
                  <span className="sr-only">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {dates.map((d) => (
                <EarthRowView
                  key={d}
                  date={d}
                  row={member.earth[d]}
                  day={missionDayOf(launchDate, d)}
                  onValue={(k, v) => setEarthValue(member.id, d, k, v)}
                  onRemove={own.includes(d) ? () => removeEarthDay(member.id, d) : undefined}
                />
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="btn"
          style={{ alignSelf: "flex-start" }}
          onClick={() => updateMember(member.id, { earth: { ...member.earth, [olderDate(dates)]: {} } })}
        >
          <Plus aria-hidden /> Add an older day
        </button>
        <p className="dim ob-help">
          Glucose and body mass are not measured every day; leave them empty on days they were not taken.
        </p>
      </section>
    </div>
  );
}

function EarthRowView({
  date,
  row,
  day,
  onValue,
  onRemove,
}: {
  date: string;
  row: EarthRow | undefined;
  day: number;
  onValue: (key: string, v: number | undefined) => void;
  onRemove?: () => void;
}) {
  const complete = rowComplete(row);
  return (
    <tr className={complete ? "is-complete" : rowStarted(row) ? "is-started" : ""}>
      <th scope="row">
        <span className="ob-date">{date}</span>
        <span className="dim">day {day}</span>
      </th>
      {EARTH_FIELDS.map((f) => (
        <td key={f.key}>
          <EarthCell
            label={`${f.label} on ${date}`}
            value={row?.[f.key]}
            decimals={f.decimals}
            check={(v) => checkEarthValue(f.key, v)}
            onCommit={(v) => onValue(f.key, v)}
          />
        </td>
      ))}
      <td>
        {onRemove && (
          <button type="button" className="btn btn--ghost ob-icon-btn" aria-label={`Clear ${date}`} onClick={onRemove}>
            <Trash2 aria-hidden />
          </button>
        )}
      </td>
    </tr>
  );
}

/** One number in the grid. Keeps what is being typed locally and saves it when the cell is left. */
function EarthCell({
  label,
  value,
  decimals,
  check,
  onCommit,
}: {
  label: string;
  value: number | undefined;
  decimals: number;
  check: (v: number) => string | null;
  onCommit: (v: number | undefined) => void;
}) {
  const shown = value === undefined ? "" : value.toFixed(decimals);
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? shown;
  const n = Number(text.replace(",", "."));
  const error = text.trim() === "" ? null : Number.isFinite(n) ? check(n) : "Numbers only.";
  return (
    <input
      className="ob-cell"
      inputMode="decimal"
      aria-label={label}
      aria-invalid={!!error}
      title={error ?? undefined}
      value={text}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft === null) return;
        const t = draft.trim();
        const v = Number(t.replace(",", "."));
        if (t === "") onCommit(undefined);
        else if (Number.isFinite(v) && !check(v)) onCommit(v);
        setDraft(error ? draft : null);
      }}
    />
  );
}
