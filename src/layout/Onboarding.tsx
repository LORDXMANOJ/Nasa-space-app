/**
 * First-run onboarding (≤ 60 s): pick a demo crew member, pick where you are, then three tour cards.
 * Skippable; replay from Settings.
 */
import { useState } from "react";
import { ENVIRONMENTS, type EnvironmentId } from "../data";
import { PROFILES } from "../engine/profiles";
import { useMission } from "../store/mission";
import { Modal } from "../components/ui";

const TOUR = [
  { t: "Dashboard", d: "Your brief, readiness score and the most urgent alert, with a clear answer: act on board now, or it can wait for Earth." },
  { t: "Check-in", d: "About one minute a day. Wearables fill some fields; you do the rest. Skip anything you can't do." },
  { t: "Body, plan and Consult Packet", d: "See where in your body, follow the on-board steps, and send one complete message to the flight surgeon." },
];

export function Onboarding() {
  const s = useMission();
  const [step, setStep] = useState(0);
  const done = () => s.completeOnboarding();
  return (
    <Modal title={step === 0 ? "Welcome aboard" : step === 1 ? "Where are you?" : TOUR[step - 2].t} onClose={done} wide>
      <div className="stack">
        {step === 0 && (
          <>
            <p className="dim">This is a prototype with simulated crew and data. Pick a crew member to follow; each has a short, seeded health story.</p>
            <div className="crew-pick">
              {PROFILES.map((p) => (
                <button key={p.id} aria-pressed={s.profileId === p.id} onClick={() => s.setProfile(p.id)}>
                  <strong>{p.name}</strong>
                  <span className="dim">{p.role}</span>
                  <span style={{ fontSize: "var(--fs-sm)" }}>{p.storyTitle}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 1 && (
          <div className="crew-pick">
            {ENVIRONMENTS.map((e) => (
              <button key={e.id} aria-pressed={s.environment === e.id} onClick={() => s.setEnvironment(e.id as EnvironmentId)}>
                <strong>{e.name}</strong>
              </button>
            ))}
          </div>
        )}
        {step >= 2 && <p style={{ fontSize: "var(--fs-lg)" }}>{TOUR[step - 2].d}</p>}
        <div className="row">
          <button className="btn btn--ghost" onClick={done}>
            Skip
          </button>
          <span className="spacer" style={{ flex: 1 }} />
          <span className="dim mono">{step + 1}/5</span>
          <button className="btn btn--primary btn--lg" onClick={() => (step >= 4 ? done() : setStep(step + 1))}>
            {step >= 4 ? "Start" : "Next"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
