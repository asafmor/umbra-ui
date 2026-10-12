import { describe, expect, it, test } from 'vitest';
import { contextPresets, paletteDefaults as d } from '../styles/tokens.generated';
import { contrastRatio, luminance, parseColour, type Rgb } from './contrast';
import { derivePalette, deriveNeutrals, distance, fromLch, mixLab, safeContext, toLch } from './palette';

const rgb = (colour: string) => parseColour(colour)!;
const ratio = (a: string, b: string) => contrastRatio(rgb(a), rgb(b));

/** Hues around the wheel, very dark, very light, grey, low and high chroma. */
export const matrix = [
  '#2a2f8f', // the default brand
  '#e11d2e', // red
  '#ff5a1f', // orange-red
  '#e8730c', // orange
  '#f5c400', // yellow
  '#b8d400', // lime
  '#3fae2a', // green
  '#16b877', // the success green
  '#0a7a55', // dark green
  '#00a3a3', // teal
  '#00c2d1', // cyan
  '#0b84ff', // azure
  '#0b5fff', // blue
  '#4b3bff', // indigo
  '#6a1fd6', // the default violet
  '#a020f0', // purple
  '#ff4fd8', // pink
  '#db1065', // the default magenta
  '#f0455a', // the danger red
  '#000000',
  '#0a0a0c', // very dark
  '#1a2b3c', // dark, low chroma
  '#808080', // grey
  '#8a8f98', // grey with a little hue
  '#c7b8a4', // light, low chroma
  '#f2f2f2', // very light
  '#ffffff',
  '#ffb3f5', // the focus pink itself
  '#00ff00', // the most luminous primary
  '#0000ff', // the least
];

const surface = d.surface;
const black: Rgb = [0, 0, 0];

function expectFill(fill: string, on: string, end = fill) {
  expect(ratio(fill, surface)).toBeGreaterThanOrEqual(3);
  for (const colour of [fill, end]) {
    expect(ratio(on, colour)).toBeGreaterThanOrEqual(4.5);
    // Hover and press darken the fill (12%, 18%, 26% black in OKLab): the text holds on each.
    for (const step of [0.12, 0.18, d.pressMix]) {
      expect(contrastRatio(rgb(on), mixLab(rgb(colour), black, step))).toBeGreaterThanOrEqual(4.5);
    }
  }
}

test('no input derives nothing: the default look is the token values', () => {
  expect(derivePalette({}, d)).toEqual({});
});

test('an input that cannot be read is skipped', () => {
  expect(derivePalette({ interaction: 'rebeccapurple', action: 'hsl(1 2% 3%)', context: 'red' }, d)).toEqual(
    {},
  );
});

test('the default brand gives the default hues back', () => {
  const p = derivePalette({ brand: d.brand }, d);
  // Lighter only by what 3:1 against the surface asks (the default violet has 2.65:1).
  expect(distance(rgb(p['color-interaction']!), rgb(d.interaction))).toBeLessThan(0.05);
  expect(distance(rgb(p['color-action']!), rgb(d.action))).toBeLessThan(0.03);
  expect(distance(rgb(p['color-interaction-text']!), rgb(d.interactionText))).toBeLessThan(0.03);
  expect(p['color-focus-ring']).toBe(d.focusRing);
});

describe.each(matrix)('brand %s', (brand) => {
  const p = derivePalette({ brand }, d);

  it('derives every role', () => {
    expect(Object.keys(p).sort()).toEqual(
      [
        'context',
        ...Object.keys(d.neutrals),
        'color-interaction',
        'color-on-interaction',
        'color-interaction-text',
        'color-focus-ring',
        'color-interaction-tint',
        'color-action',
        'color-on-action',
        'color-action-end',
      ].sort(),
    );
  });

  it('keeps text on the selected fill and on the primary action, at rest, hovered and pressed', () => {
    expectFill(p['color-interaction']!, p['color-on-interaction']!);
    expectFill(p['color-action']!, p['color-on-action']!, p['color-action-end']!);
  });

  it('keeps interaction text readable on every surface it is drawn on', () => {
    for (const name of ['color-base-surface1', 'color-base-surface2', 'color-base-surface3']) {
      expect(ratio(p['color-interaction-text']!, p[name]!)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps dimmer text readable on a selected row of data, pointed at or not', () => {
    const row = mixLab(rgb(p['color-base-surface2']!), rgb(p['color-interaction-tint']!), 0.32);
    for (const under of [row, mixLab(row, [255, 255, 255], 0.08)]) {
      expect(contrastRatio(rgb(p['color-base-text-secondary']!), under)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the focus ring visible and apart from the selected fill', () => {
    const ring = p['color-focus-ring']!;
    for (const name of ['color-base-surface1', 'color-base-surface2', 'color-base-surface3']) {
      expect(ratio(ring, p[name]!)).toBeGreaterThanOrEqual(3);
    }
    expect(distance(rgb(ring), rgb(p['color-interaction']!))).toBeGreaterThanOrEqual(0.1);
  });

  it('keeps the derived selected fill off the hues of success and danger', () => {
    for (const name of ['color-interaction']) {
      const lch = toLch(rgb(p[name]!));
      if (lch.c < 0.04) continue; // a grey reads as neither
      for (const semantic of d.avoid) {
        const gap = Math.abs(((lch.h - toLch(rgb(semantic)).h + 540) % 360) - 180);
        // The hue is set before the lightness; bringing the colour into sRGB moves it a few degrees.
        expect(gap).toBeGreaterThanOrEqual(15);
      }
    }
  });
});

describe.each(matrix)('interaction and action %s, as the app gives them', (colour) => {
  const p = derivePalette({ interaction: colour, action: colour }, d);

  it('holds the same guarantees', () => {
    expectFill(p['color-interaction']!, p['color-on-interaction']!);
    expectFill(p['color-action']!, p['color-on-action']!, p['color-action-end']!);
    expect(ratio(p['color-interaction-text']!, d.neutrals['color-base-surface3'])).toBeGreaterThanOrEqual(
      4.5,
    );
    expect(ratio(p['color-focus-ring']!, surface)).toBeGreaterThanOrEqual(3);
    expect(distance(rgb(p['color-focus-ring']!), rgb(p['color-interaction']!))).toBeGreaterThanOrEqual(0.1);
  });

  it('keeps dimmer text readable on a selected row of data', () => {
    const row = mixLab(rgb(d.neutrals['color-base-surface2']), rgb(p['color-interaction-tint']!), 0.32);
    expect(
      contrastRatio(rgb(d.neutrals['color-base-text-secondary']), mixLab(row, [255, 255, 255], 0.08)),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the hue the app asked for', () => {
    const [asked, got] = [toLch(rgb(colour)), toLch(rgb(p['color-interaction']!))];
    if (asked.c < 0.04 || got.c < 0.04) return;
    expect(Math.abs(((asked.h - got.h + 540) % 360) - 180)).toBeLessThan(12);
  });

  it('does not touch the context', () => {
    expect(p['context']).toBeUndefined();
    expect(p['color-base-surface1']).toBeUndefined();
  });
});

test('a fill that already holds is used as it is', () => {
  for (const colour of ['#8a3ff0', '#fda400', '#f2f2f2']) {
    expect(derivePalette({ interaction: colour }, d)['color-interaction']).toBe(colour);
  }
});

test('a dark fill is its own row tint; a light one is darkened for it', () => {
  expect(derivePalette({ interaction: '#8a3ff0' }, d)['color-interaction-tint']).toBe('#8a3ff0');
  const light = derivePalette({ interaction: '#f5c400' }, d);
  expect(luminance(rgb(light['color-interaction-tint']!))).toBeLessThan(
    luminance(rgb(light['color-interaction']!)),
  );
});

test('the focus ring leaves pink when the selected fill is pink', () => {
  expect(derivePalette({ interaction: '#ffb3f5' }, d)['color-focus-ring']).toBe(d.textPrimary);
  expect(derivePalette({ interaction: '#6a1fd6' }, d)['color-focus-ring']).toBe(d.focusRing);
});

describe.each(matrix)('context %s', (colour) => {
  const context = safeContext(colour, d);
  const neutrals = deriveNeutrals(context, d);

  it('gives every neutral the luminance it had, so no contrast between them changes', () => {
    for (const [name, value] of Object.entries(d.neutrals)) {
      const [before, after] = [luminance(rgb(value)), luminance(rgb(neutrals[name]!))];
      expect((Math.max(before, after) + 0.05) / (Math.min(before, after) + 0.05)).toBeLessThan(1.03);
    }
  });

  it('keeps text readable on the bright end of the page background, for a card with no surface', () => {
    const end = mixLab(rgb(d.pageBase), rgb(context), d.pageMix);
    for (const name of ['color-base-text-secondary', 'color-base-text-muted']) {
      expect(contrastRatio(rgb(neutrals[name]!), end)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrastRatio(rgb(d.textPrimary), end)).toBeGreaterThanOrEqual(7);
  });

  it('is bright enough to show', () => {
    if (toLch(rgb(colour)).c > 0.04) expect(toLch(rgb(context)).l).toBeGreaterThan(0.44);
  });
});

test('the presets pass as they are written', () => {
  expect(contextPresets).toEqual(['violet', 'teal', 'green', 'slate']);
  for (const preset of ['#7a2be0', '#1f8f7f', '#1f9a5b', '#5a6670'])
    expect(safeContext(preset, d)).toBe(preset);
});

test('the violet context gives the neutrals back', () => {
  expect(deriveNeutrals(d.context, d)).toEqual(d.neutrals);
});

test('a colour out of sRGB comes back in, with its hue', () => {
  const out = fromLch({ l: 0.7, c: 0.4, h: 150 });
  expect(out.every((v) => v >= 0 && v <= 255)).toBe(true);
  expect(Math.abs(toLch(out).h - 150)).toBeLessThan(4);
});
