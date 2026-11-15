/**
 * First thing on every launch: "Who are you?". Pick a crew member, then see the readings they took on Earth
 * before launch (their personal normal), then continue to today's check-in on the dashboard.
 */
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, UserRound } from "../components/icons";
import { INDICATORS } from "../data";
import { learnMetricBaselines } from "../engine/detectors";
import { PROFILES, profileById } from "../engine/profiles";
import { buildHistory } from "../engine/simulation";
import { useMission } from "../store/mission";
import { IndicatorIcon } from "../components/ui";

export function WhoAreYou() {
  const identify = useMission((s) => s.identify);
  const env = useMission((s) => s.environment);
  const [step, setStep] = useState<"welcome" | "pick" | "earth">("welcome");
  const [pick, setPick] = useState<string | null>(null);
  const profile = pick ? profileById(pick) : null;

  const earth = useMemo(() => {
    if (!profile) return null;
    const h = buildHistory(profile, env, 0, []);
    const base = learnMetricBaselines(h);
    const range = (key: string) => {
      const [id, mk] = key.split(".");
      const idx = INDICATORS.find((i) => i.id === id)!.metrics.findIndex((m) => m.key === mk);
      const vals = (h[id] ?? []).filter((r) => r.day <= 0).map((r) => r.values[idx]);
      return vals.length ? [Math.min(...vals), Math.max(...vals)] : null;
    };
    return { base, range, h };
  }, [profile, env]);

  return (
    <div className="who">
      <div className="who-sheet">
        {step === "welcome" && (
          <div className="who-welcome">
            <p className="who-mark" aria-hidden>
              <img src="./logo-mark.svg" width={64} height={64} alt="" />
            </p>
            <h1>Astronaut Health Monitor</h1>
            <p className="lede">
              A one-minute daily health check that knows when a problem can wait for Earth, and when it
              cannot.
            </p>
            <button className="btn btn--primary btn--lg who-cta" onClick={() => setStep("pick")}>
              <UserRound aria-hidden /> Who are you?
            </button>
            <p className="dim who-note">Prototype with simulated crew and data.</p>
          </div>
        )}

        {step === "pick" && (
          <div className="stack" style={{ gap: "var(--sp-6)" }}>
            <div>
              <h1>Who are you?</h1>
              <p className="lede">
                Pick yourself from the crew. Each one has a short health story in this demo.
              </p>
            </div>
            <div className="crew-pick">
              {PROFILES.map((p) => (
                <button
                  key={p.id}
                  aria-pressed={pick === p.id}
                  onClick={() => {
                    setPick(p.id);
                    setStep("earth");
                  }}
                >
                  <strong style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)" }}>
                    {p.name}
                  </strong>
                  <span className="dim">{p.role}</span>
                  <span style={{ fontSize: "var(--fs-sm)" }}>{p.storyTitle}</span>
                </button>
              ))}
            </div>
            <button
              className="btn btn--ghost"
              style={{ alignSelf: "flex-start" }}
              onClick={() => setStep("welcome")}
            >
              <ArrowLeft /> Back
            </button>
          </div>
        )}

        {step === "earth" && profile && earth && (
          <div className="stack" style={{ gap: "var(--sp-6)" }}>
            <div>
              <h1>Hello {profile.name.split(" ")[0]}. These are your readings on Earth.</h1>
              <p className="lede">
                Taken over the 10 days before launch. They are your normal: every reading in space is compared
                with them. (Simulated for this demo.)
              </p>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Reading</th>
                  <th scope="col">Your normal on Earth</th>
                  <th scope="col">Range over 10 days</th>
                </tr>
              </thead>
              <tbody>
                {INDICATORS.filter((i) => i.id !== "radiation").map((ind) => {
                  const keys =
                    ind.id === "bp" ? ["bp.systolic", "bp.diastolic"] : [`${ind.id}.${ind.metrics[0].key}`];
                  const m = ind.metrics[0];
                  const mean = keys.map((k) => earth.base[k]?.mean.toFixed(m.decimals) ?? "none").join("/");
                  const rng = keys
                    .map((k) => {
                      const r = earth.range(k);
                      return r ? `${r[0].toFixed(m.decimals)} to ${r[1].toFixed(m.decimals)}` : "none";
                    })
                    .join(", ");
                  return (
                    <tr key={ind.id}>
                      <td>
                        <span className="row" style={{ gap: "var(--sp-2)", flexWrap: "nowrap" }}>
                          <IndicatorIcon name={ind.icon} /> <strong>{ind.shortName}</strong>
                        </span>
                      </td>
                      <td className="num">
                        {mean} <span className="dim">{m.unit}</span>
                      </td>
                      <td className="dim">{rng}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="row">
              <button className="btn btn--ghost" onClick={() => setStep("pick")}>
                <ArrowLeft /> Not me
              </button>
              <span className="spacer" />
              <button className="btn btn--primary btn--lg" onClick={() => identify(profile.id)}>
                Next: today's readings <ArrowRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
