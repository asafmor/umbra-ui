type Rgb = [number, number, number];

// ponytail: reads hex and rgb() only. Other colour syntaxes (named, hsl, oklch) fall back to white text
// with a development warning; resolve them through the DOM if apps need them.
export function parseColour(colour: string): Rgb | null {
  const c = colour.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c)?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map((h) => h + h).join('') : hex;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(c);
  return rgb ? (rgb.slice(1, 4).map(Number) as Rgb) : null;
}

function luminance(rgb: Rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function contrastRatio(a: Rgb, b: Rgb) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const light = '#ffffff';
const dark = '#0b0612';

/** The text colour (white or near-black) with the higher contrast on `background`, and that contrast. */
export function textColourOn(background: string): { colour: string; ratio: number } | null {
  const bg = parseColour(background);
  if (!bg) return null;
  const onLight = contrastRatio(bg, parseColour(light)!);
  const onDark = contrastRatio(bg, parseColour(dark)!);
  return onLight >= onDark ? { colour: light, ratio: onLight } : { colour: dark, ratio: onDark };
}
