import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { contrastRatio, parseColour } from '../provider/contrast';
import { seriesColour, seriesCount, seriesMarker } from './SeriesMarker';

type Rgb = [number, number, number];
const tokens = JSON.parse(readFileSync('plan/tokens.json', 'utf8')).color;

// CSS `color-mix(in oklab, a p, b)`, to get the card backgrounds the stylesheet derives from a tint.
const linear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const gamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
function toOklab(colour: string) {
  const [r, g, b] = parseColour(colour)!.map((v) => linear(v / 255)) as Rgb;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function mix(a: string, share: number, b: string): Rgb {
  const [A, B] = [toOklab(a), toOklab(b)];
  const [L, x, y] = A.map((v, i) => v * share + B[i]! * (1 - share)) as Rgb;
  const l = (L + 0.3963377774 * x + 0.2158037573 * y) ** 3;
  const m = (L - 0.1055613458 * x - 0.0638541728 * y) ** 3;
  const s = (L - 0.0894841775 * x - 1.291485548 * y) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => 255 * Math.min(1, Math.max(0, gamma(v)))) as Rgb;
}

test('every series colour has 3:1 against the card backgrounds on every context tint', () => {
  const series = Object.entries(tokens.series as Record<string, string>).filter(([k]) => !k.startsWith('$'));
  expect(series).toHaveLength(seriesCount);
  // Card `default` and `tinted` on each tint, the neutral card, and the popover surface.
  const surfaces: Rgb[] = [parseColour(tokens.base.surfaceNeutral)!, parseColour(tokens.base.surface2)!];
  for (const tint of Object.values(tokens.context.presets as Record<string, string>)) {
    for (const derived of [
      tokens.context.derive.cardTint,
      tokens.context.derive.cardTintStrong,
    ] as string[]) {
      // The tint is mixed into surface1, which has the same luminance on every context.
      const [, share] = /<input> (\d+)%, var\(--umbra-color-base-surface1\)/.exec(derived)!;
      surfaces.push(mix(tint, Number(share) / 100, tokens.base.surface1));
    }
  }
  expect(surfaces).toHaveLength(10);
  let worst = Infinity;
  for (const [, colour] of series)
    for (const surface of surfaces) worst = Math.min(worst, contrastRatio(parseColour(colour)!, surface));
  // The measured minimum is 4.80 (series 6 on the tinted green card); see plan/specs/Legend.md.
  expect(worst).toBeGreaterThanOrEqual(4.5);
});

test('past the palette, the colour repeats and the marker changes', () => {
  expect(seriesColour(0)).toBe(seriesColour(seriesCount));
  expect(seriesMarker(seriesCount - 1)).toBe('dot');
  expect(seriesMarker(seriesCount)).toBe('stripes');
  expect(seriesMarker(seriesCount * 2)).toBe('dots');
  expect(seriesMarker(seriesCount * 3)).toBe('stripes');
});
