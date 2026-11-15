/**
 * First launch: set up a real crew.
 *   welcome → how it works (3 cards) → mission + launch date → crew and roles → who records Earth data
 *   → Earth records for every member (health information + one row of readings per day) → wearables → done.
 * "Try the demo" skips all of this and opens the simulated crew instead.
 * Progress is saved after every change, so setup can be left and resumed.
 */
import { useMemo, useState } from "react";
import { ENVIRONMENTS, type EnvironmentId } from "../../data";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clipboard,
  Earth,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
  Watch,
} from "../../components/icons";
import { DemoButton } from "../../demo/DemoOverlay";
import {
  dateOfMissionDay,
  dayIndex,
  EARTH_TARGET_DAYS,
  formatInterval,
  isoOf,
  missionDayOf,
  reportIntervalHours,
  rowComplete,
  todayIso,
} from "../../engine/crew";
import { earthReply, ENV_TO_MISSION, formatDuration } from "../../engine/missions";
import { SETUP_STEPS, useCrew, type CrewMember, type SetupStep } from "../../store/crew";
import { EarthRecords } from "./EarthRecords";
import { Wearables } from "./Wearables";

export const ROLE_SUGGESTIONS = [
  "Commander",
  "Pilot",
  "Flight engineer",
  "Mission specialist",
  "Crew Medical Officer",
  "Payload specialist",
];

/** Earth days needed before the crew can finish setup. 10 is the plan; fewer works, with a warning. */
export const MIN_EARTH_DAYS = 3;

export const completeDays = (m: CrewMember, launchDate: string) =>
  Object.entries(m.earth).filter(([d, row]) => missionDayOf(launchDate, d) <= 0 && rowComplete(row)).length;

const STEP_LABEL: Partial<Record<SetupStep, string>> = {
  mission: "Mission",
  crew: "Crew",
  recorder: "Recorder",
  earth: "Earth records",
  wearables: "Wearables",
  done: "Finish",
};

export function Onboarding() {
  const step = useCrew((s) => s.step);
  const goStep = useCrew((s) => s.goStep);
  const idx = SETUP_STEPS.indexOf(step);
  const next = () => goStep(SETUP_STEPS[Math.min(SETUP_STEPS.length - 1, idx + 1)]);
  const back = () => goStep(SETUP_STEPS[Math.max(0, idx - 1)]);
  const wide = step === "earth";

  return (
    <div className="who">
      <div className={`who-sheet ob-sheet${wide ? " ob-sheet--wide" : ""}`}>
        {idx >= 2 && <SetupProgress step={step} />}
        {step === "welcome" && <Welcome onStart={next} />}
        {step === "how" && <HowItWorks onBack={back} onNext={next} />}
        {step === "mission" && <MissionStep onBack={back} onNext={next} />}
        {step === "crew" && <CrewStep onBack={back} onNext={next} />}
        {step === "recorder" && <RecorderStep onBack={back} onNext={next} />}
        {step === "earth" && <EarthRecords onBack={back} onNext={next} />}
        {step === "wearables" && <Wearables onBack={back} onNext={next} />}
        {step === "done" && <DoneStep onBack={back} />}
      </div>
    </div>
  );
}

function SetupProgress({ step }: { step: SetupStep }) {
  const steps = SETUP_STEPS.slice(2);
  const at = steps.indexOf(step);
  return (
    <ol className="ob-progress" aria-label="Setup steps">
      {steps.map((s, i) => (
        <li key={s} className={i < at ? "is-done" : i === at ? "is-on" : ""} aria-current={i === at ? "step" : undefined}>
          <span className="ob-progress-dot">{i < at ? <Check aria-hidden /> : i + 1}</span>
          <span className="ob-progress-label">{STEP_LABEL[s]}</span>
        </li>
      ))}
    </ol>
  );
}

export function StepNav({
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled,
  hint,
}: {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="ob-nav">
      {onBack && (
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          <ArrowLeft aria-hidden /> Back
        </button>
      )}
      <span className="spacer" />
      {hint && <span className="ob-nav-hint">{hint}</span>}
      <button type="button" className="btn btn--primary btn--lg" onClick={onNext} disabled={nextDisabled}>
        {nextLabel} <ArrowRight aria-hidden />
      </button>
    </div>
  );
}

/* ---------------- welcome ---------------- */

function Welcome({ onStart }: { onStart: () => void }) {
  const setMode = useCrew((s) => s.setMode);
  return (
    <div className="who-welcome">
      <p className="who-mark" aria-hidden>
        <img src="./logo-mark.svg" width={64} height={64} alt="" />
      </p>
      <h1>Astronaut Health Monitor</h1>
      <p className="lede">
        A one-minute daily health check for crew far from Earth. It tells you whether a problem can wait for
        Earth's reply, or whether you need to act on board now.
      </p>
      <div className="ob-welcome-actions">
        <button className="btn btn--primary btn--lg who-cta" onClick={onStart}>
          Get started <ArrowRight aria-hidden />
        </button>
        <button className="btn btn--lg" onClick={() => setMode("demo")}>
          Try the demo
        </button>
        <DemoButton className="btn btn--lg btn--ghost" label="Watch the demo" />
      </div>
      <p className="dim who-note">
        Get started sets up your own crew. Try the demo opens a simulated crew so you can look around first.
      </p>
    </div>
  );
}

/* ---------------- how it works ---------------- */

const CARDS = [
  {
    icon: Earth,
    title: "Why it exists",
    body: [
      "On a Mars mission a message takes up to 22 minutes each way, and during solar conjunction there is no contact for about two weeks.",
      "When Earth cannot answer in time, the crew has to judge their own health. This app tells you whether a problem can wait for Earth.",
    ],
  },
  {
    icon: Clipboard,
    title: "What you enter",
    body: [
      "Before launch: 10 days of readings taken on Earth, plus basic health information. One person enters this for the whole crew. It becomes each person's own normal.",
      "After launch: a one-minute check-in every day. The wearable sends heart rate, temperature and sleep; you tap Measure for the rest and say how you feel.",
    ],
    demo: true,
  },
  {
    icon: ShieldCheck,
    title: "What happens next",
    body: [
      "Each result is Nominal, Watch or Act. If Earth would reply too late, the app says ACT ON BOARD NOW and gives a short checklist to work through with your Crew Medical Officer.",
      "Otherwise it says ASK EARTH and prepares a report for the flight surgeon. The whole crew sees every alert.",
    ],
  },
];

function HowItWorks({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const [i, setI] = useState(0);
  const card = CARDS[i];
  const Icon = card.icon;
  return (
    <div className="stack ob-how">
      <div>
        <p className="ob-kicker">How it works · {i + 1} of 3</p>
        <h1>{card.title}</h1>
      </div>
      <div className="ob-card" key={i}>
        <span className="ob-card-icon" aria-hidden>
          <Icon />
        </span>
        <div className="stack">
          {card.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        {card.demo && <EntryAnimation />}
      </div>
      <div className="ob-dots" role="tablist" aria-label="How it works cards">
        {CARDS.map((c, n) => (
          <button
            key={c.title}
            role="tab"
            aria-selected={n === i}
            aria-label={c.title}
            className={n === i ? "is-on" : ""}
            onClick={() => setI(n)}
          />
        ))}
      </div>
      <StepNav
        onBack={i === 0 ? onBack : () => setI(i - 1)}
        onNext={i === 2 ? onNext : () => setI(i + 1)}
        nextLabel={i === 2 ? "Set up the mission" : "Next"}
      />
    </div>
  );
}

/** A tiny looping picture of a check-in: a wearable value arrives, a number is tapped in, a mood is picked. */
function EntryAnimation() {
  return (
    <div className="ob-anim" aria-hidden>
      <div className="ob-anim-row ob-anim-row--1">
        <span>Heart rate</span>
        <span className="ob-anim-chip">wearable</span>
        <strong>64 bpm</strong>
      </div>
      <div className="ob-anim-row ob-anim-row--2">
        <span>Blood pressure</span>
        <strong className="ob-anim-type">
          <span>1</span>
          <span>1</span>
          <span>8</span>
          <span>/</span>
          <span>7</span>
          <span>6</span>
        </strong>
      </div>
      <div className="ob-anim-row ob-anim-row--3">
        <span>How do you feel?</span>
        <span className="ob-anim-mood">
          {[1, 2, 3, 4, 5].map((n) => (
            <i key={n} className={n === 4 ? "is-pick" : ""} />
          ))}
        </span>
      </div>
      <span className="ob-anim-tap" />
    </div>
  );
}

/* ---------------- mission ---------------- */

function MissionStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const launchDate = useCrew((s) => s.launchDate);
  const environment = useCrew((s) => s.environment);
  const setMission = useCrew((s) => s.setMission);
  const date = launchDate || todayIso();
  const reply = earthReply({ mission: ENV_TO_MISSION[environment] });
  const days = missionDayOf(date, todayIso());

  return (
    <div className="stack">
      <div>
        <h1>Mission and launch date</h1>
        <p className="lede">
          The launch date splits the records in two: readings before it are your normal on Earth, readings
          after it are the mission. You can change both later in Settings.
        </p>
      </div>
      <label className="ob-field">
        <span className="ob-label">
          <Calendar aria-hidden /> Launch date
        </span>
        <input
          type="date"
          className="ob-input ob-input--date"
          value={date}
          onChange={(e) => e.target.value && setMission(e.target.value, environment)}
        />
        <span className="dim ob-help">
          {days < 1
            ? `Launch is in ${1 - days} day${1 - days === 1 ? "" : "s"}. Daily check-ins start on launch day.`
            : `Today is mission day ${days}.`}
        </span>
      </label>
      <fieldset className="ob-field">
        <legend className="ob-label">Where is the crew going?</legend>
        <div className="ob-choices">
          {ENVIRONMENTS.map((e) => {
            const r = earthReply({ mission: ENV_TO_MISSION[e.id as EnvironmentId] });
            return (
              <button
                type="button"
                key={e.id}
                className="ob-choice"
                aria-pressed={environment === e.id}
                onClick={() => setMission(date, e.id as EnvironmentId)}
              >
                <strong>{e.name}</strong>
                <span className="dim">Earth's reply: about {formatDuration(r.totalMin)}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <p className="ob-note">
        Routine health reports go to Earth {formatInterval(reportIntervalHours(reply.totalMin))} for this mission
        (Earth's reply takes about {formatDuration(reply.totalMin)}). An emergency report goes at once.
      </p>
      <StepNav
        onBack={onBack}
        onNext={() => {
          setMission(date, environment);
          onNext();
        }}
      />
    </div>
  );
}

/* ---------------- crew ---------------- */

function CrewStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const members = useCrew((s) => s.members);
  const addMember = useCrew((s) => s.addMember);
  const updateMember = useCrew((s) => s.updateMember);
  const removeMember = useCrew((s) => s.removeMember);
  const [tried, setTried] = useState(false);
  const missing = members.filter((m) => !m.name.trim() || !m.role.trim());
  const hasMedic = members.some((m) => /medic/i.test(m.role));
  const ok = members.length > 0 && missing.length === 0;

  return (
    <div className="stack">
      <div>
        <h1>Who is on the crew?</h1>
        <p className="lede">Add every crew member and their role. There is no limit; crews differ by mission.</p>
      </div>
      <datalist id="ob-roles">
        {ROLE_SUGGESTIONS.map((r) => (
          <option key={r} value={r} />
        ))}
      </datalist>
      {members.length === 0 ? (
        <div className="ob-empty">
          <Users aria-hidden />
          <p>No crew members yet.</p>
          <button className="btn btn--primary" onClick={() => addMember()}>
            <Plus aria-hidden /> Add the first crew member
          </button>
        </div>
      ) : (
        <ol className="ob-crew">
          {members.map((m, i) => (
            <li key={m.id} className="ob-crew-row">
              <span className="ob-crew-n">{i + 1}</span>
              <label className="ob-field">
                <span className="ob-label">Name</span>
                <input
                  className="ob-input"
                  value={m.name}
                  autoComplete="off"
                  aria-invalid={tried && !m.name.trim()}
                  onChange={(e) => updateMember(m.id, { name: e.target.value })}
                />
              </label>
              <label className="ob-field">
                <span className="ob-label">Role</span>
                <input
                  className="ob-input"
                  list="ob-roles"
                  value={m.role}
                  placeholder="Pick or type a role"
                  aria-invalid={tried && !m.role.trim()}
                  onChange={(e) => updateMember(m.id, { role: e.target.value })}
                />
              </label>
              <button
                type="button"
                className="btn btn--ghost ob-icon-btn"
                aria-label={`Remove ${m.name || `crew member ${i + 1}`}`}
                onClick={() => removeMember(m.id)}
              >
                <Trash2 aria-hidden />
              </button>
            </li>
          ))}
        </ol>
      )}
      {members.length > 0 && (
        <button type="button" className="btn ob-add" onClick={() => addMember()}>
          <Plus aria-hidden /> Add crew member
        </button>
      )}
      {members.length > 0 && !hasMedic && (
        <p className="ob-note">
          Tip: name one person as Crew Medical Officer. The app's checklists send treatment decisions to them.
        </p>
      )}
      {tried && !ok && (
        <p className="ob-error" role="alert">
          {members.length === 0 ? "Add at least one crew member." : "Every crew member needs a name and a role."}
        </p>
      )}
      <StepNav
        onBack={onBack}
        onNext={() => (ok ? onNext() : setTried(true))}
        hint={members.length ? `${members.length} crew member${members.length === 1 ? "" : "s"}` : undefined}
      />
    </div>
  );
}

/* ---------------- recorder ---------------- */

function RecorderStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const members = useCrew((s) => s.members);
  const recorderId = useCrew((s) => s.recorderId);
  const setRecorder = useCrew((s) => s.setRecorder);
  const groundName = recorderId?.startsWith("ground:") ? recorderId.slice(7) : "";
  const isGround = recorderId?.startsWith("ground:") ?? false;
  return (
    <div className="stack">
      <div>
        <h1>Who records the Earth data?</h1>
        <p className="lede">
          Before launch the crew is busy, so one person enters the Earth records for everyone. It can be a crew
          member or someone on the ground team.
        </p>
      </div>
      <div className="ob-choices">
        {members.map((m) => (
          <button
            type="button"
            key={m.id}
            className="ob-choice"
            aria-pressed={recorderId === m.id}
            onClick={() => setRecorder(m.id)}
          >
            <strong>{m.name}</strong>
            <span className="dim">{m.role}</span>
          </button>
        ))}
        <button
          type="button"
          className="ob-choice"
          aria-pressed={isGround}
          onClick={() => setRecorder(`ground:${groundName}`)}
        >
          <strong>Someone on the ground team</strong>
          <span className="dim">For example a flight surgeon or nurse</span>
        </button>
      </div>
      {isGround && (
        <label className="ob-field">
          <span className="ob-label">Their name</span>
          <input
            className="ob-input"
            value={groundName}
            autoFocus
            onChange={(e) => setRecorder(`ground:${e.target.value}`)}
          />
        </label>
      )}
      <StepNav
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!recorderId || (isGround && !groundName.trim())}
        nextLabel="Enter Earth records"
      />
    </div>
  );
}

export const recorderName = (recorderId: string | null, members: CrewMember[]) =>
  !recorderId ? "Not chosen" : recorderId.startsWith("ground:") ? recorderId.slice(7) : (members.find((m) => m.id === recorderId)?.name ?? "Not chosen");

/* ---------------- done ---------------- */

function DoneStep({ onBack }: { onBack: () => void }) {
  const s = useCrew();
  const reply = earthReply({ mission: ENV_TO_MISSION[s.environment] });
  const env = ENVIRONMENTS.find((e) => e.id === s.environment)!;
  const day = missionDayOf(s.launchDate, todayIso());
  const rows = useMemo(
    () =>
      s.members.map((m) => ({
        m,
        days: completeDays(m, s.launchDate),
        wearable: !!m.deviceTestedAt,
      })),
    [s.members, s.launchDate],
  );
  const short = rows.filter((r) => r.days < EARTH_TARGET_DAYS);
  return (
    <div className="stack">
      <div>
        <h1>Ready for launch</h1>
        <p className="lede">Check the summary. Each crew member creates their own 4-digit PIN the first time they sign in.</p>
      </div>
      <dl className="ob-summary">
        <div>
          <dt>Mission</dt>
          <dd>{env.name}</dd>
        </div>
        <div>
          <dt>Launch</dt>
          <dd>
            {s.launchDate} · {day < 1 ? `in ${1 - day} day${1 - day === 1 ? "" : "s"}` : `today is day ${day}`}
          </dd>
        </div>
        <div>
          <dt>Reports to Earth</dt>
          <dd>
            {formatInterval(reportIntervalHours(reply.totalMin))}, emergencies at once
          </dd>
        </div>
        <div>
          <dt>Earth records by</dt>
          <dd>{recorderName(s.recorderId, s.members)}</dd>
        </div>
      </dl>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Crew member</th>
            <th scope="col">Earth days</th>
            <th scope="col">Wearable</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ m, days, wearable }) => (
            <tr key={m.id}>
              <td>
                <strong>{m.name}</strong> <span className="dim">{m.role}</span>
              </td>
              <td className={days < EARTH_TARGET_DAYS ? "ob-warn" : ""}>
                {days} of {EARTH_TARGET_DAYS}
              </td>
              <td>
                {wearable ? (
                  <span className="row" style={{ gap: 6 }}>
                    <Watch aria-hidden /> {m.deviceId} (simulated)
                  </span>
                ) : (
                  <span className="dim">Not paired: readings typed by hand</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {short.length > 0 && (
        <p className="ob-note">
          {short.map((r) => r.m.name).join(", ")} {short.length === 1 ? "has" : "have"} fewer than {EARTH_TARGET_DAYS} Earth
          days. The app still works, but warnings are less precise until more days are added.
        </p>
      )}
      <StepNav
        onBack={onBack}
        nextLabel="Finish setup"
        onNext={() => {
          s.finishSetup();
          s.setMode("mission");
        }}
      />
    </div>
  );
}

/** Default Earth dates: the 10 days before launch, oldest first. */
export const defaultEarthDates = (launchDate: string) =>
  Array.from({ length: EARTH_TARGET_DAYS }, (_, i) => dateOfMissionDay(launchDate, i - EARTH_TARGET_DAYS + 1));

export const olderDate = (dates: string[]) => isoOf(Math.min(...dates.map(dayIndex)) - 1);
