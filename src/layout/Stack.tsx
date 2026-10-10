import type { CSSProperties, ReactNode } from 'react';
import type { spaces } from '../styles/tokens.generated';
import { cx } from '../utils/parts';
import styles from './layout.module.css';
import { LayoutProvider, useLayoutParent, useSlot, type SlotProps } from './useSlot';

/** A step of the spacing scale (`--umbra-space-<n>`). */
export type SpaceToken = (typeof spaces)[number];

export const gapStyle = (gap: SpaceToken | undefined): CSSProperties | undefined =>
  gap === undefined ? undefined : { gap: `var(--umbra-space-${gap})` };

export interface StackProps extends SlotProps {
  /** Overrides the gap, which otherwise follows the density level. */
  gap?: SpaceToken;
  /** `collapse` shrinks the lowest-priority cards to their headers when they cannot all fit. */
  overflow?: 'collapse' | 'keep';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Shares its height among its children. */
export function Stack({ gap, overflow = 'collapse', className, style, children, ...slot }: StackProps) {
  const { ref, props } = useSlot<HTMLDivElement>(slot);
  const layout = useLayoutParent(ref, { collapse: overflow === 'collapse' });
  return (
    <LayoutProvider value={layout.value}>
      <div
        {...props}
        ref={ref}
        data-umbra="stack"
        className={cx(styles.slot, styles.stack, className)}
        style={{ ...props.style, ...gapStyle(gap), ...style }}
      >
        {children}
      </div>
    </LayoutProvider>
  );
}
