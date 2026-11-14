/**
 * On-board assistant (fully offline, pre-written answers).
 * Explains alerts using ONLY condition cards, indicator data and detector output.
 * Safety: questions about medicine doses or diagnoses are refused in code BEFORE any answer is built,
 * and every answer is checked again afterwards. No model, no network; the UI labels answers as pre-written.
 */
import { CONDITION_CARDS, INDICATORS } from "../data";
import type { Alert } from "./assess";
import type { Evaluation } from "./alerts";
import { formatDuration, type Verdict } from "./missions";

export interface AssistantContext {
  alerts: (Alert & { verdict: Verdict })[];
  evals: Record<string, Evaluation>;
  replyMin: number;
  noContact: boolean;
}

export interface Answer {
  text: string;
  kind: "answer" | "blocked";
  basis: string; // what the answer was built from (shown to the user)
  /** Set when nothing matched: questions the assistant can answer, closest first, shown as buttons. */
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Why did I get this alert?",
  "What should I do now?",
  "Can this wait for Earth?",
  "What are the red flags?",
];

/** Questions close to what was asked: readings that share a word stem with the question, then the usual ones. */
export function suggestFor(q: string): string[] {
  const words = q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4);
  const close = INDICATORS.filter((i) =>
    `${i.name} ${i.shortName}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .some((n) => n.length >= 4 && words.some((w) => w.slice(0, 4) === n.slice(0, 4))),
  ).map((i) => `How is my ${i.shortName.toLowerCase()}?`);
  return [...new Set([...close, ...DEFAULT_SUGGESTIONS])].slice(0, 4);
}

const DOSE =
  /\b(dose|dosage|doses|dosing|mg|mcg|milligram|microgram|how many (pills|tablets)|how much (medicine|medication|of the drug|drug)|prescri\w*|pill|tablet|capsule|inject\w*|ibuprofen|paracetamol|acetaminophen|aspirin|antibiotic\w*|insulin|epinephrine|adrenaline|morphine|opioid|sedative|sleeping pill|melatonin|antihistamine|steroid|medicine|medication|drug)\b/i;
const ILLNESS =
  "(infection|disease|illness|condition|cancer|covid|flu|virus|pneumonia|diabetes|stroke|heart attack|depression|fever)";
const DIAGNOSIS = new RegExp(
  String.raw`\b(diagnos\w*|(do|did) i (have|get|catch) (a |an )?(\w+ )?${ILLNESS}|have i got (a |an )?(\w+ )?${ILLNESS}|is (it|this) (a |an )?${ILLNESS}|what (disease|illness|condition) (do i|is it|have i)|am i (dying|sick with))`,
  "i",
);

export const REFUSAL =
  "I can't give medicine doses or a diagnosis. I can explain why you got an alert, what the self-care steps are, and whether it can wait for Earth. For any treatment, your Crew Medical Officer decides using the on-board medical guide.";

/** Pre-check: runs before anything else sees the question. */
export function isBlocked(q: string): "dose" | "diagnosis" | null {
  if (DIAGNOSIS.test(q)) return "diagnosis";
  if (DOSE.test(q)) return "dose";
  return null;
}

/** Post-check: an answer must never contain a dose or a drug name (food/water amounts are fine). */
const POST =
  /\b(\d+(\.\d+)?\s?(mg|mcg|µg|IU|units?)\b|ibuprofen|paracetamol|acetaminophen|aspirin|antibiotic|insulin|epinephrine|morphine|opioid|sedative|diagnos(is|ed|e))\b/i;
export const passesPostCheck = (text: string) => !POST.test(text);

const verdictText = (v: Verdict) =>
  v === "act-onboard" ? "act on board now" : "it can wait for Earth (start the steps anyway)";

export function answer(question: string, ctx: AssistantContext): Answer {
  const q = question.trim();
  const blocked = isBlocked(q);
  if (blocked)
    return {
      text: REFUSAL,
      kind: "blocked",
      basis: `Blocked before answering: looks like a ${blocked} question.`,
    };
  const out = build(q.toLowerCase(), ctx);
  if (out.suggestions) {
    const shown = q.length > 60 ? `${q.slice(0, 57)}…` : q;
    out.text = `I have nothing about "${shown}". I only answer from the condition cards and today's results. Try one of these:`;
    out.suggestions = suggestFor(q);
  }
  if (!passesPostCheck(out.text))
    return {
      text: REFUSAL,
      kind: "blocked",
      basis: "Blocked after answering: the answer failed the safety check.",
    };
  return out;
}

function build(q: string, ctx: AssistantContext): Answer {
  const top = ctx.alerts[0];
  const ind = INDICATORS.find(
    (i) =>
      q.includes(i.shortName.toLowerCase()) ||
      q.includes(i.id) ||
      q.includes(i.name.toLowerCase().split(" ")[0]),
  );

  for (const i of INDICATORS)
    for (const [term, def] of Object.entries(i.glossary))
      if (q.includes(term.toLowerCase()) && /what (is|does|are)|mean|explain/.test(q))
        return { text: `${term}: ${def}`, kind: "answer", basis: `Glossary of the ${i.shortName} card.` };

  if (/red flag|emergency|danger|worse|serious/.test(q)) {
    const flags = top ? top.redFlags : CONDITION_CARDS.flatMap((c) => c.redFlags).slice(0, 6);
    return {
      text: flags.length
        ? `Tell your Crew Medical Officer right away if you notice any of these: ${flags.join("; ")}.`
        : "No red flags are linked to today's alerts. If you feel suddenly much worse, tell your Crew Medical Officer.",
      kind: "answer",
      basis: top ? `Red flags on "${top.title}".` : "Red flags from the condition cards.",
    };
  }

  if (/wait|earth|reply|ground|surgeon|ask/.test(q)) {
    if (!top)
      return {
        text: `Nothing needs a decision today. A reply from Earth would take ${formatDuration(ctx.replyMin)}.`,
        kind: "answer",
        basis: "Earth reply model.",
      };
    return {
      text: `${top.title}: it can safely wait about ${formatDuration(top.tHarmMin)} (from the ${top.tHarmSource}). ${
        ctx.noContact
          ? "There is no contact with Earth right now (solar conjunction)"
          : `Earth's answer takes ${formatDuration(ctx.replyMin)}`
      }, so: ${verdictText(top.verdict)}. Either way, send a Consult Packet; your Crew Medical Officer decides.`,
      kind: "answer",
      basis: "Decision rule: act on board if Earth's reply time is longer than the safe wait.",
    };
  }

  if (/what (should|do|can) i do|steps|plan|help|recover/.test(q)) {
    if (!top)
      return {
        text: "No alerts today. Keep your routine: daily check-in, exercise, regular sleep, and talk to your crew.",
        kind: "answer",
        basis: "No active alerts.",
      };
    return {
      text: `For "${top.title}": ${top.steps.map((s, i) => `${i + 1}) ${s}`).join(" ")} Escalation: ${top.escalation}`,
      kind: "answer",
      basis: `Steps on the "${top.title}" card.`,
    };
  }

  if (ind) {
    const e = ctx.evals[ind.id];
    return {
      text: `${ind.shortName} is ${e.status}. ${e.reason} ${ind.plainMeaning[e.status]}`,
      kind: "answer",
      basis: `${ind.shortName} card + ${e.detector ?? "rules"} output.`,
    };
  }

  if (/why|alert|flag|warning|status/.test(q)) {
    if (!top)
      return {
        text: "You have no alerts today: all readings are within your own normal and the safety limits.",
        kind: "answer",
        basis: "Detector output.",
      };
    const rest =
      ctx.alerts.length > 1
        ? ` There ${ctx.alerts.length === 2 ? "is 1 more alert" : `are ${ctx.alerts.length - 1} more alerts`}; ask about a reading by name.`
        : "";
    return {
      text: `"${top.title}" came from the ${top.detector} check (confidence ${top.confidence}). ${top.reason}${rest}`,
      kind: "answer",
      basis: `${top.detector} detector + card text.`,
    };
  }

  if (/how (does|do) (it|this|you) (work|decide)|detector|baseline|mahalanobis|cusum/.test(q)) {
    return {
      text: "Three checks run on your daily readings: fixed safety rules from the condition cards; an 'unusual day' check that compares today with your own normal from the 10 days of readings on Earth before launch; and a slow-drift check that spots readings creeping in one direction. Then it compares how long the problem can safely wait with how long Earth takes to answer.",
      kind: "answer",
      basis: "The 'How it decides' page.",
    };
  }

  return { text: "", kind: "answer", basis: "No match: pre-written help.", suggestions: [] };
}
