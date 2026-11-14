/**
 * Consult Packet (replaces the old Ground Link): one complete message for the flight surgeon —
 * readings, 7-day trends, alert reasoning, symptoms, actions already taken. The astronaut chooses what to include.
 * Sending starts a countdown equal to T_reply; during solar conjunction it queues offline until contact returns.
 * Exports as JSON and printable PDF (browser print), generated locally.
 */
import { useEffect, useMemo, useState } from "react";
import { Download, Printer, Send, Trash2 } from "lucide-react";
import { INDICATORS } from "../data";
import { formatDuration } from "../engine/missions";
import { formatPrimary } from "../lib/format";
import { useHealth } from "../store/health";
import { packetStatus, useMission, type ConsultPacket } from "../store/mission";
import { StatusBadge } from "../components/status";

export function Consult() {
  const h = useHealth();
  const settings = useMission((s) => s.settings);
  const outbox = useMission((s) => s.outbox);
  const send = useMission((s) => s.sendPacket);
  const clear = useMission((s) => s.clearOutbox);
  const speed = useMission((s) => s.demoSpeed);
  const symptomsRaw = useMission((s) => s.symptoms[s.day]);
  const symptoms = useMemo(() => symptomsRaw ?? [], [symptomsRaw]);
  const checks = useMission((s) => s.checks);
  const [include, setInclude] = useState<Record<string, boolean>>(() => Object.fromEntries(INDICATORS.map((i) => [i.id, true])));
  const [sections, setSections] = useState({ alerts: true, trends: true, symptoms: true, actions: true });
  const [note, setNote] = useState("");
  const [sentFlash, setSentFlash] = useState(false);

  const actionsTaken = h.alerts.flatMap((a) => a.steps.filter((_, i) => checks[`${h.profile.id}:${h.day}:${a.id}:${i}`]).map((s) => `${a.title}: ${s}`));

  const payload = useMemo(() => {
    const ids = INDICATORS.filter((i) => include[i.id]);
    return {
      type: "consult-packet",
      prototype: true,
      simulatedData: true,
      crew: { name: h.profile.name, role: h.profile.role },
      missionDay: h.day,
      mission: h.link.preset.name,
      earthReply: formatDuration(h.link.reply.totalMin),
      readingsToday: Object.fromEntries(
        ids.map((i) => {
          const r = h.history[i.id].at(-1);
          const v = formatPrimary(i, r?.values, settings);
          return [i.shortName, { value: `${v.text} ${v.unit}`, measuredDay: r?.day ?? null, status: h.evals[i.id].status }];
        }),
      ),
      ...(sections.trends && {
        trends7d: Object.fromEntries(ids.map((i) => [i.shortName, h.history[i.id].slice(-7).map((r) => ({ day: r.day, value: r.values[0] }))])),
      }),
      ...(sections.alerts && {
        alerts: h.alerts
          .filter((a) => a.indicatorIds.every((i) => include[i]))
          .map((a) => ({ title: a.title, status: a.status, detector: a.detector, confidence: a.confidence, reason: a.reason, safeWait: formatDuration(a.tHarmMin), verdict: a.verdict })),
      }),
      ...(sections.symptoms && { symptoms }),
      ...(sections.actions && { actionsAlreadyTaken: actionsTaken }),
      ...(note.trim() && { note: note.trim() }),
      withheld: INDICATORS.filter((i) => !include[i.id]).map((i) => i.shortName),
    };
  }, [include, sections, note, h, settings, symptoms, actionsTaken]);

  const json = JSON.stringify(payload, null, 2);

  const doSend = () => {
    send(
      {
        oneWayMin: h.link.oneWayMin,
        tReplyMin: h.link.reply.totalMin,
        speed,
        day: h.day,
        crew: h.profile.name,
        title: h.alerts[0]?.title ?? "Routine summary",
        included: INDICATORS.filter((i) => include[i.id]).map((i) => i.id),
        payload,
      },
      h.link.reply.noContact,
    );
    setSentFlash(true);
    window.setTimeout(() => setSentFlash(false), 2500);
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `consult-packet-day${h.day}-${h.profile.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-head no-print">
        <div>
          <div className="eyebrow">Consult Packet · to the flight surgeon</div>
          <h1>One complete message, your choice of what to share</h1>
          <p className="lede">
            {h.link.reply.noContact
              ? "No contact during solar conjunction. Sending queues the packet on board; it leaves as soon as contact returns."
              : `A reply takes about ${formatDuration(h.link.reply.totalMin)} (${h.link.reply.parts.map((p) => `${p.label} ${formatDuration(p.min)}`).join(" + ")}).`}
          </p>
        </div>
      </div>

      <div className="consult no-print">
        <section className="card stack">
          <div className="label">What to include (privacy)</div>
          <div className="symptoms">
            {INDICATORS.map((i) => (
              <label key={i.id}>
                <input type="checkbox" checked={include[i.id]} onChange={(e) => setInclude((c) => ({ ...c, [i.id]: e.target.checked }))} />
                {i.shortName}
                <StatusBadge status={h.evals[i.id].status} />
              </label>
            ))}
          </div>
          <div className="symptoms">
            {(
              [
                ["alerts", "Alert reasoning"],
                ["trends", "7-day trends"],
                ["symptoms", `Symptoms (${symptoms.length})`],
                ["actions", `Actions already taken (${actionsTaken.length})`],
              ] as const
            ).map(([k, label]) => (
              <label key={k}>
                <input type="checkbox" checked={sections[k]} onChange={(e) => setSections((s) => ({ ...s, [k]: e.target.checked }))} />
                {label}
              </label>
            ))}
          </div>
          <label className="field">
            <span>Note to the flight surgeon (optional)</span>
            <textarea className="input" rows={3} style={{ padding: "var(--sp-3)" }} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="label">Preview</div>
          <pre className="packet-preview" tabIndex={0} aria-label="Packet preview">
            {json}
          </pre>
          <div className="row">
            <button className="btn btn--primary btn--lg" onClick={doSend}>
              <Send /> {h.link.reply.noContact ? "Queue for flight surgeon" : "Send to flight surgeon"}
            </button>
            <button className="btn" onClick={download}>
              <Download /> JSON
            </button>
            <button className="btn" onClick={() => window.print()}>
              <Printer /> Print / PDF
            </button>
            {sentFlash && (
              <span role="status" style={{ color: "var(--nominal)", fontWeight: 600 }}>
                {h.link.reply.noContact ? "Queued on board." : "Sent."}
              </span>
            )}
          </div>
        </section>

        <Outbox items={outbox} onClear={clear} />
      </div>

      <PrintView payload={payload} />
    </div>
  );
}

function Outbox({ items, onClear }: { items: ConsultPacket[]; onClear: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);
  return (
    <aside className="card stack" aria-label="Outbox" aria-live="polite">
      <div className="row">
        <div className="label">Outbox</div>
        <span className="spacer" style={{ flex: 1 }} />
        {items.length > 0 && (
          <button className="btn btn--ghost btn--sm" onClick={onClear}>
            <Trash2 /> Clear
          </button>
        )}
      </div>
      {items.length === 0 && <p className="dim">Nothing sent yet. Packets stay on board until sent, and work fully offline.</p>}
      {items.map((p) => {
        const { status, replyInMs } = packetStatus(p, now);
        const order = ["queued", "transit", "delivered", "reply-due"];
        const idx = order.indexOf(status);
        return (
          <div key={p.id} className="outbox-item">
            <div className="row">
              <strong>{p.title}</strong>
              <span className="spacer" style={{ flex: 1 }} />
              <span className="mono dim" style={{ fontSize: "var(--fs-sm)" }}>
                {p.id} · day {p.day}
              </span>
            </div>
            <div className="track">
              {["Queued", "In transit", "Delivered", "Reply due"].map((l, i) => (
                <span key={l} className={i < idx ? "done" : i === idx ? "on" : ""}>
                  {l}
                </span>
              ))}
            </div>
            <span className="dim" style={{ fontSize: "var(--fs-sm)" }}>
              {status === "queued"
                ? "Waiting for contact (solar conjunction). Handle everything on board meanwhile."
                : status === "reply-due"
                  ? "Reply window reached (simulated: no real reply is generated)."
                  : `Reply expected in ${formatDuration((replyInMs * p.speed) / 60000)} of mission time${p.speed > 1 ? ` (demo clock ×${p.speed})` : ""}.`}
            </span>
          </div>
        );
      })}
    </aside>
  );
}

function PrintView({ payload }: { payload: Record<string, unknown> }) {
  return (
    <div className="print-only packet-print">
      <h1>Consult Packet — PROTOTYPE, SIMULATED DATA</h1>
      <p>Decision-support prototype. It flags and explains; it does not diagnose.</p>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}
