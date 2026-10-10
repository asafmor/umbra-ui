import { expect, test } from 'vitest';
import { contrastRatio, parseColour } from '../provider/contrast';
import { colourOf, hueOf, initialsOf } from './entity';

test('initials are the first letters of the first and last words', () => {
  expect(initialsOf('Person A')).toBe('PA');
  expect(initialsOf('  north west region ')).toBe('NR');
  expect(initialsOf('Orders')).toBe('O');
  expect(initialsOf('Person A', 1)).toBe('P');
  expect(initialsOf('')).toBe('');
});

test('a name always gives the same colour, and white text on it keeps 4.5:1', () => {
  expect(colourOf('Region 2')).toBe(colourOf(' region 2 '));
  const white = parseColour('#ffffff')!;
  const colours = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const colour = colourOf(`Item ${i} ${String.fromCharCode(65 + (i % 26))}`);
    colours.add(colour);
    expect(colour).toMatch(/^#[0-9a-f]{6}$/);
    expect(contrastRatio(parseColour(colour)!, white)).toBeGreaterThanOrEqual(4.5);
  }
  expect(colours.size).toBeGreaterThan(50);
});

test('names that differ only in their last character spread over the hue range', () => {
  const hues = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((letter) => hueOf(`Client ${letter}`));
  expect(hueOf('Client A')).toBe(hueOf(' client a '));
  // Twelve 30-degree sectors: 26 well-spread names leave at most a few empty.
  expect(new Set(hues.map((hue) => Math.floor(hue / 30))).size).toBeGreaterThanOrEqual(9);
  const sorted = [...hues].sort((a, b) => a - b);
  const gaps = sorted.map((hue, i) => (i ? hue - sorted[i - 1]! : hue + 360 - sorted.at(-1)!));
  expect(Math.max(...gaps)).toBeLessThan(90);
  // Neighbours in the alphabet are not neighbours in colour.
  const turn = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  expect(hues.slice(1).filter((hue, i) => turn(hue, hues[i]!) < 15).length).toBeLessThanOrEqual(5);
});
