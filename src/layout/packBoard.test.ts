import { describe, expect, it } from 'vitest';
import { packBoard } from './packBoard';

const one = (advance: number, column?: number) => ({ span: 1, advance, column });

describe('packBoard', () => {
  it('fills the first row left to right, then the shortest column, the leftmost of equals', () => {
    const { placed, end } = packBoard([one(30), one(10), one(20), one(5), one(5), one(5)], 3);
    expect(placed.map((p) => [p.column, p.top])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 10],
      [1, 15],
      [1, 20],
    ]);
    expect(end).toBe(30);
  });

  it('puts a spanning item under everything in its columns, and nothing above it there afterwards', () => {
    const { placed } = packBoard([one(30), one(10), one(20), { span: 2, advance: 10 }, one(5), one(5)], 3);
    // Columns 1 and 2 (tops 10 and 20) start higher than columns 0 and 1 (30 and 10).
    expect(placed[3]).toEqual({ column: 1, span: 2, top: 20 });
    // The room above it in column 1 stays empty: the next items go under what came before them.
    expect(placed[4]).toEqual({ column: 0, span: 1, top: 30 });
    expect(placed[5]).toEqual({ column: 1, span: 1, top: 30 });
  });

  it('cuts a span to the columns there are', () => {
    expect(packBoard([{ span: 5, advance: 10 }, one(10)], 2).placed).toEqual([
      { column: 0, span: 2, top: 0 },
      { column: 0, span: 1, top: 10 },
    ]);
  });

  it('keeps a given column while it fits, and packs again when it does not', () => {
    expect(packBoard([one(30, 1), one(10, 1), one(10, 0)], 2).placed.map((p) => [p.column, p.top])).toEqual([
      [1, 0],
      [1, 30],
      [0, 0],
    ]);
    expect(packBoard([one(30, 3), one(10, 3)], 2).placed.map((p) => p.column)).toEqual([0, 1]);
  });

  it('places any number of items: the end is the tallest column', () => {
    const { placed, end } = packBoard(
      Array.from({ length: 5000 }, (_, i) => one(40 + (i % 7) * 10)),
      4,
    );
    expect(placed).toHaveLength(5000);
    expect(end).toBeGreaterThan(80_000);
    expect(end).toBe(Math.max(...placed.map((p, i) => p.top + 40 + (i % 7) * 10)));
  });
});
