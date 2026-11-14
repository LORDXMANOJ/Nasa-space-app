/**
 * Rule interpreter for condition cards (src/data/conditions.json).
 * A card fires when its `all`/`any` clauses match today's readings. Missing readings never match
 * (no evidence), and a firing card hides the cards it supersedes (e.g. fever+fast HR hides plain fever).
 */
import { CONDITION_CARDS, type Clause, type ConditionCard } from "../data";

export type Values = Record<string, number | undefined>; // key = "indicatorId.metricKey"

export function clauseMatches(c: Clause, values: Values): boolean {
  const v = values[c.metric];
  if (v === undefined || Number.isNaN(v)) return false;
  switch (c.op) {
    case ">":
      return v > c.value;
    case ">=":
      return v >= c.value;
    case "<":
      return v < c.value;
    case "<=":
      return v <= c.value;
  }
}

export function cardFires(card: ConditionCard, values: Values): boolean {
  return "all" in card.when ? card.when.all.every((c) => clauseMatches(c, values)) : card.when.any.some((c) => clauseMatches(c, values));
}

/** All cards that fire today, most urgent (smallest T_harm) first, superseded cards removed. */
export function firedCards(values: Values, cards: ConditionCard[] = CONDITION_CARDS): ConditionCard[] {
  const fired = cards.filter((c) => cardFires(c, values));
  const hidden = new Set(fired.flatMap((c) => c.supersedes ?? []));
  return fired.filter((c) => !hidden.has(c.id)).sort((a, b) => a.tHarmMin - b.tHarmMin);
}

export const cardMetrics = (card: ConditionCard) =>
  ("all" in card.when ? card.when.all : card.when.any).map((c) => c.metric);
