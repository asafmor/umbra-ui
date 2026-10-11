import type { CSSProperties, ReactNode } from 'react';
import { cx } from '../utils/parts';
import styles from './Kbd.module.css';

/** Internal: one key as a key cap. The one look of a drawn key, shared by the palette and the sheet. */
export function Kbd({
  className,
  style,
  children,
}: {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}) {
  return (
    <kbd data-part="key" className={cx(styles.cap, className)} style={style}>
      {children}
    </kbd>
  );
}
