import { describe, expect, it, vi } from 'vitest';
import { distinctIds } from './distinctIds';

describe('distinctIds', () => {
  it('keeps an id the first time, gives a repeat a key of its own, and turns it back', () => {
    const warned = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ids = distinctIds('Menu');
    const key = ids.scope();
    const keys = ['a', 'a', 'b', 'a'].map(key);
    expect(new Set(keys).size).toBe(4);
    expect(keys[0]).toBe('a');
    expect(keys[2]).toBe('b');
    expect(keys.map(ids.idOf)).toEqual(['a', 'a', 'b', 'a']);
    // One warning per id, not per repeat.
    expect(warned).toHaveBeenCalledTimes(1);
    expect(warned.mock.calls[0]![0]).toContain('Menu: the id "a"');
    // Another list starts again: the same id in a submenu is not a repeat.
    expect(ids.scope()('a')).toBe('a');
    warned.mockRestore();
  });
});
