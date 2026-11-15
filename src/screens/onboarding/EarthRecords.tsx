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
import { infoAnswered, infoOf, useCrew, type CrewMember } from "../../store/crew";
import { HealthInfo } from "./HealthInfo";
import {
  completeDays,
  defaultEarthDates,
  MIN_EARTH_DAYS,
  olderDate,
  recorderName,
  StepNav,
} from "./Onboarding";

export function EarthRecords({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const members = useCrew((s) => s.members);
  const launchDate = useCrew((s) => s.launchDate);
  const recorderId = useCrew((s) => s.recorderId);
  const [sel, setSel] = useState(members[0]?.id ?? "");
  const [tried, setTried] = useState(false);
  const member = members.find((m) => m.id === sel) ?? members[0];
  const shortDays = members.filter((m) => completeDays(m, launchDate) < MIN_EARTH_DAYS);
  const noInfo = members.filter((m) => !infoAnswered(infoOf(m)));
  const blocking = [...shortDays, ...noInfo];

  return (
    <div className="stack">
      <div>
        <h1>Earth records</h1>
        <p className="lede">
          Entered by <strong>{recorderName(recorderId, members)}</strong> for the whole crew. These become
          each person's normal: every reading in space is compared with them.
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
                {days}/{EARTH_TARGET_DAYS} days{infoAnswered(infoOf(m)) ? "" : " · info needed"}
              </span>
            </button>
          );
        })}
      </div>
      {member && <MemberRecords key={member.id} member={member} launchDate={launchDate} showErrors={tried} />}
      {tried && shortDays.length > 0 && (
        <p className="ob-error" role="alert">
          {shortDays.map((m) => m.name).join(", ")} need{shortDays.length === 1 ? "s" : ""} at least{" "}
          {MIN_EARTH_DAYS} complete days before setup can finish. A day is complete when blood pressure, heart
          rate, SpO₂, temperature, sleep and mood are filled in.
        </p>
      )}
      {tried && noInfo.length > 0 && (
        <p className="ob-error" role="alert">
          Answer allergies and daily medicines for {noInfo.map((m) => m.name).join(", ")} (a list, or none).
        </p>
      )}
      <StepNav
        onBack={onBack}
        onNext={() => {
          if (!blocking.length) return onNext();
          setTried(true);
          setSel(blocking[0].id);
        }}
        nextLabel="Next: wearables"
      />
    </div>
  );
}

function MemberRecords({
  member,
  launchDate,
  showErrors,
}: {
  member: CrewMember;
  launchDate: string;
  showErrors: boolean;
}) {
  const setEarthValue = useCrew((s) => s.setEarthValue);
  const removeEarthDay = useCrew((s) => s.removeEarthDay);
  const updateMember = useCrew((s) => s.updateMember);
  const own = Object.keys(member.earth).filter((d) => missionDayOf(launchDate, d) <= 0);
  const dates = [...new Set([...defaultEarthDates(launchDate), ...own])].sort();
  const days = completeDays(member, launchDate);

  return (
    <div className="stack">
      <HealthInfo member={member} showErrors={showErrors} />

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
            Fewer than {EARTH_TARGET_DAYS} days. If {member.name.split(" ")[0] || "this person"} has older
            records from before launch, add them with <strong>Add an older day</strong>. Every extra day makes
            their normal more accurate.
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
          <button
            type="button"
            className="btn btn--ghost ob-icon-btn"
            aria-label={`Clear ${date}`}
            onClick={onRemove}
          >
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
