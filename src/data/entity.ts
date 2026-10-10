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
 * A background colour for a name: the same name always gives the same colour, and white text on it
 * always has at least 4.5:1. The hue comes from a hash of the name; the lightness is lowered until
 * the contrast holds.
 */
export function colourOf(name: string): string {
  let hash = 0;
  for (const char of name.trim().toLowerCase()) hash = (hash * 31 + char.codePointAt(0)!) % 360;
  let lightness = 0.42;
  let rgb = hslToRgb(hash, 0.6, lightness);
  while (contrastRatio(rgb, white) < 4.5) rgb = hslToRgb(hash, 0.6, (lightness -= 0.02));
  return '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
}
