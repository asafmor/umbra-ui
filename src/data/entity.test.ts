import { expect, test } from 'vitest';
import { contrastRatio, parseColour } from '../provider/contrast';
import { colourOf, initialsOf } from './entity';

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
