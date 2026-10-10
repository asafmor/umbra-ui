// The built-in filter of the command palette. Pure, so it is unit-tested.

export interface Matchable {
  label: string;
  description?: string;
  keywords?: string[];
}

/** Rank of one match, best first. */
export const rank = { prefix: 5, wordStart: 4, substring: 3, keyword: 2, loose: 1, none: 0 } as const;

const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** True when the letters of `term` appear in `text` in order, with anything between them. */
function inOrder(term: string, text: string) {
  let at = 0;
  for (const letter of term) {
    at = text.indexOf(letter, at) + 1;
    if (at === 0) return false;
  }
  return true;
}

function termRank(term: string, label: string, extra: string[]) {
  if (label.startsWith(term)) return rank.prefix;
  if (label.split(/[\s\-_/.:]+/).some((word) => word.startsWith(term))) return rank.wordStart;
  if (label.includes(term)) return rank.substring;
  if (extra.some((text) => text.includes(term))) return rank.keyword;
  // Loose matching only for terms long enough to mean something.
  return term.length >= 3 && inOrder(term, label) ? rank.loose : rank.none;
}

/**
 * How well a command matches the text: the start of its label beats the start of a word in it, which
 * beats text inside it, which beats its keywords and description, which beats its letters in order.
 * Every word of the text must match; the weakest word gives the rank. 0 means no match.
 */
export function matchRank(text: string, item: Matchable): number {
  const terms = fold(text).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return rank.prefix;
  const label = fold(item.label);
  // The whole text as the start of the label is the best there is, also with spaces in it.
  if (label.startsWith(terms.join(' '))) return rank.prefix;
  const extra = [...(item.keywords ?? []), item.description ?? ''].map(fold);
  return Math.min(...terms.map((term) => termRank(term, label, extra)));
}

/** The items that match, best first. Items of the same rank keep their order. Empty text keeps all. */
export function filterCommands<T extends Matchable>(items: T[], text: string): T[] {
  if (!text.trim()) return items;
  return items
    .map((item, index) => ({ item, index, score: matchRank(text, item) }))
    .filter((entry) => entry.score > rank.none)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}
