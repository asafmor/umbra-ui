import type { CSSProperties } from 'react';
import { cx } from '../utils/parts';
import styles from './Skeleton.module.css';
import { passThrough, type RootAttributes } from '../utils/passThrough';

export interface SkeletonProps extends RootAttributes {
  /** `text` for lines of text, `block` for any rectangle, `circle` for avatars and icons. */
  shape?: 'text' | 'block' | 'circle' | undefined;
  /** Number of lines, for `text`. The last line is shorter. */
  lines?: number | undefined;
  /** Defaults to the width of the slot. */
  width?: number | string | undefined;
  /** Defaults to the height of the slot (`block`) or of the text (`text`). */
  height?: number | string | undefined;
  /** `none` is forced when reduced motion is on. */
  animation?: 'pulse' | 'none' | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** A grey placeholder in the shape of content that is still loading. Hidden from assistive technology. */
export function Skeleton({
  shape = 'text',
  lines = 1,
  width,
  height,
  animation = 'pulse',
  className,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      {...passThrough(rest)}
      aria-hidden="true"
      data-umbra="skeleton"
      data-shape={shape}
      data-animation={animation}
      className={cx(styles.skeleton, className)}
      style={{ width, height, ...style }}
    >
      {shape === 'text' && Array.from({ length: lines }, (_, i) => <span key={i} className={styles.line} />)}
    </div>
  );
}
