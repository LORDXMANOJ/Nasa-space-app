/**
 * Consult Packet (replaces the old Ground Link): one complete message for the flight surgeon —
 * readings, 7-day trends, alert reasoning, symptoms, actions already taken. The astronaut chooses what to include.
 * Sending starts a countdown equal to T_reply; during solar conjunction it queues offline until contact returns.
 * Exports as JSON and printable PDF (browser print), generated locally.
 */
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, Printer, Send, Trash2 } from "../components/icons";
import { INDICATORS } from "../data";
import { formatDuration } from "../engine/missions";
import { formatPrimary } from "../lib/format";
import { useHealth } from "../store/health";
import { packetStatus, useMission, type ConsultPacket } from "../store/mission";
import { StatusBadge } from "../components/status";
import { ActionButton } from "../components/Feedback";
import { toast } from "../store/toast";

/** Keeps the packet short enough for a slow, scheduled link. */
const NOTE_MAX = 400;

export function Consult() {
  const [preview, setPreview] = useState(false);
  const h = useHealth();
  const settings = useMission((s) => s.settings);
  const outbox = useMission((s) => s.outbox);
  const send = useMission((s) => s.sendPacket);
  const clear = useMission((s) => s.clearOutbox);
  const speed = useMission((s) => s.demoSpeed);
  const symptomsRaw = useMission((s) => s.symptoms[s.day]);
  const symptoms = useMemo(() => symptomsRaw ?? [], [symptomsRaw]);
  const checks = useMission((s) => s.checks);
  const [include, setInclude] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INDICATORS.map((i) => [i.id, true])),
  );
  const [sections, setSections] = useState({ alerts: true, trends: true, symptoms: true, actions: true });
  const [note, setNote] = useState("");

  const actionsTaken = h.alerts.flatMap((a) =>
    a.steps.filter((_, i) => checks[`${h.profile.id}:${h.day}:${a.id}:${i}`]).map((s) => `${a.title}: ${s}`),
  );

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
          return [
            i.shortName,
            { value: `${v.text} ${v.unit}`, measuredDay: r?.day ?? null, status: h.evals[i.id].status },
          ];
        }),
      ),
      ...(sections.trends && {
        trends7d: Object.fromEntries(
          ids.map((i) => [
            i.shortName,
            h.history[i.id].slice(-7).map((r) => ({ day: r.day, value: r.values[0] })),
          ]),
        ),
      }),
      ...(sections.alerts && {
        alerts: h.alerts
          .filter((a) => a.indicatorIds.every((i) => include[i]))
          .map((a) => ({
            title: a.title,
            status: a.status,
            detector: a.detector,
            confidence: a.confidence,
            reason: a.reason,
            safeWait: formatDuration(a.tHarmMin),
            verdict: a.verdict,
          })),
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
    toast(
      h.link.reply.noContact
        ? "Packet queued on board. It goes out when contact returns."
        : "Packet sent to the flight surgeon. It is in the outbox.",
    );
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
          <h1>Consult Packet</h1>
          <p className="lede">
            {h.link.reply.noContact
              ? "One complete message for the flight surgeon. No contact during solar conjunction: the packet waits on board until contact returns."
              : `One complete message for the flight surgeon; you choose what to share. A reply takes about ${formatDuration(h.link.reply.totalMin)} (${h.link.reply.parts.map((p) => `${p.label} ${formatDuration(p.min)}`).join(" + ")}).`}
          </p>
        </div>
      </div>

      <div className="consult no-print">
        <section className="card stack">
          <h2>What to include</h2>
          <div className="symptoms">
            {INDICATORS.map((i) => (
              <label key={i.id}>
                <input
                  type="checkbox"
                  checked={include[i.id]}
                  onChange={(e) => setInclude((c) => ({ ...c, [i.id]: e.target.checked }))}
                />
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
                <input
                  type="checkbox"
                  checked={sections[k]}
                  onChange={(e) => setSections((s) => ({ ...s, [k]: e.target.checked }))}
                />
                {label}
              </label>
            ))}
          </div>
          <label className="field">
            <span>Note to the flight surgeon (optional)</span>
            <textarea
              className="input"
              rows={3}
              style={{ padding: "var(--sp-3)" }}
              value={note}
              maxLength={NOTE_MAX}
              aria-describedby="note-count"
              onChange={(e) => setNote(e.target.value)}
            />
            <small
              id="note-count"
              className={`char-count${NOTE_MAX - note.length <= 40 ? " is-low" : ""}`}
              aria-live="polite"
            >
              {NOTE_MAX - note.length} characters left
            </small>
          </label>
          <button
            className="btn btn--sm"
            style={{ alignSelf: "flex-start" }}
            aria-expanded={preview}
            onClick={() => setPreview((v) => !v)}
          >
            {preview ? "Hide" : "Show"} what will be sent{" "}
            <ChevronDown aria-hidden style={{ transform: preview ? "rotate(180deg)" : undefined }} />
          </button>
          {preview && (
            <pre className="packet-preview" tabIndex={0} aria-label="Packet preview">
              {json}
            </pre>
          )}
          <div className="row">
            <ActionButton
              className="btn btn--primary btn--lg"
              onAction={doSend}
              workingLabel={h.link.reply.noContact ? "Queuing…" : "Sending…"}
              doneLabel={h.link.reply.noContact ? "Queued" : "Sent"}
            >
              <Send /> {h.link.reply.noContact ? "Queue for flight surgeon" : "Send to flight surgeon"}
            </ActionButton>
            <button className="btn" onClick={download}>
              <Download /> JSON
            </button>
            <button className="btn" onClick={() => window.print()}>
              <Printer /> Print / PDF
            </button>
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
        <h2>Outbox</h2>
        <span className="spacer" style={{ flex: 1 }} />
        {items.length > 0 && (
          <button className="btn btn--ghost btn--sm" onClick={onClear}>
            <Trash2 /> Clear
          </button>
        )}
      </div>
      {items.length === 0 && (
        <div className="empty-hint">
          <Send aria-hidden />
          <div>
            <strong>No packets yet</strong>
            <p className="dim">
              Packets you send to the flight surgeon appear here, with where each one is: queued, on its way,
              delivered, reply due. Choose what to include on the left, then press Send.
            </p>
          </div>
        </div>
      )}
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
      <h1>Consult Packet (prototype, simulated data)</h1>
      <p>Decision-support prototype. It flags and explains; it does not diagnose.</p>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>{JSON.stringify(payload, null, 2)}</pre>
    </div>
  );
}
