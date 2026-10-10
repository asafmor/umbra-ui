import { expect, test } from 'vitest';
import { parseColour, textColourOn } from './contrast';

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
