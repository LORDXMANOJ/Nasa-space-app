/**
 * Real crew sign-in: pick yourself, then your 4-digit PIN (created the first time). Each person signs in
 * separately so check-ins are never recorded under the wrong name. Before launch it shows the countdown instead.
 */
import { useState } from "react";
import { ArrowLeft, Delete, Lock, Settings } from "../../components/icons";
import { missionDayOf, pinHash, todayIso, validPin } from "../../engine/crew";
import { useCrew, type CrewMember } from "../../store/crew";
import { useMission } from "../../store/mission";
import { completeDays } from "./Onboarding";

export function signInAs(member: CrewMember) {
  const crew = useCrew.getState();
  const day = missionDayOf(crew.launchDate, todayIso());
  useMission.setState({
    identified: true,
    profileId: member.id,
    day,
    environment: crew.environment,
    userReadings: [],
    symptoms: {},
    checks: {},
  });
}

export function SignIn() {
  const members = useCrew((s) => s.members);
  const launchDate = useCrew((s) => s.launchDate);
  const goStep = useCrew((s) => s.goStep);
  const [pick, setPick] = useState<CrewMember | null>(null);
  const day = missionDayOf(launchDate, todayIso());

  return (
    <div className="who">
      <div className="who-sheet ob-sheet">
        {!pick ? (
          <div className="stack">
            <div>
              <h1>Who is checking in?</h1>
              <p className="lede">
                {day < 1
                  ? `Launch is in ${1 - day} day${1 - day === 1 ? "" : "s"} (${launchDate}). Daily check-ins start on launch day.`
                  : `Mission day ${day}. Pick yourself, then enter your PIN.`}
              </p>
            </div>
            <div className="crew-pick">
              {members.map((m) => (
                <button key={m.id} onClick={() => setPick(m)}>
                  <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)" }}>
                    {m.name}
                  </strong>
                  <span className="dim">{m.role}</span>
                  <span style={{ fontSize: "var(--fs-sm)" }}>
                    {m.pinHash ? "PIN set" : "First sign-in: create a PIN"}
                  </span>
                </button>
              ))}
            </div>
            {day < 1 && (
              <p className="ob-note">
                Before launch you can still sign in to look around, and the recorder can keep adding Earth
                records in Settings.
              </p>
            )}
            <button
              className="btn btn--ghost"
              style={{ alignSelf: "flex-start" }}
              onClick={() => {
                useCrew.setState({ setupDone: false });
                goStep("mission");
              }}
            >
              <Settings aria-hidden /> Change the mission setup
            </button>
          </div>
        ) : (
          <PinStep member={pick} onBack={() => setPick(null)} launchDate={launchDate} />
        )}
      </div>
    </div>
  );
}

function PinStep({
  member,
  onBack,
  launchDate,
}: {
  member: CrewMember;
  onBack: () => void;
  launchDate: string;
}) {
  const updateMember = useCrew((s) => s.updateMember);
  const creating = !member.pinHash;
  const [pin, setPin] = useState("");
  const [first, setFirst] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);

  const fail = (msg: string) => {
    setError(msg);
    setPin("");
    setShake((n) => n + 1);
  };

  const submit = (p: string) => {
    if (!validPin(p)) return;
    if (creating) {
      if (first === null) {
        setFirst(p);
        setPin("");
        setError("");
        return;
      }
      if (p !== first) {
        setFirst(null);
        return fail("The two PINs did not match. Start again.");
      }
      updateMember(member.id, { pinHash: pinHash(member.id, p) });
      signInAs({ ...member, pinHash: pinHash(member.id, p) });
      return;
    }
    if (pinHash(member.id, p) !== member.pinHash) return fail("Wrong PIN. Try again.");
    signInAs(member);
  };

  const press = (d: string) => {
    if (pin.length >= 4) return;
    const p = pin + d;
    setPin(p);
    setError("");
    if (p.length === 4) window.setTimeout(() => submit(p), 120);
  };

  const title = creating ? (first === null ? "Create your PIN" : "Enter it again") : "Enter your PIN";
  return (
    <div className="stack ob-pin">
      <div>
        <p className="ob-kicker">
          {member.name} · {member.role} · {completeDays(member, launchDate)} Earth days
        </p>
        <h1>
          <Lock aria-hidden /> {title}
        </h1>
        <p className="lede">
          {creating
            ? "Four digits, only for you. It stops anyone checking in under your name on this panel."
            : "Four digits."}
        </p>
      </div>
      <div
        className={`ob-pin-dots${shake ? " jiggle" : ""}`}
        key={shake}
        aria-label={`${pin.length} of 4 digits entered`}
      >
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? "is-on" : ""} />
        ))}
      </div>
      {error && (
        <p className="ob-error" role="alert">
          {error}
        </p>
      )}
      <div className="ob-pin-pad">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} type="button" className="kp-key" onClick={() => press(d)}>
            {d}
          </button>
        ))}
        <button type="button" className="kp-key kp-key--fn" onClick={onBack} aria-label="Back to crew list">
          <ArrowLeft aria-hidden />
        </button>
        <button type="button" className="kp-key" onClick={() => press("0")}>
          0
        </button>
        <button
          type="button"
          className="kp-key kp-key--fn"
          onClick={() => setPin(pin.slice(0, -1))}
          aria-label="Delete last digit"
        >
          <Delete aria-hidden />
        </button>
      </div>
      <p className="dim ob-help">
        The PIN is stored on this device only, as a scrambled code. It is a convenience lock, not strong
        security.
      </p>
    </div>
  );
}
