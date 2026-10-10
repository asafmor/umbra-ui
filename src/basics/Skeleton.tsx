import type { CSSProperties } from 'react';
import { cx } from '../utils/parts';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  /** `text` for lines of text, `block` for any rectangle, `circle` for avatars and icons. */
  shape?: 'text' | 'block' | 'circle';
  /** Number of lines, for `text`. The last line is shorter. */
  lines?: number;
  /** Defaults to the width of the slot. */
  width?: number | string;
  /** Defaults to the height of the slot (`block`) or of the text (`text`). */
  height?: number | string;
  /** `none` is forced when reduced motion is on. */
  animation?: 'pulse' | 'none';
  className?: string;
  style?: CSSProperties;
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
}: SkeletonProps) {
  return (
    <div
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
