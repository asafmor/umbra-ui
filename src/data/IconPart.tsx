import type { CSSProperties, ReactNode } from 'react';
import iconStyles from '../provider/icons.module.css';
import { cx } from '../utils/parts';

export interface IconPartProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Internal: the icon block of a data component. It is `IconSlot` (the icon's box, hidden from assistive
 * technology) that also takes `className` and `style`, as every block does.
 */
export function IconPart({ part = 'icon', className, style, children }: IconPartProps & { part?: string }) {
  return (
    <span data-part={part} aria-hidden="true" className={cx(iconStyles.icon, className)} style={style}>
      {children}
    </span>
  );
}
