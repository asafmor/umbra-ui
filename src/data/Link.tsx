import { ExternalLink } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Icon, IconSlot } from '../provider/icons';
import type { NavLinkProps } from '../shell/nav';
import { cx, renderPart, type Part } from '../utils/parts';
import styles from './Link.module.css';
import shared from './shared.module.css';

/** Props for the app's router link: spread them on it. `renderLink={(p) => <RouterLink to={p.href} {...p} />}` */
export type LinkRenderProps = NavLinkProps;

export interface LinkRootProps {
  /** Where it goes. Without it the link is a button that calls `onPress`. */
  href?: string;
  onPress?: () => void;
  /** Opens in a new tab, with `rel="noopener noreferrer"`. */
  external?: boolean;
  /** Plugs in the app's router link. Defaults to a plain `<a>`. */
  renderLink?: (props: LinkRenderProps) => ReactNode;
  disabled?: boolean;
  /** `inline` sits in a sentence and wraps with it. `standalone` is one line on its own ("See all"). */
  variant?: 'inline' | 'standalone';
  /** `neutral` takes the colour of the text around it. */
  tone?: 'accent' | 'neutral';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const plainLink = (props: LinkRenderProps) => <a {...props} />;

function Root({
  href,
  onPress,
  external,
  renderLink = plainLink,
  disabled = false,
  variant = 'inline',
  tone = 'accent',
  className,
  style,
  children,
}: LinkRootProps) {
  const common = {
    'data-umbra': 'link',
    'data-variant': variant,
    'data-tone': tone,
    className: cx(styles.link, className),
    style,
  };
  if (href === undefined) {
    return (
      <button type="button" {...common} disabled={disabled} onClick={onPress}>
        {children}
      </button>
    );
  }
  if (disabled) {
    // A disabled link is a link without a destination: it is announced as one, and cannot be followed.
    return (
      <a {...common} role="link" aria-disabled="true">
        {children}
      </a>
    );
  }
  return renderLink({
    ...common,
    href,
    onClick: onPress && (() => onPress()),
    ...(external && { target: '_blank', rel: 'noopener noreferrer' }),
    children,
  });
}

function Label({ children }: { children?: ReactNode }) {
  return (
    <span data-part="label" className={styles.label}>
      {children}
    </span>
  );
}

function LinkIcon({ part = 'icon', children }: { part?: string; children?: ReactNode }) {
  return <IconSlot part={part}>{children}</IconSlot>;
}

export interface LinkProps extends LinkRootProps {
  /** Adds a trailing chevron: "See all ›". */
  chevron?: boolean;
  /** What a screen reader hears after the text of an `external` link. */
  externalLabel?: string;
  /** Replace or hide named pieces. */
  parts?: {
    label?: Part<{ children: ReactNode }>;
    externalIcon?: Part<{ label: string }>;
    chevron?: Part;
  };
}

/** A text link: inside a sentence, or on its own line as the way to a fuller view. */
export function Link({
  children,
  chevron = false,
  externalLabel = 'opens in a new tab',
  parts,
  ...root
}: LinkProps) {
  return (
    <Root {...root}>
      {renderPart(parts?.label, { children }, (p) => (
        <Label>{p.children}</Label>
      ))}
      {root.external &&
        renderPart(parts?.externalIcon, { label: externalLabel }, (p) => (
          <>
            <LinkIcon part="externalIcon">
              <ExternalLink />
            </LinkIcon>
            <span className={shared.srOnly}>({p.label})</span>
          </>
        ))}
      {chevron && renderPart(parts?.chevron, {}, () => <Icon name="chevronRight" part="chevron" />)}
    </Root>
  );
}

Link.Root = Root;
Link.Label = Label;
Link.Icon = LinkIcon;
