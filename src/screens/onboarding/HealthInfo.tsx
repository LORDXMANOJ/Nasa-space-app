/**
 * Health information for one crew member, entered on Earth by the recorder:
 *  basics (age, sex, height, blood type), allergies (what to, what happens, how bad), daily medicines
 *  (name, amount as prescribed, when, what for), past conditions, vaccinations, diet, eyesight, emergency contact.
 * Allergies and daily medicines must be answered, even if the answer is "none": the Crew Medical Officer relies on them.
 * The app only stores what the doctor prescribed; it never suggests a medicine or an amount.
 */
import { Plus, Trash2 } from "../../components/icons";
import {
  infoOf,
  MED_TIMES,
  rowId,
  useCrew,
  type Allergy,
  type AllergyKind,
  type CrewMember,
  type EarthInfo,
  type Medicine,
  type Severity,
} from "../../store/crew";

const BLOOD_TYPES = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "Unknown"];
const KINDS: AllergyKind[] = ["Medicine", "Food", "Environment", "Other"];
const SEVERITIES: Severity[] = ["Mild", "Moderate", "Severe"];

export function HealthInfo({ member, showErrors }: { member: CrewMember; showErrors: boolean }) {
  const setInfo = useCrew((s) => s.setInfo);
  const info = infoOf(member);
  const patch = (p: Partial<EarthInfo>) => setInfo(member.id, p);
  const text = (
    k:
      | "age"
      | "sex"
      | "heightCm"
      | "bloodType"
      | "conditions"
      | "vaccinations"
      | "diet"
      | "eyesight"
      | "emergencyContact",
  ) => ({
    value: info[k],
    onChange: (e: { target: { value: string } }) => patch({ [k]: e.target.value }),
  });
  const first = member.name.split(" ")[0] || "this person";

  const setAllergy = (id: string, p: Partial<Allergy>) =>
    patch({ allergyList: info.allergyList.map((a) => (a.id === id ? { ...a, ...p } : a)) });
  const setMed = (id: string, p: Partial<Medicine>) =>
    patch({ medicineList: info.medicineList.map((m) => (m.id === id ? { ...m, ...p } : m)) });
  const allergyMissing = info.noAllergies !== true && !info.allergyList.some((a) => a.substance.trim());
  const medMissing = info.noMedicines !== true && !info.medicineList.some((m) => m.name.trim());

  return (
    <section className="ob-section">
      <h2>Health information</h2>
      <div className="ob-info">
        <label className="ob-field">
          <span className="ob-label">Age</span>
          <input className="ob-input" inputMode="numeric" {...text("age")} />
        </label>
        <label className="ob-field">
          <span className="ob-label">Sex</span>
          <select className="ob-input" {...text("sex")}>
            <option value="">Choose</option>
            <option>Female</option>
            <option>Male</option>
            <option>Prefer not to say</option>
          </select>
        </label>
        <label className="ob-field">
          <span className="ob-label">Height (cm)</span>
          <input className="ob-input" inputMode="numeric" {...text("heightCm")} />
        </label>
        <label className="ob-field">
          <span className="ob-label">Blood type</span>
          <select className="ob-input" {...text("bloodType")}>
            <option value="">Choose</option>
            {BLOOD_TYPES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </label>
      </div>

      {/* allergies */}
      <fieldset className={`ob-sub${showErrors && allergyMissing ? " is-missing" : ""}`}>
        <legend>Allergies</legend>
        <p className="dim ob-help">What is {first} allergic to, and what happens?</p>
        <div className="ob-yesno" role="group" aria-label={`Does ${first} have allergies?`}>
          <button
            type="button"
            aria-pressed={info.noAllergies === false || info.allergyList.length > 0}
            onClick={() =>
              patch({
                noAllergies: false,
                allergyList: info.allergyList.length
                  ? info.allergyList
                  : [{ id: rowId(), substance: "", kind: "Medicine", reaction: "", severity: "Mild" }],
              })
            }
          >
            Has allergies
          </button>
          <button
            type="button"
            aria-pressed={info.noAllergies === true}
            onClick={() => patch({ noAllergies: true, allergyList: [] })}
          >
            None known
          </button>
        </div>
        {info.allergyList.map((a) => (
          <div key={a.id} className="ob-item">
            <label className="ob-field">
              <span className="ob-label">Allergic to</span>
              <input
                className="ob-input"
                placeholder="e.g. penicillin, peanuts, latex"
                value={a.substance}
                onChange={(e) => setAllergy(a.id, { substance: e.target.value })}
              />
            </label>
            <label className="ob-field">
              <span className="ob-label">Type</span>
              <select
                className="ob-input"
                value={a.kind}
                onChange={(e) => setAllergy(a.id, { kind: e.target.value as AllergyKind })}
              >
                {KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label className="ob-field">
              <span className="ob-label">What happens</span>
              <input
                className="ob-input"
                placeholder="e.g. rash, swelling, trouble breathing"
                value={a.reaction}
                onChange={(e) => setAllergy(a.id, { reaction: e.target.value })}
              />
            </label>
            <label className="ob-field">
              <span className="ob-label">How bad</span>
              <select
                className="ob-input"
                value={a.severity}
                onChange={(e) => setAllergy(a.id, { severity: e.target.value as Severity })}
              >
                {SEVERITIES.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn--ghost ob-icon-btn"
              aria-label={`Remove allergy ${a.substance}`}
              onClick={() => patch({ allergyList: info.allergyList.filter((x) => x.id !== a.id) })}
            >
              <Trash2 aria-hidden />
            </button>
          </div>
        ))}
        {info.allergyList.length > 0 && (
          <button
            type="button"
            className="btn ob-add"
            onClick={() =>
              patch({
                allergyList: [
                  ...info.allergyList,
                  { id: rowId(), substance: "", kind: "Medicine", reaction: "", severity: "Mild" },
                ],
              })
            }
          >
            <Plus aria-hidden /> Add another allergy
          </button>
        )}
        {showErrors && allergyMissing && (
          <p className="ob-error" role="alert">
            Add {first}'s allergies, or choose None known.
          </p>
        )}
      </fieldset>

      {/* daily medicines */}
      <fieldset className={`ob-sub${showErrors && medMissing ? " is-missing" : ""}`}>
        <legend>Daily medicines</legend>
        <p className="dim ob-help">
          Medicines {first} takes regularly, copied from the prescription. The app keeps this for the Crew
          Medical Officer; it never suggests a medicine or an amount.
        </p>
        <div className="ob-yesno" role="group" aria-label={`Does ${first} take daily medicine?`}>
          <button
            type="button"
            aria-pressed={info.noMedicines === false || info.medicineList.length > 0}
            onClick={() =>
              patch({
                noMedicines: false,
                medicineList: info.medicineList.length
                  ? info.medicineList
                  : [{ id: rowId(), name: "", amount: "", times: [], reason: "" }],
              })
            }
          >
            Takes daily medicine
          </button>
          <button
            type="button"
            aria-pressed={info.noMedicines === true}
            onClick={() => patch({ noMedicines: true, medicineList: [] })}
          >
            None
          </button>
        </div>
        {info.medicineList.map((m) => (
          <div key={m.id} className="ob-item ob-item--med">
            <label className="ob-field">
              <span className="ob-label">Medicine</span>
              <input
                className="ob-input"
                value={m.name}
                onChange={(e) => setMed(m.id, { name: e.target.value })}
              />
            </label>
            <label className="ob-field">
              <span className="ob-label">Amount (as prescribed)</span>
              <input
                className="ob-input"
                placeholder="From the label"
                value={m.amount}
                onChange={(e) => setMed(m.id, { amount: e.target.value })}
              />
            </label>
            <label className="ob-field">
              <span className="ob-label">What it is for</span>
              <input
                className="ob-input"
                value={m.reason}
                onChange={(e) => setMed(m.id, { reason: e.target.value })}
              />
            </label>
            <button
              type="button"
              className="btn btn--ghost ob-icon-btn"
              aria-label={`Remove medicine ${m.name}`}
              onClick={() => patch({ medicineList: info.medicineList.filter((x) => x.id !== m.id) })}
            >
              <Trash2 aria-hidden />
            </button>
            <div className="ob-times" role="group" aria-label="When it is taken">
              <span className="ob-label">When</span>
              {MED_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="ob-chip"
                  aria-pressed={m.times.includes(t)}
                  onClick={() =>
                    setMed(m.id, {
                      times: m.times.includes(t) ? m.times.filter((x) => x !== t) : [...m.times, t],
                    })
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ))}
        {info.medicineList.length > 0 && (
          <button
            type="button"
            className="btn ob-add"
            onClick={() =>
              patch({
                medicineList: [
                  ...info.medicineList,
                  { id: rowId(), name: "", amount: "", times: [], reason: "" },
                ],
              })
            }
          >
            <Plus aria-hidden /> Add another medicine
          </button>
        )}
        {showErrors && medMissing && (
          <p className="ob-error" role="alert">
            Add {first}'s daily medicines, or choose None.
          </p>
        )}
      </fieldset>

      <div className="ob-info ob-info--text">
        <label className="ob-field">
          <span className="ob-label">Past conditions and operations</span>
          <textarea className="ob-input" rows={2} placeholder="None" {...text("conditions")} />
        </label>
        <label className="ob-field">
          <span className="ob-label">Vaccinations</span>
          <textarea
            className="ob-input"
            rows={2}
            placeholder="List with dates if known"
            {...text("vaccinations")}
          />
        </label>
        <label className="ob-field">
          <span className="ob-label">Diet needs</span>
          <input className="ob-input" placeholder="e.g. vegetarian, no lactose" {...text("diet")} />
        </label>
        <label className="ob-field">
          <span className="ob-label">Eyesight</span>
          <select className="ob-input" {...text("eyesight")}>
            <option value="">Choose</option>
            <option>No glasses or lenses</option>
            <option>Glasses</option>
            <option>Contact lenses</option>
            <option>Glasses and contact lenses</option>
          </select>
        </label>
        <label className="ob-field">
          <span className="ob-label">Emergency contact on Earth</span>
          <input className="ob-input" placeholder="Name, relation" {...text("emergencyContact")} />
        </label>
      </div>
    </section>
  );
}
