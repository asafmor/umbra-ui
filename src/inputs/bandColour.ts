import { toneColour } from '../data/tone';
import type { Threshold } from '../utils/thresholds';

/**
 * Internal: the CSS colour of a threshold band, as the meters paint it: its free `color`, else its
 * tone (a step of the value ramp, or a tone; `neutral` is the text colour). `undefined` without either.
 */
export function bandColour({ tone, color }: Pick<Threshold, 'tone' | 'color'>) {
  if (color) return color;
  if (!tone) return undefined;
  if (tone.startsWith('ramp-')) return `var(--umbra-color-value-${tone})`;
  return tone === 'neutral' ? 'var(--umbra-color-base-text-primary)' : toneColour(tone);
}
