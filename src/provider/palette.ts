// The derived palette (plan/decisions/08-theming.md): pure functions from the app's colour inputs to
// token values. The provider writes the result as CSS variables; scripts/build-tokens.mjs runs the
// same code for the context presets. No imports but `contrast`, so the token build can bundle it.
import { contrastRatio, luminance, parseColour, toHex, type Rgb } from './contrast';

/** The token values the derivation starts from: the relevant part of plan/tokens.json. */
export interface PaletteDefaults {
  brand: string;
  /** The context the neutrals were drawn for (the violet preset). */
  context: string;
  interaction: string;
  interactionText: string;
  action: string;
  actionEnd: string;
  focusRing: string;
  textPrimary: string;
  /** The darkest text colour, used on a light fill. */
  textDark: string;
  /** The surface a fill must stand out from by 3:1. */
  surface: string;
  /** The semantic colours whose hues a derived colour keeps away from. */
  avoid: readonly string[];
  /** The neutrals that follow the context's hue, by token name (`color-base-surface1`). */
  neutrals: Readonly<Record<string, string>>;
  /** How far the context mixes into the end of the page gradient, 0 to 1. */
  pageMix: number;
  pageBase: string;
  /** The black mixed into a fill by its strongest press step, 0 to 1. */
  pressMix: number;
}

export interface PaletteInputs {
  brand?: string | undefined;
  /** A colour, not a preset name. */
  context?: string | undefined;
  interaction?: string | undefined;
  action?: string | undefined;
}

interface Lch {
  l: number;
  c: number;
  h: number;
}
type Lab = [number, number, number];

const toLinear = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

export function toLab(rgb: Rgb): Lab {
  const [r, g, b] = rgb.map(toLinear) as Rgb;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Linear sRGB of an OKLab colour; may be outside 0 to 1. */
function labToLinear([L, a, b]: Lab): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const clampRgb = (linear: Rgb) =>
  linear.map((v) => Math.round(fromLinear(Math.min(1, Math.max(0, v))))) as Rgb;

export function fromLab(lab: Lab): Rgb {
  return clampRgb(labToLinear(lab));
}

export function toLch(rgb: Rgb): Lch {
  const [l, a, b] = toLab(rgb);
  return { l, c: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

const lchToLab = ({ l, c, h }: Lch): Lab => [
  l,
  c * Math.cos((h * Math.PI) / 180),
  c * Math.sin((h * Math.PI) / 180),
];

/** sRGB of an OKLCH colour. Out of gamut, the chroma is reduced until it fits: hue and lightness stay. */
export function fromLch(lch: Lch): Rgb {
  const fits = (c: number) => labToLinear(lchToLab({ ...lch, c })).every((v) => v >= -0.0005 && v <= 1.0005);
  if (fits(lch.c)) return fromLab(lchToLab(lch));
  let lo = 0;
  let hi = lch.c;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) lo = mid;
    else hi = mid;
  }
  return fromLab(lchToLab({ ...lch, c: lo }));
}

/** The colour of this hue and chroma whose WCAG luminance is `y`. */
export function withLuminance(lch: Lch, y: number): Rgb {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (luminance(fromLch({ ...lch, l: mid })) < y) lo = mid;
    else hi = mid;
  }
  return fromLch({ ...lch, l: (lo + hi) / 2 });
}

/** `color-mix(in oklab, a, b amount)`, as the stylesheets mix a hover or press step. */
export function mixLab(a: Rgb, b: Rgb, amount: number): Rgb {
  const [x, y] = [toLab(a), toLab(b)];
  return fromLab(x.map((v, i) => v + (y[i]! - v) * amount) as Lab);
}

/** Distance in OKLab; about 0.02 is just noticeable. */
export function distance(a: Rgb, b: Rgb) {
  const [x, y] = [toLab(a), toLab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

const hueGap = (a: number, b: number) => ((a - b + 540) % 360) - 180;

/** Chroma under which a colour has no hue worth following (a grey, a near-black, a near-white). */
const greyChroma = 0.03;
/** Half the width, in degrees of hue, of the zone a derived colour keeps clear around a semantic one. */
const avoidZone = 22;
const black: Rgb = [0, 0, 0];
/** The contrast a fill has against the bare surface. */
const edge = 3.2;
/** The share of the interaction colour in the fill of a selected row of data. */
const rowTint = 0.32;

function rgbOf(colour: string): Rgb {
  const rgb = parseColour(colour);
  if (!rgb) throw new Error(`"${colour}" is not a hex or rgb() colour.`);
  return rgb;
}

/**
 * A fill that carries text, and the text on it. The fill keeps its hue and chroma; its lightness moves
 * only as far as it must, so that it has 3:1 against the surface, and the text has 4.5:1 on it at rest
 * and on its darkened hover and press steps.
 */
export function safeFill(input: Rgb, d: PaletteDefaults): { fill: Rgb; on: Rgb } {
  const lch = toLch(input);
  const surface = rgbOf(d.surface);
  const texts = [[255, 255, 255] as Rgb, rgbOf(d.textDark)];
  const check = (fill: Rgb) => {
    // A little over 3:1 against the bare surface, so that 3:1 holds on a card, whose tint is lighter.
    if (contrastRatio(fill, surface) < edge) return null;
    const pressed = mixLab(fill, black, d.pressMix);
    const on = texts.find((t) => contrastRatio(t, fill) >= 4.5 && contrastRatio(t, pressed) >= 4.5);
    return on ? { fill, on } : null;
  };
  const y = Math.max(luminance(input), 0.001);
  // Too dark to show on the surface: lighter. Too light for white text and too dark for dark text:
  // darker, to where white text holds, which keeps more of the colour than a pastel would.
  const direction = contrastRatio(input, surface) < edge ? 1 : -1;
  for (let step = 0; step < 200; step++) {
    const found = check(step ? withLuminance(lch, y * 1.02 ** (direction * step)) : input);
    if (found) return found;
  }
  return { fill: [255, 255, 255], on: texts[1]! };
}

/**
 * `source` moved as far as `to` is from `from`: the same step in hue and in lightness, and the same
 * share of the chroma. So the default brand gives the default colour of each role, and any other
 * brand gives a colour that stands to it as violet and magenta stand to the default indigo.
 */
function turned(source: Lch, from: string, to: string, avoid: readonly string[]): Lch {
  const [a, b] = [toLch(rgbOf(from)), toLch(rgbOf(to))];
  // A grey source has no hue to turn: the result is grey too.
  const c = b.c * Math.min(1, source.c / a.c);
  let h = (source.h + hueGap(b.h, a.h) + 360) % 360;
  if (c >= greyChroma) {
    for (const colour of avoid) {
      const gap = hueGap(h, toLch(rgbOf(colour)).h);
      if (Math.abs(gap) < avoidZone) h = (h + (gap < 0 ? -1 : 1) * (avoidZone - Math.abs(gap)) + 360) % 360;
    }
  }
  return { l: Math.min(0.85, Math.max(0.3, source.l + b.l - a.l)), c, h };
}

/**
 * The context colour the tints are mixed from. A colour of the app keeps its hue and chroma; its
 * lightness is held to the range of the presets, so text keeps its contrast on the page background.
 */
export function safeContext(input: string, d: PaletteDefaults): string {
  const rgb = rgbOf(input);
  const lch = toLch(rgb);
  const page = rgbOf(d.pageBase);
  const muted = rgbOf(d.neutrals['color-base-text-muted'] ?? d.textPrimary);
  // Bright enough to show: no darker than the darkest preset.
  let out = lch.l < 0.5 ? fromLch({ ...lch, l: 0.5 }) : rgb;
  // Never so bright that muted text on the bright end of the page gradient drops under 4.5:1.
  for (let l = toLch(out).l - 0.01; l > 0.3; l -= 0.01) {
    const end = mixLab(page, out, d.pageMix);
    if (contrastRatio(neutralFor(muted, toLch(out), d), end) >= 4.5) break;
    out = fromLch({ ...lch, l });
  }
  return toHex(out);
}

function neutralFor(neutral: Rgb, context: Lch, d: PaletteDefaults): Rgb {
  const own = toLch(neutral);
  const base = toLch(rgbOf(d.context));
  const strength = Math.min(1, context.c / base.c);
  // The same luminance as the default neutral, so every contrast between neutrals is unchanged.
  return withLuminance({ l: own.l, c: own.c * strength, h: context.h }, luminance(neutral));
}

/** The neutrals (surfaces, borders, secondary text) in the hue of a context, each as bright as before. */
export function deriveNeutrals(context: string, d: PaletteDefaults): Record<string, string> {
  // The context the neutrals were drawn for gives them back exactly.
  if (toHex(rgbOf(context)) === toHex(rgbOf(d.context))) return { ...d.neutrals };
  const lch = toLch(rgbOf(context));
  return Object.fromEntries(
    Object.entries(d.neutrals).map(([name, value]) => [name, toHex(neutralFor(rgbOf(value), lch, d))]),
  );
}

/**
 * The colour mixed into a selected row of data, which keeps its dimmer text: the fill itself, or the
 * fill darkened until secondary text holds 4.5:1 on the row, pointed at or not. Only a light fill moves.
 */
function rowTintOf(fill: Rgb, neutrals: Record<string, string | undefined>, d: PaletteDefaults): Rgb {
  const lch = toLch(fill);
  const under = rgbOf(neutrals['color-base-surface2'] ?? d.surface);
  const text = rgbOf(neutrals['color-base-text-secondary'] ?? d.textPrimary);
  const holds = (tint: Rgb) =>
    contrastRatio(text, mixLab(mixLab(under, tint, rowTint), [255, 255, 255], 0.08)) >= 4.6;
  let tint = fill;
  for (let y = luminance(fill); !holds(tint) && y > 0.01; y /= 1.05) tint = withLuminance(lch, y);
  return tint;
}

/** The focus ring: the default pink, or the text colour when the selected fill is too close to pink. */
function focusRing(fill: Rgb, d: PaletteDefaults): string {
  const [ring, text] = [rgbOf(d.focusRing), rgbOf(d.textPrimary)];
  if (distance(ring, fill) >= 0.2) return d.focusRing;
  return distance(text, fill) > distance(ring, fill) ? d.textPrimary : d.focusRing;
}

/**
 * Every token that follows the inputs, keyed by name without `--umbra-`. With no input the result is
 * empty: the default look is the token values themselves. An input that cannot be read is skipped.
 */
export function derivePalette(inputs: PaletteInputs, d: PaletteDefaults): Record<string, string> {
  const out: Record<string, string> = {};
  const given = inputs.brand ? parseColour(inputs.brand) : null;
  // The default brand is the default look: nothing is derived from it.
  const brand = given && toHex(given) !== toHex(rgbOf(d.brand)) ? given : null;
  const read = (colour: string | undefined) => (colour ? parseColour(colour) : null);

  // Context: the app's colour, else the default violet turned with the brand.
  const contextInput = read(inputs.context)
    ? inputs.context
    : brand
      ? toHex(fromLch(turned(toLch(brand), d.brand, d.context, [])))
      : undefined;
  if (contextInput) {
    const context = safeContext(contextInput, d);
    out['context'] = context;
    Object.assign(out, deriveNeutrals(context, d));
  }

  // Interaction: the app's colour, else the default violet turned with the brand.
  const interaction =
    read(inputs.interaction) ??
    (brand ? fromLch(turned(toLch(brand), d.brand, d.interaction, d.avoid)) : null);
  if (interaction) {
    const { fill, on } = safeFill(interaction, d);
    out['color-interaction'] = toHex(fill);
    out['color-on-interaction'] = toHex(on);
    // The text and thin-mark colour: the default one turned with the fill, as bright as the default.
    const text = turned(toLch(fill), d.interaction, d.interactionText, []);
    out['color-interaction-text'] = toHex(withLuminance(text, luminance(rgbOf(d.interactionText))));
    out['color-focus-ring'] = focusRing(fill, d);
    out['color-interaction-tint'] = toHex(rowTintOf(fill, { ...d.neutrals, ...out }, d));
  }

  // Action: the app's colour, else the default magenta turned with the brand. It keeps clear of no hue:
  // the default magenta is itself 13 degrees from the danger red, and a danger button is outlined.
  const action = read(inputs.action) ?? (brand ? fromLch(turned(toLch(brand), d.brand, d.action, [])) : null);
  if (action) {
    const { fill, on } = safeFill(action, d);
    out['color-action'] = toHex(fill);
    out['color-on-action'] = toHex(on);
    // The end of the gradient: turned as the default end is from the default start, if the text holds.
    const shifted = fromLch(turned(toLch(fill), d.action, d.actionEnd, []));
    const holds = [shifted, mixLab(shifted, black, d.pressMix)].every((c) => contrastRatio(on, c) >= 4.5);
    out['color-action-end'] = toHex(holds && contrastRatio(shifted, rgbOf(d.surface)) >= 3 ? shifted : fill);
  }
  return out;
}
