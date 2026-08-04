// Shared helpers for the story screens (setup / reader / shelves).
//
// Colors are composed from the theme CSS variables — `color-mix` softens them
// into pastels that still follow light/dark mode. Raw hex stays reserved for
// SVG artwork (the wooden shelf plank).

import { GENRES } from '@/types/story';

export interface GenreMeta {
  id: string;
  label: string;
  emoji: string;
}

const FALLBACK_GENRE: GenreMeta = { id: 'pribeh', label: 'Příběh', emoji: '📖' };

/** Tolerant lookup — accepts a genre id (canonical) or its czech label. */
export function genreMeta(genre: string): GenreMeta {
  const needle = genre.trim().toLowerCase();
  return (
    GENRES.find(g => g.id.toLowerCase() === needle || g.label.toLowerCase() === needle) ??
    FALLBACK_GENRE
  );
}

/** Two theme vars per genre — the scene gradient behind the pet. */
const GENRE_TINTS: Record<string, [string, string]> = {
  dobrodruzstvi: ['var(--mint)', 'var(--accent)'],
  kouzla: ['var(--lavender)', 'var(--accent)'],
  detektivka: ['var(--lavender)', 'var(--mint)'],
  zviratka: ['var(--mint)', 'var(--coral)'],
  vesmir: ['var(--lavender)', 'var(--accent-hover)'],
  humor: ['var(--coral)', 'var(--accent)'],
};

function softVar(cssVar: string, strength: number): string {
  return `color-mix(in srgb, ${cssVar} ${strength}%, var(--bg-card))`;
}

/** Soft themed gradient for a genre scene. `strength` = 0-100 tint intensity. */
export function genreGradient(genre: string, strength = 42): string {
  const [from, to] = GENRE_TINTS[genreMeta(genre).id] ?? ['var(--accent)', 'var(--lavender)'];
  return `linear-gradient(155deg, ${softVar(from, strength)}, ${softVar(to, Math.round(strength * 0.55))})`;
}

/** Stable, non-random seed so a book keeps its color between renders. */
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const PALETTE_VARS = [
  'var(--accent)',
  'var(--lavender)',
  'var(--mint)',
  'var(--coral)',
  'var(--accent-hover)',
] as const;

/** Book cover colors — face + a slightly deeper spine edge. */
export function spineTint(seed: string): { face: string; edge: string } {
  const cssVar = PALETTE_VARS[hashSeed(seed) % PALETTE_VARS.length];
  return { face: softVar(cssVar, 34), edge: softVar(cssVar, 68) };
}

/** Pet remarks for finished books — memories, never scores. */
const DONE_LINES = [
  'Tuhle jsme četly spolu! 🐾',
  'Ta byla napínavá, viď?',
  'Na tuhle budu dlouho vzpomínat ✨',
  'U téhle jsi mi zapomněla dát večeři 😸',
  'Pamatuješ, jak jsme se u ní smály? 💛',
  'Ta měla nejhezčí konec 🌙',
];

export function petDoneLine(seed: string): string {
  return DONE_LINES[hashSeed(seed) % DONE_LINES.length];
}

/**
 * Reads a list out of an API envelope — `{ stories }`, `{ entries }`,
 * `{ data }` or a bare array all work.
 */
export function readList<T>(payload: unknown, ...keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of [...keys, 'data', 'items']) {
      const value = record[key];
      if (Array.isArray(value)) return value as T[];
    }
  }
  return [];
}

/** "12. srpna" — short and friendly, no time. */
export function formatDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long' });
}

/**
 * Deterministic 0-1 value from an index — decorative layouts (confetti) stay
 * identical across re-renders instead of jumping around like Math.random would.
 */
export function seededUnit(index: number, salt = 1): number {
  const x = Math.sin((index + 1) * 12.9898 * salt) * 43758.5453;
  return x - Math.floor(x);
}

/** Splits a segment into paragraphs, tolerating single or double newlines. */
export function toParagraphs(text: string): string[] {
  return text.split('\n').map(p => p.trim()).filter(Boolean);
}
