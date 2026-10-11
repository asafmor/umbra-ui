import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../utils/parts';
import styles from './layout.module.css';
import { useSlot, type SlotProps as SlotLayoutProps } from './useSlot';

export interface SlotProps extends SlotLayoutProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/**
 * Gives `size`, `priority`, `minWidth`, `minHeight` and `label` to content that is not an umbra-ui
 * component. The content fills the slot.
 */
export function Slot({ className, style, children, ...slot }: SlotProps) {
  const { ref, props } = useSlot<HTMLDivElement>(slot);
  return (
    <div
      {...props}
      ref={ref}
      data-umbra="slot"
      className={cx(styles.slot, styles.fill, className)}
      style={{ ...props.style, ...style }}
    >
      {children}
    </div>
  );
}
