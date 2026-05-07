/**
 * Modern fuzzy search utility for real-time filtering.
 * 
 * Features:
 * - Multi-word matching: each word in the query is matched independently
 * - Case-insensitive
 * - Matches against multiple fields
 * - Scores results by relevance (exact > starts-with > contains)
 * - Returns sorted results with best matches first
 */

type SearchableItem<T> = {
  item: T;
  searchFields: string[];
};

function normalizeStr(str: string): string {
  return str.toLowerCase().trim();
}

function wordScore(field: string, word: string): number {
  const f = normalizeStr(field);
  const w = normalizeStr(word);
  if (!w) return 0;

  // Exact match on entire field
  if (f === w) return 100;
  // Field starts with the word
  if (f.startsWith(w)) return 80;
  // Any word in the field starts with the search word
  const fieldWords = f.split(/\s+/);
  if (fieldWords.some(fw => fw.startsWith(w))) return 60;
  // Contains the word
  if (f.includes(w)) return 40;
  // Match individual characters in order (fuzzy)
  let fi = 0;
  for (let wi = 0; wi < w.length && fi < f.length; fi++) {
    if (f[fi] === w[wi]) wi++;
    if (wi === w.length) return 20;
  }
  return 0;
}

/**
 * Fuzzy search that filters and sorts items based on query.
 * Each word in the query is matched independently against all search fields.
 * ALL words must match at least one field for the item to be included.
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getSearchFields: (item: T) => string[]
): T[] {
  const trimmed = query.trim();
  if (!trimmed) return items;

  const queryWords = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

  const scored: { item: T; score: number }[] = [];

  for (const item of items) {
    const fields = getSearchFields(item).filter(Boolean);
    let totalScore = 0;
    let allWordsMatch = true;

    for (const word of queryWords) {
      let bestWordScore = 0;
      for (const field of fields) {
        const s = wordScore(field, word);
        bestWordScore = Math.max(bestWordScore, s);
      }
      if (bestWordScore === 0) {
        allWordsMatch = false;
        break;
      }
      totalScore += bestWordScore;
    }

    if (allWordsMatch && totalScore > 0) {
      scored.push({ item, score: totalScore });
    }
  }

  // Sort by score descending (best matches first)
  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.item);
}

/**
 * Highlight matching text in a string.
 * Returns an array of { text, highlight } segments.
 */
export function highlightMatches(
  text: string,
  query: string
): { text: string; highlight: boolean }[] {
  if (!query.trim() || !text) return [{ text, highlight: false }];

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  // Build a regex that matches any of the query words
  const escaped = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), highlight: false });
    }
    parts.push({ text: match[0], highlight: true });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }

  return parts.length > 0 ? parts : [{ text, highlight: false }];
}
