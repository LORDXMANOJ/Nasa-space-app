/**
 * On-board assistant screen. Offline, pre-written answers built only from condition cards and detector output.
 * Dose and diagnosis questions are refused in code before anything else runs; every answer is labelled with its basis.
 */
import { useEffect, useRef, useState } from "react";
import { Bot, Send, ShieldCheck } from "lucide-react";
import { answer, type Answer } from "../engine/assistant";
import { useHealth } from "../store/health";

const SUGGEST = ["Why did I get this alert?", "Can this wait for Earth?", "What should I do now?", "What are the red flags?", "What is HRV?", "How does it decide?"];

interface Msg {
  me: boolean;
  text: string;
  a?: Answer;
}

export function Assistant() {
  const h = useHealth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" }); // braces: scrollIntoView may return a Promise in new browsers
  }, [msgs]);

  const ask = (text: string) => {
    if (!text.trim()) return;
    const a = answer(text, { alerts: h.alerts, evals: h.evals, replyMin: h.link.reply.totalMin, noContact: h.link.reply.noContact });
    setMsgs((m) => [...m, { me: true, text }, { me: false, text: a.text, a }]);
    setQ("");
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>On-board assistant</h1>
          <p className="lede">
            Works offline. Answers are <strong>pre-written</strong>, built only from the condition cards and today's detector results. No AI model runs here.
          </p>
        </div>
      </div>
      <div className="banner banner--info" style={{ marginBottom: "var(--sp-5)" }}>
        <ShieldCheck aria-hidden />
        <span>It will not give medicine doses or a diagnosis. Those questions are blocked before any answer is built. Treatment decisions belong to your Crew Medical Officer.</span>
      </div>
      <div className="chat" aria-live="polite">
        {msgs.length === 0 && (
          <div className="msg">
            <Bot width={18} style={{ verticalAlign: -3, marginRight: 6 }} aria-hidden />
            Hi {h.profile.name.split(" ")[0]}. {h.alerts.length ? `You have ${h.alerts.length} alert${h.alerts.length > 1 ? "s" : ""} today.` : "No alerts today."} Ask me anything below.
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`msg${m.me ? " me" : ""}${m.a?.kind === "blocked" ? " blocked" : ""}`}>
            {m.text}
            {m.a && <span className="src-tag">{m.a.kind === "blocked" ? "SAFETY BLOCK · " : "PRE-WRITTEN · "}{m.a.basis}</span>}
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="row" style={{ marginTop: "var(--sp-5)" }}>
        {SUGGEST.map((s) => (
          <button key={s} className="chip" onClick={() => ask(s)} style={{ cursor: "pointer", minHeight: 36 }}>
            {s}
          </button>
        ))}
      </div>
      <form
        className="row"
        style={{ marginTop: "var(--sp-4)", maxWidth: 900 }}
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <label className="sr-only" htmlFor="ask">
          Your question
        </label>
        <input id="ask" className="input" style={{ flex: 1 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a question…" autoComplete="off" />
        <button className="btn btn--primary" type="submit">
          <Send /> Ask
        </button>
      </form>
    </div>
  );
}
