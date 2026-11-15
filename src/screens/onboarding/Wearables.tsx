/**
 * Pair each crew member's wearable by its unique device ID and test it before launch.
 * There is no real device in this prototype: the test is SIMULATED and says so. A member without a wearable
 * can still check in; their wearable readings are typed by hand.
 */
import { useState } from "react";
import { Check, Loader2, Watch } from "../../components/icons";
import { INDICATORS } from "../../data";
import { earthReadings, wearableReading } from "../../engine/crew";
import { useCrew, type CrewMember } from "../../store/crew";
import { StepNav } from "./Onboarding";

/** Device IDs look like BM-4F2A-91C3: two letters, then two groups of four letters or digits. */
export const DEVICE_ID = /^[A-Z]{2}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
export const normaliseDeviceId = (s: string) => s.toUpperCase().replace(/[^A-Z0-9-]/g, "");

export function Wearables({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const members = useCrew((s) => s.members);
  const paired = members.filter((m) => m.deviceTestedAt).length;
  return (
    <div className="stack">
      <div className="stack">
        <h1>Connect the wearables</h1>
        <p className="lede">
          Enter each person's device ID (printed on the back of the device) and test it before launch. After
          launch it sends heart rate, temperature and sleep every day.
        </p>
        <p className="ob-note">
          Prototype: no real wearable is connected. The test and the readings it sends are simulated.
        </p>
      </div>
      <ul className="ob-wear">
        {members.map((m) => (
          <WearableRow key={m.id} member={m} />
        ))}
      </ul>
      <StepNav
        onBack={onBack}
        onNext={onNext}
        hint={`${paired} of ${members.length} tested`}
        nextLabel={paired === members.length ? "Next" : "Next (pair the rest later)"}
      />
    </div>
  );
}

function WearableRow({ member }: { member: CrewMember }) {
  const updateMember = useCrew((s) => s.updateMember);
  const launchDate = useCrew((s) => s.launchDate);
  const env = useCrew((s) => s.environment);
  const [state, setState] = useState<"idle" | "testing" | "error">("idle");
  const valid = DEVICE_ID.test(member.deviceId);
  const tested = !!member.deviceTestedAt;

  const test = () => {
    if (!valid) return setState("error");
    setState("testing");
    window.setTimeout(() => {
      updateMember(member.id, { deviceTestedAt: Date.now() });
      setState("idle");
    }, 1400);
  };

  const sample = tested
    ? (() => {
        const earth = earthReadings(member.earth, launchDate);
        const hr = wearableReading(
          member.id,
          INDICATORS.find((i) => i.id === "hr")!,
          0,
          earth,
          env,
        )[0];
        const t = wearableReading(
          member.id,
          INDICATORS.find((i) => i.id === "temp")!,
          0,
          earth,
          env,
        )[0];
        return `${hr} bpm, ${t.toFixed(1)} °C`;
      })()
    : "";

  return (
    <li className={`ob-wear-row${tested ? " is-ok" : ""}`}>
      <div className="ob-wear-who">
        <Watch aria-hidden />
        <div>
          <strong>{member.name}</strong>
          <span className="dim">{member.role}</span>
        </div>
      </div>
      <label className="ob-field">
        <span className="ob-label">Device ID</span>
        <input
          className="ob-input ob-input--mono"
          placeholder="BM-4F2A-91C3"
          value={member.deviceId}
          aria-invalid={state === "error"}
          onChange={(e) => {
            setState("idle");
            updateMember(member.id, { deviceId: normaliseDeviceId(e.target.value), deviceTestedAt: null });
          }}
        />
      </label>
      <div className="ob-wear-test">
        {tested ? (
          <p className="ob-ok" role="status">
            <Check aria-hidden /> Connected. Test reading: {sample} (simulated)
          </p>
        ) : (
          <button
            type="button"
            className="btn"
            onClick={test}
            disabled={state === "testing" || !member.deviceId}
          >
            {state === "testing" ? (
              <>
                <Loader2 className="spin" aria-hidden /> Testing…
              </>
            ) : (
              "Test connection"
            )}
          </button>
        )}
        {state === "error" && (
          <p className="ob-error" role="alert">
            That ID does not look right. It should look like BM-4F2A-91C3.
          </p>
        )}
      </div>
    </li>
  );
}
