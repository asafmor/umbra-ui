import { describe, expect, it } from 'vitest';
import { addStop, boundsOf, moveStop, normalizeStops, removeStop, snap } from './colorScale';

const scale = { min: 0, max: 20, step: 1 };
const stops = [
  { from: 0, tone: 'ramp-1' as const },
  { from: 7, tone: 'ramp-3' as const },
  { from: 15, tone: 'ramp-5' as const },
];
const froms = (list: readonly { from: number }[]) => list.map((stop) => stop.from);

describe('colorScale', () => {
  it('snaps to the step, counted from the bottom of the scale', () => {
    expect(snap(7.4, scale)).toBe(7);
    expect(snap(0.26, { min: 0, max: 1, step: 0.05 })).toBe(0.25);
    expect(snap(4, { min: 1, max: 9, step: 2 })).toBe(5);
  });

  it('holds a moved stop one step clear of its neighbours', () => {
    expect(boundsOf(stops, 1, scale)).toEqual([1, 14]);
    expect(boundsOf(stops, 2, scale)).toEqual([8, 20]);
    expect(froms(moveStop(stops, 1, 30, scale))).toEqual([0, 14, 15]);
    expect(froms(moveStop(stops, 1, -5, scale))).toEqual([0, 1, 15]);
    expect(froms(moveStop(stops, 2, 99, scale))).toEqual([0, 7, 20]);
    // The first stop is the bottom of the scale.
    expect(froms(moveStop(stops, 0, 5, scale))).toEqual([0, 7, 15]);
  });

  it('normalises any list: sorted, the first at the bottom, ascending by at least a step', () => {
    const messy = [{ from: 9 }, { from: 3 }, { from: 9 }, { from: 40 }];
    expect(froms(normalizeStops(messy, scale))).toEqual([0, 9, 10, 20]);
    expect(normalizeStops(stops, scale)).toEqual(stops);
  });

  it('adds a stop in the middle of the widest band, in an unused tone', () => {
    const added = addStop(stops, scale)!;
    expect(froms(added.stops)).toEqual([0, 7, 11, 15]);
    expect(added.index).toBe(2);
    expect(added.stops[2]!.tone).toBe('ramp-2');
    // No room: every band is one step wide.
    const full = [{ from: 0 }, { from: 1 }, { from: 2 }];
    expect(addStop(full, { min: 0, max: 2, step: 1 })).toBeNull();
  });

  it('removes a stop; the next one becomes the bottom when the first goes', () => {
    expect(froms(removeStop(stops, 1, scale))).toEqual([0, 15]);
    const rest = removeStop(stops, 0, scale);
    expect(froms(rest)).toEqual([0, 15]);
    expect(rest[0]!.tone).toBe('ramp-3');
  });
});
