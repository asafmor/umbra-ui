import type { CSSProperties, ReactNode } from 'react';
import iconStyles from '../provider/icons.module.css';
import { cx } from '../utils/parts';

export interface IconPartProps {
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children?: ReactNode | undefined;
}

/**
 * Internal: the icon block of a data component. It is `IconSlot` (the icon's box, hidden from assistive
 * technology) that also takes `className` and `style`, as every block does.
 */
export function IconPart({
  part = 'icon',
  className,
  style,
  children,
}: IconPartProps & { part?: string | undefined }) {
  return (
    <span data-part={part} aria-hidden="true" className={cx(iconStyles.icon, className)} style={style}>
      {children}
    </span>
  );
}
