import type { CSSProperties } from 'react';
import { textColourOn } from '../provider/contrast';

/** The colour meanings shared by the data indicators. `accent` is the fixed violet. */
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

const toneColours: Record<Tone, string> = {
  neutral: 'var(--umbra-color-base-text-muted)',
  info: 'var(--umbra-color-semantic-info)',
  success: 'var(--umbra-color-semantic-success)',
  warning: 'var(--umbra-color-semantic-warning)',
  danger: 'var(--umbra-color-semantic-danger)',
  accent: 'var(--umbra-color-interaction)',
};

/** A tone name becomes its token; anything else is taken as a CSS colour. */
export const toneColour = (value: string) => toneColours[value as Tone] ?? value;

/**
 * Internal: the attributes that give an element its tone (with the `tone` class of shared.module.css).
 * A custom colour replaces the tone, and the text colour on it is chosen for contrast.
 */
export function toneProps(tone: Tone, color: string | undefined, style?: CSSProperties) {
  if (!color) return { 'data-tone': tone, style };
  const custom = { '--tone': color, '--on-tone': textColourOn(color)?.colour, ...style };
  return { 'data-tone': 'custom', style: custom as CSSProperties };
}
