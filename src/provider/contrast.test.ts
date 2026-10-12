import { describe, expect, it, test } from 'vitest';
import { contrastRatio, focusColourOn, insetOn, mutedTextOn, parseColour, textColourOn } from './contrast';

test('parses hex and rgb colours', () => {
  expect(parseColour('#fff')).toEqual([255, 255, 255]);
  expect(parseColour('#2a2f8f')).toEqual([42, 47, 143]);
  expect(parseColour('rgb(10, 20, 30)')).toEqual([10, 20, 30]);
  expect(parseColour('rgb(10 20 30 / 50%)')).toEqual([10, 20, 30]);
  expect(parseColour('rebeccapurple')).toBeNull();
});

test('picks white on a dark brand and near-black on a light one', () => {
  expect(textColourOn('#2a2f8f')).toMatchObject({ colour: '#ffffff' });
  expect(textColourOn('#e8e4f0')).toMatchObject({ colour: '#0b0612' });
  expect(textColourOn('#2a2f8f')!.ratio).toBeGreaterThan(4.5);
});

test('a mid-tone colour gets the better of the two, below 4.5:1', () => {
  const result = textColourOn('#808080')!;
  expect(result.colour).toBe('#0b0612');
  expect(result.ratio).toBeGreaterThan(4.5); // near-black still passes on mid grey
  expect(textColourOn('#6b6bd6')!.ratio).toBeLessThan(4.5);
});

describe('colours derived from the brand', () => {
  it('dims resting text as far as 4.5:1 allows', () => {
    for (const brand of ['#2a2f8f', '#0f766e', '#e8e4f0', '#2b2f36', '#777777']) {
      const on = textColourOn(brand)!.colour;
      const muted = mutedTextOn(brand, on)!;
      const ratio = contrastRatio(parseColour(muted)!, parseColour(brand)!);
      expect(ratio >= 4.5 || muted === on).toBe(true);
    }
    // A dark brand has room for the full dimming; a mid-tone one gets less.
    expect(mutedTextOn('#2b2f36', '#ffffff')).not.toBe(mutedTextOn('#0f766e', '#ffffff'));
  });

  it('replaces the focus ring where it would not show', () => {
    expect(focusColourOn('#2a2f8f', '#ffb3f5', '#ffffff')).toBe('#ffb3f5');
    expect(focusColourOn('#e8e4f0', '#ffb3f5', '#0b0612')).toBe('#0b0612');
  });
});

describe('insetOn', () => {
  const ratio = (a: string, b: string) => contrastRatio(parseColour(a)!, parseColour(b)!);

  it('is a step away from the bar on every brand, and never costs the text its contrast', () => {
    for (const brand of [
      '#2a2f8f',
      '#1d4ed8',
      '#22262e',
      '#e8e4f0',
      '#0f766e',
      '#777777',
      '#000000',
      '#ffffff',
    ]) {
      const on = textColourOn(brand)!.colour;
      const inset = insetOn(brand, on)!;
      expect(inset).not.toBe(brand);
      expect(ratio(inset, on) >= Math.min(4.5, ratio(brand, on))).toBe(true);
    }
  });

  it('goes towards the text where there is room, and away from it where there is not', () => {
    // Lighter on a dark bar, darker on a light one.
    expect(ratio(insetOn('#22262e', '#ffffff')!, '#ffffff')).toBeLessThan(ratio('#22262e', '#ffffff'));
    expect(ratio(insetOn('#e8e4f0', '#0b0612')!, '#0b0612')).toBeLessThan(ratio('#e8e4f0', '#0b0612'));
    // A mid-tone bar has no contrast to give: the surface adds some.
    expect(ratio(insetOn('#777777', '#0b0612')!, '#0b0612')).toBeGreaterThan(ratio('#777777', '#0b0612'));
  });

  it('is null for a colour it cannot read', () => {
    expect(insetOn('rebeccapurple', '#fff')).toBeNull();
  });
});
