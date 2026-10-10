import { describe, expect, it, test } from 'vitest';
import { contrastRatio, focusColourOn, mutedTextOn, parseColour, textColourOn } from './contrast';

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
