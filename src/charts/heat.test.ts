import { describe, expect, it } from 'vitest';
import { binPoints, stepIndex, stepShare, stepSize } from './internal/heat';

describe('binPoints', () => {
  it('counts points per cell, with the highest y in the first row', () => {
    const grid = binPoints(
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 9, y: 9 },
        { x: 9.5, y: 0.5 },
      ],
      { bins: 2, xDomain: [0, 10], yDomain: [0, 10] },
    );
    expect(grid.xEdges).toEqual([0, 5, 10]);
    expect(grid.yEdges).toEqual([0, 5, 10]);
    expect(grid.values).toEqual([
      [null, 1],
      [2, 1],
    ]);
  });

  it('sums `value`, takes columns and rows apart, and puts the upper edge in the last cell', () => {
    const grid = binPoints(
      [
        { x: 10, y: 4, value: 3 },
        { x: 10, y: 4, value: 2 },
        { x: 0, y: 0, value: 7 },
      ],
      { bins: [4, 1], xDomain: [0, 10], yDomain: [0, 4] },
    );
    expect(grid.values).toEqual([[7, null, null, 5]]);
  });

  it('leaves out points outside the domains, and finds the domains itself', () => {
    expect(binPoints([{ x: -1, y: 5 }], { bins: 1, xDomain: [0, 10], yDomain: [0, 10] }).values).toEqual([
      [null],
    ]);
    const grid = binPoints(
      [
        { x: 2, y: 10 },
        { x: 6, y: 30 },
      ],
      { bins: 2 },
    );
    expect(grid.xEdges).toEqual([2, 4, 6]);
    expect(grid.yEdges).toEqual([10, 20, 30]);
    expect(grid.values).toEqual([
      [null, 1],
      [1, null],
    ]);
  });

  it('survives no points and a single position', () => {
    expect(binPoints([], { bins: 2 }).values).toEqual([
      [null, null],
      [null, null],
    ]);
    expect(binPoints([{ x: 3, y: 3 }], { bins: 1 }).values).toEqual([[1]]);
  });
});

describe('the colour scale', () => {
  it('cuts a domain into equal steps and clamps values outside it', () => {
    const at = (v: number) => stepIndex(v, [0, 50], 5);
    expect([0, 9.9, 10, 25, 49, 50, 80, -5].map(at)).toEqual([0, 0, 1, 2, 4, 4, 4, 0]);
    expect(stepIndex(3, [3, 3], 5)).toBe(4);
  });

  it('spreads colour and size over the steps, strongest last', () => {
    expect([0, 1, 2, 3, 4].map((i) => stepShare(i, 5))).toEqual([15, 36, 58, 79, 100]);
    expect(stepShare(0, 1)).toBe(100);
    expect(stepSize(0, 5)).toBeCloseTo(0.45);
    expect(stepSize(4, 5)).toBe(1);
    expect(stepSize(0, 1)).toBe(1);
  });
});
