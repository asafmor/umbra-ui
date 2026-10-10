import { expect, test } from 'vitest';
import { toAriaPlacement } from './shared';

test('placement: centre is the bare side; beside the anchor, start and end become top and bottom', () => {
  expect(toAriaPlacement('bottom')).toBe('bottom');
  expect(toAriaPlacement('top center')).toBe('top');
  expect(toAriaPlacement('bottom start')).toBe('bottom start');
  expect(toAriaPlacement('top end')).toBe('top end');
  expect(toAriaPlacement('start start')).toBe('start top');
  expect(toAriaPlacement('end end')).toBe('end bottom');
  expect(toAriaPlacement('end center')).toBe('end');
});
