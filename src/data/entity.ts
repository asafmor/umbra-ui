import { contrastRatio, parseColour } from '../provider/contrast';

/** One or two upper-case letters for a name: the first letter of its first and last words. */
export function initialsOf(name: string, letters: 1 | 2 = 2): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = [...(words[0] ?? '')][0] ?? '';
  const last = words.length > 1 && letters === 2 ? ([...words[words.length - 1]!][0] ?? '') : '';
  return (first + last).toUpperCase();
}

const white = parseColour('#ffffff')!;

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

/**
 * The hue (0–359) of a name. FNV-1a, then the murmur3 finaliser: a change of one character, the last
 * one too, moves every bit, so names such as "Client A" and "Client B" land far apart.
 */
export function hueOf(name: string): number {
  let hash = 0x811c9dc5;
  for (const char of name.trim().toLowerCase()) hash = Math.imul(hash ^ char.codePointAt(0)!, 0x01000193);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return ((hash ^ (hash >>> 16)) >>> 0) % 360;
}

/**
 * A background colour for a name: the same name always gives the same colour, and white text on it
 * always has at least 4.5:1. The hue comes from a hash of the name; the lightness is lowered until
 * the contrast holds.
 */
export function colourOf(name: string): string {
  const hash = hueOf(name);
  let lightness = 0.42;
  let rgb = hslToRgb(hash, 0.6, lightness);
  while (contrastRatio(rgb, white) < 4.5) rgb = hslToRgb(hash, 0.6, (lightness -= 0.02));
  return '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
}
