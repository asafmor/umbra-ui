import { createElement, useRef, type CSSProperties, type ReactNode } from 'react';
import { ButtonBase } from '../basics/Button';
import { useShrinkLevel } from '../internal/useShrinkLevel';
import { ActionsOverflow } from '../overlays/Menu';
import { Icon } from '../provider/icons';
import type { LinkRenderProps } from '../utils/link';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './SectionTitle.module.css';

export interface SectionTitleProps {
  /** The title. */
  children?: ReactNode | undefined;
  /** `link` is chosen automatically when `href` or `onOpen` is set. */
  variant?: 'heading' | 'link' | 'rule' | undefined;
  /** Heading level. */
  headingLevel?: 2 | 3 | 4 | 5 | 6 | undefined;
  /** Makes the title a link to a fuller view of the section. */
  href?: string | undefined;
  /** Plugs in the app's router link for `href`. Defaults to a plain `<a>`. */
  renderLink?: ((props: LinkRenderProps) => ReactNode) | undefined;
  onOpen?: (() => void) | undefined;
  /** A number shown after the title. */
  count?: number | undefined;
  /** Trailing controls. They move into an overflow menu when they do not fit. */
  actions?: ReactNode | undefined;
  /** Accessible name of the overflow menu button. */
  moreLabel?: string | undefined;
  /** Replace or hide named pieces. */
  parts?:
    | {
        title?: Part<{ children: ReactNode }> | undefined;
        count?: Part<{ children: number }> | undefined;
        actions?: Part<{ children: ReactNode }> | undefined;
      }
    | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

/** Internal: the "more" button used by overflow menus in headers. */
export function MoreButton({ label }: { label: string }) {
  return (
    <ButtonBase umbra="icon-button" variant="ghost" iconOnly label={label}>
      <Icon name="more" />
    </ButtonBase>
  );
}

/** A heading for one section of content inside a card or page, with optional controls on the same line. */
export function SectionTitle({
  children,
  variant,
  headingLevel = 3,
  href,
  renderLink = (props) => <a {...props} />,
  onOpen,
  count,
  actions,
  moreLabel = 'More actions',
  parts,
  className,
  style,
}: SectionTitleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shrunk = useShrinkLevel(ref, actions ? 1 : 0) === 1;
  const look = variant ?? (href || onOpen ? 'link' : 'heading');
  const text = href ? (
    renderLink({ href, className: styles.link, children })
  ) : onOpen ? (
    <button type="button" className={styles.link} onClick={onOpen}>
      {children}
    </button>
  ) : (
    children
  );
  return (
    <div
      ref={ref}
      data-umbra="section-title"
      data-variant={look}
      data-shrunk={shrunk || !actions || undefined}
      className={cx(styles.root, className)}
      style={style}
    >
      {renderPart(parts?.title, { children: text }, (p) =>
        createElement(`h${headingLevel}`, { 'data-part': 'title', className: styles.title }, p.children),
      )}
      {count !== undefined &&
        renderPart(parts?.count, { children: count }, (p) => (
          <span data-part="count" className={styles.count}>
            {p.children}
          </span>
        ))}
      {actions &&
        renderPart(parts?.actions, { children: actions }, (p) => (
          <div data-part="actions" className={styles.actions}>
            {shrunk ? (
              <ActionsOverflow label={moreLabel} trigger={<MoreButton label={moreLabel} />}>
                {p.children}
              </ActionsOverflow>
            ) : (
              p.children
            )}
          </div>
        ))}
    </div>
  );
}
