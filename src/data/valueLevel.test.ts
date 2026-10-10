import { expect, test } from 'vitest';
import tokens from '../../plan/tokens.json';
import { contrastRatio, parseColour } from '../provider/contrast';
import { valueLevel } from './valueLevel';

test('without thresholds the scale is split into five equal bands', () => {
  expect([0, 19, 20, 50, 80, 100].map((v) => valueLevel(v))).toEqual([1, 1, 2, 3, 5, 5]);
  expect(valueLevel(15, { min: 1, max: 20 })).toBe(4);
});

test('values outside the scale take the end bands', () => {
  expect(valueLevel(-5)).toBe(1);
  expect(valueLevel(140)).toBe(5);
});

test('a value at a threshold belongs to the band above it', () => {
  const thresholds = [6, 6.5, 7, 8];
  expect([5.9, 6, 6.7, 7, 9].map((v) => valueLevel(v, { thresholds }))).toEqual([1, 2, 3, 4, 5]);
});

test('fewer thresholds spread over the whole ramp', () => {
  expect([6.9, 7].map((v) => valueLevel(v, { thresholds: [7] }))).toEqual([1, 5]);
  expect([1, 5, 9].map((v) => valueLevel(v, { thresholds: [4, 8] }))).toEqual([1, 3, 5]);
});

test('lower-is-better reverses the ramp', () => {
  expect(valueLevel(10, { ramp: 'lower-is-better' })).toBe(5);
  expect(valueLevel(9, { thresholds: [4, 8], ramp: 'lower-is-better' })).toBe(1);
});

test('no value has no level', () => {
  expect([null, undefined, NaN].map((v) => valueLevel(v))).toEqual([null, null, null]);
});

test('the pill text has 4.5:1 on every ramp step', () => {
  const text = parseColour(tokens.color.base.surface1)!;
  for (const step of ['1', '2', '3', '4', '5'] as const) {
    const fill = parseColour(tokens.color.valueRamp[step])!;
    expect(contrastRatio(text, fill), `ramp step ${step}`).toBeGreaterThanOrEqual(4.5);
  }
});
