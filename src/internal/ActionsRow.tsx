import { useRef, type CSSProperties, type ReactNode } from 'react';
import { cx } from '../utils/parts';
import { ActionsOverflow, wrapsKept } from './ActionsOverflow';
import styles from './ActionsRow.module.css';
import { useShrinkLevel } from './useShrinkLevel';

/**
 * Internal: a row of the app's controls that measures itself. It gives way last among its siblings
 * (they shrink first), and when its controls still do not fit they move into one "more" menu
 * (`ActionsOverflow`), as the actions of a card header do. For a host that has no row of its own to
 * measure: the footer of a `MediaCard`, the toolbar of a `Planner`.
 */
export function ActionsRow({
  moreLabel,
  size,
  className,
  style,
  children,
}: {
  moreLabel: string;
  size?: 'default' | 'small' | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shrunk = useShrinkLevel(ref, 1) === 1;
  return (
    <div
      ref={ref}
      data-part="actions"
      data-shrunk={shrunk || undefined}
      className={cx(styles.row, wrapsKept, className)}
      style={style}
    >
      <ActionsOverflow shrunk={shrunk} label={moreLabel} size={size}>
        {children}
      </ActionsOverflow>
    </div>
  );
}
